import { useState, useEffect } from 'react';
import { useScoringLoop, useMediaPipe } from '../hooks/useScoringLoop';
import VideoCanvas from './VideoCanvas';
import OverlayCanvas from './OverlayCanvas';
import ScorePanel from './ScorePanel';
import SubscoreBar from './SubscoreBar';
import TipsPanel from './TipsPanel';
import CalibrationBanner from './CalibrationBanner';
import DebugPanel from './DebugPanel';

type Phase = 'INIT' | 'CALIBRATING' | 'RUNNING';

/**
 * PitchMirror - Main orchestrator component
 * 
 * Features:
 * - State machine: INIT → CALIBRATING (3s) → RUNNING
 * - Keyboard shortcuts: Space (pause), O (overlay), D (debug)
 * - Layout: video/overlay on left, scores on right
 * - Demo mode badge when using mock data
 */
export default function PitchMirror() {
  const [phase, setPhase] = useState<Phase>('INIT');
  const [debugVisible, setDebugVisible] = useState(false);
  
  const { state, actions } = useScoringLoop();
  const { videoRef } = useMediaPipe();

  // Phase transitions
  useEffect(() => {
    if (phase === 'INIT') {
      // Move to calibrating after a brief moment
      const timer = setTimeout(() => {
        setPhase('CALIBRATING');
      }, 500);
      return () => clearTimeout(timer);
    }
    
    if (phase === 'CALIBRATING') {
      // Move to running after 3 seconds
      const timer = setTimeout(() => {
        setPhase('RUNNING');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          actions.pauseToggle();
          break;
        case 'o':
          e.preventDefault();
          actions.overlayToggle();
          break;
        case 'd':
          e.preventDefault();
          setDebugVisible(prev => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [actions]);

  return (
    <div className="min-h-screen bg-zinc-950 p-4">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-zinc-100 mb-2">
            PitchMirror
          </h1>
          <p className="text-zinc-500">
            AI Confidence Scorer for Presentations
          </p>
        </header>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Video + Overlay */}
          <div className="lg:col-span-2">
            <div className="relative bg-zinc-900 rounded-2xl overflow-hidden aspect-video border border-zinc-800">
              <VideoCanvas videoRef={videoRef} />
              <OverlayCanvas frame={state.frame} show={state.showOverlay} />
              
              {/* Demo mode badge - always shown since scoring is mock */}
              {phase === 'RUNNING' && (
                <div className="absolute top-4 left-4 bg-blue-500/20 border border-blue-500/50 text-blue-300 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
                  Mock Scoring Mode
                </div>
              )}

              {/* Pause indicator */}
              {state.paused && phase === 'RUNNING' && (
                <div className="absolute top-4 right-4 bg-zinc-900/90 border border-zinc-700 text-zinc-300 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
                  ⏸ Paused
                </div>
              )}

              {/* Keyboard hints */}
              <div className="absolute bottom-4 left-4 right-4 flex gap-2 text-xs text-zinc-500">
                <div className="bg-zinc-900/80 px-2 py-1 rounded backdrop-blur-sm">
                  <span className="text-zinc-400">Space</span> Pause
                </div>
                <div className="bg-zinc-900/80 px-2 py-1 rounded backdrop-blur-sm">
                  <span className="text-zinc-400">O</span> Overlay
                </div>
                <div className="bg-zinc-900/80 px-2 py-1 rounded backdrop-blur-sm">
                  <span className="text-zinc-400">D</span> Debug
                </div>
              </div>

              {/* Calibration banner */}
              <CalibrationBanner visible={phase === 'CALIBRATING'} />
            </div>
          </div>

          {/* Right: Scores and Tips */}
          <div className="space-y-6">
            {/* Overall Score */}
            <ScorePanel overall={state.overall} />

            {/* Subscores */}
            <div className="space-y-3">
              <h3 className="text-zinc-400 text-sm uppercase tracking-wider px-1">
                Sub-Scores
              </h3>
              {state.subscores ? (
                <>
                  <SubscoreBar
                    label="P"
                    title="Presence"
                    value={state.subscores.P}
                  />
                  <SubscoreBar
                    label="E"
                    title="Eye Contact"
                    value={state.subscores.E}
                  />
                  <SubscoreBar
                    label="S"
                    title="Stillness"
                    value={state.subscores.S}
                  />
                  <SubscoreBar
                    label="C"
                    title="Composure"
                    value={state.subscores.C}
                  />
                </>
              ) : (
                <div className="text-zinc-600 text-sm px-1">
                  Loading...
                </div>
              )}
            </div>

            {/* Tips */}
            <TipsPanel tips={state.tips} />
          </div>
        </div>

        {/* Debug Panel */}
        {debugVisible && (
          <DebugPanel
            fps={state.fps}
            quality={state.quality}
            isMock={state.isMock}
            features={state.features}
          />
        )}
      </div>
    </div>
  );
}

