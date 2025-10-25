/**
 * Score engine: Features → Subscores → Overall
 * Architecture §7 & §8
 */

import type { Features, Subscores, Scores } from './types';
import { clamp } from './geometry';
import {
  WEIGHTS,
  POSTURE_GOOD_MAX_DEG,
  SWAY_GOOD_MAX_NORM,
  GAZE_GOOD_MAX_DEG,
  GAZE_MAX_BREAKS_PER_MIN,
  WRIST_VEL_STD_GOOD_MAX,
  WRIST_VEL_STD_HIGH,
  TORSO_SPEED_HIGH,
} from './config';

/**
 * Sanitize numeric value: return 0 if NaN or Infinity
 */
function sane(x: number): number {
  return Number.isFinite(x) ? x : 0;
}

/**
 * Compute subscores from features
 * All subscores in [0, 1]
 */
export function computeSubscores(features: Features): Subscores {
  // Sanitize all inputs
  const postureAngleDeg = sane(features.postureAngleDeg);
  const swaySigma = sane(features.swaySigma);
  const gazeDevDeg = sane(features.gazeDevDeg);
  const gazeBreaksPerMin = sane(features.gazeBreaksPerMin);
  const wristVelStd = sane(features.wristVelStd);
  const torsoSpeed = sane(features.torsoSpeed);
  
  // Posture (P): 0.6 * angle score + 0.4 * sway score
  const P_angle = 1 - clamp(postureAngleDeg / POSTURE_GOOD_MAX_DEG, 0, 1);
  const P_sway = 1 - clamp(swaySigma / SWAY_GOOD_MAX_NORM, 0, 1);
  const P = clamp(0.6 * P_angle + 0.4 * P_sway, 0, 1);

  // Eye Contact (E): 0.7 * deviation score + 0.3 * breaks score
  const E_dev = 1 - clamp(gazeDevDeg / (GAZE_GOOD_MAX_DEG * 1.8), 0, 1);
  const E_breaks = 1 - clamp(gazeBreaksPerMin / GAZE_MAX_BREAKS_PER_MIN, 0, 1);
  const E = clamp(0.7 * E_dev + 0.3 * E_breaks, 0, 1);

  // Smoothness (S): inverse smooth mapping of wrist velocity std
  const S = 1 - clamp(
    (wristVelStd - WRIST_VEL_STD_GOOD_MAX) / 
    (WRIST_VEL_STD_HIGH - WRIST_VEL_STD_GOOD_MAX),
    0,
    1
  );

  // Composure/Pacing (C): inverse of normalized torso speed
  const C = 1 - clamp(torsoSpeed / (TORSO_SPEED_HIGH * 1.5), 0, 1);

  return { P, E, S, C };
}

/**
 * Compute overall confidence score from subscores
 * Returns value in [0, 100]
 */
export function computeOverall(subscores: Subscores): number {
  const weighted =
    WEIGHTS.P * subscores.P +
    WEIGHTS.E * subscores.E +
    WEIGHTS.S * subscores.S +
    WEIGHTS.C * subscores.C;

  return clamp(weighted * 100, 0, 100);
}

/**
 * Compute full scores from features
 */
export function computeScores(features: Features): Scores {
  const subscores = computeSubscores(features);
  const overall = computeOverall(subscores);

  return {
    ...subscores,
    overall,
  };
}

