import { useEffect, useRef, useState, useCallback } from 'react';
import { useCamera } from './useCamera';
import {
  loadPose,
  loadFace,
  warmup,
  isSupported,
  type Detector,
  type PoseDetectResult,
  type FaceDetectResult,
} from './mediapipeLoader';
import { extractPose, extractFace } from './extract';
import { distance2D, qualityFrom } from './math';
import type { FramePack, Scales, Quality } from './types';

const ANALYSIS_MS_START = 100; // Target 10 Hz
const ANALYSIS_MS_MIN = 80;
const ANALYSIS_MS_MAX = 150;

export interface VisionDebug {
  detectMs: number;
  intervalMs: number;
  poseCount: number;
  faceCount: number;
  scales: Scales;
  quality: Quality;
  slowPath: boolean;
}

export interface VisionAPI {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  isReady: boolean;
  error: string | null;
  frame: FramePack | null;
  debug: VisionDebug;
}

/**
 * Main vision orchestrator hook
 * Manages camera, MediaPipe models, and analysis loop
 */
export function useVision(): VisionAPI {
  const camera = useCamera();
  const [error, setError] = useState<string | null>(null);
  const [frame, setFrame] = useState<FramePack | null>(null);
  const [debug, setDebug] = useState<VisionDebug>({
    detectMs: 0,
    intervalMs: ANALYSIS_MS_START,
    poseCount: 0,
    faceCount: 0,
    scales: { faceWidth: 0, torsoLength: 0 },
    quality: { poseOk: false, faceOk: false },
    slowPath: false,
  });

  const poseDetectorRef = useRef<Detector<PoseDetectResult> | null>(null);
  const faceDetectorRef = useRef<Detector<FaceDetectResult> | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const lastAnalysisRef = useRef<number>(0);
  const intervalMsRef = useRef<number>(ANALYSIS_MS_START);
  const lastVideoTimeRef = useRef<number>(-1);
  const consecutiveErrorsRef = useRef<number>(0);
  const fastPathCountRef = useRef<number>(0);
  const poseCountRef = useRef<number>(0);
  const faceCountRef = useRef<number>(0);
  const lastGoodPoseRef = useRef<{ v: number }>({ v: 0 });
  const lastGoodFaceRef = useRef<{ v: number }>({ v: 0 });

  const startCamera = useCallback(async () => {
    try {
      setError(null);

      // Check support
      console.log('[Vision] Checking browser support...');
      if (!isSupported()) {
        throw new Error('Browser does not support required features (camera or WebGL)');
      }
      console.log('[Vision] Browser support OK');

      // Start camera
      console.log('[Vision] Starting camera...');
      await camera.start();
      console.log('[Vision] Camera started successfully');

      // Load models in parallel
      console.log('[Vision] Loading MediaPipe models...');
      const [poseDetector, faceDetector] = await Promise.all([
        loadPose().catch(err => {
          console.error('[Vision] Pose model error:', err);
          throw new Error(`Pose model loading failed: ${err.message}`);
        }),
        loadFace().catch(err => {
          console.error('[Vision] Face model error:', err);
          throw new Error(`Face model loading failed: ${err.message}`);
        }),
      ]);
      console.log('[Vision] Models loaded successfully');

      poseDetectorRef.current = poseDetector;
      faceDetectorRef.current = faceDetector;

      // Warmup models
      console.log('[Vision] Warming up models...');
      if (camera.videoRef.current) {
        await warmup(camera.videoRef.current);
      }
      console.log('[Vision] Warmup complete');

      // Start analysis loop
      lastAnalysisRef.current = performance.now();
      startAnalysisLoop();
      console.log('[Vision] Analysis loop started');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to initialize vision system';
      setError(errorMsg);
      console.error('[Vision] Initialization error:', err);
      // Stop camera on error
      camera.stop();
    }
  }, [camera]);

  const stopCamera = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    camera.stop();
    poseDetectorRef.current?.close();
    faceDetectorRef.current?.close();
    poseDetectorRef.current = null;
    faceDetectorRef.current = null;
    setFrame(null);
  }, [camera]);

  const startAnalysisLoop = useCallback(() => {
    const loop = () => {
      rafIdRef.current = requestAnimationFrame(loop);

      // Pause if document is hidden
      if (document.hidden) {
        return;
      }

      const now = performance.now();
      const elapsed = now - lastAnalysisRef.current;

      // Throttle analysis
      if (elapsed < intervalMsRef.current) {
        return;
      }

      const video = camera.videoRef.current;
      if (!video || video.readyState < 2) {
        return;
      }

      // Skip if video time hasn't advanced
      if (video.currentTime === lastVideoTimeRef.current) {
        return;
      }
      lastVideoTimeRef.current = video.currentTime;

      // Run analysis
      runAnalysis(video, now);
      lastAnalysisRef.current = now;
    };

    loop();
  }, [camera.videoRef]);

  const runAnalysis = useCallback((video: HTMLVideoElement, nowMs: number) => {
    const startMs = performance.now();

    try {
      const poseDetector = poseDetectorRef.current;
      const faceDetector = faceDetectorRef.current;

      if (!poseDetector || !faceDetector) {
        return;
      }

      // Detect pose and face
      const poseResult = poseDetector.detect(video, nowMs);
      const faceResult = faceDetector.detect(video, nowMs);

      // Extract frames
      const { frame: poseFrame, vis: visPose } = extractPose(poseResult.landmarks);
      const { frame: faceFrame, vis: visFace } = extractFace(faceResult.landmarks);

      // Update counts
      if (poseFrame) {
        poseCountRef.current++;
        lastGoodPoseRef.current.v = nowMs;
      }
      if (faceFrame) {
        faceCountRef.current++;
        lastGoodFaceRef.current.v = nowMs;
      }

      // Compute scales
      const scales: Scales = { faceWidth: 0, torsoLength: 0 };
      
      if (faceFrame) {
        scales.faceWidth = distance2D(faceFrame.eyes.L_outer, faceFrame.eyes.R_outer);
      }
      
      if (poseFrame) {
        const shoulderMid = {
          x: (poseFrame.shoulders.L.x + poseFrame.shoulders.R.x) / 2,
          y: (poseFrame.shoulders.L.y + poseFrame.shoulders.R.y) / 2,
        };
        const hipMid = {
          x: (poseFrame.hips.L.x + poseFrame.hips.R.x) / 2,
          y: (poseFrame.hips.L.y + poseFrame.hips.R.y) / 2,
        };
        scales.torsoLength = distance2D(shoulderMid, hipMid);
      }

      // Compute quality
      const quality = qualityFrom(visPose, visFace);

      // Assemble frame pack
      const framePack: FramePack = {
        ts: nowMs,
        pose: poseFrame,
        face: faceFrame,
        quality,
        scales,
      };

      setFrame(framePack);

      // Adaptive throttling
      const detectMs = performance.now() - startMs;
      
      if (detectMs > 40) {
        // Slow path: increase interval
        intervalMsRef.current = Math.min(
          intervalMsRef.current + 20,
          ANALYSIS_MS_MAX
        );
        fastPathCountRef.current = 0;
      } else if (detectMs < 20) {
        // Fast path: track consecutive fast detections
        fastPathCountRef.current++;
        if (fastPathCountRef.current >= 10) {
          intervalMsRef.current = Math.max(
            intervalMsRef.current - 10,
            ANALYSIS_MS_MIN
          );
          fastPathCountRef.current = 0;
        }
      }

      // Reset error counter on success
      consecutiveErrorsRef.current = 0;

      // Update debug info
      setDebug({
        detectMs,
        intervalMs: intervalMsRef.current,
        poseCount: poseCountRef.current,
        faceCount: faceCountRef.current,
        scales,
        quality,
        slowPath: intervalMsRef.current > 140,
      });

      // Expose debug info in development
      if (import.meta.env.DEV) {
        (window as Window & { pitchmirrorDebug?: { lastFrame: FramePack } }).pitchmirrorDebug = { lastFrame: framePack };
      }
    } catch (err) {
      console.error('Analysis error:', err);
      consecutiveErrorsRef.current++;

      // Error backoff
      if (consecutiveErrorsRef.current >= 10) {
        intervalMsRef.current = 200;
      }
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    videoRef: camera.videoRef,
    startCamera,
    stopCamera,
    isReady: camera.isReady,
    error: error || camera.error,
    frame,
    debug,
  };
}

