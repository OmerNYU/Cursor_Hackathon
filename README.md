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

## Key Files

- **`src/lib/types.ts`** - Core type definitions
- **`src/lib/config.ts`** - Thresholds and tunables
- **`src/lib/geometry.ts`** - Math utilities (angles, distances, rolling stats)
- **`src/lib/smoothing.ts`** - EMA and temporal smoothing
- **`src/lib/gaze.ts`** - Iris-based gaze estimation
- **`src/lib/featureProcessor.ts`** - Extract 6 features from landmarks
- **`src/lib/scoreEngine.ts`** - Features → Subscores → Overall
- **`src/lib/tipsEngine.ts`** - Rule-based tip selection
- **`src/fixtures/`** - Test fixtures (still, lookaway, walk scenarios)
- **`src/test-harness.ts`** - End-to-end validation

## Setup

```bash
npm install
```

## Testing

### Unit Tests
```bash
npm test
```

### End-to-End Test Harness
```bash
npm run build
node dist/test-harness.js
```

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

## Configuration

All thresholds in `src/lib/config.ts`:

```typescript
WEIGHTS = { P: 0.4, E: 0.3, S: 0.2, C: 0.1 }
EMA_BETA = 0.3
ROLLING_WINDOW_MS = 1500
POSTURE_GOOD_MAX_DEG = 10
GAZE_BREAK_DEG = 10
TORSO_SPEED_HIGH = 0.15
// ... and more
```

## Graceful Degradation

- Missing landmarks → hold last good value for ≤500ms grace period
- No face data → skip eye contact features, continue with posture/pacing
- No pose data → skip posture/pacing, continue with eye contact

## Performance Notes

- Ring buffers (64 capacity) for efficient rolling statistics
- EMA state maintained per metric (no reallocation)
- Target: 10-15 FPS processing at 30 FPS capture

## License

MIT

