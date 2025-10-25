# PitchMirror Feature Processing Engine

Core analysis pipeline that converts MediaPipe landmarks into features, subscores, and actionable tips.

## Overview

This module implements the analytical heart of PitchMirror, transforming raw pose and face landmarks through:

1. **Feature Extraction** → 6 metrics (posture, sway, gaze, gaze breaks, hand smoothness, pacing)
2. **Temporal Smoothing** → EMA + rolling statistics
3. **Scoring** → 4 subscores (P/E/S/C) + overall confidence (0-100)
4. **Tips Engine** → Rule-based actionable feedback

## Architecture

```
FramePack → Features → Smoothing → Subscores → Overall Score
                                 ↘ Tips Engine → Top 2 Tips
```

## Quick Start API

For immediate integration, use the single-call evaluation facade:

```typescript
import { evaluate } from './lib/index.js';
import type { FramePack } from './lib/types.js';

// Call once per frame
const result = evaluate(frameFromMediaPipe, performance.now());

// result = { features, subscores, overall, tips }
console.log(`Overall score: ${result.overall}/100`);
console.log(`Active tips:`, result.tips.map(t => t.message));
```

For manual pipeline control, import individual components from `src/lib/index.ts`.

## Key Files

- **`src/lib/index.ts`** - Public API: single-call `evaluate()` function
- **`src/lib/types.ts`** - Core type definitions
- **`src/lib/config.ts`** - Thresholds and tunables (supports test mode)
- **`src/lib/geometry.ts`** - Math utilities (angles, distances, safeNorm, rolling stats)
- **`src/lib/smoothing.ts`** - EMA and temporal smoothing
- **`src/lib/gaze.ts`** - Iris-based gaze estimation with coordinate conventions
- **`src/lib/featureProcessor.ts`** - Extract 6 features from landmarks with grace periods
- **`src/lib/scoreEngine.ts`** - Features → Subscores → Overall (NaN-safe)
- **`src/lib/tipsEngine.ts`** - Rule-based tip selection with cooldowns
- **`src/fixtures/`** - Test fixtures (still, lookaway, walk, irregular FPS)
- **`src/test-harness.ts`** - End-to-end validation with NaN checks

## Setup

```bash
npm install
```

## Testing

### Unit Tests
```bash
npm test
```

Runs all unit tests with vitest (geometry, smoothing, tips engine).

### End-to-End Test Harness
```bash
npm run test:harness
```

Runs 4 test scenarios (still/lookaway/walk/irregular) with test-mode rolling window (330ms).
The harness validates all outputs are finite (no NaN/Infinity) and checks expected behaviors.

## Features Extracted

| Feature | Description | Normalization |
|---------|-------------|---------------|
| `postureAngleDeg` | Torso deviation from vertical | Degrees (0° = upright) |
| `swaySigma` | Lateral sway stability | σ / torsoLengthPx |
| `gazeDevDeg` | Gaze deviation from center | Degrees |
| `gazeBreaksPerMin` | Rate of gaze breaks (>10°, ≥200ms) | Per minute |
| `wristVelStd` | Hand fidgeting | σ / faceWidthPx |
| `torsoSpeed` | Body translation speed | px/ms / torsoLengthPx |

## Subscores (0-1)

- **P (Posture)**: `0.6 × angle_score + 0.4 × sway_score`
- **E (Eye Contact)**: `0.7 × gaze_dev_score + 0.3 × breaks_score`
- **S (Smoothness)**: Inverse mapping of wrist velocity std
- **C (Composure)**: Inverse of torso speed

## Overall Score (0-100)

```
Overall = 100 × (0.4×P + 0.3×E + 0.2×S + 0.1×C)
```

## Tips Engine

Rules evaluate smoothed features/subscores with:
- **Window**: Condition must hold for N seconds
- **Cooldown**: Suppress repeats for N seconds
- **Priority**: Return top 2 tips by priority

Example rules:
- Eye contact poor (gaze deviation >10°)
- Posture slouch (P score <0.7)
- Hands fidgety (wrist velocity std high)
- Pacing excessive (torso speed >threshold)

## Test Scenarios

### 1. Still Subject
- Minimal movement, centered gaze
- **Expected**: P/S/C high, overall >80, no tips

### 2. Look Away
- Gaze deviation increases gradually
- **Expected**: E drops, eye contact tip triggers

### 3. Walk Around
- Sustained lateral torso movement
- **Expected**: C drops, pacing tip triggers

### 4. Irregular FPS
- Variable frame rate (16-50ms gaps)
- **Expected**: Robust scoring, no NaN, stable output

## Configuration

All thresholds centralized in `src/lib/config.ts`:

```typescript
WEIGHTS = { P: 0.4, E: 0.3, S: 0.2, C: 0.1 }
EMA_BETA = 0.3
ROLLING_WINDOW_MS = 1500  // Auto-adjusts to 330ms when PM_TEST=1
POSTURE_GOOD_MAX_DEG = 10
GAZE_BREAK_DEG = 10
TORSO_SPEED_HIGH = 0.15
// ... and more
```

### Test Mode vs Live Mode

- **Live Mode (default):** `ROLLING_WINDOW_MS = 1500` (~45 frames at 30fps)
- **Test Mode (`PM_TEST=1`):** `ROLLING_WINDOW_MS = 330` (~10 frames) for small fixtures

Test mode is automatically enabled by the test harness script. For production, simply omit the environment variable.

## Graceful Degradation

- **Missing landmarks** → Hold last good value for ≤500ms grace period
- **Grace period behavior** → Skip adding stale values to rolling stats to prevent std collapse
- **No face data** → Skip eye contact features, continue with posture/pacing
- **No pose data** → Skip posture/pacing, continue with eye contact
- **NaN/Infinity guards** → All scoring inputs sanitized via `sane()` helper
- **Division-by-zero protection** → `safeNorm()` prevents invalid normalization

## Performance Notes

- Ring buffers (64 capacity) for efficient rolling statistics
- EMA state maintained per metric (no reallocation)
- Target: 10-15 FPS processing at 30 FPS capture

## License

MIT

