/**
 * 2D vector with x and y coordinates
 */
export type Vec2 = {
  x: number;
  y: number;
};

/**
 * 3D vector with optional z coordinate
 */
export type Vec3 = {
  x: number;
  y: number;
  z?: number;
};

/**
 * Landmark point with optional visibility score
 * Coordinates are normalized to [0,1] range
 */
export interface Landmark extends Vec3 {
  /** Visibility confidence [0,1], where 1 is fully visible */
  visibility?: number;
}

/**
 * Pose frame containing key body landmarks
 * All coordinates are in normalized [0,1] space
 */
export interface PoseFrame {
  /** Left and right shoulder landmarks */
  shoulders: { L: Landmark; R: Landmark };
  /** Left and right hip landmarks */
  hips: { L: Landmark; R: Landmark };
  /** Left and right wrist landmarks */
  wrists: { L: Landmark; R: Landmark };
  /** Midpoint of torso (between shoulder and hip midpoints) */
  torsoMid: Landmark;
}

/**
 * Face frame containing eye, iris, and nose landmarks
 * All coordinates are in normalized [0,1] space
 */
export interface FaceFrame {
  /** Left and right iris center points */
  iris: { L: Landmark; R: Landmark };
  /** Eye corner landmarks for gaze estimation */
  eyes: {
    L_outer: Landmark;
    L_inner: Landmark;
    R_inner: Landmark;
    R_outer: Landmark;
  };
  /** Nose tip landmark */
  noseTip: Landmark;
  /** Center point of the face (computed from eye landmarks) */
  faceCenter: Landmark;
}

/**
 * Scale measurements for normalization
 * Used to make measurements device and distance independent
 */
export interface Scales {
  /** Distance between outer eye corners (normalized units) */
  faceWidth: number;
  /** Distance from shoulder midpoint to hip midpoint (normalized units) */
  torsoLength: number;
}

/**
 * Quality indicators for pose and face detection
 */
export interface Quality {
  /** Whether pose landmarks meet visibility threshold */
  poseOk: boolean;
  /** Whether face landmarks meet visibility threshold */
  faceOk: boolean;
}

/**
 * Complete frame package with pose, face, and metadata
 * This is the primary data structure emitted by the vision system
 */
export interface FramePack {
  /** Timestamp in milliseconds */
  ts: number;
  /** Pose data (undefined if detection failed or visibility too low) */
  pose?: PoseFrame;
  /** Face data (undefined if detection failed or visibility too low) */
  face?: FaceFrame;
  /** Quality flags indicating detection reliability */
  quality: Quality;
  /** Scale measurements for this frame */
  scales: Scales;
}

/**
 * Raw feature measurements extracted from a frame
 */
export interface Features {
  /** Torso deviation from vertical in degrees */
  postureAngleDeg: number;
  /** Standard deviation of torso sway (normalized units) */
  swaySigma: number;
  /** Gaze deviation from center in degrees */
  gazeDevDeg: number;
  /** Estimated gaze breaks per minute */
  gazeBreaksPerMin: number;
  /** Standard deviation of wrist velocity (normalized by face width) */
  wristVelStd: number;
  /** Torso movement speed (normalized units per second) */
  torsoSpeed: number;
}

/**
 * Normalized subscores for each metric [0,1]
 * Higher is better
 */
export interface Subscores {
  /** Posture score: torso alignment and stability */
  P: number;
  /** Eye contact score: gaze direction and steadiness */
  E: number;
  /** Smoothness score: hand movement stability */
  S: number;
  /** Pacing score: body movement control */
  C: number;
}

/**
 * Complete scoring result with overall confidence
 */
export interface Scores extends Subscores {
  /** Overall confidence score [0,100] */
  overall: number;
}

