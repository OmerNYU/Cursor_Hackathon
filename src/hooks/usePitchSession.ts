import { useCallback, useEffect, useRef, useState } from 'react';
import { FaceLandmarker, FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';
import { ANALYSIS_INTERVAL_MS } from '../lib/config';
import { ScoringEngine } from '../lib/scoring';
import type { Evaluation, FramePack } from '../lib/types';
import { toFramePack } from '../lib/vision';

export type SessionPhase = 'idle' | 'loading' | 'calibrating' | 'running' | 'paused' | 'error';
type Debug = { fps: number; analysisMs: number; frame?: FramePack };

const modelBase = 'https://storage.googleapis.com/mediapipe-models';

export function usePitchSession() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | undefined>(undefined);
  const poseRef = useRef<PoseLandmarker | undefined>(undefined);
  const faceRef = useRef<FaceLandmarker | undefined>(undefined);
  const engineRef = useRef(new ScoringEngine());
  const rafRef = useRef<number | undefined>(undefined);
  const lastAnalysisRef = useRef(0);
  const calibrationTimerRef = useRef<number | undefined>(undefined);
  const [phase, setPhase] = useState<SessionPhase>('idle');
  const [error, setError] = useState<string>();
  const [evaluation, setEvaluation] = useState<Evaluation>();
  const [frame, setFrame] = useState<FramePack>();
  const [showOverlay, setShowOverlay] = useState(true);
  const [showDebug, setShowDebug] = useState(false);
  const [debug, setDebug] = useState<Debug>({ fps: 0, analysisMs: 0 });

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (calibrationTimerRef.current) window.clearTimeout(calibrationTimerRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = undefined;
    poseRef.current?.close();
    faceRef.current?.close();
    poseRef.current = undefined;
    faceRef.current = undefined;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const start = useCallback(async () => {
    stop();
    engineRef.current.reset();
    setEvaluation(undefined);
    setFrame(undefined);
    setError(undefined);
    setPhase('loading');
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('This browser does not support camera access.');
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }, audio: false });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) throw new Error('Video preview is unavailable.');
      video.srcObject = stream;
      await video.play();
      const vision = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm');
      [poseRef.current, faceRef.current] = await Promise.all([
        PoseLandmarker.createFromOptions(vision, { baseOptions: { modelAssetPath: `${modelBase}/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`, delegate: 'GPU' }, runningMode: 'VIDEO', numPoses: 1, minPoseDetectionConfidence: 0.5, minPosePresenceConfidence: 0.5, minTrackingConfidence: 0.5 }),
        FaceLandmarker.createFromOptions(vision, { baseOptions: { modelAssetPath: `${modelBase}/face_landmarker/face_landmarker/float16/1/face_landmarker.task`, delegate: 'GPU' }, runningMode: 'VIDEO', numFaces: 1, minFaceDetectionConfidence: 0.5, minFacePresenceConfidence: 0.5, minTrackingConfidence: 0.5 }),
      ]);
      setPhase('calibrating');
      calibrationTimerRef.current = window.setTimeout(() => setPhase('running'), 3000);
    } catch (caught) {
      stop();
      const name = caught instanceof DOMException ? caught.name : '';
      setError(name === 'NotAllowedError' ? 'Camera access was denied. Allow it in your browser settings, then try again.' : caught instanceof Error ? caught.message : 'Unable to start this session.');
      setPhase('error');
    }
  }, [stop]);

  useEffect(() => {
    if (phase !== 'calibrating' && phase !== 'running') return;
    let frames = 0;
    let fpsStart = performance.now();
    const loop = (now: number) => {
      rafRef.current = requestAnimationFrame(loop);
      if (document.hidden || now - lastAnalysisRef.current < ANALYSIS_INTERVAL_MS) return;
      const video = videoRef.current;
      const pose = poseRef.current;
      const face = faceRef.current;
      if (!video || !pose || !face || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
      lastAnalysisRef.current = now;
      const started = performance.now();
      const poseResult = pose.detectForVideo(video, now);
      const faceResult = face.detectForVideo(video, now);
      const nextFrame = toFramePack(now, poseResult.landmarks[0] ?? [], faceResult.faceLandmarks[0] ?? []);
      setFrame(nextFrame);
      setEvaluation(engineRef.current.evaluate(nextFrame));
      frames += 1;
      if (now - fpsStart >= 1000) {
        setDebug({ fps: Math.round(frames * 1000 / (now - fpsStart)), analysisMs: Math.round(performance.now() - started), frame: nextFrame });
        fpsStart = now;
        frames = 0;
      }
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [phase]);

  useEffect(() => {
    const keyboard = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (event.key === ' ') { event.preventDefault(); setPhase((current) => current === 'running' ? 'paused' : current === 'paused' ? 'running' : current); }
      if (event.key.toLowerCase() === 'o') setShowOverlay((value) => !value);
      if (event.key.toLowerCase() === 'd') setShowDebug((value) => !value);
    };
    window.addEventListener('keydown', keyboard);
    return () => window.removeEventListener('keydown', keyboard);
  }, []);

  useEffect(() => () => stop(), [stop]);
  return { videoRef, phase, error, evaluation, frame, debug, showOverlay, showDebug, start, stop, setShowOverlay, setShowDebug, togglePause: () => setPhase((current) => current === 'running' ? 'paused' : current === 'paused' ? 'running' : current) };
}
