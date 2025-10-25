# Quick Start Guide

## Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Run type check:**
```bash
npm run typecheck
```

3. **Run unit tests:**
```bash
npm test
```

4. **Build the project:**
```bash
npm run build
```

5. **Run end-to-end test harness:**
```bash
npm run test:harness
```

## Expected Test Results

### Unit Tests (vitest)
- ✅ All geometry utilities (distance, angleDeg, midpoint, clamp, RollingStats)
- ✅ All smoothing utilities (ema, EMAState, FeatureSmoother)

### Test Harness
- ✅ **Still Subject**: High P/S/C scores, overall >80, no tips
- ✅ **Look Away**: Gaze deviation increases, E drops, eye contact tip triggers
- ✅ **Walk Around**: Torso speed rises, C drops, pacing tip triggers

## Usage Example

### Option 1: Single-Call API (Recommended)

```typescript
import { evaluate, reset } from './lib/index.js';
import type { FramePack } from './lib/types.js';

// Process each frame from MediaPipe
function onFrame(frame: FramePack) {
  const result = evaluate(frame, performance.now());
  
  // result = { features, subscores, overall, tips }
  updateUI(result.overall, result.tips);
}

// When starting a new session
function startNewSession() {
  reset();
}
```

### Option 2: Manual Pipeline (Advanced)

For fine-grained control:

```typescript
import { FeatureProcessor, FeatureSmoother, computeSubscores, computeOverall, TipsEngine, DEFAULT_TIP_RULES } from './lib/index.js';
import type { FramePack } from './lib/types.js';

// Initialize (maintain as state in your app)
const processor = new FeatureProcessor();
const smoother = new FeatureSmoother();
const tipsEngine = new TipsEngine(DEFAULT_TIP_RULES);

// Process each frame from MediaPipe
function onFrame(frame: FramePack) {
  // 1. Extract features
  const rawFeatures = processor.extractFeatures(frame);
  
  // 2. Add to rolling windows (only if pose data is fresh)
  if (processor.isPoseDataFresh()) {
    smoother.addSamples(rawFeatures.swaySigma, rawFeatures.wristVelStd, frame.ts);
  }
  
  // 3. Get rolling stats
  const stds = smoother.getRollingStds(frame.ts);
  rawFeatures.swaySigma = stds.swaySigma;
  rawFeatures.wristVelStd = stds.wristVelStd;
  
  // 4. Apply EMA smoothing
  const features = smoother.smoothFeatures(rawFeatures);
  
  // 5. Compute scores
  const subscores = computeSubscores(features);
  const overall = computeOverall(subscores);
  
  // 6. Get tips
  const tips = tipsEngine.evaluateTips(features, subscores, frame.ts);
  
  // Update UI with overall (0-100) and tips
  updateUI(overall, tips);
}
```

## File Structure

```
src/
├── lib/
│   ├── index.ts              # Public API exports & evaluate() facade
│   ├── types.ts              # Core type definitions
│   ├── config.ts             # Thresholds and tunables (test mode support)
│   ├── geometry.ts           # Math utilities (safeNorm, RollingStats)
│   ├── geometry.test.ts      # Unit tests
│   ├── smoothing.ts          # EMA and rolling stats
│   ├── smoothing.test.ts     # Unit tests
│   ├── gaze.ts               # Gaze estimation
│   ├── featureProcessor.ts   # Feature extraction with grace periods
│   ├── scoreEngine.ts        # Scoring logic (NaN-safe)
│   ├── tipsEngine.ts         # Tips generation
│   └── tipsEngine.test.ts    # Unit tests
├── fixtures/
│   ├── frames.still.json     # Still subject test data
│   ├── frames.lookaway.json  # Look away test data
│   ├── frames.walk.json      # Walk around test data
│   └── frames.irregular.json # Irregular FPS test data
├── test-harness.ts           # End-to-end validation (NaN checks)
├── example.ts                # Usage example
└── index.ts                  # Main entry point
```

## Integration with Main App

Your teammates working on the MediaPipe integration should:

1. Import from this module: `import { FeatureProcessor, ... } from './feature-engine'`
2. Initialize processors once (in React state/context)
3. Call `processor.extractFeatures(frame)` on each MediaPipe detection
4. Follow the pipeline: features → rolling stats → EMA → scores → tips
5. Update UI with `scores.overall` (0-100) and display active tips

## Tuning Thresholds

All configurable values are in `src/lib/config.ts`:
- Adjust `WEIGHTS` to change subscore importance
- Adjust `EMA_BETA` for more/less smoothing (0.2-0.4 recommended)
- Adjust thresholds (`POSTURE_GOOD_MAX_DEG`, etc.) based on user testing

## Test Mode

When running tests with small fixtures, set `PM_TEST=1` to use shorter rolling window:
- **Production:** `ROLLING_WINDOW_MS = 1500ms` (~45 frames)
- **Test:** `ROLLING_WINDOW_MS = 330ms` (~10 frames)

The `npm run test:harness` script automatically sets `PM_TEST=1`.

## Safety Features

- **`safeNorm(value, scale)`** - Prevents division by zero in normalization
- **`sane(x)`** - Replaces NaN/Infinity with 0 in scoring
- **Grace period logic** - Holds last valid features for 500ms without polluting rolling stats
- **Timestamp consistency** - All components use same monotonic time source (`performance.now()`)

## Next Steps

- [ ] Integrate with MediaPipe detection loop (teammate responsibility)
- [ ] Connect to UI components (teammate responsibility)
- [ ] Tune thresholds based on real user testing
- [ ] Add more tip rules as needed
- [ ] Consider adding session history tracking

