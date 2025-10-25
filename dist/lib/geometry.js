/**
 * Geometry utilities for PitchMirror
 * Pure math helpers with unit tests
 */
/**
 * Euclidean distance between two points
 */
export function distance(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = a.z !== undefined && b.z !== undefined
        ? (a.z - b.z)
        : 0;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}
/**
 * Angle from vertical in degrees
 * θ = atan2(|v.x|, |v.y|) * 180/π
 * 0° = perfectly upright, 90° = horizontal
 */
export function angleDeg(v) {
    return (Math.atan2(Math.abs(v.x), Math.abs(v.y)) * 180) / Math.PI;
}
/**
 * Midpoint between two landmarks
 */
export function midpoint(a, b) {
    const result = {
        x: (a.x + b.x) / 2,
        y: (a.y + b.y) / 2,
    };
    if (a.z !== undefined && b.z !== undefined) {
        result.z = (a.z + b.z) / 2;
    }
    if (a.visibility !== undefined && b.visibility !== undefined) {
        result.visibility = Math.min(a.visibility, b.visibility);
    }
    return result;
}
/**
 * Clamp value to [min, max]
 */
export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
/**
 * Safe normalization helper
 * Prevents NaN or division-by-zero errors when scale is very small
 * @param value - The value to normalize
 * @param scale - The scale to divide by (optional, defaults to 1)
 * @param eps - Epsilon to prevent division by zero (default 1e-6)
 */
export function safeNorm(value, scale, eps = 1e-6) {
    const s = Math.max(Math.abs(scale ?? 1), eps);
    return value / s;
}
/**
 * Rolling statistics with ring buffer for efficient σ computation
 * Capacity ~64 for 1500ms window at 30fps
 */
export class RollingStats {
    constructor(capacity = 64, windowMs = 1500) {
        this.head = 0;
        this.size = 0;
        this.capacity = capacity;
        this.windowMs = windowMs;
        this.buffer = new Array(capacity);
        this.timestamps = new Array(capacity);
    }
    /**
     * Add a sample with timestamp
     */
    add(value, ts) {
        this.buffer[this.head] = value;
        this.timestamps[this.head] = ts;
        this.head = (this.head + 1) % this.capacity;
        if (this.size < this.capacity) {
            this.size++;
        }
    }
    /**
     * Get all valid samples within the time window
     */
    getValidSamples(nowTs) {
        const cutoff = nowTs - this.windowMs;
        const valid = [];
        for (let i = 0; i < this.size; i++) {
            const idx = (this.head - 1 - i + this.capacity) % this.capacity;
            const ts = this.timestamps[idx];
            if (ts >= cutoff) {
                valid.push(this.buffer[idx]);
            }
        }
        return valid;
    }
    /**
     * Compute mean of samples in window
     */
    mean(nowTs) {
        const valid = this.getValidSamples(nowTs);
        if (valid.length === 0)
            return 0;
        const sum = valid.reduce((acc, v) => acc + v, 0);
        return sum / valid.length;
    }
    /**
     * Compute standard deviation of samples in window
     */
    std(nowTs) {
        const valid = this.getValidSamples(nowTs);
        if (valid.length < 2)
            return 0;
        const mean = valid.reduce((acc, v) => acc + v, 0) / valid.length;
        const variance = valid.reduce((acc, v) => acc + (v - mean) ** 2, 0) / valid.length;
        return Math.sqrt(variance);
    }
    /**
     * Get sample count in current window
     */
    count(nowTs) {
        return this.getValidSamples(nowTs).length;
    }
    /**
     * Reset all state
     */
    reset() {
        this.head = 0;
        this.size = 0;
    }
}
//# sourceMappingURL=geometry.js.map