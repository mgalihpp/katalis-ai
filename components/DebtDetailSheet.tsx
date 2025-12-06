'use client';

import { useState } from 'react';
import {
  Trash2,
  Edit3,
  HandCoins,
  Wallet,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  History,
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
import { formatRupiah, formatRelativeTime } from '@/lib/utils';
import { useTransactionStore } from '@/store/useTransactionStore';
import { cn } from '@/lib/utils';
import type { Debt } from '@/types';
import { toast } from 'sonner';
import { createRippleEffect } from '@/hooks/useRipple';

interface DebtDetailSheetProps {
  debt: Debt | null;
  isOpen: boolean;
  onClose: () => void;
}

const statusConfig = {
  pending: {
    icon: AlertTriangle,
    label: 'Belum Bayar',
    color: 'text-debt',
    bg: 'bg-debt/10',
  },
  partial: {
    icon: Clock,
    label: 'Sebagian',
    color: 'text-accent',
    bg: 'bg-accent/10',
  },
  paid: {
    icon: CheckCircle,
    label: 'Lunas',
    color: 'text-success',
    bg: 'bg-success/10',
  },
};

export function DebtDetailSheet({
  debt,
  isOpen,
  onClose,
}: DebtDetailSheetProps) {
  const { updateDebt, deleteDebt, addDebtPayment } = useTransactionStore();

  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [editData, setEditData] = useState({
    debtor_name: '',
    total_amount: 0,
  });
  const [paymentData, setPaymentData] = useState({ amount: 0, note: '' });

  if (!debt) return null;

  const config = statusConfig[debt.status];
  const StatusIcon = config.icon;
  const progressPercent = (debt.paid_amount / debt.total_amount) * 100;

  const handleEdit = () => {
    setEditData({
      debtor_name: debt.debtor_name,
      total_amount: debt.total_amount,
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    const newRemaining = editData.total_amount - debt.paid_amount;
    let newStatus: 'pending' | 'partial' | 'paid' = 'pending';
    if (newRemaining <= 0) {
      newStatus = 'paid';
    } else if (debt.paid_amount > 0) {
      newStatus = 'partial';
    }

    updateDebt(debt.id, {
      debtor_name: editData.debtor_name,
      total_amount: editData.total_amount,
      remaining_amount: Math.max(0, newRemaining),
      status: newStatus,
    });
    setIsEditing(false);
    toast.success('Data hutang berhasil diperbarui');
  };

  const handleDelete = () => {
    deleteDebt(debt.id);
    setShowDeleteDialog(false);
    onClose();
    toast.success('Data hutang berhasil dihapus');
  };

  const handlePayment = () => {
    if (paymentData.amount <= 0) {
      toast.error('Jumlah pembayaran harus lebih dari 0');
      return;
    }
    addDebtPayment(debt.id, paymentData.amount, paymentData.note);
    setShowPaymentDialog(false);
    setPaymentData({ amount: 0, note: '' });
    toast.success('Pembayaran berhasil dicatat');
  };

  const openPaymentDialog = () => {
    setPaymentData({ amount: debt.remaining_amount, note: '' });
    setShowPaymentDialog(true);
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
                      config.bg
                    )}
                  >
                    <HandCoins className={cn('w-6 h-6', config.color)} />
                  </div>
                  <div>
                    <DrawerTitle className="text-lg text-left">
                      {isEditing ? 'Edit Piutang' : debt.debtor_name}
                    </DrawerTitle>
                    {!isEditing && (
                      <div
                        className={cn(
                          'inline-flex items-center gap-1 text-sm',
                          config.color
                        )}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {config.label}
                      </div>
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
                      Nama
                    </Label>
                    <Input
                      value={editData.debtor_name}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          debtor_name: e.target.value,
                        })
                      }
                      className="mt-1 bg-muted/50"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Total Hutang
                    </Label>
                    <CurrencyInput
                      value={editData.total_amount}
                      onChange={(val) =>
                        setEditData({ ...editData, total_amount: val })
                      }
                      className="mt-1 bg-muted/50"
                    />
                  </div>
                </div>
              ) : (
                /* View Mode */
                <>
                  {/* Remaining Amount - Main Card */}
                  <div className={cn('p-5 rounded-2xl text-center', config.bg)}>
                    <p className="text-sm text-muted-foreground mb-1">
                      Sisa Hutang
                    </p>
                    <p className={cn('text-4xl font-bold', config.color)}>
                      {formatRupiah(debt.remaining_amount)}
                    </p>
                    {debt.status === 'paid' && (
                      <div className="flex items-center justify-center gap-1 mt-2 text-success">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          Sudah Lunas!
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Pay Button */}
                  {debt.status !== 'paid' && (
                    <button
                      onClick={openPaymentDialog}
                      onMouseDown={createRippleEffect}
                      className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 ripple"
                    >
                      <Wallet className="w-5 h-5" />
                      Catat Pembayaran
                    </button>
                  )}

                  {/* Amount Summary */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-muted/50 rounded-xl">
                      <p className="text-xs text-muted-foreground mb-1">
                        Total Hutang
                      </p>
                      <p className="text-lg font-bold text-foreground">
                        {formatRupiah(debt.total_amount)}
                      </p>
                    </div>
                    <div className="p-4 bg-success/10 rounded-xl">
                      <p className="text-xs text-muted-foreground mb-1">
                        Sudah Dibayar
                      </p>
                      <p className="text-lg font-bold text-success">
                        {formatRupiah(debt.paid_amount)}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="p-4 bg-muted/30 rounded-xl">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">
                        Progress Pembayaran
                      </span>
                      <span className="font-medium text-foreground">
                        {Math.round(progressPercent)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-500',
                          debt.status === 'paid'
                            ? 'bg-success'
                            : debt.status === 'partial'
                              ? 'bg-accent'
                              : 'bg-debt'
                        )}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Transaction History */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <History className="w-4 h-4 text-muted-foreground" />
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Riwayat Transaksi
                      </h3>
                    </div>
                    <div className="space-y-2">
                      {debt.transactions.map((t) => (
                        <div
                          key={t.id}
                          className="flex items-start gap-3 p-3 bg-muted/30 rounded-xl"
                        >
                          <div
                            className={cn(
                              'w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5',
                              t.type === 'add' ? 'bg-debt/10' : 'bg-success/10'
                            )}
                          >
                            {t.type === 'add' ? (
                              <ArrowUp className="w-4 h-4 text-debt" />
                            ) : (
                              <ArrowDown className="w-4 h-4 text-success" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <p className="text-sm font-medium text-foreground">
                                {t.type === 'add' ? 'Hutang Baru' : 'Pembayaran'}
                              </p>
                              <span
                                className={cn(
                                  'text-sm font-bold shrink-0',
                                  t.type === 'add' ? 'text-debt' : 'text-success'
                                )}
                              >
                                {t.type === 'add' ? '+' : '-'}
                                {formatRupiah(t.amount)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <p className="text-xs text-muted-foreground/80 truncate mr-2">
                                {t.note || '-'}
                              </p>
                              <p className="text-xs text-muted-foreground shrink-0">
                                {formatRelativeTime(t.created_at)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Date Info */}
                  <p className="text-xs text-muted-foreground text-center">
                    Dibuat{' '}
                    {new Date(debt.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
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
              Hapus Piutang?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Data piutang &quot;{debt.debtor_name}&quot; akan dihapus secara
              permanen beserta riwayat pembayarannya.
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

      {/* Payment Dialog */}
      <AlertDialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <AlertDialogContent className="max-w-sm rounded-2xl">
          <AlertDialogHeader>
            <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-2">
              <Wallet className="w-6 h-6 text-success" />
            </div>
            <AlertDialogTitle className="text-center">
              Catat Pembayaran
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Sisa hutang: {formatRupiah(debt.remaining_amount)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs text-muted-foreground">
                Jumlah Bayar
              </Label>
              <CurrencyInput
                value={paymentData.amount}
                onChange={(val) =>
                  setPaymentData({ ...paymentData, amount: val })
                }
                className="mt-1 bg-muted/50"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">
                Catatan (opsional)
              </Label>
              <Input
                value={paymentData.note}
                onChange={(e) =>
                  setPaymentData({ ...paymentData, note: e.target.value })
                }
                placeholder="Contoh: Via transfer, tunai..."
                className="mt-1 bg-muted/50"
              />
            </div>
          </div>
          <AlertDialogFooter className="flex-row gap-3 sm:justify-center">
            <AlertDialogCancel className="flex-1 mt-0">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handlePayment} className="flex-1">
              Catat Pembayaran
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
