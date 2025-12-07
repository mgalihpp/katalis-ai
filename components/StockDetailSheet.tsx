'use client';

import { useState } from 'react';
import { Trash2, Edit3, Package } from 'lucide-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { useStockStore } from '@/store/useStockStore';
import { useTransactionStore } from '@/store/useTransactionStore';
import { toast } from 'sonner';
import { createRippleEffect } from '@/hooks/useRipple';

// Extracted components
import { StockQuantityCard, SmallUnitQuantityDisplay, AdjustStockButton, PriceCards, ProfitMargin, MinStockInfo, MovementHistory, UnitsPerPackInfo } from './stock/StockViewComponents';
import { StockAdjustDrawer } from './stock/StockAdjustDrawer';
import { StockEditForm } from './stock/StockEditForm';

interface StockDetailSheetProps {
  stockId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function StockDetailSheet({ stockId, isOpen, onClose }: StockDetailSheetProps) {
  const { stocks, updateStock, deleteStock, adjustStock, getMovementsByStockId } = useStockStore();
  const { addTransaction } = useTransactionStore();
  const stock = stocks.find((s) => s.id === stockId) || null;

  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAdjustDialog, setShowAdjustDialog] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    quantity: 0,
    pack_unit: '',      // Satuan pack (dus, pak, peti)
    unit_unit: '',      // Satuan kecil (pcs, bungkus)
    units_per_pack: 0,
    modal_per_pack: 0,
    modal_per_unit: 0,
    sell_per_unit: 0,
    sell_per_pack: 0,
    min_stock: 5
  });
  const [adjustData, setAdjustData] = useState({ quantity: 0, reason: '' });
  const [error, setError] = useState('');

  if (!stock) return null;

  const movements = getMovementsByStockId(stock.id).slice(0, 10);
  const isLowStock = stock.quantity <= stock.min_stock;
  // Only truly out of stock when both pack quantity AND small unit quantity are 0
  const isOutOfStock = stock.quantity === 0 && (stock.small_unit_quantity === null || stock.small_unit_quantity === 0);

  const statusBg = isOutOfStock ? 'bg-destructive/10' : isLowStock ? 'bg-accent/10' : 'bg-primary/10';
  const statusText = isOutOfStock ? 'text-destructive' : isLowStock ? 'text-accent' : 'text-primary';

  const handleEdit = () => {
    setEditData({
      name: stock.name,
      quantity: stock.quantity,
      pack_unit: stock.pack_unit || stock.unit || 'dus',   // Read from pack_unit, fallback to unit
      unit_unit: stock.unit_unit || 'pcs',                  // Read from unit_unit
      units_per_pack: stock.units_per_pack || 0,
      modal_per_pack: stock.modal_per_pack || 0,
      modal_per_unit: stock.modal_per_unit || 0,
      sell_per_unit: stock.sell_per_unit || 0,
      sell_per_pack: stock.sell_per_pack || 0,
      min_stock: stock.min_stock,
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    // Note: quantity is NOT updated here - it's read-only
    // Stock quantity should only change via transactions or explicit adjustment
    updateStock(stock.id, {
      name: editData.name,
      unit: editData.pack_unit,              // Legacy: same as pack_unit
      pack_unit: editData.pack_unit,         // Satuan pack
      unit_unit: editData.unit_unit,         // Satuan kecil
      units_per_pack: editData.units_per_pack || null,
      modal_per_pack: editData.modal_per_pack || null,
      modal_per_unit: editData.modal_per_unit || null,
      sell_per_unit: editData.sell_per_unit || null,
      sell_per_pack: editData.sell_per_pack || null,
      min_stock: editData.min_stock,
    });
    setIsEditing(false);
    toast.success('Data barang berhasil diperbarui');
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

  const handlePurchase = (qty: number, pricePerPack: number, note: string) => {
    // Create a purchase transaction using the same format as voice purchases
    const packUnit = stock.pack_unit || stock.unit || 'dus';

    addTransaction({
      type: 'purchase',
      transactions: [{
        item_name: stock.name,
        quantity: qty,
        unit: packUnit,
        price_per_unit: pricePerPack,
        total_amount: qty * pricePerPack,
      }],
      debt: null,
      stock: null,
      note: note || `Pembelian langsung ${stock.name}`,
      raw_text: `Beli ${qty} ${packUnit} ${stock.name} @ ${pricePerPack}`,
      confidence: 1.0,
    });

    setShowAdjustDialog(false);
    toast.success(`Pembelian ${qty} ${packUnit} ${stock.name} berhasil dicatat!`);
  };

  const openAdjustDialog = () => {
    setAdjustData({ quantity: stock.quantity, reason: '' });
    setShowAdjustDialog(true);
  };

  return (
    <>
      <Drawer open={isOpen} onOpenChange={(open) => {
        if (!open) {
          // Reset edit state on any close (swipe, backdrop tap, etc.)
          setIsEditing(false);
          onClose();
        }
      }}>
        <DrawerContent className="max-h-[90dvh]">
          <div className="mx-auto w-full max-w-lg flex flex-col overflow-hidden" style={{ maxHeight: '90dvh' }}>
            <DrawerHeader className="shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center', statusBg)}>
                    <Package className={cn('w-6 h-6', statusText)} />
                  </div>
                  <div>
                    <DrawerTitle className="text-lg text-left">
                      {isEditing ? 'Edit Stok' : stock.name}
                    </DrawerTitle>
                    {!isEditing && <p className="text-sm text-muted-foreground text-left">{stock.pack_unit || stock.unit}</p>}
                  </div>
                </div>
                {!isEditing && (
                  <div className="flex gap-2">
                    <button onClick={handleEdit} onMouseDown={createRippleEffect} className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/80 ripple">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setShowDeleteDialog(true)} onMouseDown={createRippleEffect} className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center text-destructive hover:bg-destructive/20 ripple">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </DrawerHeader>

            <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-5">
              {isEditing ? (
                <StockEditForm editData={editData} setEditData={setEditData} />
              ) : (
                <>
                  <StockQuantityCard stock={stock} statusBg={statusBg} statusText={statusText} isLowStock={isLowStock} isOutOfStock={isOutOfStock} />
                  <SmallUnitQuantityDisplay stock={stock} />
                  <AdjustStockButton onClick={openAdjustDialog} />
                  <UnitsPerPackInfo stock={stock} />
                  <PriceCards stock={stock} />
                  <ProfitMargin stock={stock} />
                  <MinStockInfo stock={stock} />
                  <MovementHistory movements={movements} />
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
            <AlertDialogTitle className="text-center">Hapus Stok?</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Menghapus stok &quot;{stock.name}&quot; juga akan menghapus semua riwayat transaksi terkait. Yakin lanjut?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-3 sm:justify-center">
            <AlertDialogCancel className="flex-1 mt-0">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="flex-1 bg-destructive text-primary-foreground hover:bg-destructive/90">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Adjust Stock Drawer */}
      <StockAdjustDrawer
        isOpen={showAdjustDialog}
        onClose={() => setShowAdjustDialog(false)}
        stock={stock}
        adjustData={adjustData}
        setAdjustData={setAdjustData}
        error={error}
        onAdjust={handleAdjust}
        onPurchase={handlePurchase}
      />
    </>
  );
}
