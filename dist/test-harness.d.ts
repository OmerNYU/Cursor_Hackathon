/**
 * End-to-end test harness for feature processing pipeline
 * Loads fixtures and validates scenarios
 */
import type { Scores } from './lib/types.js';
interface TestResult {
    scenario: string;
    passed: boolean;
    details: string[];
    finalScores?: Scores;
    triggeredTips?: string[];
}
/**
 * Test scenario 1: Still subject
 * Expectation: High P/S/C scores, overall > 80, no tips
 */
declare function testStillSubject(): TestResult;
/**
 * Test scenario 2: Look away
 * Expectation: gazeDevDeg rises, E score drops, eye contact tip triggers
 */
declare function testLookAway(): TestResult;
/**
 * Test scenario 3: Walk around
 * Expectation: torsoSpeed rises, C score drops, pacing tip triggers
 */
declare function testWalkAround(): TestResult;
/**
 * Test scenario 4: Irregular FPS
 * Expectation: Robust against variable frame rates, no NaN, stable scores
 */
declare function testIrregularFPS(): TestResult;
/**
 * Run all tests and print results
 */
declare function runAllTests(): void;
export { runAllTests, testStillSubject, testLookAway, testWalkAround, testIrregularFPS };
//# sourceMappingURL=test-harness.d.ts.map