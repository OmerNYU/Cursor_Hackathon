import type { FramePack, PoseFrame, FaceFrame, Landmark, Subscores } from './types';
import { distance2D, clamp, ema } from './math';

/**
 * Thresholds for feature scoring
 * These values determine what constitutes "good" performance
 */
export const THRESHOLDS = {
  postureMaxTiltDeg: 12,
  eyeMaxOffCenterDeg: 10,
  eyeMaxBreaksPerMin: 12,
  smoothMaxStd: 0.025,
  paceMaxUnitsPerSec: 0.08,
} as const;

/**
 * Smoothing configuration
 */
export const SMOOTHING = {
  beta: 0.3,
  bufferLen: 20,
} as const;

/**
 * State maintained across frames for feature extraction
 */
export interface FeatureState {
  ema: {
    posture: number | null;
    eye: number | null;
    smooth: number | null;
    pace: number | null;
  };
  wristVelBuf: number[];
  gazeBreakTimestamps: number[];
  lastWrists: { l: Landmark; r: Landmark } | null;
  torsoHistory: Landmark[];
  lastAnalysisAt: number | null;
  lastGazeGood: boolean;
  gazeBreakStartAt: number | null;
}

/**
 * Creates default feature state
 */
export function defaultFeatureState(): FeatureState {
  return {
    ema: {
      posture: null,
      eye: null,
      smooth: null,
      pace: null,
    },
    wristVelBuf: [],
    gazeBreakTimestamps: [],
    lastWrists: null,
    torsoHistory: [],
    lastAnalysisAt: null,
    lastGazeGood: true,
    gazeBreakStartAt: null,
  };
}

/**
 * Calculates deviation from vertical in degrees
 */
export function degFromVertical(shoulderMid: Landmark, hipMid: Landmark): number {
  const dx = Math.abs(shoulderMid.x - hipMid.x);
  const dy = Math.abs(shoulderMid.y - hipMid.y);
  
  // Avoid division by zero
  if (dy < 0.001) return 90;
  
  // atan2(dx, dy) gives angle from vertical
  const radians = Math.atan2(dx, dy);
  return (radians * 180) / Math.PI;
}

/**
 * Calculates wrist velocities (normalized by face width)
 */
export function wristVelocities(
  prev: { l: Landmark; r: Landmark } | null,
  curr: { l: Landmark; r: Landmark } | null,
  dtSec: number,
  faceWidth: number
): [number, number] {
  if (!prev || !curr || dtSec <= 0 || faceWidth <= 0) {
    return [0, 0];
  }

  const lVel = distance2D(prev.l, curr.l) / dtSec / faceWidth;
  const rVel = distance2D(prev.r, curr.r) / dtSec / faceWidth;
  
  return [lVel, rVel];
}

/**
 * Calculates standard deviation of an array
 */
export function stddev(values: number[]): number {
  if (values.length === 0) return 0;
  
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  
  return Math.sqrt(variance);
}

/**
 * Calculates torso movement speed (normalized units per second)
 */
export function torsoUnitsPerSec(history: Landmark[], fps: number): number {
  if (history.length < 2 || fps <= 0) return 0;
  
  let totalDist = 0;
  for (let i = 1; i < history.length; i++) {
    totalDist += distance2D(history[i - 1], history[i]);
  }
  
  // Average distance per frame * fps = units per second
  const avgDistPerFrame = totalDist / (history.length - 1);
  return avgDistPerFrame * fps;
}

/**
 * Scores posture based on torso alignment and stability
 * Returns value in [0, 1] where higher is better
 */
