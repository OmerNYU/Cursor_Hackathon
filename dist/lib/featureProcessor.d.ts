/**
 * Feature extraction from FramePack
 * Architecture §7: Posture, Eye Contact, Smoothness, Pacing
 */
import type { FramePack, Features } from './types.js';
/**
 * Feature processor state
 * Maintains history for velocity/acceleration and missing landmark grace
 */
export declare class FeatureProcessor {
    private prevFrame;
    private gazeTracker;
    private lastGoodFeatures;
    private featureMissingStart;
    private lastPoseWasFresh;
    /**
     * Extract all features from a frame pack
     */
    extractFeatures(pack: FramePack): Features;
    /**
     * Extract posture angle and sway from pose
     * Note: swaySigma needs rolling window - returned as instantaneous value here
     * Rolling std computed externally in smoother
     */
    private extractPostureFeatures;
    /**
     * Extract pacing feature (torso movement speed)
     */
    private extractPacingFeature;
    /**
     * Extract smoothness feature (wrist velocity std dev)
     * Returns instantaneous velocity magnitude (to be fed to rolling stats)
     */
    private extractSmoothnessFeature;
    /**
     * Mark feature as present, clear grace period
     */
    private markFeaturePresent;
    /**
     * Get feature value with grace period
     * Returns last good value if within grace period, else default
     */
    private getWithGrace;
    /**
     * Check if the last extracted pose features were fresh (not from grace period)
     */
    isPoseDataFresh(): boolean;
    /**
     * Reset all state
     */
    reset(): void;
}
//# sourceMappingURL=featureProcessor.d.ts.map