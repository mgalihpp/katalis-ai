'use client';

import {
  XCircle,
  Mic,
  Banknote,
  ShoppingCart,
  HandCoins,
  Wallet,
  Package,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ParsedVoiceResult } from '@/types';
import { formatRupiah } from '@/lib/utils';
import { createRippleEffect } from '@/hooks/useRipple';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from '@/components/ui/drawer';

interface ProcessingModalProps {
  isOpen: boolean;
  isProcessing: boolean;
  transcript: string | null;
  result: ParsedVoiceResult | null;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
  onRetry: () => void;
}

const typeConfig = {
  sale: {
    icon: Banknote,
    label: 'Penjualan',
    color: 'text-success',
    bg: 'bg-success/10',
  },
  purchase: {
    icon: ShoppingCart,
    label: 'Pembelian',
    color: 'text-purchase',
    bg: 'bg-purchase/10',
  },
  debt_add: {
    icon: HandCoins,
    label: 'Piutang Baru',
    color: 'text-debt',
    bg: 'bg-debt/10',
  },
  debt_payment: {
    icon: Wallet,
    label: 'Pembayaran Hutang',
    color: 'text-success',
    bg: 'bg-success/10',
  },
  stock_add: {
    icon: Package,
    label: 'Tambah Stok',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  stock_check: {
    icon: Package,
    label: 'Cek Stok',
    color: 'text-muted-foreground',
    bg: 'bg-muted',
  },
};

export function ProcessingModal({
  isOpen,
  isProcessing,
  transcript,
  result,
  error,
  onConfirm,
  onCancel,
  onRetry,
}: ProcessingModalProps) {
  const config = result ? typeConfig[result.type] || typeConfig.sale : null;
  const TypeIcon = config?.icon;

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DrawerContent className="max-h-[90dvh]">
        <div
          className="mx-auto w-full max-w-lg flex flex-col overflow-hidden"
          style={{ maxHeight: '90dvh' }}
        >
          {/* Processing State */}
          {isProcessing && (
            <div className="flex flex-col items-center py-12 px-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mic className="w-8 h-8 text-primary" />
                </div>
                <div className="absolute inset-0 w-20 h-20 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              </div>
              <DrawerTitle className="text-lg font-semibold text-foreground mt-6">
                Memproses suara...
              </DrawerTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Tunggu sebentar ya
              </p>
            </div>
          )}

          {/* Error State */}
          {error && !isProcessing && (
            <div className="flex flex-col items-center py-10 px-6">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                <XCircle className="w-8 h-8 text-destructive" />
              </div>
              <DrawerTitle className="text-lg font-semibold text-foreground">
                Gagal Memproses
              </DrawerTitle>
              <p className="text-sm text-muted-foreground text-center mt-2 mb-6 max-w-xs">
                {error}
              </p>

              <div className="flex gap-3 w-full max-w-xs">
                <button
                  onClick={onCancel}
                  onMouseDown={createRippleEffect}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-muted text-muted-foreground rounded-xl font-medium ripple"
                >
                  Batal
                </button>
                <button
                  onClick={onRetry}
                  onMouseDown={createRippleEffect}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-xl font-medium ripple"
                >
                  <RotateCcw className="w-4 h-4" />
                  Ulangi
                </button>
              </div>
            </div>
          )}

          {/* Success State */}
          {result && !isProcessing && !error && (
            <>
              <DrawerHeader className="shrink-0">
                <div className="flex text-left items-center gap-3">
                  {TypeIcon && (
                    <div
                      className={cn(
                        'w-12 h-12 rounded-2xl flex items-center justify-center',
                        config?.bg
                      )}
                    >
                      <TypeIcon className={cn('w-6 h-6', config?.color)} />
                    </div>
                  )}
                  <div>
                    <DrawerTitle className="text-lg">
                      {config?.label}
                    </DrawerTitle>
                    <p className="text-sm text-muted-foreground">
                      Konfirmasi transaksi
                    </p>
                  </div>
                </div>
              </DrawerHeader>

              <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-4">
                {/* Transcript */}
                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-xl">
                  <Mic className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground italic">
                    &quot;{transcript}&quot;
                  </p>
                </div>

                {/* Items */}
                {result.transactions && result.transactions.length > 0 && (
                  <div className="space-y-2">
                    {result.transactions.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                      >
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {item.item_name}
                          </p>
                          {item.quantity && item.unit && (
                            <p className="text-xs text-muted-foreground">
                              {item.quantity} {item.unit}{' '}
                              {item.price_per_unit
                                ? 'x ' + formatRupiah(item.price_per_unit)
                                : ''}
                            </p>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-foreground">
                          {item.total_amount
                            ? formatRupiah(item.total_amount)
                            : '-'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Debt info */}
                {result.debt && result.debt.debtor_name && (
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {result.debt.debtor_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {result.type === 'debt_payment'
                          ? 'Pembayaran'
                          : 'Piutang baru'}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-foreground">
                      {result.debt.amount
                        ? formatRupiah(result.debt.amount)
                        : '-'}
                    </p>
                  </div>
                )}

                {/* Stock info */}
                {result.stock && result.stock.item_name && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between py-2">
                      <p className="text-sm text-muted-foreground">Barang</p>
                      <p className="text-sm font-medium text-foreground capitalize">
                        {result.stock.item_name}
                      </p>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <p className="text-sm text-muted-foreground">Jumlah</p>
                      <p className="text-sm font-medium text-foreground">
                        {result.stock.quantity} {result.stock.unit}
                      </p>
                    </div>
                    {result.stock.modal_per_pack && (
                      <div className="flex items-center justify-between py-2">
                        <p className="text-sm text-muted-foreground">
                          Modal per {result.stock.unit || 'dus/pak'}
                        </p>
                        <p className="text-sm font-medium text-foreground">
                          {formatRupiah(result.stock.modal_per_pack)}
                        </p>
                      </div>
                    )}
                    {result.stock.units_per_pack && result.stock.units_per_pack > 0 && (
                      <div className="flex items-center justify-between py-2">
                        <p className="text-sm text-muted-foreground">
                          Isi per {result.stock.unit || 'dus/pak'}
                        </p>
                        <p className="text-sm font-medium text-foreground">
                          {result.stock.units_per_pack} pcs
                        </p>
                      </div>
                    )}
                    {/* Modal per satuan - calculated from modal_per_pack / units_per_pack */}
                    {result.stock.modal_per_pack && result.stock.units_per_pack && result.stock.units_per_pack > 0 && (
                      <div className="flex items-center justify-between py-2 bg-primary/5 rounded-lg px-3 -mx-3">
                        <p className="text-sm text-muted-foreground">
                          Modal per satuan
                        </p>
                        <p className="text-sm font-semibold text-primary">
                          ≈ {formatRupiah(Math.round(result.stock.modal_per_pack / result.stock.units_per_pack))} / pcs
                        </p>
                      </div>
                    )}
                    {result.stock.sell_per_pack && (
                      <div className="flex items-center justify-between py-2">
                        <p className="text-sm text-muted-foreground">
                          Harga Jual per {result.stock.unit || 'dus/pak'}
                        </p>
                        <p className="text-sm font-medium text-foreground">
                          {formatRupiah(result.stock.sell_per_pack)}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Total */}
                {result.type !== 'stock_add' &&
                  result.type !== 'stock_check' && (
                    <div
                      className={cn(
                        'flex items-center justify-between p-4 rounded-xl',
                        config?.bg
                      )}
                    >
                      <span className="text-sm font-medium text-foreground">
                        Total
                      </span>
                      <span className={cn('text-xl font-bold', config?.color)}>
                        {formatRupiah(
                          result.transactions?.reduce(
                            (sum, t) => sum + (t.total_amount || 0),
                            0
                          ) ||
                          result.debt?.amount ||
                          0
                        )}
                      </span>
                    </div>
                  )}

                {/* Confidence */}
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
                  <span>Tingkat keyakinan AI</span>
                  <span
                    className={cn(
                      'font-medium',
                      result.confidence >= 0.8
                        ? 'text-success'
                        : result.confidence >= 0.6
                          ? 'text-warning'
                          : 'text-destructive'
                    )}
                  >
                    {Math.round(result.confidence * 100)}%
                  </span>
                </div>
              </div>

              <DrawerFooter className="shrink-0 py-4 pb-8 border-t border-border">
                <div className="flex gap-3">
                  <button
                    onClick={onCancel}
                    onMouseDown={createRippleEffect}
                    className="flex-1 px-6 py-3.5 bg-muted text-muted-foreground rounded-xl font-medium text-[15px] ripple"
                  >
                    Batal
                  </button>
                  <button
                    onClick={onConfirm}
                    onMouseDown={createRippleEffect}
                    className="flex-1 px-6 py-3.5 bg-primary text-primary-foreground rounded-xl font-medium text-[15px] ripple"
                  >
                    Simpan
                  </button>
                </div>
              </DrawerFooter>
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
