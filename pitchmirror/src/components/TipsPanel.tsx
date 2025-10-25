import { useEffect, useState } from 'react';
import type { TipRule } from '../lib/types';

export interface TipsPanelProps {
  tips: TipRule[];  // length 0..2
}

/**
 * TipsPanel - Displays up to 2 coaching tips
 * 
 * Fade/slide animations for tip changes
 * Supportive, non-judgmental messaging
 */
export default function TipsPanel({ tips }: TipsPanelProps) {
  const [displayTips, setDisplayTips] = useState<TipRule[]>([]);

  useEffect(() => {
    // Smooth transition when tips change
    setDisplayTips(tips);
  }, [tips]);

  if (displayTips.length === 0) {
    return (
      <div className="bg-zinc-900/30 border border-zinc-700/30 rounded-2xl p-6">
        <h3 className="text-zinc-400 text-sm uppercase tracking-wider mb-3">
          Coaching Tips
        </h3>
        <div className="text-zinc-600 text-sm italic">
          You're doing great! Keep it up.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/30 border border-zinc-700/30 rounded-2xl p-6">
      <h3 className="text-zinc-400 text-sm uppercase tracking-wider mb-4">
        Coaching Tips
      </h3>
      
      <div className="space-y-3">
        {displayTips.map((tip, index) => (
          <div
            key={`${tip.id}-${index}`}
            className="animate-slide-in bg-zinc-800/50 border border-zinc-700/30 rounded-xl p-4 text-zinc-200 text-sm leading-relaxed"
          >
            {tip.message}
          </div>
        ))}
      </div>
    </div>
  );
}

