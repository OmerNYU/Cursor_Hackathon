/**
 * Unit tests for tips engine
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TipsEngine } from './tipsEngine.js';
import type { TipRule, Features, Subscores } from './types.js';

describe('TipsEngine', () => {
  const mockFeatures: Features = {
    postureAngleDeg: 5,
    swaySigma: 0.01,
    gazeDevDeg: 3,
    gazeBreaksPerMin: 5,
    wristVelStd: 0.02,
    torsoSpeed: 0.05,
  };

  const mockSubscores: Subscores = {
    P: 0.9,
    E: 0.8,
    S: 0.85,
    C: 0.9,
  };

  describe('cooldown suppression', () => {
    it('triggers tip after window duration', () => {
      const rules: TipRule[] = [
        {
          id: 'test-rule',
          priority: 1,
          windowSec: 1,
          cooldownSec: 5,
          when: () => true,
          message: 'Test message',
        },
      ];

      const engine = new TipsEngine(rules);

      // Condition becomes true at t=0
      let tips = engine.evaluateTips(mockFeatures, mockSubscores, 0);
      expect(tips).toHaveLength(0); // Not triggered yet (window not met)

      // At t=500ms, window not met yet
      tips = engine.evaluateTips(mockFeatures, mockSubscores, 500);
      expect(tips).toHaveLength(0);

      // At t=1000ms, window met, should trigger
      tips = engine.evaluateTips(mockFeatures, mockSubscores, 1000);
      expect(tips).toHaveLength(1);
      expect(tips[0].id).toBe('test-rule');
    });

    it('suppresses tip during cooldown period', () => {
      const rules: TipRule[] = [
        {
          id: 'cooldown-test',
          priority: 1,
          windowSec: 1,
          cooldownSec: 3,
          when: () => true,
          message: 'Cooldown test',
        },
      ];

      const engine = new TipsEngine(rules);

      // Establish activation at t=0ms
      engine.evaluateTips(mockFeatures, mockSubscores, 0);

      // First trigger at t=1000ms (window met: 1000ms duration)
      engine.evaluateTips(mockFeatures, mockSubscores, 1000);

      // Try to trigger again immediately - should be in cooldown
      let tips = engine.evaluateTips(mockFeatures, mockSubscores, 1001);
      expect(tips).toHaveLength(0);

      // Still in cooldown at t=3500ms
      tips = engine.evaluateTips(mockFeatures, mockSubscores, 3500);
      expect(tips).toHaveLength(0);

      // Cooldown ends after 3000ms, so at t=4001ms should trigger again
      tips = engine.evaluateTips(mockFeatures, mockSubscores, 4001);
      expect(tips).toHaveLength(1);
    });

    it('resets activation when condition becomes false', () => {
      let conditionMet = true;
      const rules: TipRule[] = [
        {
          id: 'toggle-test',
          priority: 1,
          windowSec: 1,
          cooldownSec: 5,
          when: () => conditionMet,
          message: 'Toggle test',
        },
      ];

      const engine = new TipsEngine(rules);

      // Condition true at t=0
      engine.evaluateTips(mockFeatures, mockSubscores, 0);

      // Condition becomes false before window completes
      conditionMet = false;
      engine.evaluateTips(mockFeatures, mockSubscores, 500);

      // Condition becomes true again
      conditionMet = true;
      engine.evaluateTips(mockFeatures, mockSubscores, 600);

      // Window should restart from t=600, not t=0
      // So at t=1500 (900ms after restart), window not met
      let tips = engine.evaluateTips(mockFeatures, mockSubscores, 1500);
      expect(tips).toHaveLength(0);

      // At t=1600 (1000ms after restart), should trigger
      tips = engine.evaluateTips(mockFeatures, mockSubscores, 1600);
      expect(tips).toHaveLength(1);
    });
  });

  describe('priority ordering', () => {
    it('returns higher priority tips first', () => {
      const rules: TipRule[] = [
        {
          id: 'low-priority',
          priority: 3,
          windowSec: 0.5,
          cooldownSec: 5,
          when: () => true,
          message: 'Low priority',
        },
        {
          id: 'high-priority',
          priority: 1,
          windowSec: 0.5,
          cooldownSec: 5,
          when: () => true,
          message: 'High priority',
        },
        {
          id: 'medium-priority',
          priority: 2,
          windowSec: 0.5,
          cooldownSec: 5,
          when: () => true,
          message: 'Medium priority',
        },
      ];

      const engine = new TipsEngine(rules);

      // Establish activation at t=0ms
      engine.evaluateTips(mockFeatures, mockSubscores, 0);

      // Trigger all at t=500ms (window is 0.5s = 500ms)
      const tips = engine.evaluateTips(mockFeatures, mockSubscores, 500);

      // Should return top 2, ordered by priority (1 = highest)
      expect(tips).toHaveLength(2);
      expect(tips[0].id).toBe('high-priority');
      expect(tips[1].id).toBe('medium-priority');
    });

    it('returns fewer than 2 tips if only some trigger', () => {
      const rules: TipRule[] = [
        {
          id: 'triggered',
          priority: 1,
          windowSec: 0.5,
          cooldownSec: 5,
          when: () => true,
          message: 'Triggered',
        },
        {
          id: 'not-triggered',
          priority: 2,
          windowSec: 0.5,
          cooldownSec: 5,
          when: () => false,
          message: 'Not triggered',
        },
      ];

      const engine = new TipsEngine(rules);

      // Establish activation at t=0ms
      engine.evaluateTips(mockFeatures, mockSubscores, 0);

      // Check at t=500ms (window is 0.5s = 500ms)
      const tips = engine.evaluateTips(mockFeatures, mockSubscores, 500);

      expect(tips).toHaveLength(1);
      expect(tips[0].id).toBe('triggered');
    });

    it('respects priority even with different activation times', () => {
      let lowPriorityActive = false;
      const rules: TipRule[] = [
        {
          id: 'low-priority-late',
          priority: 2,
          windowSec: 0.5,
          cooldownSec: 5,
          when: () => lowPriorityActive,
          message: 'Low priority',
        },
        {
          id: 'high-priority-early',
          priority: 1,
          windowSec: 0.5,
          cooldownSec: 5,
          when: () => true,
          message: 'High priority',
        },
      ];

      const engine = new TipsEngine(rules);

      // High priority activates at t=0
      engine.evaluateTips(mockFeatures, mockSubscores, 0);

      // Low priority activates at t=200ms
      lowPriorityActive = true;
      engine.evaluateTips(mockFeatures, mockSubscores, 200);

      // Both should be ready at t=700ms (high at 500+200, low at 700)
      // But we need to wait until both windows are met
      // High priority window met at t=500
      let tips = engine.evaluateTips(mockFeatures, mockSubscores, 500);
      expect(tips).toHaveLength(1);
      expect(tips[0].id).toBe('high-priority-early');

      // Low priority window met at t=700
      tips = engine.evaluateTips(mockFeatures, mockSubscores, 700);
      // High is in cooldown, low triggers
      expect(tips).toHaveLength(1);
      expect(tips[0].id).toBe('low-priority-late');
    });
  });

  describe('reset', () => {
    it('clears all rule states', () => {
      const rules: TipRule[] = [
        {
          id: 'test',
          priority: 1,
          windowSec: 1,
          cooldownSec: 5,
          when: () => true,
          message: 'Test',
        },
      ];

      const engine = new TipsEngine(rules);

      // Trigger tip
      engine.evaluateTips(mockFeatures, mockSubscores, 1000);

      // Reset
      engine.reset();

      // Establish activation after reset at t=1000ms
      engine.evaluateTips(mockFeatures, mockSubscores, 1000);

      // Should be able to trigger at t=2000ms (window is 1s)
      const tips = engine.evaluateTips(mockFeatures, mockSubscores, 2000);
      expect(tips).toHaveLength(1);
    });
  });

  describe('feature and subscore evaluation', () => {
    it('evaluates based on features', () => {
      const rules: TipRule[] = [
        {
          id: 'gaze-rule',
          priority: 1,
          windowSec: 0.5,
          cooldownSec: 5,
          when: (f: Features) => f.gazeDevDeg > 10,
          message: 'Look at camera',
        },
      ];

      const engine = new TipsEngine(rules);

      const badGaze: Features = { ...mockFeatures, gazeDevDeg: 15 };
      // Establish activation at t=0ms
      engine.evaluateTips(badGaze, mockSubscores, 0);
      // Check at t=500ms (window is 0.5s = 500ms)
      let tips = engine.evaluateTips(badGaze, mockSubscores, 500);
      expect(tips).toHaveLength(1);

      engine.reset();

      const goodGaze: Features = { ...mockFeatures, gazeDevDeg: 3 };
      // Establish at t=0ms (condition false)
      engine.evaluateTips(goodGaze, mockSubscores, 0);
      // Check at t=500ms - should still be 0 since condition never met
      tips = engine.evaluateTips(goodGaze, mockSubscores, 500);
      expect(tips).toHaveLength(0);
    });

    it('evaluates based on subscores', () => {
      const rules: TipRule[] = [
        {
          id: 'posture-rule',
          priority: 1,
          windowSec: 0.5,
          cooldownSec: 5,
          when: (_f: Features, s: Subscores) => s.P < 0.7,
          message: 'Improve posture',
        },
      ];

      const engine = new TipsEngine(rules);

      const badPosture: Subscores = { ...mockSubscores, P: 0.5 };
      // Establish activation at t=0ms
      engine.evaluateTips(mockFeatures, badPosture, 0);
      // Check at t=500ms (window is 0.5s = 500ms)
      let tips = engine.evaluateTips(mockFeatures, badPosture, 500);
      expect(tips).toHaveLength(1);

      engine.reset();

      const goodPosture: Subscores = { ...mockSubscores, P: 0.9 };
      // Establish at t=0ms (condition false)
      engine.evaluateTips(mockFeatures, goodPosture, 0);
      // Check at t=500ms - should still be 0 since condition never met
      tips = engine.evaluateTips(mockFeatures, goodPosture, 500);
      expect(tips).toHaveLength(0);
    });
  });
});

