'use client';

import { ArrowUp, ArrowDown, RefreshCw, TrendingUp, TrendingDown, AlertTriangle, History } from 'lucide-react';
import { cn, formatRupiah, formatRelativeTime } from '@/lib/utils';
import { createRippleEffect } from '@/hooks/useRipple';
import type { StockItem, StockMovement } from '@/types';

interface StockQuantityCardProps {
    stock: StockItem;
    statusBg: string;
    statusText: string;
    isLowStock: boolean;
    isOutOfStock: boolean;
}

export function StockQuantityCard({ stock, statusBg, statusText, isLowStock, isOutOfStock }: StockQuantityCardProps) {
    return (
        <div className={cn('p-5 rounded-2xl text-center', statusBg)}>
            <p className="text-sm text-muted-foreground mb-1">Jumlah Stok</p>
            <p className={cn('text-4xl font-bold', statusText)}>{stock.quantity}</p>
            <p className="text-sm text-muted-foreground">{stock.unit}</p>
            {isOutOfStock && (
                <div className="flex items-center justify-center gap-1 mt-2 text-destructive">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm font-medium">Stok Habis!</span>
                </div>
            )}
            {isLowStock && !isOutOfStock && (
                <div className="flex items-center justify-center gap-1 mt-2 text-accent">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm font-medium">Stok Rendah</span>
                </div>
            )}
        </div>
    );
}

export function AdjustStockButton({ onClick }: { onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            onMouseDown={createRippleEffect}
            className="w-full flex items-center justify-center gap-2 py-3 bg-muted rounded-xl text-foreground font-medium hover:bg-muted/80 ripple"
        >
            <RefreshCw className="w-4 h-4" />
            Sesuaikan Stok
        </button>
    );
}

export function PriceCards({ stock }: { stock: StockItem }) {
    return (
        <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-muted/50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="w-4 h-4 text-purchase" />
                    <span className="text-xs text-muted-foreground">Harga Beli</span>
                </div>
                <p className="text-lg font-bold text-foreground">
                    {stock.buy_price ? formatRupiah(stock.buy_price) : '-'}
                </p>
            </div>
            <div className="p-4 bg-muted/50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-success" />
                    <span className="text-xs text-muted-foreground">Harga Jual</span>
                </div>
                <p className="text-lg font-bold text-foreground">
                    {stock.sell_price ? formatRupiah(stock.sell_price) : '-'}
                </p>
            </div>
        </div>
    );
}

export function ProfitMargin({ stock }: { stock: StockItem }) {
    if (!stock.buy_price || !stock.sell_price) return null;

    return (
        <div className="p-4 bg-success/10 rounded-xl">
            <p className="text-xs text-muted-foreground mb-1">Margin Keuntungan</p>
            <p className="text-xl font-bold text-success">
                {formatRupiah(stock.sell_price - stock.buy_price)}
                <span className="text-sm font-normal text-muted-foreground"> / {stock.unit}</span>
            </p>
        </div>
    );
}

export function MinStockInfo({ stock }: { stock: StockItem }) {
    return (
        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
            <span className="text-sm text-muted-foreground">Stok Minimum</span>
            <span className="font-medium text-foreground">{stock.min_stock} {stock.unit}</span>
        </div>
    );
}

export function MovementHistory({ movements }: { movements: StockMovement[] }) {
    return (
        <div>
            <div className="flex items-center gap-2 mb-3">
                <History className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-medium text-muted-foreground">Riwayat Pergerakan</h3>
            </div>
            {movements.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4 bg-muted/30 rounded-xl">
                    Belum ada riwayat pergerakan
                </p>
            ) : (
                <div className="space-y-2">
                    {movements.map((m) => (
                        <div key={m.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                            <div className={cn(
                                'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                                m.type === 'in' ? 'bg-success/10' : m.type === 'out' ? 'bg-destructive/10' : 'bg-muted'
                            )}>
                                {m.type === 'in' ? (
                                    <ArrowUp className="w-4 h-4 text-success" />
                                ) : m.type === 'out' ? (
                                    <ArrowDown className="w-4 h-4 text-destructive" />
                                ) : (
                                    <RefreshCw className="w-4 h-4 text-muted-foreground" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{m.reason}</p>
                                <p className="text-xs text-muted-foreground">{formatRelativeTime(m.created_at)}</p>
                            </div>
                            <span className={cn(
                                'text-sm font-bold shrink-0',
                                m.type === 'in' ? 'text-success' : m.type === 'out' ? 'text-destructive' : 'text-foreground'
                            )}>
                                {m.type === 'in' ? '+' : m.type === 'out' ? '-' : ''}
                                {Math.abs(m.quantity)}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
