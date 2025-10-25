export interface SubscoreBarProps {
  label: string;   // "P", "E", "S", "C"
  title?: string;  // "Presence", etc.
  value: number;   // 0..1
}

/**
 * SubscoreBar - Single animated bar for subscores
 * 
 * Color coded: red (<0.5), amber (0.5-0.7), green (>0.7)
 * Animated width transitions
 */
export default function SubscoreBar({ label, title, value }: SubscoreBarProps) {
  // Clamp value between 0 and 1
  const clampedValue = Math.max(0, Math.min(1, value));
  const percentage = Math.round(clampedValue * 100);
  
  // Color based on value
  const getColor = () => {
    if (clampedValue >= 0.7) return 'bg-neon-green';
    if (clampedValue >= 0.5) return 'bg-yellow-400';
    return 'bg-red-400';
  };

  const getTextColor = () => {
    if (clampedValue >= 0.7) return 'text-neon-green';
    if (clampedValue >= 0.5) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="bg-zinc-900/30 border border-zinc-700/30 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`text-lg font-bold ${getTextColor()}`}>
            {label}
          </span>
          {title && (
            <span className="text-sm text-zinc-500">
              {title}
            </span>
          )}
        </div>
        <span className={`text-sm font-medium ${getTextColor()}`}>
          {percentage}%
        </span>
      </div>
      
      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full subscore-bar ${getColor()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

