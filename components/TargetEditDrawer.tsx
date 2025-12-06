'use client';

import { useState, useEffect } from 'react';
import { Crosshair, Calendar } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Label } from '@/components/ui/label';
import {
  useSettingsStore,
  periodLabels,
  TargetPeriod,
} from '@/store/useSettingsStore';
import { formatRupiah } from '@/lib/utils';
import { toast } from 'sonner';
import { createRippleEffect } from '@/hooks/useRipple';

interface TargetEditDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const periods: TargetPeriod[] = ['daily', 'weekly', 'monthly', 'yearly'];

const presetsByPeriod: Record<TargetPeriod, number[]> = {
  daily: [500000, 1000000, 2000000, 5000000],
  weekly: [3000000, 5000000, 10000000, 20000000],
  monthly: [10000000, 25000000, 50000000, 100000000],
  yearly: [100000000, 250000000, 500000000, 1000000000],
};

export function TargetEditDrawer({ isOpen, onClose }: TargetEditDrawerProps) {
  const { targetAmount, targetPeriod, setTarget } = useSettingsStore();
  const [amount, setAmount] = useState(targetAmount);
  const [period, setPeriod] = useState<TargetPeriod>(targetPeriod);

  // Reset form when drawer opens
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAmount(targetAmount);
      setPeriod(targetPeriod);
    }
  }, [isOpen, targetAmount, targetPeriod]);

  const handleSave = () => {
    if (amount < 0) {
      toast.error('Target tidak boleh negatif');
      return;
    }
    setTarget(amount, period);
    toast.success(
      `Target ${periodLabels[period].toLowerCase()} berhasil diubah`
    );
    onClose();
  };

  const currentPresets = presetsByPeriod[period];

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="max-h-[90dvh]">
        <div
          className="mx-auto w-full max-w-lg flex flex-col overflow-hidden"
          style={{ maxHeight: '90dvh' }}
        >
          <DrawerHeader className="shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Crosshair className="w-6 h-6 text-primary" />
              </div>
              <div>
                <DrawerTitle className="text-lg text-left">
                  Ubah Target
                </DrawerTitle>
                <p className="text-sm text-muted-foreground">
                  Set target penjualan
                </p>
              </div>
            </div>
          </DrawerHeader>

          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-5">
            {/* Period Selection */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Periode Target</p>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
                {periods.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    onMouseDown={createRippleEffect}
                    className={`py-2.5 px-2 rounded-xl text-xs font-medium transition-colors ripple ${
                      period === p
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground hover:bg-muted/80'
                    }`}
                  >
                    {periodLabels[p]}
                  </button>
                ))}
              </div>
            </div>

            {/* Current Target Display */}
            <div className="p-4 bg-primary text-primary-foreground rounded-2xl text-center">
              <p className="text-sm mb-1">
                Target {periodLabels[period]} Saat Ini
              </p>
              <p className="text-2xl font-bold">{formatRupiah(targetAmount)}</p>
            </div>

            {/* Input */}
            <div>
              <Label className="text-xs text-muted-foreground">
                Target Baru
              </Label>
              <CurrencyInput
                value={amount}
                onChange={setAmount}
                className="mt-1 bg-muted/50 text-lg"
                placeholder="0"
              />
            </div>

            {/* Quick Presets */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Pilih Cepat</p>
              <div className="grid grid-cols-2 gap-2">
                {currentPresets.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setAmount(preset)}
                    onMouseDown={createRippleEffect}
                    className={`py-2.5 px-3 rounded-xl text-sm font-medium transition-colors ripple ${
                      amount === preset
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground hover:bg-muted/80'
                    }`}
                  >
                    {formatRupiah(preset)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="shrink-0 px-6 py-4 pb-8 bg-background border-t border-border">
            <div className="flex gap-3">
              <button
                onClick={onClose}
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
        </div>
      </DrawerContent>
    </Drawer>
  );
}
