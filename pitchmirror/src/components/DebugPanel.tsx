import { EvaluateResult } from '../lib/types';

export interface DebugPanelProps {
  fps: number;
  quality: { poseOk: boolean; faceOk: boolean } | null;
  isMock: boolean;
  features: EvaluateResult["features"] | null;
}

/**
 * DebugPanel - Dev/QA overlay (toggled with D key)
 * 
 * Shows FPS, quality flags, mock status, and raw features
 * Minimal, non-intrusive design
 */
export default function DebugPanel({ fps, quality, isMock, features }: DebugPanelProps) {
  return (
    <div className="fixed bottom-4 left-4 z-30 bg-zinc-900/95 border border-zinc-700/50 rounded-xl p-4 text-xs font-mono max-w-xs shadow-xl">
      <h3 className="text-neon-green font-bold mb-3 uppercase tracking-wider">
        Debug Panel
      </h3>
      
      <div className="space-y-2">
        {/* FPS */}
        <div className="flex justify-between">
          <span className="text-zinc-500">FPS:</span>
          <span className={fps > 8 ? 'text-neon-green' : 'text-yellow-400'}>
            {fps}
          </span>
        </div>

        {/* Mode */}
        <div className="flex justify-between">
          <span className="text-zinc-500">Mode:</span>
          <span className={isMock ? 'text-yellow-400' : 'text-neon-green'}>
            {isMock ? 'MOCK' : 'LIVE'}
          </span>
        </div>

        {/* Quality */}
        {quality && (
          <>
            <div className="flex justify-between">
              <span className="text-zinc-500">Pose:</span>
              <span className={quality.poseOk ? 'text-neon-green' : 'text-red-400'}>
                {quality.poseOk ? '✓ OK' : '✗ BAD'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Face:</span>
              <span className={quality.faceOk ? 'text-neon-green' : 'text-red-400'}>
                {quality.faceOk ? '✓ OK' : '✗ BAD'}
              </span>
            </div>
          </>
        )}

        {/* Features */}
        {features && (
          <>
            <div className="border-t border-zinc-800 my-2 pt-2">
              <div className="text-zinc-400 font-bold mb-1">Features:</div>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Posture°:</span>
              <span className="text-zinc-300">{features.postureAngleDeg.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Sway σ:</span>
              <span className="text-zinc-300">{features.swaySigma.toFixed(3)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Gaze°:</span>
              <span className="text-zinc-300">{features.gazeDevDeg.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Gaze brk/m:</span>
              <span className="text-zinc-300">{features.gazeBreaksPerMin.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Wrist σ:</span>
              <span className="text-zinc-300">{features.wristVelStd.toFixed(3)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Torso spd:</span>
              <span className="text-zinc-300">{features.torsoSpeed.toFixed(3)}</span>
            </div>
          </>
        )}
      </div>

      <div className="mt-3 pt-2 border-t border-zinc-800 text-zinc-600 text-center">
        Press D to toggle
      </div>
    </div>
  );
}

