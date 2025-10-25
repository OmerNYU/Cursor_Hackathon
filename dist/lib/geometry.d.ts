/**
 * Geometry utilities for PitchMirror
 * Pure math helpers with unit tests
 */
import type { Vec2, Vec3, Landmark } from './types.js';
/**
 * Euclidean distance between two points
 */
export declare function distance(a: Vec2 | Vec3, b: Vec2 | Vec3): number;
/**
 * Angle from vertical in degrees
 * θ = atan2(|v.x|, |v.y|) * 180/π
 * 0° = perfectly upright, 90° = horizontal
 */
export declare function angleDeg(v: Vec2): number;
/**
 * Midpoint between two landmarks
 */
export declare function midpoint(a: Landmark, b: Landmark): Landmark;
/**
 * Clamp value to [min, max]
 */
export declare function clamp(value: number, min: number, max: number): number;
/**
 * Safe normalization helper
 * Prevents NaN or division-by-zero errors when scale is very small
 * @param value - The value to normalize
 * @param scale - The scale to divide by (optional, defaults to 1)
 * @param eps - Epsilon to prevent division by zero (default 1e-6)
 */
export declare function safeNorm(value: number, scale?: number, eps?: number): number;
/**
 * Rolling statistics with ring buffer for efficient σ computation
 * Capacity ~64 for 1500ms window at 30fps
 */
export declare class RollingStats {
    private buffer;
    private timestamps;
    private head;
    private size;
    private readonly capacity;
    private readonly windowMs;
    constructor(capacity?: number, windowMs?: number);
    /**
     * Add a sample with timestamp
     */
    add(value: number, ts: number): void;
    /**
     * Get all valid samples within the time window
     */
    private getValidSamples;
    /**
     * Compute mean of samples in window
     */
    mean(nowTs: number): number;
    /**
     * Compute standard deviation of samples in window
     */
    std(nowTs: number): number;
    /**
     * Get sample count in current window
     */
    count(nowTs: number): number;
    /**
     * Reset all state
     */
    reset(): void;
}
//# sourceMappingURL=geometry.d.ts.map