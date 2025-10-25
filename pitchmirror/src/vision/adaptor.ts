import type { FramePack, Subscores, Quality } from './types';
import { confidenceFrom, tipsFor } from './scoring';

/**
 * UI-ready data structure
 */
export interface UIData {
  confidence: number;
  subScores: Subscores;
  tips: string[];
  quality: Quality | null;
}

/**
 * Converts frame and smoothed scores to UI-ready format
 * 
 * @param frame - Current frame pack (can be null)
 * @param smoothed - Smoothed subscores (can be null)
 * @returns UI data object with confidence, subscores, tips, and quality
 */
export function toUI(
  frame: FramePack | null,
  smoothed: Subscores | null
): UIData {
  if (!frame || !smoothed) {
    return {
      confidence: 50,
      subScores: { P: 0.5, E: 0.5, S: 0.5, C: 0.5 },
      tips: [],
      quality: null,
    };
  }
  
  return {
    confidence: confidenceFrom(smoothed),
    subScores: smoothed,
    tips: tipsFor(smoothed),
    quality: frame.quality,
  };
}

