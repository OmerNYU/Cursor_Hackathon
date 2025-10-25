/**
 * Configuration and tunables for PitchMirror scoring engine
 * All thresholds locked for MVP (Architecture updates)
 */
import type { TipRule } from './types.js';
export declare const TEST_MODE: boolean;
export declare const WEIGHTS: {
    readonly P: 0.4;
    readonly E: 0.3;
    readonly S: 0.2;
    readonly C: 0.1;
};
export declare const EMA_BETA = 0.3;
export declare const ROLLING_WINDOW_MS: number;
export declare const POSTURE_GOOD_MAX_DEG = 10;
export declare const SWAY_GOOD_MAX_NORM = 0.02;
export declare const GAZE_GOOD_MAX_DEG = 5;
export declare const GAZE_BREAK_DEG = 10;
export declare const GAZE_BREAK_MIN_MS = 200;
export declare const GAZE_MAX_BREAKS_PER_MIN = 12;
export declare const WRIST_VEL_STD_GOOD_MAX = 0.02;
export declare const WRIST_VEL_STD_HIGH = 0.08;
export declare const TORSO_SPEED_HIGH = 0.15;
export declare const MISSING_LANDMARK_GRACE_MS = 500;
export declare const ROLLING_BUFFER_CAPACITY = 64;
/**
 * Starter tip rules (4-6 examples)
 * Evaluate on smoothed features/subscores
 */
export declare const DEFAULT_TIP_RULES: TipRule[];
//# sourceMappingURL=config.d.ts.map