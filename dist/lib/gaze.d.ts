/**
 * Gaze estimation using iris landmarks
 * Architecture §7B
 *
 * COORDINATE CONVENTION:
 * - Screen-forward is treated as (0, -1) in screen coordinates (y increases downward)
 * - gazeDeviationDeg measures the angle between normalized eye→iris vector and (0, -1)
 * - Smaller angles mean better eye contact with camera
 *
 * FALLBACK BEHAVIOR:
 * - If one eye is missing: use the other eye
 * - If both eyes missing for >GRACE_MS: return undefined (handled by feature processor)
 * - Iris position relative to eye center indicates gaze direction
 */
import type { Landmark, Vec2, FaceFrame } from './types.js';
/**
 * Compute gaze vector from iris to eye center
 */
export declare function computeGazeVector(iris: Landmark, eyeCenter: Landmark): Vec2;
/**
 * Compute gaze deviation angle from screen center in degrees
 * Average both eyes
 */
export declare function gazeDeviationDeg(face: FaceFrame): number;
/**
 * Gaze break tracker
 * Counts contiguous runs where gazeDevDeg > threshold for ≥ min duration
 */
export declare class GazeBreakTracker {
    private inBreak;
    private breakStartTs;
    private breakCount;
    private firstSampleTs;
    private breakRateEMA;
    private emaInitialized;
    /**
     * Update with current gaze deviation
     * Returns current breaks per minute estimate
     */
    update(gazeDevDeg: number, ts: number): number;
    /**
     * Reset tracker
     */
    reset(): void;
    /**
     * Get raw break count
     */
    getBreakCount(): number;
}
//# sourceMappingURL=gaze.d.ts.map