export function postureScore(
  pose: PoseFrame | undefined,
  _prevPose: PoseFrame | undefined
): number {
  if (!pose) return 0.5; // Neutral when missing
  
  // Calculate torso tilt
  const shoulderMid = {
    x: (pose.shoulders.L.x + pose.shoulders.R.x) / 2,
    y: (pose.shoulders.L.y + pose.shoulders.R.y) / 2,
  };
  const hipMid = {
    x: (pose.hips.L.x + pose.hips.R.x) / 2,
    y: (pose.hips.L.y + pose.hips.R.y) / 2,
  };
  
  const tiltDeg = degFromVertical(shoulderMid as Landmark, hipMid as Landmark);
  const tiltScore = 1 - clamp(tiltDeg / THRESHOLDS.postureMaxTiltDeg, 0, 1);
  
  // For now, focus on tilt. Sway requires history (computed in evaluate)
  return clamp(tiltScore, 0, 1);
}

/**
 * Scores eye contact based on gaze direction
 * Returns value in [0, 1] where higher is better
 */
export function eyeContactScore(
  face: FaceFrame | undefined,
  state: FeatureState,
  nowMs: number,
  _dtSec: number
): number {
  if (!face) return 0.5; // Neutral when missing
  
  // Calculate gaze deviation
  // Approximate gaze by looking at iris position relative to eye center
  const lEyeCenter = {
    x: (face.eyes.L_outer.x + face.eyes.L_inner.x) / 2,
    y: (face.eyes.L_outer.y + face.eyes.L_inner.y) / 2,
  };
  const rEyeCenter = {
    x: (face.eyes.R_outer.x + face.eyes.R_inner.x) / 2,
    y: (face.eyes.R_outer.y + face.eyes.R_inner.y) / 2,
  };
  
  // Gaze deviation (simplified: distance from iris to eye center)
  const lGazeDist = distance2D(lEyeCenter, face.iris.L);
  const rGazeDist = distance2D(rEyeCenter, face.iris.R);
  const avgGazeDist = (lGazeDist + rGazeDist) / 2;
  
  // Convert to approximate degrees (rough heuristic)
  const gazeDevDeg = avgGazeDist * 100; // Normalize
  
  // Score based on deviation
  const devScore = 1 - clamp(gazeDevDeg / (THRESHOLDS.eyeMaxOffCenterDeg * 1.8), 0, 1);
  
  // Track gaze breaks
  const isGoodGaze = gazeDevDeg <= THRESHOLDS.eyeMaxOffCenterDeg;
  
  if (!isGoodGaze && state.lastGazeGood) {
    // Starting a break
    state.gazeBreakStartAt = nowMs;
  } else if (isGoodGaze && !state.lastGazeGood && state.gazeBreakStartAt !== null) {
    // Ending a break (if it lasted > 200ms)
    if (nowMs - state.gazeBreakStartAt >= 200) {
      state.gazeBreakTimestamps.push(nowMs);
      // Keep only recent breaks (last 60 seconds)
      state.gazeBreakTimestamps = state.gazeBreakTimestamps.filter(
        ts => nowMs - ts < 60000
      );
    }
    state.gazeBreakStartAt = null;
  }
  
  state.lastGazeGood = isGoodGaze;
  
  // Calculate breaks per minute
  const breaksPerMin = state.gazeBreakTimestamps.length;
  const breakScore = 1 - clamp(breaksPerMin / THRESHOLDS.eyeMaxBreaksPerMin, 0, 1);
  
  // Combined score
  return clamp(0.7 * devScore + 0.3 * breakScore, 0, 1);
}

/**
 * Scores hand movement smoothness
 * Returns value in [0, 1] where higher is better
 */
export function smoothnessScore(
  pose: PoseFrame | undefined,
  state: FeatureState,
  dtSec: number,
  faceWidth: number
): number {
  if (!pose || faceWidth <= 0) return 0.5; // Neutral when missing
  
  // Calculate wrist velocities
  const [lVel, rVel] = wristVelocities(
    state.lastWrists,
    { l: pose.wrists.L, r: pose.wrists.R },
    dtSec,
    faceWidth
  );
  
  // Update wrist history
  state.lastWrists = { l: pose.wrists.L, r: pose.wrists.R };
  
  const avgVel = (lVel + rVel) / 2;
  state.wristVelBuf.push(avgVel);
  
  // Keep buffer size limited
  if (state.wristVelBuf.length > SMOOTHING.bufferLen) {
    state.wristVelBuf.shift();
  }
  
  // Calculate standard deviation
  if (state.wristVelBuf.length < 5) {
    return 0.7; // Default good score while warming up
  }
  
  const velStd = stddev(state.wristVelBuf);
  
  // Score inversely proportional to std dev
  const score = 1 - clamp(
    (velStd - 0.01) / (THRESHOLDS.smoothMaxStd - 0.01),
    0,
    1
  );
  
  return clamp(score, 0, 1);
}

