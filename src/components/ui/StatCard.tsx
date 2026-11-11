import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
    neutral?: boolean;
  };
  highlightColor?: 'default' | 'emerald' | 'amber' | 'red' | 'blue';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  highlightColor = 'default',
}) => {
  let valueColor = 'text-slate-900';
  if (highlightColor === 'emerald') valueColor = 'text-emerald-700';
  if (highlightColor === 'amber') valueColor = 'text-amber-700';
  if (highlightColor === 'red') valueColor = 'text-red-700';
  if (highlightColor === 'blue') valueColor = 'text-blue-700';

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs transition-shadow hover:shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</span>
        {icon && <div className="text-slate-400 p-1.5 bg-slate-50 rounded">{icon}</div>}
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-2">
        <span className={`text-2xl font-bold tracking-tight font-mono tabular-nums ${valueColor}`}>
          {value}
        </span>
        {trend && (
          <span
            className={`text-xs font-medium tabular-nums ${
              trend.neutral
                ? 'text-slate-500'
                : trend.isPositive
                ? 'text-emerald-600'
                : 'text-red-600'
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>

      {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
    </div>
  );
};
