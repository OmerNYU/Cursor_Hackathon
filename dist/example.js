/**
 * Example usage of the PitchMirror Feature Processing Engine
 */
import { FeatureProcessor } from './lib/featureProcessor.js';
import { FeatureSmoother } from './lib/smoothing.js';
import { computeScores } from './lib/scoreEngine.js';
import { TipsEngine } from './lib/tipsEngine.js';
import { DEFAULT_TIP_RULES } from './lib/config.js';
/**
 * Process a single frame through the pipeline
 */
function processSingleFrame(frame) {
    // Initialize processors (in real app, keep these as persistent state)
    const processor = new FeatureProcessor();
    const smoother = new FeatureSmoother();
    const tipsEngine = new TipsEngine(DEFAULT_TIP_RULES);
    // 1. Extract raw features
    const rawFeatures = processor.extractFeatures(frame);
    // 2. Feed instantaneous values to rolling stats
    smoother.addSamples(rawFeatures.swaySigma, // raw sway position
    rawFeatures.wristVelStd, // raw wrist velocity
    frame.ts);
    // 3. Get rolling statistics
    const rollingStds = smoother.getRollingStds(frame.ts);
    rawFeatures.swaySigma = rollingStds.swaySigma;
    rawFeatures.wristVelStd = rollingStds.wristVelStd;
    // 4. Apply EMA smoothing
    const smoothedFeatures = smoother.smoothFeatures(rawFeatures);
    // 5. Compute scores
    const scores = computeScores(smoothedFeatures);
    // 6. Evaluate tips
    const tips = tipsEngine.evaluateTips(smoothedFeatures, scores, frame.ts);
    return { features: smoothedFeatures, scores, tips };
}
/**
 * Example: Creating a mock frame
 */
function createMockFrame(ts) {
    return {
        ts,
        pose: {
            shoulders: {
                L: { x: 250, y: 200, z: 0, visibility: 0.95 },
                R: { x: 350, y: 200, z: 0, visibility: 0.95 },
            },
            hips: {
                L: { x: 255, y: 400, z: 0, visibility: 0.9 },
                R: { x: 345, y: 400, z: 0, visibility: 0.9 },
            },
            wrists: {
                L: { x: 200, y: 350, z: 0, visibility: 0.85 },
                R: { x: 400, y: 350, z: 0, visibility: 0.85 },
            },
            torsoMid: { x: 300, y: 300, z: 0, visibility: 0.95 },
        },
        face: {
            iris: {
                L: { x: 280, y: 150, z: 0, visibility: 0.95 },
                R: { x: 320, y: 150, z: 0, visibility: 0.95 },
            },
            eyes: {
                L_outer: { x: 270, y: 150, z: 0, visibility: 0.95 },
                L_inner: { x: 290, y: 150, z: 0, visibility: 0.95 },
                R_inner: { x: 310, y: 150, z: 0, visibility: 0.95 },
                R_outer: { x: 330, y: 150, z: 0, visibility: 0.95 },
            },
            noseTip: { x: 300, y: 160, z: 0, visibility: 0.95 },
            faceCenter: { x: 300, y: 150, z: 0, visibility: 0.95 },
        },
        quality: { poseOk: true, faceOk: true },
        scales: { faceWidthPx: 60, torsoLengthPx: 200 },
    };
}
/**
 * Run example
 */
function runExample() {
    console.log('🎯 PitchMirror Feature Processing Example\n');
    const frame = createMockFrame(0);
    const result = processSingleFrame(frame);
    console.log('📊 Scores:');
    console.log(`  Overall: ${result.scores.overall.toFixed(1)}/100`);
    console.log(`  P (Posture): ${result.scores.P.toFixed(2)}`);
    console.log(`  E (Eye Contact): ${result.scores.E.toFixed(2)}`);
    console.log(`  S (Smoothness): ${result.scores.S.toFixed(2)}`);
    console.log(`  C (Composure): ${result.scores.C.toFixed(2)}`);
    console.log('\n📐 Features:');
    console.log(`  Posture angle: ${result.features.postureAngleDeg.toFixed(1)}°`);
    console.log(`  Sway sigma: ${result.features.swaySigma.toFixed(4)}`);
    console.log(`  Gaze deviation: ${result.features.gazeDevDeg.toFixed(1)}°`);
    console.log(`  Gaze breaks/min: ${result.features.gazeBreaksPerMin.toFixed(1)}`);
    console.log(`  Wrist vel std: ${result.features.wristVelStd.toFixed(4)}`);
    console.log(`  Torso speed: ${result.features.torsoSpeed.toFixed(4)}`);
    console.log('\n💡 Tips:');
    if (result.tips.length === 0) {
        console.log('  No tips (doing great!)');
    }
    else {
        result.tips.forEach((tip, i) => {
            console.log(`  ${i + 1}. ${tip.message}`);
        });
    }
}
// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runExample();
}
export { processSingleFrame, createMockFrame, runExample };
//# sourceMappingURL=example.js.map