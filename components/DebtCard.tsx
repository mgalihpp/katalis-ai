"use client";

import { HandCoins, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { cn, formatRupiah } from '@/lib/utils';
import type { Debt } from '@/types';

interface DebtCardProps {
  debt: Debt;
  onClick?: () => void;
}

const statusConfig = {
  pending: {
    icon: AlertTriangle,
    label: 'Belum Bayar',
    color: 'text-debt',
    bg: 'bg-debt/10',
  },
  partial: {
    icon: Clock,
    label: 'Sebagian',
    color: 'text-accent',
    bg: 'bg-accent/10',
  },
  paid: {
    icon: CheckCircle,
    label: 'Lunas',
    color: 'text-success',
    bg: 'bg-success/10',
  },
};

export function DebtCard({ debt, onClick }: DebtCardProps) {
  const config = statusConfig[debt.status];
  const StatusIcon = config.icon;
  const progressPercent = (debt.paid_amount / debt.total_amount) * 100;

  return (
    <div
      onClick={onClick}
      className="bg-muted/30 rounded-2xl p-4 active:bg-muted/50 transition-colors cursor-pointer"
    >
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
          config.bg
        )}>
          <HandCoins className={cn('w-5 h-5', config.color)} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-[15px] font-semibold text-foreground truncate">{debt.debtor_name}</h3>
            <span className={cn(
              'text-xs font-medium flex items-center gap-1 shrink-0 ml-2',
              config.color
            )}>
              <StatusIcon className="w-3 h-3" />
              {config.label}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mb-2">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                debt.status === 'paid' ? 'bg-success' : debt.status === 'partial' ? 'bg-accent' : 'bg-debt'
              )}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Amount Info */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {formatRupiah(debt.paid_amount)} dibayar
            </span>
            <span className={cn('font-bold', config.color)}>
              {formatRupiah(debt.remaining_amount)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
