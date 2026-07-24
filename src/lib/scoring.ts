import { EMA_BETA, GRACE_PERIOD_MS, NEUTRAL_FEATURES, THRESHOLDS, WEIGHTS, WINDOW_MS } from './config';
import { clamp, distance, ema, midpoint, standardDeviation } from './math';
import type { Evaluation, Features, FramePack, Scores, Subscores, Tip, TipId } from './types';

type Sample = { ts: number; value: number };
type TipState = { activeSince?: number; cooldownUntil?: number };

const neutral = (): Features => ({ ...NEUTRAL_FEATURES });
const trim = (samples: Sample[], now: number) => samples.filter((sample) => now - sample.ts <= WINDOW_MS);

export class ScoringEngine {
  private lastPoseAt?: number;
  private lastFaceAt?: number;
  private lastFeatures?: Features;
  private smoothed?: Features;
  private lastPose?: FramePack['pose'];
  private lastTs?: number;
  private sway: Sample[] = [];
  private wristVelocity: Sample[] = [];
  private gazeBreaks: number[] = [];
  private gazeAwaySince?: number;
  private tips = new Map<TipId, TipState>();

  reset() {
    this.lastPoseAt = undefined;
    this.lastFaceAt = undefined;
    this.lastFeatures = undefined;
    this.smoothed = undefined;
    this.lastPose = undefined;
    this.lastTs = undefined;
    this.sway = [];
    this.wristVelocity = [];
    this.gazeBreaks = [];
    this.gazeAwaySince = undefined;
    this.tips.clear();
  }

  evaluate(frame: FramePack): Evaluation {
    const raw = neutral();
    const now = frame.ts;
    const dt = this.lastTs === undefined ? 0.1 : Math.max(0.01, (now - this.lastTs) / 1000);
    this.lastTs = now;

    if (frame.pose && frame.quality.poseOk && frame.scales.torsoLength > 0.001) {
      this.lastPoseAt = now;
      const shoulderMid = midpoint(frame.pose.shoulders.L, frame.pose.shoulders.R);
      const hipMid = midpoint(frame.pose.hips.L, frame.pose.hips.R);
      raw.postureAngleDeg = Math.atan2(Math.abs(shoulderMid.x - hipMid.x), Math.abs(shoulderMid.y - hipMid.y)) * 180 / Math.PI;
      this.sway = trim([...this.sway, { ts: now, value: shoulderMid.x / frame.scales.torsoLength }], now);
      raw.swaySigma = standardDeviation(this.sway.map((sample) => sample.value));
      if (this.lastPose) {
        const wristSpeed = (distance(frame.pose.wrists.L, this.lastPose.wrists.L) + distance(frame.pose.wrists.R, this.lastPose.wrists.R)) /
          (2 * dt * Math.max(frame.scales.faceWidth, 0.01));
        const torsoSpeed = distance(frame.pose.torsoMid, this.lastPose.torsoMid) / (dt * frame.scales.torsoLength);
        this.wristVelocity = trim([...this.wristVelocity, { ts: now, value: wristSpeed }], now);
        raw.torsoSpeed = torsoSpeed;
      }
      raw.wristVelStd = standardDeviation(this.wristVelocity.map((sample) => sample.value));
      this.lastPose = frame.pose;
    } else {
      this.applyPoseFallback(raw, now);
    }

    if (frame.face && frame.quality.faceOk) {
      this.lastFaceAt = now;
      const leftCenter = midpoint(frame.face.eyes.L_outer, frame.face.eyes.L_inner);
      const rightCenter = midpoint(frame.face.eyes.R_inner, frame.face.eyes.R_outer);
      const eyeWidth = (distance(frame.face.eyes.L_outer, frame.face.eyes.L_inner) + distance(frame.face.eyes.R_inner, frame.face.eyes.R_outer)) / 2;
      raw.gazeDevDeg = clamp(((distance(leftCenter, frame.face.iris.L) + distance(rightCenter, frame.face.iris.R)) / 2) / Math.max(eyeWidth, 0.001) * 45, 0, 45);
      if (raw.gazeDevDeg > THRESHOLDS.gazeGoodDeg) {
        this.gazeAwaySince ??= now;
      } else if (this.gazeAwaySince !== undefined) {
        if (now - this.gazeAwaySince >= 200) this.gazeBreaks.push(now);
        this.gazeAwaySince = undefined;
      }
      this.gazeBreaks = this.gazeBreaks.filter((ts) => now - ts <= 60_000);
      raw.gazeBreaksPerMin = this.gazeBreaks.length;
    } else {
      this.applyFaceFallback(raw, now);
    }

    this.lastFeatures = { ...raw };
    this.smoothed = this.smooth(raw);
    const scores = score(this.smoothed);
    return { features: this.smoothed, scores, tips: this.selectTips(frame, scores, now) };
  }

