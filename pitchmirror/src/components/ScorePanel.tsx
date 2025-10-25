export interface ScorePanelProps {
  overall: number | null;
}

/**
 * ScorePanel - Large confidence score display (0-100)
 * 
 * Features neon styling with glow effect
 * Shows "--" when score is null
 */
export default function ScorePanel({ overall }: ScorePanelProps) {
  const displayScore = overall !== null ? Math.round(overall) : '--';
  
  // Color based on score
  const getColor = () => {
    if (overall === null) return 'text-zinc-500';
    if (overall >= 80) return 'text-neon-green';
    if (overall >= 60) return 'text-neon-blue';
    if (overall >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="bg-zinc-900/50 border border-zinc-700/50 rounded-2xl p-8 flex flex-col items-center justify-center">
      <h2 className="text-zinc-400 text-sm uppercase tracking-wider mb-4">
        Confidence Score
      </h2>
      
      <div className={`text-8xl font-bold ${getColor()} score-glow transition-colors duration-500`}>
        {displayScore}
      </div>
      
      {overall !== null && (
        <div className="text-zinc-500 text-sm mt-2">/ 100</div>
      )}
      
      {overall === null && (
        <div className="text-zinc-600 text-sm mt-4">
          Analyzing...
        </div>
      )}
    </div>
  );
}

