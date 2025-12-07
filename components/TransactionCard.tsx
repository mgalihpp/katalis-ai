import { TrendingUp, ShoppingCart, UserPlus, CheckCircle, Tag } from 'lucide-react';
import { cn, formatRupiah, formatRelativeTime, formatTransactionType } from '@/lib/utils';
import type { Transaction } from '@/types';

interface TransactionCardProps {
  transaction: Transaction;
  onClick?: () => void;
}

const typeConfig = {
  sale: {
    icon: TrendingUp,
    badgeClass: 'badge-sale',
    amountClass: 'text-sale',
    prefix: '+',
  },
  purchase: {
    icon: ShoppingCart,
    badgeClass: 'badge-purchase',
    amountClass: 'text-purchase',
    prefix: '-',
  },
  debt_add: {
    icon: UserPlus,
    badgeClass: 'badge-debt',
    amountClass: 'text-debt',
    prefix: '',
  },
  debt_payment: {
    icon: CheckCircle,
    badgeClass: 'badge-payment',
    amountClass: 'text-success',
    prefix: '+',
  },
  stock_add: {
    icon: ShoppingCart, // Fallback icon
    badgeClass: 'badge-stock',
    amountClass: 'text-primary',
    prefix: '',
  },
  stock_check: {
    icon: ShoppingCart, // Fallback icon
    badgeClass: 'badge-stock',
    amountClass: 'text-muted-foreground',
    prefix: '',
  },
  price_update: {
    icon: Tag,
    badgeClass: 'badge-info',
    amountClass: 'text-info',
    prefix: '',
  },
};

export function TransactionCard({ transaction, onClick }: TransactionCardProps) {
  const config = typeConfig[transaction.type];
  const Icon = config.icon;

  // Get primary item or note to display
  const primaryText = transaction.items.length > 0
    ? transaction.items.map(item => {
      if (item.quantity && item.unit) {
        return `${item.item_name} ${item.quantity} ${item.unit}`;
      }
      return item.item_name;
    }).join(', ')
    : transaction.note || transaction.raw_text;

  return (
    <div
      className="card-transaction cursor-pointer"
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={cn(
          'flex items-center justify-center w-10 h-10 rounded-xl',
          config.badgeClass.replace('badge-', 'bg-') + '/20'
        )}>
          <Icon className={cn('w-5 h-5', config.amountClass)} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn('badge-type', config.badgeClass)}>
              {formatTransactionType(transaction.type)}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(transaction.created_at)}
            </span>
          </div>

          <p className="text-sm text-foreground font-medium truncate">
            {primaryText}
          </p>
        </div>

        {/* Amount */}
        <div className="text-right">
          <p className={cn('text-base font-bold', config.amountClass)}>
            {config.prefix}{formatRupiah(transaction.total_amount)}
          </p>
        </div>
      </div>
    </div>
  );
}
