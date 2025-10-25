/**
 * Tips engine: Rule-based tip selection
 * Architecture §9
 */
/**
 * Tips engine evaluator
 * Tracks rule activation windows and cooldowns
 */
export class TipsEngine {
    constructor(rules) {
        this.rules = rules;
        this.ruleStates = new Map();
        // Initialize state for each rule
        for (const rule of rules) {
            this.ruleStates.set(rule.id, {
                activeSince: null,
                lastTriggered: null,
            });
        }
    }
    /**
     * Evaluate rules and return top 2 active tips
     */
    evaluateTips(features, subscores, nowMs) {
        const activeTips = [];
        for (const rule of this.rules) {
            const state = this.ruleStates.get(rule.id);
            const conditionMet = rule.when(features, subscores);
            // Update activation tracking
            if (conditionMet && state.activeSince === null) {
                // Condition just became true
                state.activeSince = nowMs;
            }
            else if (!conditionMet && state.activeSince !== null) {
                // Condition no longer true
                state.activeSince = null;
            }
            // Check if rule should trigger
            if (state.activeSince !== null) {
                const activeDuration = nowMs - state.activeSince;
                const windowMs = rule.windowSec * 1000;
                // Check window duration
                if (activeDuration >= windowMs) {
                    // Check cooldown
                    const isInCooldown = state.lastTriggered !== null &&
                        nowMs - state.lastTriggered < rule.cooldownSec * 1000;
                    if (!isInCooldown) {
                        activeTips.push({ rule, priority: rule.priority });
                        // Mark as triggered
                        state.lastTriggered = nowMs;
                    }
                }
            }
        }
        // Sort by priority (1 = highest) and return top 2
        activeTips.sort((a, b) => a.priority - b.priority);
        return activeTips.slice(0, 2).map((t) => t.rule);
    }
    /**
     * Reset all rule states
     */
    reset() {
        for (const [id, state] of this.ruleStates) {
            state.activeSince = null;
            state.lastTriggered = null;
        }
    }
    /**
     * Get current state for debugging
     */
    getState() {
        return new Map(this.ruleStates);
    }
}
//# sourceMappingURL=tipsEngine.js.map