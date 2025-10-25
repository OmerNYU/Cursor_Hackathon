// ===== Import TipRule from scoring engine =====
import type { TipRule } from '@scoring-engine/types';

// ===== Shared low-level types from Vision =====
// These are the structures Vision gives us. We NEVER compute them in UI. We only read them.
// FramePack updates ~10 times per second.

export interface Vec2 {
  x: number;
  y: number;
  visibility?: number; // optional confidence per landmark
}

// Re-export TipRule for convenience
export type { TipRule };

export interface PoseFrame {
  shoulders: { L: Vec2; R: Vec2 };
  hips: { L: Vec2; R: Vec2 };
  wrists: { L: Vec2; R: Vec2 };
  torsoMid: Vec2;
}

export interface FaceFrame {
  iris: { L: Vec2; R: Vec2 };
  eyes: {
    L_outer: Vec2;
    L_inner: Vec2;
    R_inner: Vec2;
    R_outer: Vec2;
  };
  noseTip: Vec2;
  faceCenter: Vec2;
}

export interface FramePack {
  pose?: PoseFrame;
  face?: FaceFrame;
  scales: {
    faceWidth: number;     // pixel scale of head
    torsoLength: number;   // pixel scale of torso
  };
  quality: {
    poseOk: boolean;
    faceOk: boolean;
  };
  ts: number; // timestamp in ms
}

// ===== Output from Logic (teammate 2) =====
// We call evaluate() in the UI layer every ~100ms. We DO NOT change its math here.
// We take its output and display it.

export interface EvaluateResult {
  features: {
    postureAngleDeg: number;
    swaySigma: number;
    gazeDevDeg: number;
    gazeBreaksPerMin: number;
    wristVelStd: number;
    torsoSpeed: number;
  };
  subscores: {
    P: number; // Presence         [0..1]
    E: number; // Eye Contact      [0..1]
    S: number; // Stillness        [0..1]
    C: number; // Composure/Pacing [0..1]
  };
  overall: number;   // 0..100
  tips: TipRule[];   // up to 2 tip rules with messages
}

// ===== Vision hook from teammate 1 that UI consumes =====
// The UI NEVER calls MediaPipe directly.
// We just call useMediaPipe() and read its data.
// If isReady=false or error!=null, frontend falls back to mock fixture replay.

export interface UseMediaPipeResult {
  framePack: FramePack | null;
  videoRef: React.RefObject<HTMLVideoElement>;
  isReady: boolean;    // true when camera + models loaded and streaming
  error: string | null; // non-null if camera denied or model failed
}

// ===== Frontend state hook (owned by teammate 3) =====
// UI will implement this hook.
// Responsibilities:
// - Pull live FramePack from useMediaPipe(), OR load from fixtures if not ready (mock mode).
// - Call evaluate(framePack, Date.now()) ~10Hz.
// - Track fps.
// - Expose pauseToggle (Space) and overlayToggle (O).
// - Never spam React state every animation frame; throttle to ~100ms.

export interface ScoringState {
  frame: FramePack | null;  // last frame (real or mock)
  features: EvaluateResult["features"] | null;
  subscores: EvaluateResult["subscores"] | null;
  overall: number | null;   // 0..100
  tips: TipRule[];
  fps: number;
  quality: FramePack["quality"] | null;
  isMock: boolean;          // true if we are replaying fixtures instead of real camera
  paused: boolean;          // true if user hit Space to pause updates
  showOverlay: boolean;     // true if overlay should draw skeleton/gaze
}

export interface ScoringActions {
  pauseToggle(): void;     // Space key
  overlayToggle(): void;   // O key
}

export interface UseScoringLoopResult {
  state: ScoringState;
  actions: ScoringActions;
}

