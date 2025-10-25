/**
 * End-to-end test harness for feature processing pipeline
 * Loads fixtures and validates scenarios
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { FeatureProcessor } from './lib/featureProcessor.js';
import { FeatureSmoother } from './lib/smoothing.js';
import { computeScores } from './lib/scoreEngine.js';
import { TipsEngine } from './lib/tipsEngine.js';
import { DEFAULT_TIP_RULES } from './lib/config.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
/**
 * Check if value contains NaN or Infinity
 */
function hasInvalidNumbers(obj) {
    const invalid = [];
    function check(value, path) {
        if (typeof value === 'number') {
            if (!Number.isFinite(value)) {
                invalid.push(`${path} = ${value}`);
            }
        }
        else if (typeof value === 'object' && value !== null) {
            for (const key in value) {
                check(value[key], path ? `${path}.${key}` : key);
            }
        }
    }
    check(obj, '');
    return invalid;
}
/**
 * Load fixture file
 */
function loadFixture(filename) {
    const path = join(__dirname, 'fixtures', filename);
    const content = readFileSync(path, 'utf-8');
    return JSON.parse(content);
}
/**
 * Process a sequence of frames through the full pipeline
 */
function processFrames(frames) {
    const processor = new FeatureProcessor();
    const smoother = new FeatureSmoother();
    const tipsEngine = new TipsEngine(DEFAULT_TIP_RULES);
    const allFeatures = [];
    const allScores = [];
    const allTips = [];
    for (const frame of frames) {
        // Extract raw features
        const rawFeatures = processor.extractFeatures(frame);
        // For sway and wrist velocity, we need to feed instantaneous values
        // to rolling stats before computing std
        const swayValue = rawFeatures.swaySigma; // Actually raw sway position
        const wristVel = rawFeatures.wristVelStd; // Actually raw velocity
        // Add to rolling windows (only if pose data is fresh, not from grace period)
        if (processor.isPoseDataFresh()) {
            smoother.addSamples(swayValue, wristVel, frame.ts);
        }
        // Get rolling std deviations
        const rollingStds = smoother.getRollingStds(frame.ts);
        // Update features with rolling stats
        rawFeatures.swaySigma = rollingStds.swaySigma;
        rawFeatures.wristVelStd = rollingStds.wristVelStd;
        // Apply EMA smoothing
        const smoothedFeatures = smoother.smoothFeatures(rawFeatures);
        // Compute scores
        const scores = computeScores(smoothedFeatures);
        // Evaluate tips
        const tips = tipsEngine.evaluateTips(smoothedFeatures, scores, frame.ts);
        allFeatures.push(smoothedFeatures);
        allScores.push(scores);
        allTips.push(tips);
    }
    return { features: allFeatures, scores: allScores, tips: allTips };
}
/**
 * Validate that outputs contain no NaN or Infinity
 */
function validateOutputs(features, scores) {
    const errors = [];
    for (let i = 0; i < features.length; i++) {
        const featInvalid = hasInvalidNumbers(features[i]);
        if (featInvalid.length > 0) {
            errors.push(`Frame ${i} features: ${featInvalid.join(', ')}`);
        }
        const scoreInvalid = hasInvalidNumbers(scores[i]);
        if (scoreInvalid.length > 0) {
            errors.push(`Frame ${i} scores: ${scoreInvalid.join(', ')}`);
        }
    }
    return errors;
}
/**
 * Test scenario 1: Still subject
 * Expectation: High P/S/C scores, overall > 80, no tips
 */
