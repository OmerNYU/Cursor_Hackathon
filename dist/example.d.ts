/**
 * Example usage of the PitchMirror Feature Processing Engine
 */
import type { FramePack } from './lib/types.js';
/**
 * Process a single frame through the pipeline
 */
declare function processSingleFrame(frame: FramePack): {
    features: import("./index.js").Features;
    scores: import("./index.js").Scores;
    tips: import("./index.js").TipRule[];
};
/**
 * Example: Creating a mock frame
 */
declare function createMockFrame(ts: number): FramePack;
/**
 * Run example
 */
declare function runExample(): void;
export { processSingleFrame, createMockFrame, runExample };
//# sourceMappingURL=example.d.ts.map