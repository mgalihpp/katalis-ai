'use client';

import { useState } from 'react';
import {
  Trash2,
  Edit3,
  Package,
  TrendingUp,
  TrendingDown,
  History,
  AlertTriangle,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Minus,
  Plus,
} from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn, formatRupiah, formatRelativeTime } from '@/lib/utils';
import { useStockStore } from '@/store/useStockStore';
import { toast } from 'sonner';
import { createRippleEffect } from '@/hooks/useRipple';

interface StockDetailSheetProps {
  stockId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function StockDetailSheet({
  stockId,
  isOpen,
  onClose,
}: StockDetailSheetProps) {
  const {
    stocks,
    updateStock,
    deleteStock,
    adjustStock,
    getMovementsByStockId,
  } = useStockStore();
  const stock = stocks.find((s) => s.id === stockId) || null;

  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAdjustDialog, setShowAdjustDialog] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    quantity: 0,
    unit: '',
    buy_price: 0,
    sell_price: 0,
    min_stock: 5,
  });
  const [adjustData, setAdjustData] = useState({ quantity: 0, reason: '' });
  const [error, setError] = useState('');

  if (!stock) return null;

  const movements = getMovementsByStockId(stock.id).slice(0, 10);
  const isLowStock = stock.quantity <= stock.min_stock;
  const isOutOfStock = stock.quantity === 0;

  const statusColor = isOutOfStock
    ? 'destructive'
    : isLowStock
    ? 'accent'
    : 'primary';
  const statusBg = isOutOfStock
    ? 'bg-destructive/10'
    : isLowStock
    ? 'bg-accent/10'
    : 'bg-primary/10';
  const statusText = isOutOfStock
    ? 'text-destructive'
    : isLowStock
    ? 'text-accent'
    : 'text-primary';

  const handleEdit = () => {
    setEditData({
      name: stock.name,
      quantity: stock.quantity,
      unit: stock.unit,
      buy_price: stock.buy_price || 0,
      sell_price: stock.sell_price || 0,
      min_stock: stock.min_stock,
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    updateStock(stock.id, {
      name: editData.name,
      quantity: editData.quantity,
      unit: editData.unit,
      buy_price: editData.buy_price || null,
      sell_price: editData.sell_price || null,
      min_stock: editData.min_stock,
    });
    setIsEditing(false);
    toast.success('Stok berhasil diperbarui');
  };

  const handleDelete = () => {
    deleteStock(stock.id);
    setShowDeleteDialog(false);
    onClose();
    toast.success('Stok berhasil dihapus');
  };

  const handleAdjust = () => {
    if (!adjustData.reason.trim()) {
      setError('Alasan penyesuaian harus diisi');
      return;
    }
    adjustStock(stock.id, adjustData.quantity, adjustData.reason);
    setShowAdjustDialog(false);
    setError('');
    toast.success('Stok berhasil disesuaikan');
  };

  const openAdjustDialog = () => {
    setAdjustData({ quantity: stock.quantity, reason: '' });
    setShowAdjustDialog(true);
  };

  return (
    <>
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent className="max-h-[90dvh]">
          <div
            className="mx-auto w-full max-w-lg flex flex-col overflow-hidden"
            style={{ maxHeight: '90dvh' }}
          >
            <DrawerHeader className="shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-12 h-12 rounded-2xl flex items-center justify-center',
                      statusBg
                    )}
                  >
                    <Package className={cn('w-6 h-6', statusText)} />
                  </div>
                  <div>
                    <DrawerTitle className="text-lg text-left">
                      {isEditing ? 'Edit Stok' : stock.name}
                    </DrawerTitle>
                    {!isEditing && (
                      <p className="text-sm text-muted-foreground">
                        {stock.unit}
                      </p>
                    )}
                  </div>
                </div>
                {!isEditing && (
                  <div className="flex gap-2">
                    <button
                      onClick={handleEdit}
                      onMouseDown={createRippleEffect}
                      className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/80 ripple"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setShowDeleteDialog(true)}
                      onMouseDown={createRippleEffect}
                      className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center text-destructive hover:bg-destructive/20 ripple"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </DrawerHeader>

            <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-5">
              {isEditing ? (
                /* Edit Form */
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Nama Barang
                    </Label>
                    <Input
                      value={editData.name}
                      onChange={(e) =>
                        setEditData({ ...editData, name: e.target.value })
                      }
                      className="mt-1 bg-muted/50"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Jumlah
                      </Label>
                      <Input
                        type="number"
                        value={editData.quantity}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            quantity: Number(e.target.value),
                          })
                        }
                        className="mt-1 bg-muted/50"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Satuan
                      </Label>
                      <Input
                        value={editData.unit}
                        onChange={(e) =>
                          setEditData({ ...editData, unit: e.target.value })
                        }
                        className="mt-1 bg-muted/50"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Harga Beli
                      </Label>
                      <CurrencyInput
                        value={editData.buy_price}
                        onChange={(val) =>
                          setEditData({ ...editData, buy_price: val })
                        }
                        className="mt-1 bg-muted/50"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Harga Jual
                      </Label>
                      <CurrencyInput
                        value={editData.sell_price}
                        onChange={(val) =>
                          setEditData({ ...editData, sell_price: val })
                        }
                        className="mt-1 bg-muted/50"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Stok Minimum
                    </Label>
                    <Input
                      type="number"
                      value={editData.min_stock}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          min_stock: Number(e.target.value),
                        })
                      }
                      className="mt-1 bg-muted/50"
                    />
                  </div>
                </div>
              ) : (
                /* View Mode */
                <>
                  {/* Stock Quantity Card */}
                  <div className={cn('p-5 rounded-2xl text-center', statusBg)}>
                    <p className="text-sm text-muted-foreground mb-1">
                      Jumlah Stok
                    </p>
                    <p className={cn('text-4xl font-bold', statusText)}>
                      {stock.quantity}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {stock.unit}
                    </p>
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

                  {/* Adjust Stock Button */}
                  <button
                    onClick={openAdjustDialog}
                    onMouseDown={createRippleEffect}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-muted rounded-xl text-foreground font-medium hover:bg-muted/80 ripple"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Sesuaikan Stok
                  </button>

                  {/* Price Cards */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-muted/50 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingDown className="w-4 h-4 text-purchase" />
                        <span className="text-xs text-muted-foreground">
                          Harga Beli
                        </span>
                      </div>
                      <p className="text-lg font-bold text-foreground">
                        {stock.buy_price ? formatRupiah(stock.buy_price) : '-'}
                      </p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-success" />
                        <span className="text-xs text-muted-foreground">
                          Harga Jual
                        </span>
                      </div>
                      <p className="text-lg font-bold text-foreground">
                        {stock.sell_price
                          ? formatRupiah(stock.sell_price)
                          : '-'}
                      </p>
                    </div>
                  </div>

                  {/* Profit Margin */}
                  {stock.buy_price && stock.sell_price && (
                    <div className="p-4 bg-success/10 rounded-xl">
                      <p className="text-xs text-muted-foreground mb-1">
                        Margin Keuntungan
                      </p>
                      <p className="text-xl font-bold text-success">
                        {formatRupiah(stock.sell_price - stock.buy_price)}
                        <span className="text-sm font-normal text-muted-foreground">
                          {' '}
                          / {stock.unit}
                        </span>
                      </p>
                    </div>
                  )}

                  {/* Min Stock Info */}
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                    <span className="text-sm text-muted-foreground">
                      Stok Minimum
                    </span>
                    <span className="font-medium text-foreground">
                      {stock.min_stock} {stock.unit}
                    </span>
                  </div>

                  {/* Movement History */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <History className="w-4 h-4 text-muted-foreground" />
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Riwayat Pergerakan
                      </h3>
                    </div>
                    {movements.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4 bg-muted/30 rounded-xl">
                        Belum ada riwayat pergerakan
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {movements.map((m) => (
                          <div
                            key={m.id}
                            className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl"
                          >
                            <div
                              className={cn(
                                'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                                m.type === 'in'
                                  ? 'bg-success/10'
                                  : m.type === 'out'
                                  ? 'bg-destructive/10'
                                  : 'bg-muted'
                              )}
                            >
                              {m.type === 'in' ? (
                                <ArrowUp className="w-4 h-4 text-success" />
                              ) : m.type === 'out' ? (
                                <ArrowDown className="w-4 h-4 text-destructive" />
                              ) : (
                                <RefreshCw className="w-4 h-4 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">
                                {m.reason}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatRelativeTime(m.created_at)}
                              </p>
                            </div>
                            <span
                              className={cn(
                                'text-sm font-bold shrink-0',
                                m.type === 'in'
                                  ? 'text-success'
                                  : m.type === 'out'
                                  ? 'text-destructive'
                                  : 'text-foreground'
                              )}
                            >
                              {m.type === 'in'
                                ? '+'
                                : m.type === 'out'
                                ? '-'
                                : ''}
                              {Math.abs(m.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Footer Actions for Edit Mode */}
            {isEditing && (
              <div className="shrink-0 px-6 py-4 pb-8 bg-background border-t border-border">
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsEditing(false)}
                    onMouseDown={createRippleEffect}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-muted text-muted-foreground rounded-xl font-medium ripple"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSave}
                    onMouseDown={createRippleEffect}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-primary text-primary-foreground rounded-xl font-medium ripple"
                  >
                    Simpan
                  </button>
                </div>
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-sm rounded-2xl">
          <AlertDialogHeader>
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-2">
              <Trash2 className="w-6 h-6 text-destructive" />
            </div>
            <AlertDialogTitle className="text-center">
              Hapus Stok?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Stok &quot;{stock.name}&quot; akan dihapus secara permanen beserta
              riwayat pergerakannya.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-3 sm:justify-center">
            <AlertDialogCancel className="flex-1 mt-0">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="flex-1 bg-destructive text-primary-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Adjust Stock Drawer */}
      <Drawer open={showAdjustDialog} onOpenChange={setShowAdjustDialog}>
        <DrawerContent className="max-h-[85dvh]">
          <div className="mx-auto w-full max-w-lg">
            <DrawerHeader className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                <RefreshCw className="w-6 h-6 text-primary" />
              </div>
              <DrawerTitle>Sesuaikan Stok</DrawerTitle>
              <p className="text-sm text-muted-foreground">
                Stok saat ini:{' '}
                <span className="font-semibold text-foreground">
                  {stock.quantity} {stock.unit}
                </span>
              </p>
            </DrawerHeader>

            <div className="px-6 space-y-4 py-4">
              {/* Quantity Adjuster */}
              <div className="flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() =>
                    setAdjustData((prev) => ({
                      ...prev,
                      quantity: Math.max(0, prev.quantity - 1),
                    }))
                  }
                  onMouseDown={createRippleEffect}
                  className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center text-foreground hover:bg-muted/80 active:scale-95 transition-transform ripple"
                >
                  <Minus className="w-6 h-6 pointer-events-none" />
                </button>
                <div className="text-center min-w-[100px]">
                  <p className="text-4xl font-bold text-foreground">
                    {adjustData.quantity}
                  </p>
                  <p className="text-sm text-muted-foreground">{stock.unit}</p>
                  {adjustData.quantity !== stock.quantity && (
                    <p
                      className={cn(
                        'text-sm font-medium mt-1',
                        adjustData.quantity > stock.quantity
                          ? 'text-success'
                          : 'text-destructive'
                      )}
                    >
                      {adjustData.quantity > stock.quantity ? '+' : ''}
                      {adjustData.quantity - stock.quantity}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setAdjustData((prev) => ({
                      ...prev,
                      quantity: prev.quantity + 1,
                    }))
                  }
                  onMouseDown={createRippleEffect}
                  className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center text-foreground hover:bg-muted/80 active:scale-95 transition-transform ripple"
                >
                  <Plus className="w-6 h-6 pointer-events-none" />
                </button>
              </div>

              {/* Quick Adjust Presets */}
              <div className="flex justify-center gap-2">
                {[-10, -5, +5, +10].map((delta) => (
                  <button
                    type="button"
                    key={delta}
                    onClick={() =>
                      setAdjustData((prev) => ({
                        ...prev,
                        quantity: Math.max(0, prev.quantity + delta),
                      }))
                    }
                    onMouseDown={createRippleEffect}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ripple',
                      delta < 0
                        ? 'bg-destructive/10 text-destructive hover:bg-destructive/20'
                        : 'bg-success/10 text-success hover:bg-success/20'
                    )}
                  >
                    {delta > 0 ? '+' : ''}
                    {delta}
                  </button>
                ))}
              </div>

              {/* Reason Input */}
              <div>
                <Label
                  className={cn(
                    'text-xs text-muted-foreground',
                    error && 'text-red-500'
                  )}
                >
                  Alasan
                </Label>
                <Input
                  value={adjustData.reason}
                  onChange={(e) =>
                    setAdjustData((prev) => ({
                      ...prev,
                      reason: e.target.value,
                    }))
                  }
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
                  onClick={() => setShowAdjustDialog(false)}
                  onMouseDown={createRippleEffect}
                  className="flex-1 px-6 py-3.5 bg-muted text-muted-foreground rounded-xl font-medium ripple"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleAdjust}
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
    </>
  );
}
