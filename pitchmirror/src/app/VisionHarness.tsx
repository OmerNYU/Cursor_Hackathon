import { useEffect, useRef, useState } from 'react';
import { useVision } from '../vision/useVision';
import { evaluate, defaultFeatureState, type FeatureState } from '../vision/features';
import { toUI } from '../vision/adaptor';
import { drawOverlay } from '../vision/overlay';
import { TuningPanel } from '../vision/TuningPanel';

export function VisionHarness() {
  const vision = useVision();
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [showOverlay, setShowOverlay] = useState(true);
  const [isStarted, setIsStarted] = useState(false);
  const featureStateRef = useRef<FeatureState>(defaultFeatureState());
  const [uiData, setUiData] = useState(toUI(null, null));
  const [scores, setScores] = useState<ReturnType<typeof evaluate> | null>(null);

  const handleStart = async () => {
    try {
      console.log('Starting camera...');
      await vision.startCamera();
      setIsStarted(true);
    } catch (err) {
      console.error('Failed to start camera:', err);
      alert(`Camera error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleStop = () => {
    vision.stopCamera();
    setIsStarted(false);
    featureStateRef.current = defaultFeatureState();
  };

  // Analysis and rendering loop
  useEffect(() => {
    if (!vision.isReady || !vision.frame) return;

    let rafId: number;

    const loop = () => {
      rafId = requestAnimationFrame(loop);

      // Evaluate features
      const nowMs = performance.now();
      const analysisFps = vision.debug.intervalMs > 0 ? 1000 / vision.debug.intervalMs : 10;
      const result = evaluate(vision.frame, featureStateRef.current, analysisFps, nowMs);

      // Update scores
      setScores(result);

      // Convert to UI data
      const ui = toUI(vision.frame, result.smoothed);
      setUiData(ui);

      // Draw overlay
      if (showOverlay && overlayCanvasRef.current && vision.videoRef.current) {
        const canvas = overlayCanvasRef.current;
        const video = vision.videoRef.current;

        // Match canvas size to video
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }

        const ctx = canvas.getContext('2d');
        if (ctx && vision.frame) {
          drawOverlay(
            ctx,
            { w: canvas.width, h: canvas.height },
            vision.frame.pose,
            vision.frame.face
          );
        }
      } else if (!showOverlay && overlayCanvasRef.current) {
        const ctx = overlayCanvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
        }
      }
    };

    loop();

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [vision.isReady, vision.frame, showOverlay, vision.videoRef, vision.debug.intervalMs]);

  return (
    <div className="min-h-screen bg-[#0b0d10] p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-blue-400 mb-2">
            PitchMirror Vision Harness
          </h1>
          <p className="text-gray-400">Real-time presentation feedback system</p>
        </header>

        {/* Controls */}
        <div className="mb-6 flex gap-4 items-center">
          {!isStarted ? (
            <button
              onClick={handleStart}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
            >
              Start Camera
            </button>
          ) : (
            <button
              onClick={handleStop}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition"
            >
              Stop Camera
            </button>
          )}

          {isStarted && (
            <button
              onClick={() => setShowOverlay(!showOverlay)}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition"
            >
              {showOverlay ? 'Hide' : 'Show'} Overlay
            </button>
          )}
        </div>

        {/* Error display */}
        {vision.error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
            <strong>Error:</strong> {vision.error}
          </div>
        )}

        {/* Main content grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: Video and overlay */}
          <div className="bg-gray-900/50 rounded-lg p-4">
            <h2 className="text-xl font-semibold text-gray-200 mb-4">Video Feed</h2>
            <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
              <video
                ref={vision.videoRef}
                className="w-full h-full object-contain"
                style={{ transform: 'scaleX(-1)' }}
                playsInline
                muted
                autoPlay
              />
              <canvas
                ref={overlayCanvasRef}
                className="absolute top-0 left-0 w-full h-full"
                style={{ transform: 'scaleX(-1)' }}
              />
              {!isStarted && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                  Camera not started
                </div>
              )}
            </div>
          </div>

          {/* Right: Scores and tips */}
          <div className="space-y-6">
            {/* Confidence score */}
            <div className="bg-gray-900/50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-200 mb-4">Confidence</h2>
              <div className="flex items-center justify-center">
                <div className="text-6xl font-bold text-blue-400">
                  {uiData.confidence}
                </div>
                <div className="text-2xl text-gray-400 ml-2">/100</div>
              </div>
            </div>

            {/* Subscores */}
            <div className="bg-gray-900/50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-200 mb-4">Subscores</h2>
              <div className="space-y-3">
                <ScoreBar label="Posture (P)" value={uiData.subScores.P} />
                <ScoreBar label="Eye Contact (E)" value={uiData.subScores.E} />
                <ScoreBar label="Smoothness (S)" value={uiData.subScores.S} />
                <ScoreBar label="Pacing (C)" value={uiData.subScores.C} />
              </div>
            </div>

            {/* Tips */}
            <div className="bg-gray-900/50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-200 mb-4">Tips</h2>
              {uiData.tips.length > 0 ? (
                <ul className="space-y-2">
                  {uiData.tips.map((tip, i) => (
                    <li key={i} className="text-gray-300 flex items-start gap-2">
                      <span className="text-blue-400">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No tips available</p>
              )}
            </div>

            {/* Debug panel */}
            <div className="bg-gray-900/50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-200 mb-4">Debug Info</h2>
              <div className="space-y-2 text-sm font-mono">
                <div className="flex justify-between">
                  <span className="text-gray-400">Detect Time:</span>
                  <span className="text-gray-200">{vision.debug.detectMs.toFixed(1)} ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Interval:</span>
                  <span className="text-gray-200">{vision.debug.intervalMs.toFixed(0)} ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">FPS:</span>
                  <span className="text-gray-200">
                    {vision.debug.intervalMs > 0 ? (1000 / vision.debug.intervalMs).toFixed(1) : '0'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Pose Count:</span>
                  <span className="text-gray-200">{vision.debug.poseCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Face Count:</span>
                  <span className="text-gray-200">{vision.debug.faceCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Pose OK:</span>
                  <span className={vision.debug.quality.poseOk ? 'text-green-400' : 'text-red-400'}>
                    {vision.debug.quality.poseOk ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Face OK:</span>
                  <span className={vision.debug.quality.faceOk ? 'text-green-400' : 'text-red-400'}>
                    {vision.debug.quality.faceOk ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Slow Path:</span>
                  <span className={vision.debug.slowPath ? 'text-yellow-400' : 'text-gray-200'}>
                    {vision.debug.slowPath ? 'Yes' : 'No'}
                  </span>
                </div>
                {scores?.debug && (
                  <>
                    {scores.debug.tiltDeg !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Tilt:</span>
                        <span className="text-gray-200">{scores.debug.tiltDeg.toFixed(1)}°</span>
                      </div>
                    )}
                    {scores.debug.breaksPerMin !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Gaze Breaks/Min:</span>
                        <span className="text-gray-200">{scores.debug.breaksPerMin}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Developer Tuning Panel */}
      <TuningPanel debugData={scores?.debug} />
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const percentage = Math.round(value * 100);
  const color =
    value >= 0.7 ? 'bg-green-500' : value >= 0.5 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-400">{label}</span>
        <span className="text-gray-200">{percentage}%</span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

