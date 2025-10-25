/**
 * Public API for PitchMirror Feature Processing Engine
 * Single-call evaluation facade
 */
import { FeatureProcessor } from './featureProcessor.js';
import { FeatureSmoother } from './smoothing.js';
import { TipsEngine } from './tipsEngine.js';
import { DEFAULT_TIP_RULES } from './config.js';
import { computeSubscores, computeOverall } from './scoreEngine.js';
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
export function evaluate(frame, nowMs) {
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
export { FeatureProcessor } from './featureProcessor.js';
export { FeatureSmoother, SubscoreSmoother } from './smoothing.js';
export { TipsEngine } from './tipsEngine.js';
export { computeSubscores, computeOverall, computeScores } from './scoreEngine.js';
export { DEFAULT_TIP_RULES } from './config.js';
//# sourceMappingURL=index.js.map