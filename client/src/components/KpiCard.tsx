import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: string;
    positive: boolean;
  };
  color?: 'blue' | 'emerald' | 'amber' | 'rose' | 'indigo' | 'cyan';
}

export default function KpiCard({ title, value, icon: Icon, description, trend, color = 'blue' }: KpiCardProps) {
  const colors = {
    blue: 'bg-primary/10 text-primary',
    emerald: 'bg-success/10 text-success',
    amber: 'bg-warning/10 text-warning',
    rose: 'bg-error/10 text-error',
    indigo: 'bg-primary/10 text-primary',
    cyan: 'bg-primary/10 text-primary',
  };

  return (
    <div className="bg-surface p-6 rounded-xl border border-border shadow-sm flex items-center justify-between hover:shadow-md hover:border-slate-300 transition duration-200">
      <div className="space-y-1">
        <span className="text-xs font-bold text-secondary uppercase tracking-wider">{title}</span>
        <div className="text-2xl font-extrabold text-text tracking-tight">{value}</div>
        
        {trend && (
          <div className="flex items-center gap-1.5 text-xs">
            <span className={`font-bold ${trend.positive ? 'text-success' : 'text-danger'}`}>
              {trend.value}
            </span>
            <span className="text-secondary font-medium">from last drive</span>
          </div>
        )}
        
        {description && !trend && (
          <div className="text-xs text-secondary font-medium">{description}</div>
        )}
      </div>

      <div className={`p-3.5 rounded-xl ${colors[color] || colors.blue}`}>
        <Icon className="w-6 h-6 flex-shrink-0" />
      </div>
    </div>
  );
}
