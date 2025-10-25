/**
 * Tips engine: Rule-based tip selection
 * Architecture §9
 */
import type { Features, Subscores, TipRule } from './types.js';
interface RuleState {
    activeSince: number | null;
    lastTriggered: number | null;
}
/**
 * Tips engine evaluator
 * Tracks rule activation windows and cooldowns
 */
export declare class TipsEngine {
    private rules;
    private ruleStates;
    constructor(rules: TipRule[]);
    /**
     * Evaluate rules and return top 2 active tips
     */
    evaluateTips(features: Features, subscores: Subscores, nowMs: number): TipRule[];
    /**
     * Reset all rule states
     */
    reset(): void;
    /**
     * Get current state for debugging
     */
    getState(): Map<string, RuleState>;
}
export {};
//# sourceMappingURL=tipsEngine.d.ts.map