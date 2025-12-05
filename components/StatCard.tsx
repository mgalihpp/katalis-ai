"use client";

import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn, formatRupiah } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string;
  progress?: {
    current: number;
    target: number;
  };
  variant?: 'default' | 'success' | 'warning' | 'sale' | 'purchase' | 'debt' | 'danger';
  isCurrency?: boolean;
  compact?: boolean;
  fullWidth?: boolean;
}

const variantStyles = {
  default: {
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    progressBg: 'bg-primary',
  },
  success: {
    iconBg: 'bg-success/10',
    iconColor: 'text-success',
    progressBg: 'bg-success',
  },
  warning: {
    iconBg: 'bg-accent/10',
    iconColor: 'text-accent',
    progressBg: 'bg-accent',
  },
  sale: {
    iconBg: 'bg-success/10',
    iconColor: 'text-success',
    progressBg: 'bg-success',
  },
  purchase: {
    iconBg: 'bg-purchase/10',
    iconColor: 'text-purchase',
    progressBg: 'bg-purchase',
  },
  debt: {
    iconBg: 'bg-debt/10',
    iconColor: 'text-debt',
    progressBg: 'bg-debt',
  },
  danger: {
    iconBg: 'bg-destructive/10',
    iconColor: 'text-destructive',
    progressBg: 'bg-destructive',
  },
};

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  subtitle,
  progress,
  variant = 'default',
  isCurrency = true,
  compact = false,
  fullWidth = false,
}: StatCardProps) {
  const styles = variantStyles[variant];
  const progressPercent = progress ? Math.min((progress.current / progress.target) * 100, 100) : 0;

  // Format value with shorter format for small screens
  const formatValue = (val: number) => {
    if (!isCurrency) return val.toLocaleString('id-ID');
    return formatRupiah(val);
  };

  if (compact) {
    return (
      <div className={cn("bg-background rounded-2xl p-3", fullWidth && "col-span-2")}>
        <div className="flex items-center gap-2 mb-1.5">
          <div className={cn('p-1.5 rounded-lg', styles.iconBg)}>
            <Icon className={cn('w-4 h-4', styles.iconColor)} />
          </div>
          <p className="text-[11px] text-muted-foreground leading-tight">{title}</p>
        </div>
        <p className="text-base font-bold text-foreground">
          {formatValue(value)}
        </p>
      </div>
    );
  }

  return (
    <div className={cn("bg-background rounded-2xl p-3", fullWidth && "col-span-2")}>
      {/* Header: Icon + Trend */}
      <div className="flex items-start justify-between mb-2">
        <div className={cn('p-2 rounded-xl', styles.iconBg)}>
          <Icon className={cn('w-4 h-4', styles.iconColor)} />
        </div>
        {trend && (
          <div className={cn(
            'flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full',
            trend.isPositive ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
          )}>
            {trend.isPositive ? (
              <TrendingUp className="w-2.5 h-2.5" />
            ) : (
              <TrendingDown className="w-2.5 h-2.5" />
            )}
            {trend.isPositive ? '+' : ''}{trend.value}%
          </div>
        )}
      </div>

      {/* Title */}
      <p className="text-[11px] text-muted-foreground mb-0.5 leading-tight">{title}</p>

      {/* Value */}
      <p className="text-base font-bold text-foreground leading-tight">
        {formatValue(value)}
      </p>

      {/* Subtitle */}
      {subtitle && (
        <p className="text-[10px] text-muted-foreground mt-1">{subtitle}</p>
      )}

      {/* Progress Bar (optional) */}
      {progress && (
        <div className="mt-2">
          <div className="flex items-center justify-between text-[10px] mb-1">
            <span className="text-muted-foreground">Target: {formatRupiah(progress.target)}</span>
            <span className={cn('font-medium', styles.iconColor)}>{Math.round(progressPercent)}%</span>
          </div>
          <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-500', styles.progressBg)}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
