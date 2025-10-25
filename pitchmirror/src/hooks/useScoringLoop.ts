import { useState, useEffect, useRef, useCallback } from 'react';
import { UseScoringLoopResult, ScoringState } from '../lib/types';
import { useMediaPipe } from '../lib/mockVision';
import { evaluate } from '@scoring-engine/index';

/**
 * Main state management hook for PitchMirror
 * 
 * Responsibilities:
 * - Pull live FramePack from useMediaPipe() or fixtures (mock mode)
 * - Call evaluate() at ~10Hz (throttled)
 * - Track FPS
 * - Manage pause/overlay toggles
 * - Never spam React state every frame - throttle to ~100ms
 */
export function useScoringLoop(): UseScoringLoopResult {
  // Get frame data from Vision layer (or mock)
  const { framePack, isReady, error } = useMediaPipe();
  
  // Main state
  const [state, setState] = useState<ScoringState>({
    frame: null,
    features: null,
    subscores: null,
    overall: null,
    tips: [],
    fps: 0,
    quality: null,
    isMock: true, // Always true since we're using mock for now
    paused: false,
    showOverlay: true,
  });

  // Refs for tracking
  const lastUpdateRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const fpsUpdateRef = useRef<number>(0);
  const rafIdRef = useRef<number | null>(null);

  // Actions
  const pauseToggle = useCallback(() => {
    setState(prev => ({ ...prev, paused: !prev.paused }));
  }, []);

  const overlayToggle = useCallback(() => {
    setState(prev => ({ ...prev, showOverlay: !prev.showOverlay }));
  }, []);

  // Main scoring loop
  useEffect(() => {
    if (!isReady || !framePack) return;

    const tick = () => {
      const now = Date.now();
      
      // Throttle state updates to ~100ms (10Hz)
      if (now - lastUpdateRef.current >= 100) {
        // Don't update if paused
        if (!state.paused) {
          // Call evaluate from Logic layer
          const result = evaluate(framePack, now);

          // Update state
          setState(prev => ({
            ...prev,
            frame: framePack,
            features: result.features,
            subscores: result.subscores,
            overall: result.overall,
            tips: result.tips,
            quality: framePack.quality,
          }));

          lastUpdateRef.current = now;
        }
      }

      // Track FPS (update every second)
      frameCountRef.current++;
      if (now - fpsUpdateRef.current >= 1000) {
        const fps = Math.round(frameCountRef.current * 1000 / (now - fpsUpdateRef.current));
        setState(prev => ({ ...prev, fps }));
        frameCountRef.current = 0;
        fpsUpdateRef.current = now;
      }

      // Continue loop
      rafIdRef.current = requestAnimationFrame(tick);
    };

    // Start the loop
    rafIdRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [isReady, framePack, state.paused]);

  // Update isMock status based on Vision layer
  useEffect(() => {
    setState(prev => ({
      ...prev,
      isMock: !isReady || !!error,
    }));
  }, [isReady, error]);

  return {
    state,
    actions: {
      pauseToggle,
      overlayToggle,
    },
  };
}

// Export videoRef access for components that need it
export { useMediaPipe };

