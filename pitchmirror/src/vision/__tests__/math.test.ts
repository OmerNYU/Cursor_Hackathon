import { describe, it, expect } from 'vitest';
import { clamp, distance2D, midpoint, ema, median, qualityFrom } from '../math';

describe('clamp', () => {
  it('should clamp values within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it('should handle edge cases', () => {
    expect(clamp(0, 0, 10)).toBe(0);
    expect(clamp(10, 0, 10)).toBe(10);
  });
});

describe('distance2D', () => {
  it('should calculate Euclidean distance', () => {
    expect(distance2D({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
    expect(distance2D({ x: 0, y: 0 }, { x: 0, y: 0 })).toBe(0);
  });

  it('should work with negative coordinates', () => {
    expect(distance2D({ x: -3, y: -4 }, { x: 0, y: 0 })).toBe(5);
  });
});

describe('midpoint', () => {
  it('should calculate midpoint between two points', () => {
    const result = midpoint({ x: 0, y: 0 }, { x: 4, y: 6 });
    expect(result.x).toBe(2);
    expect(result.y).toBe(3);
  });

  it('should handle z coordinate', () => {
    const result = midpoint({ x: 0, y: 0, z: 0 }, { x: 4, y: 6, z: 8 });
    expect(result.x).toBe(2);
    expect(result.y).toBe(3);
    expect(result.z).toBe(4);
  });

  it('should handle missing z coordinate', () => {
    const result = midpoint({ x: 0, y: 0 }, { x: 4, y: 6 });
    expect(result.z).toBeUndefined();
  });
});

describe('ema', () => {
  it('should return value on first call (null prev)', () => {
    expect(ema(null, 10, 0.3)).toBe(10);
  });

  it('should apply exponential moving average', () => {
    const result = ema(10, 20, 0.3);
    // 0.3 * 20 + 0.7 * 10 = 6 + 7 = 13
    expect(result).toBe(13);
  });

  it('should weight current value more with higher beta', () => {
    const result1 = ema(10, 20, 0.1); // 0.1 * 20 + 0.9 * 10 = 11
    const result2 = ema(10, 20, 0.9); // 0.9 * 20 + 0.1 * 10 = 19
    expect(result1).toBe(11);
    expect(result2).toBe(19);
  });
});

describe('median', () => {
  it('should find median of odd-length array', () => {
    expect(median([1, 3, 2])).toBe(2);
    expect(median([5, 1, 3, 2, 4])).toBe(3);
  });

  it('should find median of even-length array', () => {
    expect(median([4, 1, 3, 2])).toBe(2.5);
    expect(median([1, 2])).toBe(1.5);
  });

  it('should handle single element', () => {
    expect(median([5])).toBe(5);
  });

  it('should return 0 for empty array', () => {
    expect(median([])).toBe(0);
  });
});

describe('qualityFrom', () => {
  it('should return true when visibility meets threshold', () => {
    const result = qualityFrom([0.9, 0.8, 0.7], [0.9, 0.9], { minPose: 0.5, minFace: 0.5 });
    expect(result.poseOk).toBe(true);
    expect(result.faceOk).toBe(true);
  });

  it('should return false when visibility below threshold', () => {
    const result = qualityFrom([0.3, 0.2, 0.1], [0.3, 0.2], { minPose: 0.5, minFace: 0.5 });
    expect(result.poseOk).toBe(false);
    expect(result.faceOk).toBe(false);
  });

  it('should handle empty arrays', () => {
    const result = qualityFrom([], [], { minPose: 0.5, minFace: 0.5 });
    expect(result.poseOk).toBe(false);
    expect(result.faceOk).toBe(false);
  });

  it('should use default thresholds', () => {
    const result = qualityFrom([0.6, 0.6], [0.6, 0.6]);
    expect(result.poseOk).toBe(true);
    expect(result.faceOk).toBe(true);
  });
});

