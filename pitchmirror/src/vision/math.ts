import type { Landmark, Quality } from './types';

/**
 * Clamps a number between min and max values
 * @example clamp(15, 0, 10) → 10
 * @example clamp(-5, 0, 10) → 0
 * @example clamp(5, 0, 10) → 5
 */
export function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/**
 * Calculates Euclidean distance between two 2D points
 * @example distance2D({x: 0, y: 0}, {x: 3, y: 4}) → 5
 */
export function distance2D(
  a: { x: number; y: number },
  b: { x: number; y: number }
): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculates the midpoint between two points
 * @example midpoint({x: 0, y: 0}, {x: 4, y: 6}) → {x: 2, y: 3}
 */
export function midpoint(
  a: { x: number; y: number; z?: number },
  b: { x: number; y: number; z?: number }
): Landmark {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    z: a.z !== undefined && b.z !== undefined ? (a.z + b.z) / 2 : undefined,
  };
}

/**
 * Exponential Moving Average (EMA) filter
 * @param prev - Previous EMA value (null for first value)
 * @param value - Current value to incorporate
 * @param beta - Smoothing factor [0,1], higher = more weight to current value
 * @example ema(null, 10, 0.3) → 10 (first value)
 * @example ema(10, 20, 0.3) → 13 (0.3 * 20 + 0.7 * 10)
 */
export function ema(prev: number | null, value: number, beta: number): number {
  if (prev === null) return value;
  return beta * value + (1 - beta) * prev;
}

/**
 * Calculates the median of an array of numbers
 * @example median([1, 3, 2]) → 2
 * @example median([4, 1, 3, 2]) → 2.5
 */
export function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

/**
 * Converts raw pixel coordinates to normalized [0,1] unit space
 * @param raw - Raw coordinates {x, y}
 * @param width - Frame width in pixels
 * @param height - Frame height in pixels
 * @param mirror - If true, flips x coordinate (for selfie view)
 * @example toUnitSpace({x: 640, y: 480}, 1280, 720, false) → {x: 0.5, y: 0.667}
 * @example toUnitSpace({x: 640, y: 480}, 1280, 720, true) → {x: 0.5, y: 0.667} (mirrored)
 */
export function toUnitSpace(
  raw: { x: number; y: number },
  width: number,
  height: number,
  mirror = true
): Landmark {
  return {
    x: mirror ? 1 - raw.x / width : raw.x / width,
    y: raw.y / height,
  };
}

/**
 * Visibility hold: maintains last good landmark for a grace period
 * Prevents scores from dropping to zero during brief occlusions
 * 
 * @param curr - Current landmark (may be null if not detected)
 * @param prev - Previous landmark (may be null)
 * @param nowMs - Current timestamp in milliseconds
 * @param lastGoodRef - Reference object tracking last good timestamp
 * @param visible - Whether current landmark meets visibility threshold
 * @param holdMs - Grace period in milliseconds (default 500ms)
 * @returns Current landmark if visible, previous if within hold period, null otherwise
 * 
 * @example
 * const ref = { v: 1000 };
 * visibilityHold(landmark, null, 1000, ref, true, 500) → landmark
 * visibilityHold(null, landmark, 1200, ref, false, 500) → landmark (within 500ms)
 * visibilityHold(null, landmark, 1600, ref, false, 500) → null (beyond 500ms)
 */
export function visibilityHold<T extends Landmark>(
  curr: T | null,
  prev: T | null,
  nowMs: number,
  lastGoodRef: { v: number },
  visible: boolean,
  holdMs = 500
): T | null {
  if (visible && curr) {
    lastGoodRef.v = nowMs;
    return curr;
  }
  
  // Within grace period, use previous value
  if (prev && nowMs - lastGoodRef.v <= holdMs) {
    return prev;
  }
  
  return null;
}

/**
 * Determines quality flags based on visibility scores
 * @param visPose - Array of pose landmark visibility scores [0,1]
 * @param visFace - Array of face landmark visibility scores [0,1]
 * @param thresholds - Minimum visibility thresholds
 * @returns Quality flags indicating if pose and face meet thresholds
 * 
 * @example
 * qualityFrom([0.9, 0.8, 0.7], [0.9, 0.9], {minPose: 0.5, minFace: 0.5})
 * → {poseOk: true, faceOk: true}
 */
export function qualityFrom(
  visPose: number[],
  visFace: number[],
  thresholds = { minPose: 0.5, minFace: 0.5 }
): Quality {
  const poseOk = visPose.length > 0 && 
    visPose.reduce((sum, v) => sum + v, 0) / visPose.length >= thresholds.minPose;
  
  const faceOk = visFace.length > 0 && 
    visFace.reduce((sum, v) => sum + v, 0) / visFace.length >= thresholds.minFace;
  
  return { poseOk, faceOk };
}

