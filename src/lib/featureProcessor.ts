/**
 * Feature extraction from FramePack
 * Architecture §7: Posture, Eye Contact, Smoothness, Pacing
 */

import type { FramePack, Features, Landmark } from './types.js';
import { distance, angleDeg, midpoint } from './geometry.js';
import { gazeDeviationDeg, GazeBreakTracker } from './gaze.js';
import { MISSING_LANDMARK_GRACE_MS } from './config.js';

/**
 * Feature processor state
 * Maintains history for velocity/acceleration and missing landmark grace
 */
export class FeatureProcessor {
  private prevFrame: FramePack | null = null;
  private gazeTracker = new GazeBreakTracker();
  
  // Grace period tracking for missing landmarks
  private lastGoodFeatures: Partial<Features> = {};
  private featureMissingStart: Map<keyof Features, number> = new Map();

  /**
   * Extract all features from a frame pack
   */
  extractFeatures(pack: FramePack): Features {
    const features: Partial<Features> = {};

    // Extract posture features (requires pose)
    if (pack.pose && pack.quality.poseOk) {
      const postureFeatures = this.extractPostureFeatures(pack);
      features.postureAngleDeg = postureFeatures.postureAngleDeg;
      features.swaySigma = postureFeatures.swaySigma;
      
      // Extract pacing (torso motion)
      features.torsoSpeed = this.extractPacingFeature(pack);
      
      // Extract smoothness (wrist motion)
      features.wristVelStd = this.extractSmoothnessFeature(pack);
      
      this.markFeaturePresent('postureAngleDeg', pack.ts);
      this.markFeaturePresent('swaySigma', pack.ts);
      this.markFeaturePresent('torsoSpeed', pack.ts);
      this.markFeaturePresent('wristVelStd', pack.ts);
    } else {
      // Apply grace period for pose features
      features.postureAngleDeg = this.getWithGrace('postureAngleDeg', pack.ts, 5);
      features.swaySigma = this.getWithGrace('swaySigma', pack.ts, 0.01);
      features.torsoSpeed = this.getWithGrace('torsoSpeed', pack.ts, 0.05);
      features.wristVelStd = this.getWithGrace('wristVelStd', pack.ts, 0.02);
    }

    // Extract eye contact features (requires face)
    if (pack.face && pack.quality.faceOk) {
      features.gazeDevDeg = gazeDeviationDeg(pack.face);
      features.gazeBreaksPerMin = this.gazeTracker.update(features.gazeDevDeg, pack.ts);
      
      this.markFeaturePresent('gazeDevDeg', pack.ts);
      this.markFeaturePresent('gazeBreaksPerMin', pack.ts);
    } else {
      // Apply grace period for face features
      features.gazeDevDeg = this.getWithGrace('gazeDevDeg', pack.ts, 3);
      features.gazeBreaksPerMin = this.getWithGrace('gazeBreaksPerMin', pack.ts, 0);
    }

    // Store as last good features
    for (const key in features) {
      if (features[key as keyof Features] !== undefined) {
        this.lastGoodFeatures[key as keyof Features] = features[key as keyof Features];
      }
    }

    this.prevFrame = pack;

    return features as Features;
  }

  /**
   * Extract posture angle and sway from pose
   * Note: swaySigma needs rolling window - returned as instantaneous value here
   * Rolling std computed externally in smoother
   */
  private extractPostureFeatures(pack: FramePack): Pick<Features, 'postureAngleDeg' | 'swaySigma'> {
    const pose = pack.pose!;

    // Compute shoulder and hip midpoints
    const shoulderMid = midpoint(pose.shoulders.L, pose.shoulders.R);
    const hipMid = midpoint(pose.hips.L, pose.hips.R);

    // Torso vector
    const torsoVec = {
      x: shoulderMid.x - hipMid.x,
      y: shoulderMid.y - hipMid.y,
    };

    // Angle from vertical
    const postureAngleDeg = angleDeg(torsoVec);

    // Sway: instantaneous horizontal position (to be fed to rolling stats)
    // We'll use shoulder midpoint X position, normalized by torso length
    const swayRaw = shoulderMid.x / pack.scales.torsoLengthPx;

    return {
      postureAngleDeg,
      swaySigma: swayRaw, // This will be processed by rolling stats externally
    };
  }

  /**
   * Extract pacing feature (torso movement speed)
   */
  private extractPacingFeature(pack: FramePack): number {
    if (!this.prevFrame || !this.prevFrame.pose) {
      return 0;
    }

    const pose = pack.pose!;
    const prevPose = this.prevFrame.pose;

    const currentTorso = pose.torsoMid;
    const prevTorso = prevPose.torsoMid;

    // Distance moved
    const dist = distance(currentTorso, prevTorso);
    
    // Time delta
    const dt = pack.ts - this.prevFrame.ts;
    if (dt === 0) return 0;

    // Speed normalized by torso length
    const speed = dist / pack.scales.torsoLengthPx / dt;

    return speed;
  }

  /**
   * Extract smoothness feature (wrist velocity std dev)
   * Returns instantaneous velocity magnitude (to be fed to rolling stats)
   */
  private extractSmoothnessFeature(pack: FramePack): number {
    if (!this.prevFrame || !this.prevFrame.pose) {
      return 0;
    }

    const pose = pack.pose!;
    const prevPose = this.prevFrame.pose;

    // Compute velocity for both wrists
    const leftVel = distance(pose.wrists.L, prevPose.wrists.L);
    const rightVel = distance(pose.wrists.R, prevPose.wrists.R);

    // Time delta
    const dt = pack.ts - this.prevFrame.ts;
    if (dt === 0) return 0;

    // Average velocity normalized by face width
    const avgVel = (leftVel + rightVel) / 2;
    const normalizedVel = avgVel / pack.scales.faceWidthPx / dt;

    return normalizedVel;
  }

  /**
   * Mark feature as present, clear grace period
   */
  private markFeaturePresent(feature: keyof Features, ts: number): void {
    this.featureMissingStart.delete(feature);
  }

  /**
   * Get feature value with grace period
   * Returns last good value if within grace period, else default
   */
  private getWithGrace(feature: keyof Features, ts: number, defaultValue: number): number {
    // Track when feature went missing
    if (!this.featureMissingStart.has(feature)) {
      this.featureMissingStart.set(feature, ts);
    }

    const missingStart = this.featureMissingStart.get(feature)!;
    const missingDuration = ts - missingStart;

    if (missingDuration <= MISSING_LANDMARK_GRACE_MS) {
      // Within grace period - return last good value
      return this.lastGoodFeatures[feature] ?? defaultValue;
    } else {
      // Beyond grace period - return default
      return defaultValue;
    }
  }

  /**
   * Reset all state
   */
  reset(): void {
    this.prevFrame = null;
    this.gazeTracker.reset();
    this.lastGoodFeatures = {};
    this.featureMissingStart.clear();
  }
}

