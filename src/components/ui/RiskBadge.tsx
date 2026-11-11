import React from 'react';
import { RiskLevel } from '../../types';

interface RiskBadgeProps {
  level: RiskLevel;
  score?: number;
  showScore?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, score, showScore = false }) => {
  let colorStyles = '';
  let dotColor = '';

  if (level === 'High') {
    colorStyles = 'text-red-700 bg-red-50 border border-red-200';
    dotColor = 'bg-red-600';
  } else if (level === 'Medium') {
    colorStyles = 'text-amber-700 bg-amber-50 border border-amber-200';
    dotColor = 'bg-amber-600';
  } else {
    colorStyles = 'text-emerald-700 bg-emerald-50 border border-emerald-200';
    dotColor = 'bg-emerald-600';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-medium tracking-tight ${colorStyles}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} aria-hidden="true" />
      <span>{level} Risk</span>
      {showScore && score !== undefined && (
        <>
          <span className="opacity-50">·</span>
          <span className="font-mono tabular-nums font-semibold">{score}</span>
        </>
      )}
    </span>
  );
};
