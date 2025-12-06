'use client';

import { useState } from 'react';
import {
  Trash2,
  Edit3,
  Banknote,
  ShoppingCart,
  HandCoins,
  Wallet,
  Package,
  Clock,
  MessageSquare,
  Mic,
} from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
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
import { useTransactionStore } from '@/store/useTransactionStore';
import { cn, formatRupiah } from '@/lib/utils';
import type { Transaction } from '@/types';
import { toast } from 'sonner';
import { createRippleEffect } from '@/hooks/useRipple';

interface TransactionDetailSheetProps {
  transactionId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const typeConfig = {
  sale: {
    icon: Banknote,
    label: 'Penjualan',
    color: 'text-success',
    bg: 'bg-success/10',
    prefix: '+',
  },
  purchase: {
    icon: ShoppingCart,
    label: 'Pembelian',
    color: 'text-purchase',
    bg: 'bg-purchase/10',
    prefix: '-',
  },
  debt_add: {
    icon: HandCoins,
    label: 'Piutang Baru',
    color: 'text-debt',
    bg: 'bg-debt/10',
    prefix: '',
  },
  debt_payment: {
    icon: Wallet,
    label: 'Pembayaran',
    color: 'text-success',
    bg: 'bg-success/10',
    prefix: '+',
  },
  stock_add: {
    icon: Package,
    label: 'Tambah Stok',
    color: 'text-primary',
    bg: 'bg-primary/10',
    prefix: '',
  },
  stock_check: {
    icon: Package,
    label: 'Cek Stok',
    color: 'text-muted-foreground',
    bg: 'bg-muted',
    prefix: '',
  },
};

export function TransactionDetailSheet({
  transactionId,
  isOpen,
  onClose,
}: TransactionDetailSheetProps) {
  const { transactions, updateTransaction, deleteTransaction } =
    useTransactionStore();
  const transaction = transactions.find((t) => t.id === transactionId) || null;

  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editedItems, setEditedItems] = useState<Transaction['items']>([]);
  const [editedNote, setEditedNote] = useState('');

  if (!transaction) return null;

  const config = typeConfig[transaction.type] || typeConfig.sale;
  const Icon = config.icon;

  const handleEdit = () => {
    setEditedItems([...transaction.items]);
    setEditedNote(transaction.note || '');
    setIsEditing(true);
  };

  const handleSave = () => {
    const newTotal = editedItems.reduce(
      (sum, item) => sum + item.total_amount,
      0
    );
    updateTransaction(transaction.id, {
      items: editedItems,
      note: editedNote || null,
      total_amount: newTotal,
    });
    setIsEditing(false);
    toast.success('Transaksi berhasil diperbarui');
  };

  const handleDelete = () => {
    deleteTransaction(transaction.id);
    setShowDeleteDialog(false);
    onClose();
    toast.success('Transaksi berhasil dihapus');
  };

  const updateItem = (index: number, field: string, value: string | number) => {
    const newItems = [...editedItems];
    newItems[index] = { ...newItems[index], [field]: value };

    if (field === 'quantity' || field === 'price_per_unit') {
      const qty =
        field === 'quantity' ? Number(value) : newItems[index].quantity || 1;
      const price =
        field === 'price_per_unit'
          ? Number(value)
          : newItems[index].price_per_unit || 0;
      newItems[index].total_amount = qty * price;
    }

    setEditedItems(newItems);
  };

  const formattedDate = new Date(transaction.created_at).toLocaleDateString(
    'id-ID',
    {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }
  );

  const formattedTime = new Date(transaction.created_at).toLocaleTimeString(
    'id-ID',
    {
      hour: '2-digit',
      minute: '2-digit',
    }
  );

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
                      config.bg
                    )}
                  >
                    <Icon className={cn('w-6 h-6', config.color)} />
                  </div>
                  <div>
                    <DrawerTitle className="text-lg text-left">
                      {config.label}
                    </DrawerTitle>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formattedTime}
                    </p>
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
              {/* Total Amount Card */}
              <div className={cn('p-4 rounded-2xl', config.bg)}>
                <p className="text-sm text-muted-foreground mb-1">Total</p>
                <p className={cn('text-3xl font-bold', config.color)}>
                  {config.prefix}
                  {formatRupiah(
                    isEditing
                      ? editedItems.reduce((sum, i) => sum + i.total_amount, 0)
                      : transaction.total_amount
                  )}
                </p>
              </div>

              {/* Items List */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  Detail Item
                </h3>
                <div className="space-y-2">
                  {(isEditing ? editedItems : transaction.items).map(
                    (item, index) => (
                      <div key={index} className="p-4 bg-muted/50 rounded-xl">
                        {isEditing ? (
                          <div className="space-y-3">
                            <div>
                              <Label className="text-xs text-muted-foreground">
                                Nama Item
                              </Label>
                              <Input
                                value={item.item_name}
                                onChange={(e) =>
                                  updateItem(index, 'item_name', e.target.value)
                                }
                                className="mt-1 bg-background"
                              />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <Label className="text-xs text-muted-foreground">
                                  Jumlah
                                </Label>
                                <Input
                                  type="number"
                                  value={item.quantity || ''}
                                  onChange={(e) =>
                                    updateItem(
                                      index,
                                      'quantity',
                                      Number(e.target.value)
                                    )
                                  }
                                  className="mt-1 bg-background"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">
                                  Satuan
                                </Label>
                                <Input
                                  value={item.unit || ''}
                                  onChange={(e) =>
                                    updateItem(index, 'unit', e.target.value)
                                  }
                                  className="mt-1 bg-background"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">
                                  Harga
                                </Label>
                                <CurrencyInput
                                  value={item.price_per_unit || 0}
                                  onChange={(val) =>
                                    updateItem(index, 'price_per_unit', val)
                                  }
                                  className="mt-1 bg-background"
                                />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-foreground">
                                {item.item_name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {item.quantity} {item.unit || 'pcs'}
                                {item.price_per_unit &&
                                  ` x ${formatRupiah(item.price_per_unit)}`}
                              </p>
                            </div>
                            <p className="font-semibold text-foreground">
                              {formatRupiah(item.total_amount)}
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Note Section */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Catatan
                  </h3>
                </div>
                {isEditing ? (
                  <Input
                    value={editedNote}
                    onChange={(e) => setEditedNote(e.target.value)}
                    placeholder="Tambah catatan..."
                    className="bg-muted/50"
                  />
                ) : (
                  <p className="text-sm text-foreground">
                    {transaction.note || (
                      <span className="text-muted-foreground italic">
                        Tidak ada catatan
                      </span>
                    )}
                  </p>
                )}
              </div>

              {/* Original Voice Text */}
              <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-xl">
                <Mic className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Teks asli suara
                  </p>
                  <p className="text-sm text-foreground italic">
                    &quot;{transaction.raw_text}&quot;
                  </p>
                </div>
              </div>

              {/* Date */}
              <p className="text-xs text-muted-foreground text-center">
                {formattedDate}
              </p>
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

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-sm rounded-2xl">
          <AlertDialogHeader>
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-2">
              <Trash2 className="w-6 h-6 text-destructive" />
            </div>
            <AlertDialogTitle className="text-center">
              Hapus Transaksi?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Transaksi ini akan dihapus secara permanen dan tidak dapat
              dikembalikan.
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
    </>
  );
}
