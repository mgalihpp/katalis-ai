'use client';

import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Label } from '@/components/ui/label';
import { createRippleEffect } from '@/hooks/useRipple';

export interface EditData {
    name: string;
    quantity: number;
    pack_unit: string;        // Satuan pack (dus, pak, peti)
    unit_unit: string;        // Satuan kecil (pcs, bungkus)
    units_per_pack: number;
    modal_per_pack: number;
    modal_per_unit: number;
    sell_per_unit: number;
    sell_per_pack: number;
    min_stock: number;
}

interface StockEditFormProps {
    editData: EditData;
    setEditData: React.Dispatch<React.SetStateAction<EditData>>;
    onSave: () => void;
    onCancel: () => void;
}

export function StockEditForm({ editData, setEditData, onSave, onCancel }: StockEditFormProps) {
    // Calculate total stock in small units (read-only display)
    const totalSmallUnits = editData.units_per_pack > 0
        ? editData.quantity * editData.units_per_pack
        : null;

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

                {/* Read-only stock quantity display */}
                <div className="p-4 bg-muted/30 rounded-xl border border-muted">
                    <p className="text-xs text-muted-foreground mb-2">Stok Saat Ini (tidak bisa diubah di sini)</p>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-lg font-bold text-foreground">{editData.quantity} {editData.pack_unit || 'pack'}</p>
                            {totalSmallUnits !== null && (
                                <p className="text-sm text-muted-foreground">= {totalSmallUnits} {editData.unit_unit || 'pcs'}</p>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground max-w-[140px] text-right">
                            Gunakan &quot;Sesuaikan Stok&quot; untuk mengubah jumlah
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <Label className="text-xs text-muted-foreground">Satuan Pack</Label>
                        <Input
                            value={editData.pack_unit}
                            placeholder="dus, pak, peti"
                            onChange={(e) => setEditData({ ...editData, pack_unit: e.target.value })}
                            className="mt-1 bg-muted/50"
                        />
                    </div>
                    <div>
                        <Label className="text-xs text-muted-foreground">Satuan Kecil</Label>
                        <Input
                            value={editData.unit_unit}
                            placeholder="pcs, bungkus, kg"
                            onChange={(e) => setEditData({ ...editData, unit_unit: e.target.value })}
                            className="mt-1 bg-muted/50"
                        />
                    </div>
                </div>
                <div>
                    <Label className="text-xs text-muted-foreground">Isi per {editData.pack_unit || 'pack'}</Label>
                    <Input
                        type="number"
                        value={editData.units_per_pack || ''}
                        placeholder="Contoh: 40"
                        onChange={(e) => {
                            const newUnitsPerPack = Number(e.target.value) || 0;
                            const updates: Partial<EditData> = { units_per_pack: newUnitsPerPack };
                            // Auto-calculate modal_per_unit if modal_per_pack and units_per_pack are valid
                            if (newUnitsPerPack > 0 && editData.modal_per_pack > 0) {
                                updates.modal_per_unit = Math.round(editData.modal_per_pack / newUnitsPerPack);
                            }
                            setEditData({ ...editData, ...updates });
                        }}
                        className="mt-1 bg-muted/50"
                    />
                </div>
                {/* Row 1: Modal per dus/pak | Jual per dus/pak */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <Label className="text-xs text-muted-foreground">Modal per dus/pak</Label>
                        <CurrencyInput
                            value={editData.modal_per_pack}
                            onChange={(val) => {
                                const newModalPerPack = Math.max(0, val);
                                const updates: Partial<EditData> = { modal_per_pack: newModalPerPack };
                                // Auto-calculate modal_per_unit if units_per_pack is valid
                                if (editData.units_per_pack > 0 && newModalPerPack > 0) {
                                    updates.modal_per_unit = Math.round(newModalPerPack / editData.units_per_pack);
                                }
                                setEditData({ ...editData, ...updates });
                            }}
                            className="mt-1 bg-muted/50"
                        />
                    </div>
                    <div>
                        <Label className="text-xs text-muted-foreground">Jual per dus/pak</Label>
                        <CurrencyInput
                            value={editData.sell_per_pack}
                            onChange={(val) => setEditData({ ...editData, sell_per_pack: Math.max(0, val) })}
                            className="mt-1 bg-muted/50"
                        />
                    </div>
                </div>
                {/* Row 2: Modal per satuan | Jual per satuan */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <Label className="text-xs text-muted-foreground">Modal per satuan</Label>
                        <CurrencyInput
                            value={editData.modal_per_unit}
                            onChange={(val) => setEditData({ ...editData, modal_per_unit: Math.max(0, val) })}
                            className="mt-1 bg-muted/50"
                        />
                    </div>
                    <div>
                        <Label className="text-xs text-muted-foreground">Jual per satuan</Label>
                        <CurrencyInput
                            value={editData.sell_per_unit}
                            onChange={(val) => setEditData({ ...editData, sell_per_unit: Math.max(0, val) })}
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
