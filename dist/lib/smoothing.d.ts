/**
 * Temporal smoothing utilities
 * EMA and rolling statistics integration
 */
import type { Features, Subscores } from './types.js';
/**
 * Exponential Moving Average
 * s_t = β * x_t + (1 - β) * s_{t-1}
 */
export declare function ema(prev: number, curr: number, beta?: number): number;
/**
 * EMA state manager for features
 * Maintains smoothed values per metric
 */
export declare class EMAState<T extends Record<string, number>> {
    private state;
    private initialized;
    private readonly beta;
    constructor(beta?: number);
    /**
     * Update with new values, return smoothed
     */
    update(values: T): T;
    /**
     * Get current smoothed values
     */
    get(): Partial<T>;
    /**
     * Reset state
     */
    reset(): void;
    /**
     * Check if initialized
     */
    isInitialized(): boolean;
}
/**
 * Feature smoothing state manager
 * Handles both rolling stats and EMA
 */
export declare class FeatureSmoother {
    private emaState;
    private swayStats;
    private wristVelStats;
    constructor();
    /**
     * Add raw samples to rolling windows
     */
    addSamples(swayValue: number, wristVel: number, ts: number): void;
    /**
     * Get rolling std deviations
     */
    getRollingStds(ts: number): {
        swaySigma: number;
        wristVelStd: number;
    };
    /**
     * Apply EMA smoothing to features
     */
    smoothFeatures(features: Features): Features;
    /**
     * Reset all state
     */
    reset(): void;
}
/**
 * Subscore smoothing (optional light EMA on subscores)
 */
export declare class SubscoreSmoother {
    private emaState;
    constructor(beta?: number);
    /**
     * Smooth subscores
     */
    smooth(subscores: Subscores): Subscores;
    /**
     * Reset state
     */
    reset(): void;
}
//# sourceMappingURL=smoothing.d.ts.map