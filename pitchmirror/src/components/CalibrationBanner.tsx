export interface CalibrationBannerProps {
  visible: boolean;
}

/**
 * CalibrationBanner - Overlay shown during CALIBRATING phase (~3s)
 * 
 * Provides setup instructions to user
 */
export default function CalibrationBanner({ visible }: CalibrationBannerProps) {
  if (!visible) return null;

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-8 max-w-md mx-4 shadow-2xl">
        <div className="text-center">
          <div className="text-4xl mb-4">📹</div>
          <h2 className="text-2xl font-bold text-zinc-100 mb-4">
            Calibrating...
          </h2>
          <div className="space-y-2 text-zinc-400">
            <p>✓ Center yourself in the frame</p>
            <p>✓ Check your lighting</p>
            <p>✓ Camera at eye level</p>
          </div>
          <div className="mt-6">
            <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
              <div className="h-full bg-neon-blue animate-pulse-glow" style={{ width: '100%' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

