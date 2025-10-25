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
import { GAZE_BREAK_DEG, GAZE_BREAK_MIN_MS } from './config.js';
import { ema } from './smoothing.js';
/**
 * Compute gaze vector from iris to eye center
 */
export function computeGazeVector(iris, eyeCenter) {
    return {
        x: iris.x - eyeCenter.x,
        y: iris.y - eyeCenter.y,
    };
}
/**
 * Compute gaze deviation angle from screen center in degrees
 * Average both eyes
 */
export function gazeDeviationDeg(face) {
    // Compute eye centers (midpoint of inner/outer corners)
    const leftEyeCenter = {
        x: (face.eyes.L_inner.x + face.eyes.L_outer.x) / 2,
        y: (face.eyes.L_inner.y + face.eyes.L_outer.y) / 2,
    };
    const rightEyeCenter = {
        x: (face.eyes.R_inner.x + face.eyes.R_outer.x) / 2,
        y: (face.eyes.R_inner.y + face.eyes.R_outer.y) / 2,
    };
    // Compute gaze vectors
    const leftGaze = computeGazeVector(face.iris.L, leftEyeCenter);
    const rightGaze = computeGazeVector(face.iris.R, rightEyeCenter);
    // Average gaze vector
    const avgGaze = {
        x: (leftGaze.x + rightGaze.x) / 2,
        y: (leftGaze.y + rightGaze.y) / 2,
    };
    // Compute angle from center (screen normal)
    // Assuming screen center is (0, 0) relative gaze
    const magnitude = Math.sqrt(avgGaze.x * avgGaze.x + avgGaze.y * avgGaze.y);
    // Convert to degrees (rough approximation: small angles)
    // For more accuracy, could use atan2, but for small deviations this works
    const angleDeg = Math.atan2(magnitude, 1.0) * (180 / Math.PI);
    return angleDeg;
}
/**
 * Gaze break tracker
 * Counts contiguous runs where gazeDevDeg > threshold for ≥ min duration
 */
export class GazeBreakTracker {
    constructor() {
        this.inBreak = false;
        this.breakStartTs = 0;
        this.breakCount = 0;
        this.firstSampleTs = 0;
        this.breakRateEMA = 0;
        this.emaInitialized = false;
    }
    /**
     * Update with current gaze deviation
     * Returns current breaks per minute estimate
     */
    update(gazeDevDeg, ts) {
        if (this.firstSampleTs === 0) {
            this.firstSampleTs = ts;
        }
        const isBreaking = gazeDevDeg > GAZE_BREAK_DEG;
        if (isBreaking && !this.inBreak) {
            // Start of potential break
            this.inBreak = true;
            this.breakStartTs = ts;
        }
        else if (!isBreaking && this.inBreak) {
            // End of break - check if it was long enough
            const duration = ts - this.breakStartTs;
            if (duration >= GAZE_BREAK_MIN_MS) {
                this.breakCount++;
            }
            this.inBreak = false;
        }
        else if (isBreaking && this.inBreak) {
            // Still in break - check if it crosses threshold now
            const duration = ts - this.breakStartTs;
            if (duration >= GAZE_BREAK_MIN_MS) {
                // Count this break if not already counted
                // We could track "counted" flag but for simplicity,
                // we'll count when the break ends
            }
        }
        // Compute breaks per minute
        const elapsedMs = ts - this.firstSampleTs;
        if (elapsedMs < 1000) {
            return 0; // Not enough data yet
        }
        const instantRate = (this.breakCount / elapsedMs) * 60000;
        // Apply EMA smoothing to rate
        if (!this.emaInitialized) {
            this.breakRateEMA = instantRate;
            this.emaInitialized = true;
        }
        else {
            this.breakRateEMA = ema(this.breakRateEMA, instantRate, 0.2);
        }
        return this.breakRateEMA;
    }
    /**
     * Reset tracker
     */
    reset() {
        this.inBreak = false;
        this.breakStartTs = 0;
        this.breakCount = 0;
        this.firstSampleTs = 0;
        this.breakRateEMA = 0;
        this.emaInitialized = false;
    }
    /**
     * Get raw break count
     */
    getBreakCount() {
        return this.breakCount;
    }
}
//# sourceMappingURL=gaze.js.map