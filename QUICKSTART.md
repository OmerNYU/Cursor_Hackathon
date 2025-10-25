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

```typescript
import { FeatureProcessor, FeatureSmoother, computeScores, TipsEngine, DEFAULT_TIP_RULES } from './index.js';
import type { FramePack } from './index.js';

// Initialize (maintain as state in your app)
const processor = new FeatureProcessor();
const smoother = new FeatureSmoother();
const tipsEngine = new TipsEngine(DEFAULT_TIP_RULES);

// Process each frame from MediaPipe
function onFrame(frame: FramePack) {
  // 1. Extract features
  const rawFeatures = processor.extractFeatures(frame);
  
  // 2. Add to rolling windows
  smoother.addSamples(rawFeatures.swaySigma, rawFeatures.wristVelStd, frame.ts);
  
  // 3. Get rolling stats
  const stds = smoother.getRollingStds(frame.ts);
  rawFeatures.swaySigma = stds.swaySigma;
  rawFeatures.wristVelStd = stds.wristVelStd;
  
  // 4. Apply EMA smoothing
  const features = smoother.smoothFeatures(rawFeatures);
  
  // 5. Compute scores
  const scores = computeScores(features);
  
  // 6. Get tips
  const tips = tipsEngine.evaluateTips(features, scores, frame.ts);
  
  // Update UI with scores.overall (0-100) and tips
  updateUI(scores, tips);
}
```

## File Structure

```
src/
├── lib/
│   ├── types.ts              # Core type definitions
│   ├── config.ts             # Thresholds and tunables
│   ├── geometry.ts           # Math utilities
│   ├── geometry.test.ts      # Unit tests
│   ├── smoothing.ts          # EMA and rolling stats
│   ├── smoothing.test.ts     # Unit tests
│   ├── gaze.ts               # Gaze estimation
│   ├── featureProcessor.ts   # Feature extraction
│   ├── scoreEngine.ts        # Scoring logic
│   └── tipsEngine.ts         # Tips generation
├── fixtures/
│   ├── frames.still.json     # Still subject test data
│   ├── frames.lookaway.json  # Look away test data
│   └── frames.walk.json      # Walk around test data
├── test-harness.ts           # End-to-end validation
├── example.ts                # Usage example
└── index.ts                  # Public API exports
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

## Next Steps

- [ ] Integrate with MediaPipe detection loop (teammate responsibility)
- [ ] Connect to UI components (teammate responsibility)
- [ ] Tune thresholds based on real user testing
- [ ] Add more tip rules as needed
- [ ] Consider adding session history tracking