/**
 * Scores body pacing/movement
 * Returns value in [0, 1] where higher is better
 */
export function pacingScore(
  pose: PoseFrame | undefined,
  state: FeatureState,
  analysisFps: number
): number {
  if (!pose) return 0.5; // Neutral when missing
  
  // Update torso history
  state.torsoHistory.push(pose.torsoMid);
  
  // Keep history limited
  if (state.torsoHistory.length > SMOOTHING.bufferLen) {
    state.torsoHistory.shift();
  }
  
  // Need enough history
  if (state.torsoHistory.length < 5) {
    return 0.7; // Default good score while warming up
  }
  
  // Calculate movement speed
  const speed = torsoUnitsPerSec(state.torsoHistory, analysisFps);
  
  // Score inversely proportional to excessive movement
  const score = 1 - clamp(speed / (THRESHOLDS.paceMaxUnitsPerSec * 1.5), 0, 1);
  
  return clamp(score, 0, 1);
}

/**
 * Evaluates all features and returns raw and smoothed subscores
 */
export function evaluate(
  frame: FramePack | null,
  state: FeatureState,
  analysisFps: number,
  nowMs: number
): {
  sub: Subscores;
  smoothed: Subscores;
  debug: {
    tiltDeg?: number;
    breaksPerMin?: number;
    velStd?: number;
    unitsPerSec?: number;
  };
} {
  // Calculate dt
  const dtSec = state.lastAnalysisAt !== null 
    ? (nowMs - state.lastAnalysisAt) / 1000 
    : 0.1;
  state.lastAnalysisAt = nowMs;
  
  // Compute raw scores
  const P = postureScore(frame?.pose, undefined);
  const E = eyeContactScore(frame?.face, state, nowMs, dtSec);
  const S = smoothnessScore(frame?.pose, state, dtSec, frame?.scales.faceWidth || 0.1);
  const C = pacingScore(frame?.pose, state, analysisFps);
  
  const sub: Subscores = { P, E, S, C };
  
  // Apply EMA smoothing
  state.ema.posture = ema(state.ema.posture, P, SMOOTHING.beta);
  state.ema.eye = ema(state.ema.eye, E, SMOOTHING.beta);
  state.ema.smooth = ema(state.ema.smooth, S, SMOOTHING.beta);
  state.ema.pace = ema(state.ema.pace, C, SMOOTHING.beta);
  
  const smoothed: Subscores = {
    P: state.ema.posture ?? P,
    E: state.ema.eye ?? E,
    S: state.ema.smooth ?? S,
    C: state.ema.pace ?? C,
  };
  
  // Debug info
  const debug = {
    tiltDeg: frame?.pose ? degFromVertical(
      {
        x: (frame.pose.shoulders.L.x + frame.pose.shoulders.R.x) / 2,
        y: (frame.pose.shoulders.L.y + frame.pose.shoulders.R.y) / 2,
      } as Landmark,
      {
        x: (frame.pose.hips.L.x + frame.pose.hips.R.x) / 2,
        y: (frame.pose.hips.L.y + frame.pose.hips.R.y) / 2,
      } as Landmark
    ) : undefined,
    breaksPerMin: state.gazeBreakTimestamps.length,
    velStd: state.wristVelBuf.length > 0 ? stddev(state.wristVelBuf) : undefined,
    unitsPerSec: state.torsoHistory.length > 1 ? torsoUnitsPerSec(state.torsoHistory, analysisFps) : undefined,
  };
  
  return { sub, smoothed, debug };
}

