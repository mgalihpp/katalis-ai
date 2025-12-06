'use client';

import { Package, AlertTriangle } from 'lucide-react';
import { cn, formatRupiah } from '@/lib/utils';
import type { StockItem } from '@/types';

interface StockCardProps {
  stock: StockItem;
  onClick?: () => void;
}

export function StockCard({ stock, onClick }: StockCardProps) {
  const isLowStock = stock.quantity <= stock.min_stock;
  const isOutOfStock = stock.quantity === 0;

  return (
    <div
      onClick={onClick}
      className="bg-muted/30 rounded-2xl p-4 active:bg-muted/50 transition-colors cursor-pointer"
    >
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
          isOutOfStock ? 'bg-destructive/10' : isLowStock ? 'bg-accent/10' : 'bg-primary/10'
        )}>
          {isLowStock ? (
            <AlertTriangle className={cn('w-5 h-5', isOutOfStock ? 'text-destructive' : 'text-accent')} />
          ) : (
            <Package className="w-5 h-5 text-primary" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] font-semibold text-foreground capitalize truncate">{stock.name}</h3>
          <p className="text-sm text-muted-foreground">
            {stock.sell_per_unit ? formatRupiah(stock.sell_per_unit) : stock.unit}
          </p>
        </div>

        {/* Quantity */}
        <div className="text-right">
          <p className={cn(
            'text-xl font-bold',
            isOutOfStock ? 'text-destructive' : isLowStock ? 'text-accent' : 'text-foreground'
          )}>
            {stock.quantity}
          </p>
          <p className="text-xs text-muted-foreground">
            {isOutOfStock ? 'Habis' : isLowStock ? 'Rendah' : stock.unit}
          </p>
        </div>
      </div>
    </div>
  );
}
