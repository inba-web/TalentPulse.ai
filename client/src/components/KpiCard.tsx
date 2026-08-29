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
    blue: 'bg-gradient-primary text-white glow-primary',
    emerald: 'bg-gradient-growth text-white glow-growth',
    amber: 'bg-gradient-action text-white glow-action',
    rose: 'bg-error/10 text-error',
    indigo: 'bg-gradient-primary text-white glow-primary',
    cyan: 'bg-gradient-primary text-white glow-primary',
  };

  return (
    <div className="bg-surface-1 p-6 rounded border border-border-primary flex items-center justify-between hover:border-border-hover transition duration-200">
      <div className="space-y-1">
        <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{title}</span>
        <div className="text-xl font-extrabold text-text-primary tracking-tight">{value}</div>
        
        {trend && (
          <div className="flex items-center gap-1.5 text-xs">
            <span className={`font-bold ${trend.positive ? 'text-success' : 'text-danger'}`}>
              {trend.value}
            </span>
            <span className="text-text-muted font-medium">from last drive</span>
          </div>
        )}
        
        {description && !trend && (
          <div className="text-[11px] text-text-muted font-medium">{description}</div>
        )}
      </div>

      <div className={`p-3 rounded ${colors[color] || colors.blue}`}>
        <Icon className="w-5 h-5 flex-shrink-0" />
      </div>
    </div>
  );
}
