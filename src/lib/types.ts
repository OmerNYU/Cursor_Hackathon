/**
 * Core type definitions for PitchMirror feature processing engine
 * Aligned with Architecture §4
 */

export type Vec2 = { x: number; y: number };
export type Vec3 = { x: number; y: number; z?: number };

export interface Landmark extends Vec3 {
  visibility?: number;
}

export interface PoseFrame {
  shoulders: { L: Landmark; R: Landmark };
  hips: { L: Landmark; R: Landmark };
  wrists: { L: Landmark; R: Landmark };
  torsoMid: Landmark; // midpoint of shoulder midpoint and hip midpoint
}

export interface FaceFrame {
  iris: { L: Landmark; R: Landmark };
  eyes: {
    L_outer: Landmark;
    L_inner: Landmark;
    R_inner: Landmark;
    R_outer: Landmark;
  };
  noseTip: Landmark;
  faceCenter: Landmark; // mean of keypoints
}

export interface FramePack {
  ts: number; // timestamp in ms
  pose?: PoseFrame; // undefined → degrade gracefully
  face?: FaceFrame;
  quality: { poseOk: boolean; faceOk: boolean };
  scales: { faceWidthPx: number; torsoLengthPx: number };
}

/**
 * Six extracted features from FramePack
 */
export interface Features {
  postureAngleDeg: number; // torso angle vs vertical
  swaySigma: number; // normalized by torsoLength
  gazeDevDeg: number; // gaze deviation angle
  gazeBreaksPerMin: number; // EMA estimate of gaze breaks per minute
  wristVelStd: number; // normalized by faceWidth
  torsoSpeed: number; // normalized by torsoLength
}

/**
 * Four subscores (Posture, Eye contact, Smoothness, Composure/pacing)
 * Each in [0, 1]
 */
export interface Subscores {
  P: number; // Posture
  E: number; // Eye contact
  S: number; // Smoothness (hands)
  C: number; // Composure/pacing
}

/**
 * Overall score extends subscores with weighted overall [0, 100]
 */
export interface Scores extends Subscores {
  overall: number;
}

/**
 * Tip rule interface for tips engine
 */
export interface TipRule {
  id: string;
  priority: number; // 1 = highest
  windowSec: number; // condition must hold this long
  cooldownSec: number; // suppress repeats
  when: (features: Features, subscores: Subscores) => boolean;
  message: string;
}

/**
 * Active tip with trigger timestamp
 */
export interface ActiveTip {
  rule: TipRule;
  triggeredAt: number; // ms
}

