'use client';

import { useState } from 'react';
import { Minus, Plus, RefreshCw, ShoppingCart } from 'lucide-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CurrencyInput } from '@/components/ui/currency-input';
import { cn } from '@/lib/utils';
import { createRippleEffect } from '@/hooks/useRipple';
import { formatRupiah } from '@/lib/utils';
import type { StockItem } from '@/types';

type Mode = 'adjustment' | 'purchase';

interface StockAdjustDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    stock: StockItem;
    adjustData: { quantity: number; reason: string };
    setAdjustData: React.Dispatch<React.SetStateAction<{ quantity: number; reason: string }>>;
    error: string;
    onAdjust: () => void;
    onPurchase?: (qty: number, pricePerPack: number, note: string) => void;
}

export function StockAdjustDrawer({
    isOpen,
    onClose,
    stock,
    adjustData,
    setAdjustData,
    error,
    onAdjust,
    onPurchase,
}: StockAdjustDrawerProps) {
    const [mode, setMode] = useState<Mode>('adjustment');
    const [purchaseQty, setPurchaseQty] = useState(1);
    const [purchasePrice, setPurchasePrice] = useState(stock.modal_per_pack || 0);
    const [purchaseNote, setPurchaseNote] = useState('');
    const [purchaseError, setPurchaseError] = useState('');

    const quickAdjustValues = [-10, -5, +5, +10];
    const packUnit = stock.pack_unit || stock.unit || 'pack';
    const totalPurchase = purchaseQty * purchasePrice;

    const handlePurchaseSubmit = () => {
        setPurchaseError('');
        if (purchaseQty <= 0) {
            setPurchaseError('Jumlah harus lebih dari 0');
            return;
        }
        if (purchasePrice <= 0) {
            setPurchaseError('Harga harus lebih dari 0');
            return;
        }
        if (onPurchase) {
            onPurchase(purchaseQty, purchasePrice, purchaseNote);
        }
    };

    const handleClose = () => {
        setMode('adjustment');
        setPurchaseQty(1);
        setPurchasePrice(stock.modal_per_pack || 0);
        setPurchaseNote('');
        setPurchaseError('');
        onClose();
    };

    return (
        <Drawer open={isOpen} onOpenChange={handleClose}>
            <DrawerContent className="max-h-[90dvh]">
                <div className="mx-auto w-full max-w-lg flex flex-col overflow-hidden" style={{ maxHeight: '90dvh' }}>

                    <DrawerHeader className="text-center shrink-0">
                        {/* Mode Toggle Tabs */}
                        <div className="flex bg-muted rounded-xl p-1 mb-4">
                            <button
                                type="button"
                                onClick={() => setMode('adjustment')}
                                className={cn(
                                    'flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all',
                                    mode === 'adjustment'
                                        ? 'bg-background text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground'
                                )}
                            >
                                <RefreshCw className="w-4 h-4 inline mr-2" />
                                Penyesuaian
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode('purchase')}
                                className={cn(
                                    'flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all',
                                    mode === 'purchase'
                                        ? 'bg-background text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground'
                                )}
                            >
                                <ShoppingCart className="w-4 h-4 inline mr-2" />
                                Pembelian
                            </button>
                        </div>

                        <div className={cn(
                            'w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2',
                            mode === 'adjustment' ? 'bg-primary/10' : 'bg-primary/10'
                        )}>
                            {mode === 'adjustment'
                                ? <RefreshCw className="w-6 h-6 text-primary" />
                                : <ShoppingCart className="w-6 h-6 text-primary" />
                            }
                        </div>
                        <DrawerTitle>
                            {mode === 'adjustment' ? 'Sesuaikan Stok' : 'Pembelian Langsung'}
                        </DrawerTitle>
                        <p className="text-sm text-muted-foreground">
                            Stok saat ini: <span className="font-semibold text-foreground">{stock.quantity} {packUnit}</span>
                            {stock.small_unit_quantity !== null && (
                                <span className="text-muted-foreground"> ({stock.small_unit_quantity} {stock.unit_unit || 'pcs'})</span>
                            )}
                        </p>
                    </DrawerHeader>

                    <div className="flex-1 overflow-y-auto min-h-0 py-4">
                        {mode === 'adjustment' ? (
                            /* ADJUSTMENT MODE */
                            <div className="px-6 space-y-4 py-4 pb-0">
                                {/* Quantity Adjuster */}
                                <div className="flex items-center justify-center gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setAdjustData((prev) => ({ ...prev, quantity: Math.max(0, prev.quantity - 1) }))}
                                        onMouseDown={createRippleEffect}
                                        className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center text-foreground hover:bg-muted/80 active:scale-95 transition-transform ripple"
                                    >
                                        <Minus className="w-6 h-6 pointer-events-none" />
                                    </button>
                                    <div className="text-center min-w-[100px]">
                                        <p className="text-4xl font-bold text-foreground">{adjustData.quantity}</p>
                                        <p className="text-sm text-muted-foreground">{packUnit}</p>
                                        {adjustData.quantity !== stock.quantity && (
                                            <p className={cn('text-sm font-medium mt-1', adjustData.quantity > stock.quantity ? 'text-success' : 'text-destructive')}>
                                                {adjustData.quantity > stock.quantity ? '+' : ''}{adjustData.quantity - stock.quantity}
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setAdjustData((prev) => ({ ...prev, quantity: prev.quantity + 1 }))}
                                        onMouseDown={createRippleEffect}
                                        className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center text-foreground hover:bg-muted/80 active:scale-95 transition-transform ripple"
                                    >
                                        <Plus className="w-6 h-6 pointer-events-none" />
                                    </button>
                                </div>

                                {/* Quick Adjust Presets */}
                                <div className="flex justify-center gap-2">
                                    {quickAdjustValues.map((delta) => (
                                        <button
                                            type="button"
                                            key={delta}
                                            onClick={() => setAdjustData((prev) => ({ ...prev, quantity: Math.max(0, prev.quantity + delta) }))}
                                            onMouseDown={createRippleEffect}
                                            className={cn(
                                                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ripple',
                                                delta < 0 ? 'bg-destructive/10 text-destructive hover:bg-destructive/20' : 'bg-success/10 text-success hover:bg-success/20'
                                            )}
                                        >
                                            {delta > 0 ? '+' : ''}{delta}
                                        </button>
                                    ))}
                                </div>

                                {/* Reason Input */}
                                <div>
                                    <Label className={cn('text-xs text-muted-foreground', error && 'text-red-500')}>Alasan</Label>
                                    <Input
                                        value={adjustData.reason}
                                        onChange={(e) => setAdjustData((prev) => ({ ...prev, reason: e.target.value }))}
                                        placeholder="Contoh: Koreksi stok, rusak..."
                                        className={cn('mt-1 bg-muted/50', error && 'border-red-500')}
                                    />
                                    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
                                </div>
                            </div>
                        ) : (
                            /* PURCHASE MODE */
                            <div className="px-6 space-y-4 py-4 pb-0">
                                {/* Quantity to Purchase */}
                                <div className="flex items-center justify-center gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setPurchaseQty(Math.max(1, purchaseQty - 1))}
                                        onMouseDown={createRippleEffect}
                                        className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center text-foreground hover:bg-muted/80 active:scale-95 transition-transform ripple"
                                    >
                                        <Minus className="w-6 h-6 pointer-events-none" />
                                    </button>
                                    <div className="text-center min-w-[100px]">
                                        <p className="text-4xl font-bold text-foreground">{purchaseQty}</p>
                                        <p className="text-sm text-muted-foreground">{packUnit}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setPurchaseQty(purchaseQty + 1)}
                                        onMouseDown={createRippleEffect}
                                        className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center text-foreground hover:bg-muted/80 active:scale-95 transition-transform ripple"
                                    >
                                        <Plus className="w-6 h-6 pointer-events-none" />
                                    </button>
                                </div>

                                {/* Quick Add Presets */}
                                <div className="flex justify-center gap-2">
                                    {[1, 2, 5, 10].map((qty) => (
                                        <button
                                            type="button"
                                            key={qty}
                                            onClick={() => setPurchaseQty(qty)}
                                            onMouseDown={createRippleEffect}
                                            className={cn(
                                                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ripple',
                                                purchaseQty === qty
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-primary/10 text-primary hover:bg-primary/20'
                                            )}
                                        >
                                            {qty}
                                        </button>
                                    ))}
                                </div>

                                {/* Price Input */}
                                <div>
                                    <Label className={cn('text-xs text-muted-foreground', purchaseError && 'text-red-500')}>Harga per {packUnit}</Label>
                                    <CurrencyInput
                                        value={purchasePrice}
                                        onChange={(val) => {
                                            setPurchasePrice(Math.max(0, val));
                                            if (purchaseError) setPurchaseError('');
                                        }}
                                        className={cn('mt-1 bg-muted/50', purchaseError && 'border-red-500')}
                                    />
                                    {purchaseError && <p className="text-xs text-red-500 mt-1">{purchaseError}</p>}
                                </div>

                                {/* Total */}
                                <div className="p-4 bg-primary/10 rounded-xl">
                                    <p className="text-xs text-muted-foreground mb-1">Total Pembelian</p>
                                    <p className="text-2xl font-bold text-primary">{formatRupiah(totalPurchase)}</p>
                                </div>

                                {/* Note Input */}
                                <div>
                                    <Label className="text-xs text-muted-foreground">Catatan (opsional)</Label>
                                    <Input
                                        value={purchaseNote}
                                        onChange={(e) => setPurchaseNote(e.target.value)}
                                        placeholder="Catatan pembelian / supplier..."
                                        className="mt-1 bg-muted/50"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <DrawerFooter className="shrink-0 py-4 pb-8 border-t border-border bg-background">
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={handleClose}
                                onMouseDown={createRippleEffect}
                                className="flex-1 px-6 py-3.5 bg-muted text-muted-foreground rounded-xl font-medium ripple"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={mode === 'adjustment' ? onAdjust : handlePurchaseSubmit}
                                onMouseDown={createRippleEffect}
                                className={cn(
                                    'flex-1 px-6 py-3.5 rounded-xl font-medium ripple bg-primary text-primary-foreground',
                                )}
                            >
                                {mode === 'adjustment' ? 'Simpan' : 'Beli'}
                            </button>
                        </div>
                    </DrawerFooter>
                </div>
            </DrawerContent>
        </Drawer>
    );
}
