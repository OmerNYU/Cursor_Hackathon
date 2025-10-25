/**
 * Unit tests for smoothing utilities
 */

import { describe, it, expect } from 'vitest';
import { ema, EMAState, FeatureSmoother } from './smoothing';
import type { Features } from './types';

describe('smoothing utilities', () => {
  describe('ema', () => {
    it('computes EMA correctly with beta=0.3', () => {
      const result = ema(10, 20, 0.3);
      expect(result).toBe(0.3 * 20 + 0.7 * 10); // 13
    });

    it('handles beta=1 (no smoothing)', () => {
      expect(ema(10, 20, 1)).toBe(20);
    });

    it('handles beta=0 (full smoothing)', () => {
      expect(ema(10, 20, 0)).toBe(10);
    });

    it('produces values between prev and curr for beta in (0,1)', () => {
      const prev = 10;
      const curr = 20;
      
      for (const beta of [0.1, 0.3, 0.5, 0.7, 0.9]) {
        const result = ema(prev, curr, beta);
        expect(result).toBeGreaterThanOrEqual(Math.min(prev, curr));
        expect(result).toBeLessThanOrEqual(Math.max(prev, curr));
      }
    });

    it('approaches current value as beta approaches 1', () => {
      const result1 = ema(10, 20, 0.9);
      const result2 = ema(10, 20, 0.99);
      
      expect(result2).toBeGreaterThan(result1);
      expect(result2).toBeCloseTo(20, 0);
    });
  });

  describe('EMAState', () => {
    it('initializes with first values', () => {
      const state = new EMAState<{ a: number; b: number }>();
      const result = state.update({ a: 10, b: 20 });
      
      expect(result.a).toBe(10);
      expect(result.b).toBe(20);
      expect(state.isInitialized()).toBe(true);
    });

    it('smooths subsequent updates', () => {
      const state = new EMAState<{ value: number }>(0.3);
      state.update({ value: 10 });
      const result = state.update({ value: 20 });
      
      expect(result.value).toBe(13); // 0.3 * 20 + 0.7 * 10
    });

    it('maintains state across multiple updates', () => {
      const state = new EMAState<{ value: number }>(0.5);
      state.update({ value: 10 });
      state.update({ value: 20 });
      const result = state.update({ value: 30 });
      
      // First: 10
      // Second: 0.5 * 20 + 0.5 * 10 = 15
      // Third: 0.5 * 30 + 0.5 * 15 = 22.5
      expect(result.value).toBe(22.5);
    });

    it('resets correctly', () => {
      const state = new EMAState<{ value: number }>();
      state.update({ value: 10 });
      state.reset();
      
      expect(state.isInitialized()).toBe(false);
      const result = state.update({ value: 20 });
      expect(result.value).toBe(20);
    });
  });

  describe('FeatureSmoother', () => {
    it('integrates rolling stats and EMA', () => {
      const smoother = new FeatureSmoother();
      
      // Add samples for rolling stats
      smoother.addSamples(0.01, 0.02, 0);
      smoother.addSamples(0.02, 0.03, 33);
      smoother.addSamples(0.015, 0.025, 66);
      
      const stds = smoother.getRollingStds(66);
      expect(stds.swaySigma).toBeGreaterThan(0);
      expect(stds.wristVelStd).toBeGreaterThan(0);
    });

    it('smooths features with EMA', () => {
      const smoother = new FeatureSmoother();
      
      const features1: Features = {
        postureAngleDeg: 5,
        swaySigma: 0.01,
        gazeDevDeg: 3,
        gazeBreaksPerMin: 2,
        wristVelStd: 0.02,
        torsoSpeed: 0.05,
      };
      
      const smoothed1 = smoother.smoothFeatures(features1);
      expect(smoothed1.postureAngleDeg).toBe(5); // First frame, no smoothing
      
      const features2: Features = {
        postureAngleDeg: 15,
        swaySigma: 0.02,
        gazeDevDeg: 8,
        gazeBreaksPerMin: 5,
        wristVelStd: 0.04,
        torsoSpeed: 0.1,
      };
      
      const smoothed2 = smoother.smoothFeatures(features2);
      // Should be between first and second values
      expect(smoothed2.postureAngleDeg).toBeGreaterThan(5);
      expect(smoothed2.postureAngleDeg).toBeLessThan(15);
    });

    it('resets all state', () => {
      const smoother = new FeatureSmoother();
      smoother.addSamples(0.01, 0.02, 0);
      
      const features: Features = {
        postureAngleDeg: 5,
        swaySigma: 0.01,
        gazeDevDeg: 3,
        gazeBreaksPerMin: 2,
        wristVelStd: 0.02,
        torsoSpeed: 0.05,
      };
      smoother.smoothFeatures(features);
      
      smoother.reset();
      
      const stds = smoother.getRollingStds(100);
      expect(stds.swaySigma).toBe(0);
      expect(stds.wristVelStd).toBe(0);
    });
  });
});

