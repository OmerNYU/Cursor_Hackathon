import { describe, expect, it } from 'vitest';
import { score, ScoringEngine } from './scoring';
import type { Features, FramePack } from './types';

const good: Features = { postureAngleDeg: 0, swaySigma: 0, gazeDevDeg: 0, gazeBreaksPerMin: 0, wristVelStd: 0.01, torsoSpeed: 0 };
const landmark = (x: number, y: number) => ({ x, y, visibility: 1 });
function frame(ts: number, includeFace = true): FramePack {
  const pose = { shoulders: { L: landmark(.4, .3), R: landmark(.6, .3) }, hips: { L: landmark(.4, .65), R: landmark(.6, .65) }, wrists: { L: landmark(.35, .5), R: landmark(.65, .5) }, torsoMid: landmark(.5, .475) };
  const face = { iris: { L: landmark(.46, .4), R: landmark(.54, .4) }, eyes: { L_outer: landmark(.43, .4), L_inner: landmark(.48, .4), R_inner: landmark(.52, .4), R_outer: landmark(.57, .4) }, noseTip: landmark(.5, .45), faceCenter: landmark(.5, .4) };
  return { ts, pose, face: includeFace ? face : undefined, quality: { poseOk: true, faceOk: includeFace }, scales: { faceWidth: .14, torsoLength: .35 } };
}

describe('score', () => {
  it('produces a bounded weighted confidence score', () => {
    const result = score(good);
    expect(result.overall).toBe(100);
    expect(Object.values(result).every((value) => value >= 0 && value <= 100)).toBe(true);
  });

  it('penalizes poor posture and eye contact', () => {
    const result = score({ ...good, postureAngleDeg: 20, gazeDevDeg: 30 });
    expect(result.P).toBeLessThan(.5);
    expect(result.E).toBeLessThan(.5);
  });
});

describe('ScoringEngine', () => {
  it('holds the last face value briefly, then returns to a neutral value', () => {
    const engine = new ScoringEngine();
    engine.evaluate(frame(0));
    const held = engine.evaluate(frame(300, false));
    const neutral = engine.evaluate(frame(900, false));
    expect(held.features.gazeDevDeg).toBeLessThan(8);
    expect(neutral.features.gazeDevDeg).toBeGreaterThan(held.features.gazeDevDeg);
  });

  it('waits two seconds before surfacing a persistent coaching cue', () => {
    const engine = new ScoringEngine();
    const poor = frame(0);
    poor.face!.iris.L.x = .43;
    poor.face!.iris.R.x = .57;
    engine.evaluate(poor);
    poor.ts = 1_900;
    expect(engine.evaluate(poor).tips).toHaveLength(0);
    poor.ts = 2_100;
    expect(engine.evaluate(poor).tips.some((tip) => tip.id === 'gaze')).toBe(true);
  });
});
