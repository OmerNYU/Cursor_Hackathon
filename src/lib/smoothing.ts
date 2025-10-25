/**
 * Temporal smoothing utilities
 * EMA and rolling statistics integration
 */

import { RollingStats } from './geometry.js';
import { EMA_BETA, ROLLING_WINDOW_MS, ROLLING_BUFFER_CAPACITY } from './config.js';
import type { Features, Subscores } from './types.js';

/**
 * Exponential Moving Average
 * s_t = β * x_t + (1 - β) * s_{t-1}
 */
export function ema(prev: number, curr: number, beta = EMA_BETA): number {
  return beta * curr + (1 - beta) * prev;
}

/**
 * EMA state manager for features
 * Maintains smoothed values per metric
 */
export class EMAState<T extends Record<string, number>> {
  private state: Partial<T> = {};
  private initialized = false;
  private readonly beta: number;

  constructor(beta = EMA_BETA) {
    this.beta = beta;
  }

  /**
   * Update with new values, return smoothed
   */
  update(values: T): T {
    if (!this.initialized) {
      // First frame: initialize with current values
      this.state = { ...values };
      this.initialized = true;
      return values;
    }

    const smoothed = {} as T;
    for (const key in values) {
      const prev = this.state[key] ?? values[key];
      smoothed[key] = ema(prev, values[key], this.beta) as T[Extract<keyof T, string>];
      this.state[key] = smoothed[key];
    }

    return smoothed;
  }

  /**
   * Get current smoothed values
   */
  get(): Partial<T> {
    return { ...this.state };
  }

  /**
   * Reset state
   */
  reset(): void {
    this.state = {};
    this.initialized = false;
  }

  /**
   * Check if initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

/**
 * Feature smoothing state manager
 * Handles both rolling stats and EMA
 */
export class FeatureSmoother {
  private emaState: EMAState<Features>;
  private swayStats: RollingStats;
  private wristVelStats: RollingStats;

  constructor() {
    this.emaState = new EMAState<Features>();
    this.swayStats = new RollingStats(ROLLING_BUFFER_CAPACITY, ROLLING_WINDOW_MS);
    this.wristVelStats = new RollingStats(ROLLING_BUFFER_CAPACITY, ROLLING_WINDOW_MS);
  }

  /**
   * Add raw samples to rolling windows
   */
  addSamples(swayValue: number, wristVel: number, ts: number): void {
    this.swayStats.add(swayValue, ts);
    this.wristVelStats.add(wristVel, ts);
  }

  /**
   * Get rolling std deviations
   */
  getRollingStds(ts: number): { swaySigma: number; wristVelStd: number } {
    return {
      swaySigma: this.swayStats.std(ts),
      wristVelStd: this.wristVelStats.std(ts),
    };
  }

  /**
   * Apply EMA smoothing to features
   */
  smoothFeatures(features: Features): Features {
    return this.emaState.update(features);
  }

  /**
   * Reset all state
   */
  reset(): void {
    this.emaState.reset();
    this.swayStats.reset();
    this.wristVelStats.reset();
  }
}

/**
 * Subscore smoothing (optional light EMA on subscores)
 */
export class SubscoreSmoother {
  private emaState: EMAState<Subscores>;

  constructor(beta = 0.2) {
    // Lighter smoothing for subscores
    this.emaState = new EMAState<Subscores>(beta);
  }

  /**
   * Smooth subscores
   */
  smooth(subscores: Subscores): Subscores {
    return this.emaState.update(subscores);
  }

  /**
   * Reset state
   */
  reset(): void {
    this.emaState.reset();
  }
}

