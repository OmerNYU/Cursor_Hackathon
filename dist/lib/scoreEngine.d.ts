/**
 * Score engine: Features → Subscores → Overall
 * Architecture §7 & §8
 */
import type { Features, Subscores, Scores } from './types.js';
/**
 * Compute subscores from features
 * All subscores in [0, 1]
 */
export declare function computeSubscores(features: Features): Subscores;
/**
 * Compute overall confidence score from subscores
 * Returns value in [0, 100]
 */
export declare function computeOverall(subscores: Subscores): number;
/**
 * Compute full scores from features
 */
export declare function computeScores(features: Features): Scores;
//# sourceMappingURL=scoreEngine.d.ts.map