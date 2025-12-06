'use client';

import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Label } from '@/components/ui/label';
import { createRippleEffect } from '@/hooks/useRipple';

interface EditData {
    name: string;
    quantity: number;
    unit: string;
    buy_price: number;
    sell_price: number;
    min_stock: number;
}

interface StockEditFormProps {
    editData: EditData;
    setEditData: React.Dispatch<React.SetStateAction<EditData>>;
    onSave: () => void;
    onCancel: () => void;
}

export function StockEditForm({ editData, setEditData, onSave, onCancel }: StockEditFormProps) {
    return (
        <>
            <div className="space-y-4">
                <div>
                    <Label className="text-xs text-muted-foreground">Nama Barang</Label>
                    <Input
                        value={editData.name}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                        className="mt-1 bg-muted/50"
                    />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <Label className="text-xs text-muted-foreground">Jumlah</Label>
                        <Input
                            type="number"
                            value={editData.quantity}
                            onChange={(e) => setEditData({ ...editData, quantity: Number(e.target.value) })}
                            className="mt-1 bg-muted/50"
                        />
                    </div>
                    <div>
                        <Label className="text-xs text-muted-foreground">Satuan</Label>
                        <Input
                            value={editData.unit}
                            onChange={(e) => setEditData({ ...editData, unit: e.target.value })}
                            className="mt-1 bg-muted/50"
                        />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <Label className="text-xs text-muted-foreground">Harga Beli</Label>
                        <CurrencyInput
                            value={editData.buy_price}
                            onChange={(val) => setEditData({ ...editData, buy_price: val })}
                            className="mt-1 bg-muted/50"
                        />
                    </div>
                    <div>
                        <Label className="text-xs text-muted-foreground">Harga Jual</Label>
                        <CurrencyInput
                            value={editData.sell_price}
                            onChange={(val) => setEditData({ ...editData, sell_price: val })}
                            className="mt-1 bg-muted/50"
                        />
                    </div>
                </div>
                <div>
                    <Label className="text-xs text-muted-foreground">Stok Minimum</Label>
                    <Input
                        type="number"
                        value={editData.min_stock}
                        onChange={(e) => setEditData({ ...editData, min_stock: Number(e.target.value) })}
                        className="mt-1 bg-muted/50"
                    />
                </div>
            </div>

            {/* Footer Actions */}
            <div className="shrink-0 px-6 py-4 pb-8 bg-background border-t border-border -mx-6 mt-5">
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        onMouseDown={createRippleEffect}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-muted text-muted-foreground rounded-xl font-medium ripple"
                    >
                        Batal
                    </button>
                    <button
                        onClick={onSave}
                        onMouseDown={createRippleEffect}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-primary text-primary-foreground rounded-xl font-medium ripple"
                    >
                        Simpan
                    </button>
                </div>
            </div>
        </>
    );
}
