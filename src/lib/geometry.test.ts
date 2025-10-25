/**
 * Unit tests for geometry utilities
 */

import { describe, it, expect } from 'vitest';
import { distance, angleDeg, midpoint, clamp, safeNorm, RollingStats } from './geometry';
import type { Landmark } from './types';

describe('geometry utilities', () => {
  describe('distance', () => {
    it('computes 2D distance correctly', () => {
      expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
      expect(distance({ x: 0, y: 0 }, { x: 0, y: 0 })).toBe(0);
    });

    it('computes 3D distance correctly', () => {
      expect(distance(
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 2, z: 2 }
      )).toBe(3);
    });
  });

  describe('angleDeg', () => {
    it('returns 0° for perfectly vertical vector', () => {
      expect(angleDeg({ x: 0, y: 1 })).toBe(0);
    });

    it('returns 90° for horizontal vector', () => {
      expect(angleDeg({ x: 1, y: 0 })).toBeCloseTo(90, 5);
    });

    it('returns ~45° for diagonal vector', () => {
      expect(angleDeg({ x: 1, y: 1 })).toBeCloseTo(45, 5);
    });

    it('handles negative values (abs)', () => {
      expect(angleDeg({ x: -1, y: 1 })).toBeCloseTo(45, 5);
      expect(angleDeg({ x: 1, y: -1 })).toBeCloseTo(45, 5);
    });

    it('handles vertical upward vector (edge case)', () => {
      expect(angleDeg({ x: 0, y: 10 })).toBe(0);
    });

    it('handles vertical downward vector (edge case)', () => {
      expect(angleDeg({ x: 0, y: -10 })).toBe(0);
    });

    it('handles horizontal left vector (edge case)', () => {
      expect(angleDeg({ x: -10, y: 0 })).toBeCloseTo(90, 5);
    });

    it('handles horizontal right vector (edge case)', () => {
      expect(angleDeg({ x: 10, y: 0 })).toBeCloseTo(90, 5);
    });
  });

  describe('midpoint', () => {
    it('computes 2D midpoint', () => {
      const a: Landmark = { x: 0, y: 0 };
      const b: Landmark = { x: 4, y: 6 };
      const mid = midpoint(a, b);
      expect(mid.x).toBe(2);
      expect(mid.y).toBe(3);
    });

    it('computes 3D midpoint', () => {
      const a: Landmark = { x: 0, y: 0, z: 0 };
      const b: Landmark = { x: 4, y: 6, z: 8 };
      const mid = midpoint(a, b);
      expect(mid.x).toBe(2);
      expect(mid.y).toBe(3);
      expect(mid.z).toBe(4);
    });

    it('takes minimum visibility', () => {
      const a: Landmark = { x: 0, y: 0, visibility: 0.9 };
      const b: Landmark = { x: 2, y: 2, visibility: 0.7 };
      const mid = midpoint(a, b);
      expect(mid.visibility).toBe(0.7);
    });
  });

  describe('clamp', () => {
    it('clamps to minimum', () => {
      expect(clamp(-5, 0, 10)).toBe(0);
    });

    it('clamps to maximum', () => {
      expect(clamp(15, 0, 10)).toBe(10);
    });

    it('returns value if within range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
    });
  });

  describe('safeNorm', () => {
    it('normalizes with valid scale', () => {
      expect(safeNorm(10, 2)).toBe(5);
    });

    it('prevents division by zero', () => {
      const result = safeNorm(10, 0);
      expect(Number.isFinite(result)).toBe(true);
      expect(result).toBeGreaterThan(0);
    });

    it('handles very small scale values', () => {
      const result = safeNorm(10, 1e-10);
      expect(Number.isFinite(result)).toBe(true);
    });

    it('uses default scale of 1 when not provided', () => {
      expect(safeNorm(10)).toBe(10);
    });

    it('handles negative scales (uses absolute value)', () => {
      expect(safeNorm(10, -2)).toBe(5);
    });

    it('handles custom epsilon', () => {
      const result = safeNorm(10, 0, 0.1);
      expect(result).toBe(10 / 0.1);
    });
  });

  describe('RollingStats', () => {
    it('computes mean correctly', () => {
      const stats = new RollingStats(10, 100);
      stats.add(10, 0);
      stats.add(20, 10);
      stats.add(30, 20);
      
      expect(stats.mean(20)).toBe(20);
    });

    it('computes std correctly', () => {
      const stats = new RollingStats(10, 100);
      stats.add(10, 0);
      stats.add(20, 10);
      stats.add(30, 20);
      
      const std = stats.std(20);
      expect(std).toBeCloseTo(8.165, 2);
    });

    it('filters samples outside window', () => {
      const stats = new RollingStats(10, 100);
      stats.add(10, 0);
      stats.add(20, 50);
      stats.add(30, 200); // only this should be in window
      
      expect(stats.mean(250)).toBe(30);
      expect(stats.count(250)).toBe(1);
    });

    it('handles ring buffer wrap-around', () => {
      const stats = new RollingStats(3, 100);
      stats.add(1, 0);
      stats.add(2, 10);
      stats.add(3, 20);
      stats.add(4, 30); // wraps, overwrites 1
      
      expect(stats.count(30)).toBe(3);
      expect(stats.mean(30)).toBe(3);
    });

    it('resets correctly', () => {
      const stats = new RollingStats(10, 100);
      stats.add(10, 0);
      stats.add(20, 10);
      stats.reset();
      
      expect(stats.count(10)).toBe(0);
      expect(stats.mean(10)).toBe(0);
    });

    it('evicts samples exactly at window boundary', () => {
      const stats = new RollingStats(10, 100);
      stats.add(10, 0);
      stats.add(20, 50);
      stats.add(30, 100);
      
      // At time 100, sample at 0 should be exactly at cutoff (100 - 100 = 0)
      // Should include samples at 0, 50, 100
      expect(stats.count(100)).toBe(3);
      
      // At time 101, sample at 0 is now outside window
      expect(stats.count(101)).toBe(2);
    });

    it('handles empty stats gracefully', () => {
      const stats = new RollingStats(10, 100);
      
      expect(stats.mean(0)).toBe(0);
      expect(stats.std(0)).toBe(0);
      expect(stats.count(0)).toBe(0);
    });

    it('handles single sample std', () => {
      const stats = new RollingStats(10, 100);
      stats.add(10, 0);
      
      // Std with only 1 sample should be 0
      expect(stats.std(0)).toBe(0);
    });
  });
});