  private applyPoseFallback(raw: Features, now: number) {
    const last = this.lastFeatures;
    const recent = this.lastPoseAt !== undefined && now - this.lastPoseAt <= GRACE_PERIOD_MS;
    raw.postureAngleDeg = recent && last ? last.postureAngleDeg : NEUTRAL_FEATURES.postureAngleDeg;
    raw.swaySigma = recent && last ? last.swaySigma : NEUTRAL_FEATURES.swaySigma;
    raw.wristVelStd = recent && last ? last.wristVelStd : NEUTRAL_FEATURES.wristVelStd;
    raw.torsoSpeed = recent && last ? last.torsoSpeed : NEUTRAL_FEATURES.torsoSpeed;
  }

  private applyFaceFallback(raw: Features, now: number) {
    const last = this.lastFeatures;
    const recent = this.lastFaceAt !== undefined && now - this.lastFaceAt <= GRACE_PERIOD_MS;
    raw.gazeDevDeg = recent && last ? last.gazeDevDeg : NEUTRAL_FEATURES.gazeDevDeg;
    raw.gazeBreaksPerMin = recent && last ? last.gazeBreaksPerMin : NEUTRAL_FEATURES.gazeBreaksPerMin;
  }

  private smooth(raw: Features): Features {
    const previous = this.smoothed;
    const smooth = (key: keyof Features) => previous ? EMA_BETA * raw[key] + (1 - EMA_BETA) * previous[key] : raw[key];
    return {
      postureAngleDeg: smooth('postureAngleDeg'), swaySigma: smooth('swaySigma'), gazeDevDeg: smooth('gazeDevDeg'),
      gazeBreaksPerMin: smooth('gazeBreaksPerMin'), wristVelStd: smooth('wristVelStd'), torsoSpeed: smooth('torsoSpeed'),
    };
  }

  private selectTips(frame: FramePack, scores: Scores, now: number): Tip[] {
    const candidates: Array<Tip & { triggered: boolean }> = [
      { id: 'camera', message: 'Step back into view so I can read your posture.', priority: 1, triggered: !frame.quality.poseOk && !frame.quality.faceOk },
      { id: 'gaze', message: 'Bring your gaze a little closer to the lens.', priority: 1, triggered: scores.E < 0.7 },
      { id: 'posture', message: 'Stack your shoulders over your hips.', priority: 2, triggered: scores.P < 0.7 },
      { id: 'hands', message: 'Pause your hands between key points.', priority: 2, triggered: scores.S < 0.7 },
      { id: 'pacing', message: 'Plant your feet for emphasis.', priority: 3, triggered: scores.C < 0.7 },
    ];
    return candidates.filter((candidate) => this.isTipActive(candidate, now)).sort((a, b) => a.priority - b.priority).slice(0, 2);
  }

  private isTipActive(candidate: Tip & { triggered: boolean }, now: number) {
    const state = this.tips.get(candidate.id) ?? {};
    if (!candidate.triggered) {
      if (state.activeSince !== undefined) state.cooldownUntil = now + 6_000;
      state.activeSince = undefined;
      this.tips.set(candidate.id, state);
      return false;
    }
    if (state.cooldownUntil && now < state.cooldownUntil) return false;
    state.activeSince ??= now;
    this.tips.set(candidate.id, state);
    return now - state.activeSince >= 2_000;
  }
}

export function score(features: Features): Scores {
  const P = clamp(0.6 * (1 - clamp(features.postureAngleDeg / THRESHOLDS.postureMaxDeg)) + 0.4 * (1 - clamp(features.swaySigma / THRESHOLDS.swayMax)));
  const E = clamp(0.7 * (1 - clamp(features.gazeDevDeg / (THRESHOLDS.gazeGoodDeg * 1.8))) + 0.3 * (1 - clamp(features.gazeBreaksPerMin / THRESHOLDS.gazeMaxBreaksPerMin)));
  const S = 1 - clamp((features.wristVelStd - THRESHOLDS.wristVelLow) / (THRESHOLDS.wristVelHigh - THRESHOLDS.wristVelLow));
  const C = 1 - clamp(features.torsoSpeed / (THRESHOLDS.paceIdealMax * 1.5));
  return { P, E, S, C, overall: Math.round(100 * (WEIGHTS.P * P + WEIGHTS.E * E + WEIGHTS.S * S + WEIGHTS.C * C)) };
}
