"use client"

import { useState } from 'react';
import { History, Search } from 'lucide-react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { TransactionDetailCard } from '@/components/TransactionDetailCard';
import { TransactionDetailSheet } from '@/components/TransactionDetailSheet';
import { DebtDetailSheet } from '@/components/DebtDetailSheet';
import { ProcessingModal } from '@/components/ProcessingModal';
import { EmptyState } from '@/components/EmptyState';
import { useTransactionStore } from '@/store/useTransactionStore';
import { useVoice } from '@/context/VoiceContext';
import { cn } from '@/lib/utils';
import type { Transaction, TransactionType, Debt } from '@/types';

const filterOptions: { value: TransactionType | 'all'; label: string }[] = [
    { value: 'all', label: 'Semua' },
    { value: 'sale', label: 'Penjualan' },
    { value: 'purchase', label: 'Pembelian' },
    { value: 'debt_add', label: 'Hutang' },
    { value: 'debt_payment', label: 'Bayar' },
];

export default function RiwayatPage() {
    const { transactions, debts } = useTransactionStore();
    const [filter, setFilter] = useState<TransactionType | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
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

    const filteredTransactions = transactions.filter((t) => {
        const matchesFilter = filter === 'all' || t.type === filter;
        const matchesSearch = searchQuery === '' ||
            t.raw_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.items.some(item => item.item_name.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesFilter && matchesSearch;
    });

    // Group by date
    const groupedTransactions = filteredTransactions.reduce((groups, transaction) => {
        const date = new Date(transaction.created_at).toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(transaction);
        return groups;
    }, {} as Record<string, Transaction[]>);

    // Handle transaction click - route debt transactions to DebtDetailSheet
    const handleTransactionClick = (transaction: Transaction) => {
        if (transaction.type === 'debt_add' || transaction.type === 'debt_payment') {
            const debtorNameFromItems = transaction.items[0]?.item_name;

            let relatedDebt = debts.find(d =>
                d.debtor_name.toLowerCase() === debtorNameFromItems?.toLowerCase()
            );

            if (!relatedDebt && (transaction.note || transaction.raw_text)) {
                const searchText = (transaction.note || transaction.raw_text).toLowerCase();
                relatedDebt = debts.find(d =>
                    searchText.includes(d.debtor_name.toLowerCase())
                );
            }

            if (relatedDebt) {
                setSelectedDebt(relatedDebt);
            }
        } else {
            setSelectedTransaction(transaction);
        }
    };

    return (
        <div className="min-h-screen bg-primary">
            {/* Header */}
            <div className="sticky top-0 z-0">
                <Header storeName="Riwayat Transaksi" variant="light" />
            </div>

            {/* Main Content Sheet */}
            <div className="relative z-10 bg-background rounded-t-3xl px-4 pt-6 pb-24 min-h-[80dvh] shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.05)]">
                {/* Search */}
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Cari transaksi..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                </div>

                {/* Filter Pills */}
                <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 mb-6">
                    {filterOptions.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => setFilter(option.value)}
                            className={cn(
                                'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                                filter === option.value
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-card text-muted-foreground border border-border'
                            )}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>

                {/* Transactions List */}
                {filteredTransactions.length === 0 ? (
                    <EmptyState
                        icon={History}
                        title="Tidak Ada Transaksi"
                        description={
                            searchQuery || filter !== 'all'
                                ? "Tidak ditemukan transaksi yang sesuai filter"
                                : "Mulai catat transaksi dengan suara di tombol bawah"
                        }
                    />
                ) : (
                    <div className="space-y-6">
                        {Object.entries(groupedTransactions).map(([date, dayTransactions]) => (
                            <div key={date}>
                                <h3 className="text-sm font-medium text-muted-foreground mb-3">{date}</h3>
                                <div className="space-y-3">
                                    {dayTransactions.map((transaction) => (
                                        <div
                                            key={transaction.id}
                                            onClick={() => handleTransactionClick(transaction)}
                                            className="cursor-pointer"
                                        >
                                            <TransactionDetailCard transaction={transaction} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Transaction Detail Sheet */}
            <TransactionDetailSheet
                transactionId={selectedTransaction?.id || ''}
                isOpen={!!selectedTransaction}
                onClose={() => setSelectedTransaction(null)}
            />

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
