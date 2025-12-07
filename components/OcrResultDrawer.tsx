'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Check,
  X,
  Store,
  Calendar,
  Receipt,
  Trash2,
  Package,
  ShoppingCart,
} from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { createRippleEffect } from '@/hooks/useRipple';
import { cn, formatRupiah } from '@/lib/utils';
import { parseOCRNumber } from '@/lib/ocrService';
import { Switch } from '@/components/ui/switch';
import type { OCRReceiptResult, OCRItem } from '@/types';

interface EditableItem extends OCRItem {
  id: string;
  unit: string; // Added for stock integration
}

interface OcrResultDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  result: OCRReceiptResult | null;
  onConfirm: (result: OCRReceiptResult, addToStock: boolean) => void;
}

function generateItemId() {
  return Math.random().toString(36).substring(2, 9);
}

export function OcrResultDrawer({
  isOpen,
  onClose,
  result,
  onConfirm,
}: OcrResultDrawerProps) {
  const [editedItems, setEditedItems] = useState<EditableItem[]>([]);
  const [merchantName, setMerchantName] = useState('');
  const [receiptDate, setReceiptDate] = useState('');
  const [addToStock, setAddToStock] = useState(true); // Default ON
  const [isSaving, setIsSaving] = useState(false); // Prevent double submission

  // Initialize state when result changes
  useEffect(() => {
    if (result) {
      const items = (result.items || []).map((item) => {
        const qty = parseOCRNumber(item.quantity);
        const unitPrice = parseOCRNumber(item.unit_price);
        // Recalculate total_price to ensure proper parsing
        const totalPrice =
          qty > 0 && unitPrice > 0
            ? qty * unitPrice
            : parseOCRNumber(item.total_price);

        return {
          ...item,
          id: generateItemId(),
          quantity: qty,
          unit_price: unitPrice,
          total_price: totalPrice,
          unit: 'pcs', // Default unit
        };
      });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEditedItems(items);
      setMerchantName(result.merchant?.name || '');
      setReceiptDate(
        result.receipt_info?.date || new Date().toLocaleDateString('id-ID')
      );
    }
  }, [result]);

  // Calculate total
  const calculatedTotal = editedItems.reduce((sum, item) => {
    return sum + parseOCRNumber(item.total_price);
  }, 0);

  const handleUpdateItem = useCallback(
    (id: string, field: keyof OCRItem | 'unit', value: string | number) => {
      setEditedItems((prev) =>
        prev.map((item) => {
          if (item.id !== id) return item;

          const updated = { ...item, [field]: value };

          // Auto-calculate total_price when quantity or unit_price changes
          if (field === 'quantity' || field === 'unit_price') {
            const qty = parseOCRNumber(
              field === 'quantity' ? value : item.quantity
            );
            const unitPrice = parseOCRNumber(
              field === 'unit_price' ? value : item.unit_price
            );
            if (qty > 0 && unitPrice > 0) {
              updated.total_price = qty * unitPrice;
            }
          }

          return updated;
        })
      );
    },
    []
  );

  const handleDeleteItem = useCallback((id: string) => {
    setEditedItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const handleConfirm = () => {
    if (!result) return;

    // Include unit in items for stock integration
    const itemsWithUnit = editedItems.map(({ id: _id, ...item }) => ({
      ...item,
      unit: item.unit, // Preserve the unit field
    }));

    const updatedResult: OCRReceiptResult = {
      ...result,
      merchant: { ...result.merchant, name: merchantName },
      receipt_info: { ...result.receipt_info, date: receiptDate },
      items: itemsWithUnit,
      summary: { ...result.summary, total: calculatedTotal },
    };

    onConfirm(updatedResult, addToStock);
  };

  if (!result) return null;

  const confidenceScore = result.metadata?.confidence_score;

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="max-h-[85dvh]">
        <div
          className="mx-auto w-full max-w-lg flex flex-col overflow-hidden"
          style={{ maxHeight: '85dvh' }}
        >
          {/* Header */}
          <DrawerHeader className="shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-purchase/10 flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-purchase" />
                </div>
                <div>
                  <DrawerTitle className="text-lg text-left">
                    Pembelian
                  </DrawerTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {editedItems.length} item terdeteksi
                    </span>
                    {confidenceScore !== undefined && (
                      <span
                        className={cn(
                          'text-xs font-medium px-1.5 py-0.5 rounded-md',
                          confidenceScore > 0.8
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : confidenceScore > 0.5
                              ? 'bg-amber-500/10 text-amber-600'
                              : 'bg-red-500/10 text-red-600'
                        )}
                      >
                        {Math.round(confidenceScore * 100)}% akurat
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-muted/80 flex items-center justify-center hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </DrawerHeader>

          {/* Scrollable Content */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="px-5 pb-4 space-y-4">
              {/* Merchant & Date */}
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl">
                  <div className="w-9 h-9 rounded-lg bg-purchase/10 flex items-center justify-center shrink-0">
                    <Store className="w-4 h-4 text-purchase" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                      Toko
                    </span>
                    <input
                      type="text"
                      value={merchantName}
                      onChange={(e) => setMerchantName(e.target.value)}
                      className="w-full text-sm font-medium bg-transparent outline-none placeholder:text-muted-foreground/50 truncate"
                      placeholder="Nama toko..."
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl">
                  <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                      Tanggal
                    </span>
                    <input
                      type="text"
                      value={receiptDate}
                      onChange={(e) => setReceiptDate(e.target.value)}
                      className="w-full text-sm font-medium bg-transparent outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Items Section */}
              <div>
                <div className="flex items-center gap-2 mb-2 px-1">
                  <Package className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Daftar Belanja
                  </span>
                </div>

                {editedItems.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground bg-muted/20 rounded-2xl">
                    <Receipt className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Tidak ada item terdeteksi</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {editedItems.map((item, index) => (
                      <div
                        key={item.id}
                        className="group relative bg-background border border-border/50 rounded-xl p-3 hover:border-primary/20 hover:shadow-sm transition-all"
                      >
                        {/* Item Name */}
                        <div className="flex items-start gap-2 mb-2">
                          <span className="shrink-0 w-5 h-5 rounded-md bg-purchase/10 text-purchase text-xs font-medium flex items-center justify-center">
                            {index + 1}
                          </span>
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) =>
                              handleUpdateItem(item.id, 'name', e.target.value)
                            }
                            className="flex-1 text-sm font-medium bg-transparent outline-none"
                            placeholder="Nama item"
                          />
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="shrink-0 w-6 h-6 rounded-md opacity-0 group-hover:opacity-100 bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive/20 transition-all"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Quantity x Price = Total */}
                        <div className="flex items-center gap-2 pl-7 text-xs">
                          <input
                            type="number"
                            value={parseOCRNumber(item.quantity) || ''}
                            onChange={(e) =>
                              handleUpdateItem(
                                item.id,
                                'quantity',
                                Number(e.target.value)
                              )
                            }
                            className="w-10 text-center bg-muted/50 rounded-md px-1 py-1 outline-none focus:ring-1 ring-primary/30"
                            min="0"
                            placeholder="0"
                          />
                          <input
                            type="text"
                            value={item.unit}
                            onChange={(e) =>
                              handleUpdateItem(
                                item.id,
                                'unit',
                                e.target.value
                              )
                            }
                            className="w-12 text-center bg-muted/50 rounded-md px-1 py-1 outline-none focus:ring-1 ring-primary/30 text-muted-foreground"
                            placeholder="pcs"
                          />
                          <span className="text-muted-foreground">×</span>
                          <div className="flex items-center gap-0.5">
                            <span className="text-muted-foreground text-[10px]">
                              Rp
                            </span>
                            <input
                              type="number"
                              value={parseOCRNumber(item.unit_price) || ''}
                              onChange={(e) =>
                                handleUpdateItem(
                                  item.id,
                                  'unit_price',
                                  Number(e.target.value)
                                )
                              }
                              className="w-20 bg-muted/50 rounded-md px-1.5 py-1 text-right outline-none focus:ring-1 ring-primary/30"
                              min="0"
                              placeholder="0"
                            />
                          </div>
                          <span className="text-muted-foreground">=</span>
                          <span className="ml-auto font-semibold text-sm text-purchase">
                            {formatRupiah(parseOCRNumber(item.total_price))}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add to Stock Toggle */}
              <div className="flex items-center justify-between p-4 bg-muted/40 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Package className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Tambahkan ke Stok
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Otomatis update stok barang
                    </p>
                  </div>
                </div>
                <Switch
                  checked={addToStock}
                  onCheckedChange={setAddToStock}
                />
              </div>

              {/* Summary Card */}
              <div className="bg-gradient-to-br from-purchase/5 to-purchase/10 rounded-2xl p-4 border border-purchase/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">
                      Total Pembelian
                    </p>
                    <p className="text-2xl font-bold text-purchase">
                      {formatRupiah(calculatedTotal)}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-purchase/10 flex items-center justify-center">
                    <ShoppingCart className="w-6 h-6 text-purchase" />
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Footer Actions */}
          <div className="shrink-0 px-5 py-4 pb-8 bg-background border-t border-border">
            <div className="flex gap-3">
              <button
                onClick={onClose}
                onMouseDown={createRippleEffect}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-muted text-muted-foreground rounded-xl font-medium ripple"
              >
                Batal
              </button>
              <button
                onClick={handleConfirm}
                onMouseDown={createRippleEffect}
                disabled={editedItems.length === 0}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-medium ripple',
                  editedItems.length > 0
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                )}
              >
                <Check className="w-4 h-4" />
                Simpan
              </button>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
