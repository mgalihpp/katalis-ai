'use client';

import { Banknote, ShoppingCart, HandCoins, Wallet, Package, Tag } from 'lucide-react';
import { cn, formatRupiah, formatRelativeTime, formatTransactionType } from '@/lib/utils';
import type { Transaction } from '@/types';
import { createRippleEffect } from '@/hooks/useRipple';

interface TransactionDetailCardProps {
  transaction: Transaction;
}

const typeConfig = {
  sale: {
    icon: Banknote,
    iconBg: 'bg-gradient-to-br from-success/20 to-success/5',
    iconColor: 'text-success',
    amountColor: 'text-success',
    prefix: '+',
  },
  purchase: {
    icon: ShoppingCart,
    iconBg: 'bg-gradient-to-br from-purchase/20 to-purchase/5',
    iconColor: 'text-purchase',
    amountColor: 'text-purchase',
    prefix: '-',
  },
  debt_add: {
    icon: HandCoins,
    iconBg: 'bg-gradient-to-br from-debt/20 to-debt/5',
    iconColor: 'text-debt',
    amountColor: 'text-debt',
    prefix: '',
  },
  debt_payment: {
    icon: Wallet,
    iconBg: 'bg-gradient-to-br from-success/20 to-success/5',
    iconColor: 'text-success',
    amountColor: 'text-success',
    prefix: '+',
  },
  stock_add: {
    icon: Package,
    iconBg: 'bg-gradient-to-br from-purchase/20 to-purchase/5',
    iconColor: 'text-purchase',
    amountColor: 'text-purchase',
    prefix: '-',
  },
  stock_check: {
    icon: Package,
    iconBg: 'bg-gradient-to-br from-muted-foreground/20 to-muted-foreground/5',
    iconColor: 'text-muted-foreground',
    amountColor: 'text-foreground',
    prefix: '',
  },
  price_update: {
    icon: Tag,
    iconBg: 'bg-gradient-to-br from-info/20 to-info/5',
    iconColor: 'text-info',
    amountColor: 'text-info',
    prefix: '',
  },
};

export function TransactionDetailCard({ transaction }: TransactionDetailCardProps) {
  const config = typeConfig[transaction.type] || typeConfig.sale;
  const Icon = config.icon;

  // Get primary item name for display
  const primaryItem = transaction.items[0];
  const itemCount = transaction.items.length;

  // For debt transactions, extract debtor name from raw_text
  const getDebtorName = () => {
    const text = transaction.raw_text || transaction.note || '';
    // Try to match "hutang Pak/Bu/Mas Name" pattern
    const hutangMatch = text.match(/hutang\s+((?:pak|bu|mas|mbak|ibu|bapak)\s+\w+)/i);
    if (hutangMatch) return hutangMatch[1];
    // Try to match name at start like "Pak Name ngutang"
    const startMatch = text.match(/^((?:pak|bu|mas|mbak|ibu|bapak)\s+\w+)/i);
    if (startMatch) return startMatch[1];
    // Fallback
    const nameMatch = text.match(/(?:pak|bu|mas|mbak|ibu|bapak)\s+\w+/i);
    return nameMatch?.[0] || null;
  };

  // Create display name based on transaction type
  let displayName: string;
  let subtitle: string;

  if (transaction.type === 'debt_add') {
    // For debt_add: show "Pak Lukman berhutang" as title
    const debtorName = getDebtorName();
    displayName = debtorName ? `${debtorName} berhutang` : 'Piutang Baru';
    // Subtitle shows items: "56 peti Telur" or "3 item"
    if (itemCount > 1) {
      subtitle = `${itemCount} item`;
    } else if (primaryItem?.quantity && primaryItem?.item_name) {
      subtitle = `${primaryItem.quantity} ${primaryItem.unit || 'pcs'} ${primaryItem.item_name}`;
    } else {
      subtitle = 'Piutang Baru';
    }
  } else if (transaction.type === 'debt_payment') {
    // For debt_payment: show "Pembayaran Pak Lukman" as title
    const debtorName = getDebtorName();
    displayName = debtorName ? `Pembayaran ${debtorName}` : 'Bayar Hutang';
    subtitle = 'Bayar Hutang';
  } else {
    // Original logic for other transaction types
    displayName = primaryItem?.item_name || formatTransactionType(transaction.type);
    subtitle = itemCount > 1
      ? `${itemCount} item`
      : (primaryItem?.quantity ? `${primaryItem.quantity} ${primaryItem.unit || 'pcs'}` : formatTransactionType(transaction.type));
  }

  return (
    <div
      className="flex items-center gap-4 active:bg-muted/50 transition-opacity bg-muted/30 rounded-2xl p-4 cursor-pointer ripple"
      onMouseDown={createRippleEffect}
    >
      {/* Icon with gradient background */}
      <div className={cn(
        'flex items-center justify-center w-11 h-11 rounded-2xl shrink-0',
        config.iconBg
      )}>
        <Icon className={cn('w-5 h-5', config.iconColor)} strokeWidth={2.5} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-semibold text-foreground truncate leading-tight">
          {displayName}
        </p>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          {subtitle}
        </p>
      </div>

      {/* Amount & Time */}
      <div className="text-right shrink-0">
        <p className={cn('text-[15px] font-bold', config.amountColor)}>
          {config.prefix}{formatRupiah(transaction.total_amount)}
        </p>
        <p className="text-[12px] text-muted-foreground mt-0.5">
          {formatRelativeTime(transaction.created_at)}
        </p>
      </div>
    </div>
  );
}
