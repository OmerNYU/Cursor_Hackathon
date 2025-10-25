import { describe, it, expect } from 'vitest';
import { degFromVertical, wristVelocities, stddev, torsoUnitsPerSec, postureScore } from '../features';
import type { Landmark, PoseFrame } from '../types';

describe('degFromVertical', () => {
  it('should return 0 for perfectly vertical alignment', () => {
    const shoulderMid: Landmark = { x: 0.5, y: 0.3 };
    const hipMid: Landmark = { x: 0.5, y: 0.6 };
    const deg = degFromVertical(shoulderMid, hipMid);
    expect(deg).toBeCloseTo(0, 1);
  });

  it('should return positive degrees for tilted posture', () => {
    const shoulderMid: Landmark = { x: 0.4, y: 0.3 };
    const hipMid: Landmark = { x: 0.5, y: 0.6 };
    const deg = degFromVertical(shoulderMid, hipMid);
    expect(deg).toBeGreaterThan(0);
  });

  it('should handle large tilt', () => {
    const shoulderMid: Landmark = { x: 0.3, y: 0.3 };
    const hipMid: Landmark = { x: 0.7, y: 0.6 };
    const deg = degFromVertical(shoulderMid, hipMid);
    expect(deg).toBeGreaterThan(30);
  });
});

describe('wristVelocities', () => {
  it('should return [0, 0] when prev is null', () => {
    const curr = {
      l: { x: 0.3, y: 0.5 },
      r: { x: 0.7, y: 0.5 },
    };
    const [lVel, rVel] = wristVelocities(null, curr, 0.1, 0.08);
    expect(lVel).toBe(0);
    expect(rVel).toBe(0);
  });

  it('should calculate velocities correctly', () => {
    const prev = {
      l: { x: 0.3, y: 0.5 } as Landmark,
      r: { x: 0.7, y: 0.5 } as Landmark,
    };
    const curr = {
      l: { x: 0.31, y: 0.5 } as Landmark,
      r: { x: 0.71, y: 0.5 } as Landmark,
    };
    const [lVel, rVel] = wristVelocities(prev, curr, 0.1, 0.08);
    
    // Distance moved is 0.01, dt is 0.1, faceWidth is 0.08
    // Velocity = 0.01 / 0.1 / 0.08 = 1.25
    expect(lVel).toBeCloseTo(1.25, 2);
    expect(rVel).toBeCloseTo(1.25, 2);
  });

  it('should return [0, 0] with invalid params', () => {
    const [lVel, rVel] = wristVelocities(null, null, 0.1, 0.08);
    expect(lVel).toBe(0);
    expect(rVel).toBe(0);
  });
});

describe('stddev', () => {
  it('should calculate standard deviation', () => {
    const values = [2, 4, 4, 4, 5, 5, 7, 9];
    const result = stddev(values);
    expect(result).toBeCloseTo(2, 0);
  });

  it('should return 0 for empty array', () => {
    expect(stddev([])).toBe(0);
  });

  it('should return 0 for single value', () => {
    expect(stddev([5])).toBe(0);
  });

  it('should return 0 for identical values', () => {
    expect(stddev([5, 5, 5, 5])).toBe(0);
  });
});

describe('torsoUnitsPerSec', () => {
  it('should calculate speed from history', () => {
    const history: Landmark[] = [
      { x: 0.5, y: 0.45 },
      { x: 0.51, y: 0.45 },
      { x: 0.52, y: 0.45 },
    ];
    const fps = 10;
    
    // Average distance per frame = 0.01, speed = 0.01 * 10 = 0.1
    const speed = torsoUnitsPerSec(history, fps);
    expect(speed).toBeCloseTo(0.1, 2);
  });

  it('should return 0 for insufficient history', () => {
    expect(torsoUnitsPerSec([{ x: 0.5, y: 0.45 }], 10)).toBe(0);
    expect(torsoUnitsPerSec([], 10)).toBe(0);
  });

  it('should return 0 for zero fps', () => {
    const history: Landmark[] = [
      { x: 0.5, y: 0.45 },
      { x: 0.51, y: 0.45 },
    ];
    expect(torsoUnitsPerSec(history, 0)).toBe(0);
  });
});

describe('postureScore', () => {
  it('should return 0.5 when pose is undefined', () => {
    expect(postureScore(undefined, undefined)).toBe(0.5);
  });

  it('should return high score for good posture', () => {
    const pose: PoseFrame = {
      shoulders: {
        L: { x: 0.4, y: 0.3, visibility: 0.9 },
        R: { x: 0.6, y: 0.3, visibility: 0.9 },
      },
      hips: {
        L: { x: 0.4, y: 0.6, visibility: 0.8 },
        R: { x: 0.6, y: 0.6, visibility: 0.8 },
      },
      wrists: {
        L: { x: 0.3, y: 0.5, visibility: 0.7 },
        R: { x: 0.7, y: 0.5, visibility: 0.7 },
      },
      torsoMid: { x: 0.5, y: 0.45 },
    };
    
    const score = postureScore(pose, undefined);
    expect(score).toBeGreaterThan(0.8);
  });

  it('should return lower score for poor posture', () => {
    const pose: PoseFrame = {
      shoulders: {
        L: { x: 0.3, y: 0.3, visibility: 0.9 },
        R: { x: 0.6, y: 0.3, visibility: 0.9 },
      },
      hips: {
        L: { x: 0.5, y: 0.6, visibility: 0.8 },
        R: { x: 0.7, y: 0.6, visibility: 0.8 },
      },
      wrists: {
        L: { x: 0.3, y: 0.5, visibility: 0.7 },
        R: { x: 0.7, y: 0.5, visibility: 0.7 },
      },
      torsoMid: { x: 0.5, y: 0.45 },
    };
    
    const score = postureScore(pose, undefined);
    expect(score).toBeLessThan(0.7);
  });
});

