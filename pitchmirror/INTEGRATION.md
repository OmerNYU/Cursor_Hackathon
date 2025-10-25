# Integration Guide for Vision & Logic Teams

This document explains how to integrate your Vision and Logic implementations with the Frontend.

## Overview

The frontend is **completely decoupled** from Vision and Logic implementations. It only depends on:
1. Type interfaces defined in `src/lib/types.ts`
2. Two functions: `useMediaPipe()` hook and `evaluate()` function

## Type Contracts

All types are defined in `src/lib/types.ts` and match the specifications exactly.

### Vision Layer Types

```typescript
// What Vision provides
export interface FramePack {
  pose?: PoseFrame;
  face?: FaceFrame;
  scales: {
    faceWidth: number;
    torsoLength: number;
  };
  quality: {
    poseOk: boolean;
    faceOk: boolean;
  };
  ts: number;
}

// What the hook returns
export interface UseMediaPipeResult {
  framePack: FramePack | null;
  videoRef: React.RefObject<HTMLVideoElement>;
  isReady: boolean;
  error: string | null;
}
```

### Logic Layer Types

```typescript
// What Logic expects
export function evaluate(
  framePack: FramePack,
  nowMs: number
): EvaluateResult

// What Logic returns
export interface EvaluateResult {
  features: {
    postureAngleDeg: number;
    swaySigma: number;
    gazeDevDeg: number;
    gazeBreaksPerMin: number;
    wristVelStd: number;
    torsoSpeed: number;
  };
  subscores: {
    P: number; // 0..1
    E: number; // 0..1
    S: number; // 0..1
    C: number; // 0..1
  };
  overall: number;   // 0..100
  tips: string[];    // up to 2 strings
}
```

## Integration Steps

### Step 1: Place Your Code

Create your implementation files:

```
pitchmirror/src/
  ├── vision/
  │   └── useMediaPipe.ts      # Your Vision implementation
  └── logic/
      └── evaluate.ts           # Your Logic implementation
```

### Step 2: Update Imports

Edit `src/hooks/useScoringLoop.ts`:

```typescript
// Change these two lines:
import { useMediaPipe } from '../lib/mockVision';  // REMOVE
import { evaluate } from '../lib/mockLogic';       // REMOVE

// To:
import { useMediaPipe } from '../vision/useMediaPipe';
import { evaluate } from '../logic/evaluate';
```

That's it! The frontend will now use your real implementations.

## Vision Layer Implementation Guide

Your `useMediaPipe` hook should:

### 1. Initialize MediaPipe
```typescript
export function useMediaPipe(): UseMediaPipeResult {
  const videoRef = useRef<HTMLVideoElement>(null!);
  const [framePack, setFramePack] = useState<FramePack | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize camera
    // Load MediaPipe models
    // Set isReady=true when done
    // Set error if anything fails
  }, []);

  // ... update framePack ~10 times/second

  return { framePack, videoRef, isReady, error };
}
```

### 2. Update FramePack Regularly
- Target: 10 Hz (every 100ms)
- Include timestamp: `Date.now()`
- Set quality flags appropriately
- Optional fields can be undefined

### 3. Handle Errors Gracefully
- If camera denied: set `error = "Camera access denied"`
- If model fails: set `error = "Failed to load models"`
- Frontend will fallback to mock mode

### 4. Provide Video Reference
The `videoRef` should point to the `<video>` element that receives the webcam stream.

## Logic Layer Implementation Guide

Your `evaluate` function should:

### 1. Accept Standard Inputs
```typescript
export function evaluate(
  framePack: FramePack,
  nowMs: number
): EvaluateResult
```

### 2. Handle Missing Data
```typescript
if (!framePack.pose) {
  // Use partial scoring or fallback values
}
if (!framePack.face) {
  // Degrade gracefully
}
```

### 3. Return Complete Results
```typescript
return {
  features: { /* all 6 features */ },
  subscores: { P, E, S, C },  // all in 0..1 range
  overall: Math.round(...),    // 0..100
  tips: [                      // 0-2 strings
    "👀 Keep your eyes closer to the camera",
    "💪 Stack shoulders over hips"
  ]
}
```

### 4. Performance Considerations
- Function is called ~10 times/second
- Keep calculations efficient
- Use EMA smoothing for stability
- Cache expensive computations

## Testing Integration

### Test with Mock First
1. Ensure frontend works with mocks: `npm run dev`
2. Verify all UI components render correctly
3. Test keyboard shortcuts (Space, O, D)

### Test with Real Vision
1. Replace Vision mock import
2. Check camera permissions work
3. Verify `framePack` updates appear in Debug panel (D key)
4. Confirm overlay draws correctly

### Test with Real Logic
1. Replace Logic mock import
2. Verify scores update smoothly
3. Check tips appear and make sense
4. Confirm subscores are in correct ranges

### Full Integration Test
1. Both Vision and Logic connected
2. Test all 3 phases: INIT → CALIBRATING → RUNNING
3. Test pause (Space) and overlay (O)
4. Test with good posture, poor posture, etc.
5. Verify tips match actual behavior

## Debug Panel Usage

Press **D** to toggle debug panel. It shows:
- **FPS**: Should be 8-12 Hz for updates
- **Mode**: MOCK or LIVE
- **Pose/Face Quality**: From your Vision layer
- **Raw Features**: From your Logic layer

Use this to verify your implementations are working.

## Common Integration Issues

### Issue: framePack is always null
**Solution**: Check that Vision's `isReady` is set to `true` after initialization.

### Issue: Scores don't update
**Solution**: Verify `evaluate()` is returning valid numbers (not NaN or undefined).

### Issue: Tips don't appear
**Solution**: Ensure `tips` array contains strings (even if empty array).

### Issue: Overlay doesn't draw
**Solution**: Check that `pose` and `face` objects have correct structure.

### Issue: Performance is slow
**Solution**: 
- Profile your Vision/Logic code
- Reduce update frequency if needed
- Use Web Workers for heavy processing

## File Organization Suggestion

```
pitchmirror/src/
  ├── vision/
  │   ├── useMediaPipe.ts          # Main hook
  │   ├── mediapipeLoader.ts       # Model loading
  │   ├── cameraManager.ts         # getUserMedia wrapper
  │   └── landmarkProcessor.ts     # Process raw landmarks
  ├── logic/
  │   ├── evaluate.ts              # Main function
  │   ├── featureExtractor.ts      # Calculate features
  │   ├── scoreCalculator.ts       # Calculate subscores
  │   ├── tipsEngine.ts            # Generate tips
  │   └── config.ts                # Thresholds and weights
  ├── components/                   # UI (already done)
  ├── hooks/                        # State management
  └── lib/
      └── types.ts                  # Shared types (don't modify)
```

## Performance Targets

- **Vision**: 10 FPS output (100ms per frame)
- **Logic**: < 10ms processing time per call
- **UI**: 60 FPS canvas rendering (already optimized)
- **Overall**: Smooth experience on mid-range laptops

## Next Steps

1. Review the type definitions in `src/lib/types.ts`
2. Implement your Vision layer matching `UseMediaPipeResult`
3. Implement your Logic layer matching `EvaluateResult`
4. Update imports in `src/hooks/useScoringLoop.ts`
5. Test incrementally (Vision first, then Logic)
6. Tune parameters based on real-world testing

## Questions?

Check the main README.md for project structure and component documentation.

