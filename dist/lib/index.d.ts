/**
 * Public API for PitchMirror Feature Processing Engine
 * Single-call evaluation facade
 */
import type { FramePack, Features, Subscores, TipRule } from './types.js';
/**
 * Single-call evaluation facade
 * Process a frame through the full pipeline and return all outputs
 *
 * @param frame - MediaPipe frame pack with pose and face landmarks
 * @param nowMs - Current timestamp (monotonic, e.g., performance.now())
 * @returns Complete evaluation with features, subscores, overall score, and active tips
 */
export declare function evaluate(frame: FramePack, nowMs: number): {
    features: Features;
    subscores: Subscores;
    overall: number;
    tips: TipRule[];
};
/**
 * Reset all state (useful for starting a new session)
 */
export declare function reset(): void;
export type { FramePack, Features, Subscores, TipRule } from './types.js';
export { FeatureProcessor } from './featureProcessor.js';
export { FeatureSmoother, SubscoreSmoother } from './smoothing.js';
export { TipsEngine } from './tipsEngine.js';
export { computeSubscores, computeOverall, computeScores } from './scoreEngine.js';
export { DEFAULT_TIP_RULES } from './config.js';
//# sourceMappingURL=index.d.ts.map