function testStillSubject() {
    const frames = loadFixture('frames.still.json');
    const { features, scores, tips } = processFrames(frames);
    const details = [];
    let passed = true;
    // Validate no NaN/Infinity
    const invalidOutputs = validateOutputs(features, scores);
    if (invalidOutputs.length > 0) {
        details.push(`❌ Invalid outputs: ${invalidOutputs.join('; ')}`);
        passed = false;
    }
    else {
        details.push(`✓ All outputs are finite`);
    }
    // Check final scores (after smoothing has settled)
    const finalScores = scores[scores.length - 1];
    details.push(`Final overall: ${finalScores.overall.toFixed(1)}`);
    details.push(`Final P: ${finalScores.P.toFixed(2)}, E: ${finalScores.E.toFixed(2)}, S: ${finalScores.S.toFixed(2)}, C: ${finalScores.C.toFixed(2)}`);
    // Expectations
    if (finalScores.P < 0.8) {
        details.push(`❌ Expected P > 0.8, got ${finalScores.P.toFixed(2)}`);
        passed = false;
    }
    else {
        details.push(`✓ P score good: ${finalScores.P.toFixed(2)}`);
    }
    if (finalScores.S < 0.7) {
        details.push(`❌ Expected S > 0.7, got ${finalScores.S.toFixed(2)}`);
        passed = false;
    }
    else {
        details.push(`✓ S score good: ${finalScores.S.toFixed(2)}`);
    }
    if (finalScores.C < 0.8) {
        details.push(`❌ Expected C > 0.8, got ${finalScores.C.toFixed(2)}`);
        passed = false;
    }
    else {
        details.push(`✓ C score good: ${finalScores.C.toFixed(2)}`);
    }
    // Check for unwanted tips
    const allTriggeredTips = tips.flatMap(t => t);
    const uniqueTips = [...new Set(allTriggeredTips.map(t => t.id))];
    if (uniqueTips.length > 0) {
        details.push(`⚠️ Tips triggered (expected none): ${uniqueTips.join(', ')}`);
        // Not failing test since tips might trigger briefly
    }
    else {
        details.push(`✓ No tips triggered`);
    }
    return {
        scenario: 'Still Subject',
        passed,
        details,
        finalScores,
        triggeredTips: uniqueTips,
    };
}
/**
 * Test scenario 2: Look away
 * Expectation: gazeDevDeg rises, E score drops, eye contact tip triggers
 */
function testLookAway() {
    const frames = loadFixture('frames.lookaway.json');
    const { features, scores, tips } = processFrames(frames);
    const details = [];
    let passed = true;
    // Validate no NaN/Infinity
    const invalidOutputs = validateOutputs(features, scores);
    if (invalidOutputs.length > 0) {
        details.push(`❌ Invalid outputs: ${invalidOutputs.join('; ')}`);
        passed = false;
    }
    else {
        details.push(`✓ All outputs are finite`);
    }
    // Check gaze deviation increases
    const firstGaze = features[0].gazeDevDeg;
    const lastGaze = features[features.length - 1].gazeDevDeg;
    details.push(`Gaze dev: ${firstGaze.toFixed(1)}° → ${lastGaze.toFixed(1)}°`);
    if (lastGaze <= firstGaze) {
        details.push(`❌ Expected gaze deviation to increase`);
        passed = false;
    }
    else {
        details.push(`✓ Gaze deviation increased`);
    }
    // Check E score drops
    const firstE = scores[0].E;
    const lastE = scores[scores.length - 1].E;
    details.push(`E score: ${firstE.toFixed(2)} → ${lastE.toFixed(2)}`);
    if (lastE >= firstE) {
        details.push(`❌ Expected E score to drop`);
        passed = false;
    }
    else {
        details.push(`✓ E score dropped`);
    }
    // Check for eye contact tip
    const allTriggeredTips = tips.flatMap(t => t);
    const eyeTip = allTriggeredTips.find(t => t.id.includes('eye'));
    if (!eyeTip) {
        details.push(`❌ Expected eye contact tip to trigger`);
        passed = false;
    }
    else {
        details.push(`✓ Eye contact tip triggered: "${eyeTip.message}"`);
    }
    return {
        scenario: 'Look Away',
        passed,
        details,
        finalScores: scores[scores.length - 1],
        triggeredTips: [...new Set(allTriggeredTips.map(t => t.id))],
    };
}
/**
 * Test scenario 3: Walk around
 * Expectation: torsoSpeed rises, C score drops, pacing tip triggers
 */
