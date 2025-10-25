/**
 * PitchMirror Feature Processing Engine
 * Public API exports
 */
// Configuration
export { WEIGHTS, EMA_BETA, ROLLING_WINDOW_MS, POSTURE_GOOD_MAX_DEG, SWAY_GOOD_MAX_NORM, GAZE_GOOD_MAX_DEG, GAZE_BREAK_DEG, GAZE_BREAK_MIN_MS, GAZE_MAX_BREAKS_PER_MIN, WRIST_VEL_STD_GOOD_MAX, WRIST_VEL_STD_HIGH, TORSO_SPEED_HIGH, MISSING_LANDMARK_GRACE_MS, ROLLING_BUFFER_CAPACITY, DEFAULT_TIP_RULES, } from './lib/config.js';
// Geometry utilities
export { distance, angleDeg, midpoint, clamp, RollingStats } from './lib/geometry.js';
// Smoothing
export { ema, EMAState, FeatureSmoother, SubscoreSmoother } from './lib/smoothing.js';
// Gaze estimation
export { computeGazeVector, gazeDeviationDeg, GazeBreakTracker } from './lib/gaze.js';
// Feature processor
export { FeatureProcessor } from './lib/featureProcessor.js';
// Score engine
export { computeSubscores, computeOverall, computeScores } from './lib/scoreEngine.js';
// Tips engine
export { TipsEngine } from './lib/tipsEngine.js';
//# sourceMappingURL=index.js.map