/**
 * Temporal smoothing utilities
 * EMA and rolling statistics integration
 */
import { RollingStats } from './geometry.js';
import { EMA_BETA, ROLLING_WINDOW_MS, ROLLING_BUFFER_CAPACITY } from './config.js';
/**
 * Exponential Moving Average
 * s_t = β * x_t + (1 - β) * s_{t-1}
 */
export function ema(prev, curr, beta = EMA_BETA) {
    return beta * curr + (1 - beta) * prev;
}
/**
 * EMA state manager for features
 * Maintains smoothed values per metric
 */
export class EMAState {
    constructor(beta = EMA_BETA) {
        this.state = {};
        this.initialized = false;
        this.beta = beta;
    }
    /**
     * Update with new values, return smoothed
     */
    update(values) {
        if (!this.initialized) {
            // First frame: initialize with current values
            this.state = { ...values };
            this.initialized = true;
            return values;
        }
        const smoothed = {};
        for (const key in values) {
            const prev = this.state[key] ?? values[key];
            smoothed[key] = ema(prev, values[key], this.beta);
            this.state[key] = smoothed[key];
        }
        return smoothed;
    }
    /**
     * Get current smoothed values
     */
    get() {
        return { ...this.state };
    }
    /**
     * Reset state
     */
    reset() {
        this.state = {};
        this.initialized = false;
    }
    /**
     * Check if initialized
     */
    isInitialized() {
        return this.initialized;
    }
}
/**
 * Feature smoothing state manager
 * Handles both rolling stats and EMA
 */
export class FeatureSmoother {
    constructor() {
        this.emaState = new EMAState();
        this.swayStats = new RollingStats(ROLLING_BUFFER_CAPACITY, ROLLING_WINDOW_MS);
        this.wristVelStats = new RollingStats(ROLLING_BUFFER_CAPACITY, ROLLING_WINDOW_MS);
    }
    /**
     * Add raw samples to rolling windows
     */
    addSamples(swayValue, wristVel, ts) {
        this.swayStats.add(swayValue, ts);
        this.wristVelStats.add(wristVel, ts);
    }
    /**
     * Get rolling std deviations
     */
    getRollingStds(ts) {
        return {
            swaySigma: this.swayStats.std(ts),
            wristVelStd: this.wristVelStats.std(ts),
        };
    }
    /**
     * Apply EMA smoothing to features
     */
    smoothFeatures(features) {
        return this.emaState.update(features);
    }
    /**
     * Reset all state
     */
    reset() {
        this.emaState.reset();
        this.swayStats.reset();
        this.wristVelStats.reset();
    }
}
/**
 * Subscore smoothing (optional light EMA on subscores)
 */
export class SubscoreSmoother {
    constructor(beta = 0.2) {
        // Lighter smoothing for subscores
        this.emaState = new EMAState(beta);
    }
    /**
     * Smooth subscores
     */
    smooth(subscores) {
        return this.emaState.update(subscores);
    }
    /**
     * Reset state
     */
    reset() {
        this.emaState.reset();
    }
}
//# sourceMappingURL=smoothing.js.map