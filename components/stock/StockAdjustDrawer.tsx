'use client';

import { Minus, Plus, RefreshCw } from 'lucide-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { createRippleEffect } from '@/hooks/useRipple';
import type { StockItem } from '@/types';

interface StockAdjustDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    stock: StockItem;
    adjustData: { quantity: number; reason: string };
    setAdjustData: React.Dispatch<React.SetStateAction<{ quantity: number; reason: string }>>;
    error: string;
    onAdjust: () => void;
}

export function StockAdjustDrawer({
    isOpen,
    onClose,
    stock,
    adjustData,
    setAdjustData,
    error,
    onAdjust,
}: StockAdjustDrawerProps) {
    const quickAdjustValues = [-10, -5, +5, +10];

    return (
        <Drawer open={isOpen} onOpenChange={onClose}>
            <DrawerContent className="max-h-[85dvh]">
                <div className="mx-auto w-full max-w-lg">
                    <DrawerHeader className="text-center">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                            <RefreshCw className="w-6 h-6 text-primary" />
                        </div>
                        <DrawerTitle>Sesuaikan Stok</DrawerTitle>
                        <p className="text-sm text-muted-foreground">
                            Stok saat ini: <span className="font-semibold text-foreground">{stock.quantity} {stock.unit}</span>
                        </p>
                    </DrawerHeader>

                    <div className="px-6 space-y-4 py-4">
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
                                <p className="text-sm text-muted-foreground">{stock.unit}</p>
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

                    <DrawerFooter className="py-4 pb-8 border-t border-border">
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                onMouseDown={createRippleEffect}
                                className="flex-1 px-6 py-3.5 bg-muted text-muted-foreground rounded-xl font-medium ripple"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={onAdjust}
                                onMouseDown={createRippleEffect}
                                className="flex-1 px-6 py-3.5 bg-primary text-primary-foreground rounded-xl font-medium ripple"
                            >
                                Simpan
                            </button>
                        </div>
                    </DrawerFooter>
                </div>
            </DrawerContent>
        </Drawer>
    );
}
