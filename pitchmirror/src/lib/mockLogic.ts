import { FramePack, EvaluateResult } from './types';

/**
 * Mock implementation of evaluate function from Logic layer
 * Generates reasonable scores and tips based on frame quality
 * This allows UI testing without actual Logic layer
 */
export function evaluate(framePack: FramePack, nowMs: number): EvaluateResult {
  // Generate mock features based on frame quality
  const hasPose = !!framePack.pose;
  const hasFace = !!framePack.face;

  // Mock feature values - in real implementation these come from actual calculations
  const features = {
    postureAngleDeg: hasPose ? 8 + Math.random() * 4 : 15,
    swaySigma: hasPose ? 0.01 + Math.random() * 0.01 : 0.03,
    gazeDevDeg: hasFace ? 5 + Math.random() * 8 : 20,
    gazeBreaksPerMin: hasFace ? 4 + Math.random() * 6 : 15,
    wristVelStd: hasPose ? 0.02 + Math.random() * 0.04 : 0.09,
    torsoSpeed: hasPose ? 0.03 + Math.random() * 0.03 : 0.1,
  };

  // Calculate subscores based on features
  // In real implementation, these use thresholds from config
  const P = hasPose ? Math.max(0, 1 - features.postureAngleDeg / 12) * (1 - features.swaySigma / 0.02) : 0.5;
  const E = hasFace ? Math.max(0, 1 - features.gazeDevDeg / 18) * (1 - features.gazeBreaksPerMin / 12) : 0.5;
  const S = hasPose ? Math.max(0, 1 - (features.wristVelStd - 0.01) / 0.07) : 0.6;
  const C = hasPose ? Math.max(0, 1 - features.torsoSpeed / 0.12) : 0.6;

  const subscores = {
    P: Math.max(0, Math.min(1, P)),
    E: Math.max(0, Math.min(1, E)),
    S: Math.max(0, Math.min(1, S)),
    C: Math.max(0, Math.min(1, C)),
  };

  // Calculate overall score (weighted average)
  const overall = Math.round(
    100 * (0.4 * subscores.P + 0.3 * subscores.E + 0.2 * subscores.S + 0.1 * subscores.C)
  );

  // Generate tips based on lowest subscores
  const tips: string[] = [];
  
  if (!framePack.quality.poseOk) {
    tips.push('📹 Center yourself in the frame');
  } else if (subscores.P < 0.7) {
    tips.push('💪 Stack shoulders over hips for better posture');
  }

  if (!framePack.quality.faceOk) {
    tips.push('👤 Face not detected - ensure good lighting');
  } else if (subscores.E < 0.7 && tips.length < 2) {
    tips.push('👀 Keep your eyes closer to the camera');
  }

  if (subscores.S < 0.7 && tips.length < 2) {
    tips.push('🖐️ Hands a bit fidgety - add purposeful pauses');
  }

  if (subscores.C < 0.7 && tips.length < 2) {
    tips.push('🚶 You\'re pacing - plant your feet for emphasis');
  }

  // Limit to 2 tips max
  return {
    features,
    subscores,
    overall,
    tips: tips.slice(0, 2),
  };
}