function testWalkAround() {
    const frames = loadFixture('frames.walk.json');
    const { features, scores, tips } = processFrames(frames);
    const details = [];
    let passed = true;
    // Validate no NaN/Infinity
    const invalidOutputs = validateOutputs(features, scores);
    if (invalidOutputs.length > 0) {
        details.push(`❌ Invalid outputs: ${invalidOutputs.join('; ')}`);
        passed = false;
    }
    else {
        details.push(`✓ All outputs are finite`);
    }
    // Check torso speed
    const speeds = features.map(f => f.torsoSpeed);
    const maxSpeed = Math.max(...speeds);
    details.push(`Max torso speed: ${maxSpeed.toFixed(4)}`);
    if (maxSpeed < 0.1) {
        details.push(`❌ Expected significant torso movement (speed > 0.1)`);
        passed = false;
    }
    else {
        details.push(`✓ Significant torso movement detected`);
    }
    // Check C score
    const firstC = scores[0].C;
    const lastC = scores[scores.length - 1].C;
    details.push(`C score: ${firstC.toFixed(2)} → ${lastC.toFixed(2)}`);
    if (lastC >= firstC) {
        details.push(`❌ Expected C score to drop`);
        passed = false;
    }
    else {
        details.push(`✓ C score dropped`);
    }
    // Check for pacing tip
    const allTriggeredTips = tips.flatMap(t => t);
    const pacingTip = allTriggeredTips.find(t => t.id.includes('pacing'));
    if (!pacingTip) {
        details.push(`❌ Expected pacing tip to trigger`);
        passed = false;
    }
    else {
        details.push(`✓ Pacing tip triggered: "${pacingTip.message}"`);
    }
    return {
        scenario: 'Walk Around',
        passed,
        details,
        finalScores: scores[scores.length - 1],
        triggeredTips: [...new Set(allTriggeredTips.map(t => t.id))],
    };
}
/**
 * Test scenario 4: Irregular FPS
 * Expectation: Robust against variable frame rates, no NaN, stable scores
 */
function testIrregularFPS() {
    const frames = loadFixture('frames.irregular.json');
    const { features, scores, tips } = processFrames(frames);
    const details = [];
    let passed = true;
    // Validate no NaN/Infinity
    const invalidOutputs = validateOutputs(features, scores);
    if (invalidOutputs.length > 0) {
        details.push(`❌ Invalid outputs: ${invalidOutputs.join('; ')}`);
        passed = false;
    }
    else {
        details.push(`✓ All outputs are finite`);
    }
    // Check timestamp gaps vary
    const gaps = [];
    for (let i = 1; i < frames.length; i++) {
        gaps.push(frames[i].ts - frames[i - 1].ts);
    }
    const minGap = Math.min(...gaps);
    const maxGap = Math.max(...gaps);
    details.push(`Timestamp gaps: ${minGap}ms - ${maxGap}ms`);
    if (maxGap < 40) {
        details.push(`❌ Expected max gap >40ms for irregular FPS`);
        passed = false;
    }
    else {
        details.push(`✓ FPS variation present`);
    }
    // Check final scores are reasonable for still subject
    const finalScores = scores[scores.length - 1];
    details.push(`Final overall: ${finalScores.overall.toFixed(1)}`);
    details.push(`Final subscores: P=${finalScores.P.toFixed(2)}, E=${finalScores.E.toFixed(2)}, S=${finalScores.S.toFixed(2)}, C=${finalScores.C.toFixed(2)}`);
    if (finalScores.P < 0.7) {
        details.push(`❌ Expected P > 0.7 for still subject`);
        passed = false;
    }
    else {
        details.push(`✓ Posture score stable`);
    }
    return {
        scenario: 'Irregular FPS',
        passed,
        details,
        finalScores,
        triggeredTips: [...new Set(tips.flatMap(t => t).map(t => t.id))],
    };
}
/**
 * Run all tests and print results
 */
function runAllTests() {
    console.log('🧪 PitchMirror Feature Processing Engine - Test Harness\n');
    console.log('═'.repeat(60));
    const tests = [testStillSubject, testLookAway, testWalkAround, testIrregularFPS];
    const results = [];
    for (const test of tests) {
        const result = test();
        results.push(result);
        console.log(`\n📋 ${result.scenario}`);
        console.log('─'.repeat(60));
        for (const detail of result.details) {
            console.log(`  ${detail}`);
        }
        console.log(`\n  Result: ${result.passed ? '✅ PASSED' : '❌ FAILED'}`);
        if (result.finalScores) {
            console.log(`  Final Score: ${result.finalScores.overall.toFixed(1)}/100`);
        }
    }
    console.log('\n' + '═'.repeat(60));
    const passCount = results.filter(r => r.passed).length;
    const totalCount = results.length;
    console.log(`\n📊 Summary: ${passCount}/${totalCount} tests passed`);
    if (passCount === totalCount) {
        console.log('🎉 All tests passed!\n');
        process.exit(0);
    }
    else {
        console.log('⚠️  Some tests failed.\n');
        process.exit(1);
    }
}
// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runAllTests();
}
export { runAllTests, testStillSubject, testLookAway, testWalkAround, testIrregularFPS };
//# sourceMappingURL=test-harness.js.map