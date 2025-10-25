/**
 * Configuration and tunables for PitchMirror scoring engine
 * All thresholds locked for MVP (Architecture updates)
 */

import type { Features, Subscores, TipRule } from './types.js';

// Test mode flag (set via PM_TEST=1 environment variable)
export const TEST_MODE = process.env.PM_TEST === '1';

// Weights for overall confidence score
export const WEIGHTS = { P: 0.4, E: 0.3, S: 0.2, C: 0.1 } as const;

// Smoothing parameters
export const EMA_BETA = 0.3;
// Rolling window: 1500ms (~45 frames at 30fps) in production, 330ms (~10 frames) in test mode
export const ROLLING_WINDOW_MS = TEST_MODE ? 330 : 1500;

// Posture thresholds
export const POSTURE_GOOD_MAX_DEG = 10; // angle to vertical (≤10° is good)
export const SWAY_GOOD_MAX_NORM = 0.02; // σ / torsoLengthPx

// Eye contact thresholds
export const GAZE_GOOD_MAX_DEG = 5; // deviation ≤5° is excellent
export const GAZE_BREAK_DEG = 10; // deviation >10° counts as break
export const GAZE_BREAK_MIN_MS = 200; // break must last ≥200ms
export const GAZE_MAX_BREAKS_PER_MIN = 12; // penalty threshold

// Smoothness (hands) threshold
export const WRIST_VEL_STD_GOOD_MAX = 0.02; // σ / faceWidthPx (lower is better)
export const WRIST_VEL_STD_HIGH = 0.08; // upper bound for penalty

// Pacing threshold
export const TORSO_SPEED_HIGH = 0.15; // normalized units/ms (walking clearly exceeds)

// Grace period for missing landmarks
export const MISSING_LANDMARK_GRACE_MS = 500;

// Ring buffer sizing (at 30 fps, 1500ms ≈ 45 samples; allocate 64 for headroom)
export const ROLLING_BUFFER_CAPACITY = 64;

/**
 * Starter tip rules (4-6 examples)
 * Evaluate on smoothed features/subscores
 */
export const DEFAULT_TIP_RULES: TipRule[] = [
  {
    id: 'eye-contact-poor',
    priority: 1, // highest priority
    windowSec: 2,
    cooldownSec: 6,
    when: (f: Features, _s: Subscores) => f.gazeDevDeg > GAZE_BREAK_DEG,
    message: '👀 Keep your eyes closer to the camera lens.',
  },
  {
    id: 'posture-slouch',
    priority: 2,
    windowSec: 2,
    cooldownSec: 6,
    when: (_f: Features, s: Subscores) => s.P < 0.7,
    message: '💪 Stack your shoulders over your hips.',
  },
  {
    id: 'hands-fidgety',
    priority: 2,
    windowSec: 2,
    cooldownSec: 6,
    when: (f: Features, _s: Subscores) => f.wristVelStd > WRIST_VEL_STD_HIGH,
    message: '🖐️ Hands a bit fidgety — add purposeful pauses.',
  },
  {
    id: 'pacing-excessive',
    priority: 3,
    windowSec: 2,
    cooldownSec: 6,
    when: (f: Features, _s: Subscores) => f.torsoSpeed > TORSO_SPEED_HIGH,
    message: '🚶 You\'re pacing — plant your feet for emphasis.',
  },
  {
    id: 'gaze-breaks-frequent',
    priority: 2,
    windowSec: 3,
    cooldownSec: 8,
    when: (f: Features, _s: Subscores) => f.gazeBreaksPerMin > GAZE_MAX_BREAKS_PER_MIN,
    message: '👁️ Try holding eye contact a bit longer.',
  },
  {
    id: 'engagement-low',
    priority: 3,
    windowSec: 3,
    cooldownSec: 10,
    when: (_f: Features, s: Subscores) => s.E < 0.6,
    message: '✨ Remember to engage with the camera.',
  },
];

