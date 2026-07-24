import { describe, expect, it } from 'vitest';
import { toFramePack } from './vision';

describe('toFramePack', () => {
  it('returns usable pose and face contracts from MediaPipe indexed landmarks', () => {
    const pose = Array.from({ length: 33 }, (_, index) => ({ x: index / 100, y: index / 100, visibility: 1 }));
    const face = Array.from({ length: 478 }, (_, index) => ({ x: index / 1000, y: index / 1000 }));
    const frame = toFramePack(10, pose, face);
    expect(frame.quality).toEqual({ poseOk: true, faceOk: true });
    expect(frame.pose?.torsoMid.x).toBeGreaterThan(0);
    expect(frame.scales.faceWidth).toBeGreaterThan(0);
  });

  it('degrades when required landmarks are unavailable', () => {
    const frame = toFramePack(10, [], []);
    expect(frame.pose).toBeUndefined();
    expect(frame.face).toBeUndefined();
    expect(frame.quality).toEqual({ poseOk: false, faceOk: false });
  });
});
