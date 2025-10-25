import type { Subscores } from './types';

/**
 * Weights for each subscore in the overall confidence calculation
 * Must sum to 1.0
 */
export const WEIGHTS = {
  posture: 0.4,
  eye: 0.3,
  smooth: 0.2,
  pace: 0.1,
} as const;

/**
 * Calculates overall confidence score from subscores
 * @param sub - Subscores object with P, E, S, C values in [0,1]
 * @returns Confidence score in [0,100]
 */
export function confidenceFrom(sub: Subscores): number {
  const weighted =
    WEIGHTS.posture * sub.P +
    WEIGHTS.eye * sub.E +
    WEIGHTS.smooth * sub.S +
    WEIGHTS.pace * sub.C;
  
  return Math.round(100 * weighted);
}

/**
 * Generates actionable tips based on subscores
 * Returns the top 2 most relevant tips, or an encouraging message if all scores are high
 * 
 * @param sub - Subscores object with P, E, S, C values in [0,1]
 * @returns Array of tip strings (max 2)
 */
export function tipsFor(sub: Subscores): string[] {
  // If all scores are high, return encouraging message
  if (sub.P >= 0.85 && sub.E >= 0.85 && sub.S >= 0.85 && sub.C >= 0.85) {
    return ['Strong presence. Keep it up!'];
  }
  
  // Find the two lowest subscores
  const scores = [
    { name: 'posture', value: sub.P },
    { name: 'eye', value: sub.E },
    { name: 'smooth', value: sub.S },
    { name: 'pace', value: sub.C },
  ];
  
  scores.sort((a, b) => a.value - b.value);
  
  const tips: string[] = [];
  const tipMap: Record<string, string> = {
    posture: '💪 Stack shoulders over hips and reduce side tilt.',
    eye: '👀 Keep your gaze closer to the camera.',
    smooth: '🖐️ Hands look fidgety. Add deliberate pauses.',
    pace: '🚶 Reduce pacing. Plant your feet for emphasis.',
  };
  
  // Take the two lowest scores
  for (let i = 0; i < Math.min(2, scores.length); i++) {
    const score = scores[i];
    if (score.value < 0.85) {
      tips.push(tipMap[score.name]);
    }
  }
  
  // If no tips generated (all scores are okay), return an encouraging message
  if (tips.length === 0) {
    return ['Good presence overall!'];
  }
  
  return tips;
}

