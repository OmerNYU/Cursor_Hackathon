import {
  FilesetResolver,
  PoseLandmarker,
  FaceLandmarker,
  type PoseLandmarkerResult,
  type FaceLandmarkerResult,
} from '@mediapipe/tasks-vision';
import { toUnitSpace } from './math';

// Singleton state
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let visionPromise: Promise<any> | null = null;
let poseDetectorPromise: Promise<Detector<PoseDetectResult>> | null = null;
let faceDetectorPromise: Promise<Detector<FaceDetectResult>> | null = null;

/**
 * Checks if the browser supports required features
 * @returns true if getUserMedia and WebGL are available
 */
export function isSupported(): boolean {
  // Check getUserMedia
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return false;
  }

  // Check WebGL support
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    return gl !== null;
  } catch {
    return false;
  }
}

/**
 * Initializes the MediaPipe Vision FilesetResolver (shared by all detectors)
 */
async function initVision() {
  if (visionPromise) return visionPromise;

  console.log('[MediaPipe] Initializing FilesetResolver from CDN...');
  visionPromise = FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
  ).then(fileset => {
    console.log('[MediaPipe] FilesetResolver initialized successfully');
    return fileset;
  }).catch(err => {
    console.error('[MediaPipe] FilesetResolver failed:', err);
    visionPromise = null; // Reset on error so retry is possible
    throw new Error(`Failed to load MediaPipe WASM files: ${err.message}`);
  });

  return visionPromise;
}

export interface Detector<T> {
  detect(video: HTMLVideoElement, ts: number): T;
  close(): void;
}

export interface PoseDetectResult {
  landmarks: Array<{ x: number; y: number; z?: number; visibility?: number }>;
  visibility: number[];
}

export interface FaceDetectResult {
  landmarks: Array<{ x: number; y: number; z?: number; visibility?: number }>;
  visibility: number[];
}

/**
 * Loads and initializes the Pose Landmarker model
 * Uses singleton pattern to avoid multiple loads
 */
export async function loadPose(): Promise<Detector<PoseDetectResult>> {
  if (poseDetectorPromise) return poseDetectorPromise;

  poseDetectorPromise = (async () => {
    try {
      console.log('[MediaPipe] Loading Pose model...');
      const vision = await initVision();
      console.log('[MediaPipe] Creating PoseLandmarker...');
      
      const poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      console.log('[MediaPipe] PoseLandmarker created successfully');

      return {
        detect(video: HTMLVideoElement, ts: number): PoseDetectResult {
          try {
            // Guard: ensure video has valid dimensions and is ready
            if (!video || video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
              return { landmarks: [], visibility: [] };
            }
            
            const result: PoseLandmarkerResult = poseLandmarker.detectForVideo(video, ts);
            
            if (!result.landmarks || result.landmarks.length === 0) {
              return { landmarks: [], visibility: [] };
            }

            const rawLandmarks = result.landmarks[0];
            const width = video.videoWidth;
            const height = video.videoHeight;

            // Convert to normalized [0,1] space with mirroring
            const landmarks = rawLandmarks.map(lm => ({
              ...toUnitSpace({ x: lm.x * width, y: lm.y * height }, width, height, true),
              z: lm.z,
              visibility: lm.visibility,
            }));

            const visibility = landmarks.map(lm => lm.visibility ?? 0);

            return { landmarks, visibility };
          } catch (err) {
            console.error('Pose detect error:', err);
            return { landmarks: [], visibility: [] };
          }
        },
        close() {
          poseLandmarker.close();
          poseDetectorPromise = null;
        },
      };
    } catch (err) {
      poseDetectorPromise = null;
      throw new Error(`Pose model failed to load: ${err instanceof Error ? err.message : String(err)}`);
    }
  })();

  return poseDetectorPromise;
}

/**
 * Loads and initializes the Face Landmarker model with iris tracking
 * Uses singleton pattern to avoid multiple loads
 */
export async function loadFace(): Promise<Detector<FaceDetectResult>> {
  if (faceDetectorPromise) return faceDetectorPromise;

  faceDetectorPromise = (async () => {
    try {
      console.log('[MediaPipe] Loading Face model...');
      const vision = await initVision();
      console.log('[MediaPipe] Creating FaceLandmarker...');
      
      const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numFaces: 1,
        minFaceDetectionConfidence: 0.5,
        minFacePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
        outputFaceBlendshapes: false,
        outputFacialTransformationMatrixes: false,
      });

      console.log('[MediaPipe] FaceLandmarker created successfully');

      return {
        detect(video: HTMLVideoElement, ts: number): FaceDetectResult {
          try {
            // Guard: ensure video has valid dimensions and is ready
            if (!video || video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
              return { landmarks: [], visibility: [] };
            }
            
            const result: FaceLandmarkerResult = faceLandmarker.detectForVideo(video, ts);
            
            if (!result.faceLandmarks || result.faceLandmarks.length === 0) {
              return { landmarks: [], visibility: [] };
            }

            const rawLandmarks = result.faceLandmarks[0];
            const width = video.videoWidth;
            const height = video.videoHeight;

            // Convert to normalized [0,1] space with mirroring
            const landmarks = rawLandmarks.map(lm => ({
              ...toUnitSpace({ x: lm.x * width, y: lm.y * height }, width, height, true),
              z: lm.z,
              visibility: lm.visibility,
            }));

            const visibility = landmarks.map(lm => lm.visibility ?? 1); // Face landmarks default to visible

            return { landmarks, visibility };
          } catch (err) {
            console.error('Face detect error:', err);
            return { landmarks: [], visibility: [] };
          }
        },
        close() {
          faceLandmarker.close();
          faceDetectorPromise = null;
        },
      };
    } catch (err) {
      faceDetectorPromise = null;
      throw new Error(`Face model failed to load: ${err instanceof Error ? err.message : String(err)}`);
    }
  })();

  return faceDetectorPromise;
}

/**
 * Warms up the models by running a detection on a video frame
 * Helps reduce latency on the first real detection
 */
export async function warmup(video: HTMLVideoElement): Promise<void> {
  try {
    const [poseDetector, faceDetector] = await Promise.all([loadPose(), loadFace()]);
    
    // Wait for video to have actual frames available
    if (video.readyState < 2) {
      console.log('[MediaPipe] Waiting for video to have frames...');
      await new Promise<void>((resolve) => {
        const checkFrames = () => {
          if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
            console.log('[MediaPipe] Video has frames ready');
            resolve();
          } else {
            setTimeout(checkFrames, 50);
          }
        };
        checkFrames();
      });
    }
    
    // Run a dummy detection to warm up the models
    const ts = performance.now();
    poseDetector.detect(video, ts);
    faceDetector.detect(video, ts);
    console.log('[MediaPipe] Warmup detections completed successfully');
  } catch (err) {
    console.warn('Warmup failed:', err);
  }
}

