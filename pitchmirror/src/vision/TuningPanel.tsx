import { useState, useEffect } from 'react';
import { THRESHOLDS } from './features';

interface TuningPanelProps {
  debugData?: {
    tiltDeg?: number;
    breaksPerMin?: number;
    velStd?: number;
    unitsPerSec?: number;
  };
}

/**
 * Developer tuning panel for adjusting thresholds
 * Only shown in development mode
 */
export function TuningPanel({ debugData }: TuningPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [thresholds, setThresholds] = useState(() => {
    const stored = localStorage.getItem('pitchmirror_thresholds');
    return stored ? JSON.parse(stored) : { ...THRESHOLDS };
  });

  // Apply thresholds to the THRESHOLDS object
  useEffect(() => {
    Object.assign(THRESHOLDS, thresholds);
    localStorage.setItem('pitchmirror_thresholds', JSON.stringify(thresholds));
  }, [thresholds]);

  const handleReset = () => {
    const defaults = {
      postureMaxTiltDeg: 12,
      eyeMaxOffCenterDeg: 10,
      eyeMaxBreaksPerMin: 12,
      smoothMaxStd: 0.025,
      paceMaxUnitsPerSec: 0.08,
    };
    setThresholds(defaults);
  };

  if (!import.meta.env.DEV) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg shadow-lg transition"
        >
          ⚙️ Dev Tuning
        </button>
      ) : (
        <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-xl p-4 w-96 max-h-[600px] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-white">Dev Tuning Panel</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            {/* Posture Max Tilt */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Posture Max Tilt (deg)
              </label>
              <input
                type="range"
                min="5"
                max="30"
                step="1"
                value={thresholds.postureMaxTiltDeg}
                onChange={(e) =>
                  setThresholds({ ...thresholds, postureMaxTiltDeg: Number(e.target.value) })
                }
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>{thresholds.postureMaxTiltDeg}°</span>
                {debugData?.tiltDeg !== undefined && (
                  <span className="text-blue-400">Current: {debugData.tiltDeg.toFixed(1)}°</span>
                )}
              </div>
            </div>

            {/* Eye Max Off Center */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Eye Max Off Center (deg)
              </label>
              <input
                type="range"
                min="5"
                max="30"
                step="1"
                value={thresholds.eyeMaxOffCenterDeg}
                onChange={(e) =>
                  setThresholds({ ...thresholds, eyeMaxOffCenterDeg: Number(e.target.value) })
                }
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>{thresholds.eyeMaxOffCenterDeg}°</span>
              </div>
            </div>

            {/* Eye Max Breaks Per Min */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Eye Max Breaks/Min
              </label>
              <input
                type="range"
                min="5"
                max="30"
                step="1"
                value={thresholds.eyeMaxBreaksPerMin}
                onChange={(e) =>
                  setThresholds({ ...thresholds, eyeMaxBreaksPerMin: Number(e.target.value) })
                }
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>{thresholds.eyeMaxBreaksPerMin}</span>
                {debugData?.breaksPerMin !== undefined && (
                  <span className="text-blue-400">Current: {debugData.breaksPerMin}</span>
                )}
              </div>
            </div>

            {/* Smooth Max Std */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Smooth Max Std Dev
              </label>
              <input
                type="range"
                min="0.01"
                max="0.1"
                step="0.005"
                value={thresholds.smoothMaxStd}
                onChange={(e) =>
                  setThresholds({ ...thresholds, smoothMaxStd: Number(e.target.value) })
                }
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>{thresholds.smoothMaxStd.toFixed(3)}</span>
                {debugData?.velStd !== undefined && (
                  <span className="text-blue-400">Current: {debugData.velStd.toFixed(3)}</span>
                )}
              </div>
            </div>

            {/* Pace Max Units Per Sec */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Pace Max Units/Sec
              </label>
              <input
                type="range"
                min="0.02"
                max="0.2"
                step="0.01"
                value={thresholds.paceMaxUnitsPerSec}
                onChange={(e) =>
                  setThresholds({ ...thresholds, paceMaxUnitsPerSec: Number(e.target.value) })
                }
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>{thresholds.paceMaxUnitsPerSec.toFixed(2)}</span>
                {debugData?.unitsPerSec !== undefined && (
                  <span className="text-blue-400">
                    Current: {debugData.unitsPerSec.toFixed(2)}
                  </span>
                )}
              </div>
            </div>

            {/* Reset button */}
            <button
              onClick={handleReset}
              className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded transition"
            >
              Reset to Defaults
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

