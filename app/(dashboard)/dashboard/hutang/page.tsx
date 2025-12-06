'use client'

import { useState } from 'react';
import { HandCoins, Wallet, Clock, CheckCircle } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { DebtCard } from '@/components/DebtCard';
import { DebtDetailSheet } from '@/components/DebtDetailSheet';
import { ProcessingModal } from '@/components/ProcessingModal';
import { EmptyState } from '@/components/EmptyState';
import { useTransactionStore } from '@/store/useTransactionStore';
import { useVoice } from '@/context/VoiceContext';
import { formatRupiah } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { Debt } from '@/types';

type FilterType = 'all' | 'pending' | 'partial' | 'paid';

const filterOptions: { value: FilterType; label: string; icon: typeof HandCoins }[] = [
    { value: 'all', label: 'Semua', icon: HandCoins },
    { value: 'pending', label: 'Belum Bayar', icon: Clock },
    { value: 'partial', label: 'Sebagian', icon: Wallet },
    { value: 'paid', label: 'Lunas', icon: CheckCircle },
];

export default function HutangPage() {
    const { debts } = useTransactionStore();
    const [filter, setFilter] = useState<FilterType>('all');
    const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
    const {
        isProcessing,
        showModal,
        currentResult,
        error,
        handleConfirm,
        handleCancel,
        handleRetry
    } = useVoice();

    const filteredDebts = debts.filter((d) => {
        if (filter === 'all') return true;
        return d.status === filter;
    });

    // Calculate summary
    const totalDebt = debts.reduce((sum, d) => sum + d.total_amount, 0);
    const totalPaid = debts.reduce((sum, d) => sum + d.paid_amount, 0);
    const totalRemaining = debts.reduce((sum, d) => sum + d.remaining_amount, 0);

    return (
        <div className="min-h-screen bg-primary">
            {/* Header */}
            <header className="sticky top-0 bg-primary z-0 px-4 py-4 shadow-none">
                <h1 className="text-xl font-bold text-white mb-4">Daftar Piutang</h1>

                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/10">
                        <p className="text-xs text-white/80 mb-1">Total Piutang</p>
                        <p className="text-sm font-bold text-white">{formatRupiah(totalDebt)}</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/10">
                        <p className="text-xs text-white/80 mb-1">Sudah Dibayar</p>
                        <p className="text-sm font-bold text-white">{formatRupiah(totalPaid)}</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/10">
                        <p className="text-xs text-white/80 mb-1">Belum Dibayar</p>
                        <p className="text-sm font-bold text-white">{formatRupiah(totalRemaining)}</p>
                    </div>
                </div>

                {/* Filter Pills */}
                <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
                    {filterOptions.map((option) => {
                        const Icon = option.icon;
                        const isActive = filter === option.value;
                        return (
                            <button
                                key={option.value}
                                onClick={() => setFilter(option.value)}
                                className={cn(
                                    'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                                    isActive
                                        ? 'bg-white text-primary'
                                        : 'bg-white/10 text-white hover:bg-white/20'
                                )}
                            >
                                <Icon className="w-4 h-4" />
                                {option.label}
                            </button>
                        );
                    })}
                </div>
            </header>

            {/* Debts List Sheet */}
            <div className="relative z-10 bg-background rounded-t-3xl px-4 pt-6 pb-24 min-h-[80dvh] shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.05)]">
                {filteredDebts.length === 0 ? (
                    <EmptyState
                        icon={HandCoins}
                        title="Tidak Ada Piutang"
                        description={
                            filter !== 'all'
                                ? 'Tidak ada piutang dengan status ini'
                                : 'Catat piutang dengan tombol mikrofon  di bawah'
                        }
                    />
                ) : (
                    <div className="space-y-3">
                        {filteredDebts.map((debt) => (
                            <DebtCard
                                key={debt.id}
                                debt={debt}
                                onClick={() => setSelectedDebt(debt)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Debt Detail Sheet */}
            <DebtDetailSheet
                debt={selectedDebt}
                isOpen={!!selectedDebt}
                onClose={() => setSelectedDebt(null)}
            />

            {/* Processing Modal */}
            <ProcessingModal
                isOpen={showModal}
                isProcessing={isProcessing}
                transcript={currentResult?.transcript || null}
                result={currentResult?.parsed || null}
                error={error}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
                onRetry={handleRetry}
            />

            <BottomNav />
        </div>
    );
}
