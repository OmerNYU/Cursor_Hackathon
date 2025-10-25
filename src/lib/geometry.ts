/**
 * Geometry utilities for PitchMirror
 * Pure math helpers with unit tests
 */

import type { Vec2, Vec3, Landmark } from './types';

/**
 * Euclidean distance between two points
 */
export function distance(a: Vec2 | Vec3, b: Vec2 | Vec3): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = (a as Vec3).z !== undefined && (b as Vec3).z !== undefined
    ? ((a as Vec3).z! - (b as Vec3).z!)
    : 0;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Angle from vertical in degrees
 * θ = atan2(|v.x|, |v.y|) * 180/π
 * 0° = perfectly upright, 90° = horizontal
 */
export function angleDeg(v: Vec2): number {
  return (Math.atan2(Math.abs(v.x), Math.abs(v.y)) * 180) / Math.PI;
}

/**
 * Midpoint between two landmarks
 */
export function midpoint(a: Landmark, b: Landmark): Landmark {
  const result: Landmark = {
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
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Safe normalization helper
 * Prevents NaN or division-by-zero errors when scale is very small
 * @param value - The value to normalize
 * @param scale - The scale to divide by (optional, defaults to 1)
 * @param eps - Epsilon to prevent division by zero (default 1e-6)
 */
export function safeNorm(value: number, scale?: number, eps = 1e-6): number {
  const s = Math.max(Math.abs(scale ?? 1), eps);
  return value / s;
}

/**
 * Rolling statistics with ring buffer for efficient σ computation
 * Capacity ~64 for 1500ms window at 30fps
 */
export class RollingStats {
  private buffer: number[];
  private timestamps: number[];
  private head = 0;
  private size = 0;
  private readonly capacity: number;
  private readonly windowMs: number;

  constructor(capacity = 64, windowMs = 1500) {
    this.capacity = capacity;
    this.windowMs = windowMs;
    this.buffer = new Array(capacity);
    this.timestamps = new Array(capacity);
  }

  /**
   * Add a sample with timestamp
   */
  add(value: number, ts: number): void {
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
  private getValidSamples(nowTs: number): number[] {
    const cutoff = nowTs - this.windowMs;
    const valid: number[] = [];
    
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
  mean(nowTs: number): number {
    const valid = this.getValidSamples(nowTs);
    if (valid.length === 0) return 0;
    
    const sum = valid.reduce((acc, v) => acc + v, 0);
    return sum / valid.length;
  }

  /**
   * Compute standard deviation of samples in window
   */
  std(nowTs: number): number {
    const valid = this.getValidSamples(nowTs);
    if (valid.length < 2) return 0;
    
    const mean = valid.reduce((acc, v) => acc + v, 0) / valid.length;
    const variance = valid.reduce((acc, v) => acc + (v - mean) ** 2, 0) / valid.length;
    return Math.sqrt(variance);
  }

  /**
   * Get sample count in current window
   */
  count(nowTs: number): number {
    return this.getValidSamples(nowTs).length;
  }

  /**
   * Reset all state
   */
  reset(): void {
    this.head = 0;
    this.size = 0;
  }
}

