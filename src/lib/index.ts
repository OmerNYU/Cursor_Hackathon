/**
 * Public API for PitchMirror Feature Processing Engine
 * Single-call evaluation facade
 */

import { FeatureProcessor } from './featureProcessor';
import { FeatureSmoother } from './smoothing';
import { TipsEngine } from './tipsEngine';
import { DEFAULT_TIP_RULES } from './config';
import { computeSubscores, computeOverall } from './scoreEngine';
import type { FramePack, Features, Subscores, TipRule } from './types';

// Initialize singleton instances
const processor = new FeatureProcessor();
const smoother = new FeatureSmoother();
const tips = new TipsEngine(DEFAULT_TIP_RULES);

/**
 * Single-call evaluation facade
 * Process a frame through the full pipeline and return all outputs
 * 
 * @param frame - MediaPipe frame pack with pose and face landmarks
 * @param nowMs - Current timestamp (monotonic, e.g., performance.now())
 * @returns Complete evaluation with features, subscores, overall score, and active tips
 */
export function evaluate(frame: FramePack, nowMs: number) {
  // 1. Extract raw features
  const raw = processor.extractFeatures(frame);
  
  // 2. Add samples to rolling windows (for sway and wrist velocity)
  // Only add if pose data is fresh (not from grace period)
  if (processor.isPoseDataFresh()) {
    smoother.addSamples(raw.swaySigma, raw.wristVelStd, nowMs);
  }
  
  // 3. Get rolling standard deviations
  const stds = smoother.getRollingStds(nowMs);
  raw.swaySigma = stds.swaySigma;
  raw.wristVelStd = stds.wristVelStd;
  
  // 4. Apply EMA smoothing
  const features = smoother.smoothFeatures(raw);
  
  // 5. Compute subscores
  const subscores = computeSubscores(features);
  
  // 6. Compute overall score
  const overall = computeOverall(subscores);
  
  // 7. Evaluate tips
  const topTips = tips.evaluateTips(features, subscores, nowMs);
  
  return { features, subscores, overall, tips: topTips };
}

/**
 * Reset all state (useful for starting a new session)
 */
export function reset() {
  processor.reset();
  smoother.reset();
  tips.reset();
}

// Re-export types and utilities for convenience
export type { FramePack, Features, Subscores, TipRule } from './types';
export { FeatureProcessor } from './featureProcessor';
export { FeatureSmoother, SubscoreSmoother } from './smoothing';
export { TipsEngine } from './tipsEngine';
export { computeSubscores, computeOverall, computeScores } from './scoreEngine';
export { DEFAULT_TIP_RULES } from './config';

