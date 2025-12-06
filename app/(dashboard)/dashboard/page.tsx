"use client";

import { useState, useEffect, useCallback } from 'react';
import { Banknote, ShoppingCart, HandCoins, TrendingUp, TrendingDown, Receipt, Crosshair } from 'lucide-react';
import { useTransactionStore } from '@/store/useTransactionStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { Transaction, Debt, OCRReceiptResult } from '@/types';
import { useVoice } from '@/context/VoiceContext';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { EmptyState } from '@/components/EmptyState';
import { ProcessingModal } from '@/components/ProcessingModal';
import { StatCard } from '@/components/StatCard';
import { TransactionDetailCard } from '@/components/TransactionDetailCard';
import { TransactionDetailSheet } from '@/components/TransactionDetailSheet';
import { DebtDetailSheet } from '@/components/DebtDetailSheet';
import { TargetEditDrawer } from '@/components/TargetEditDrawer';
import { OcrScannerDrawer } from '@/components/OcrScannerDrawer';
import { OcrResultDrawer } from '@/components/OcrResultDrawer';
import { AgentDrawer } from '@/components/AgentDrawer';
import { parseOCRNumber } from '@/lib/ocrService';
import { toast } from 'sonner';
import Link from 'next/link';

export default function DashboardPage() {
    const { getTodayTransactions, getTodaySummary, debts, transactions, addTransaction } = useTransactionStore();
    const { targetAmount, targetPeriod } = useSettingsStore();
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
    const [showTargetEdit, setShowTargetEdit] = useState(false);

    // OCR State
    const [showOcrScanner, setShowOcrScanner] = useState(false);
    const [showOcrResult, setShowOcrResult] = useState(false);
    const [ocrResult, setOcrResult] = useState<OCRReceiptResult | null>(null);
    const [isOcrProcessing, setIsOcrProcessing] = useState(false);

    // Agent State
    const [showAgent, setShowAgent] = useState(false);

    const {
        isProcessing,
        showModal,
        currentResult,
        error,
        handleConfirm,
        handleCancel,
        handleRetry
    } = useVoice();

    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // OCR Handlers
    const handleScanClick = useCallback(() => {
        setShowOcrScanner(true);
    }, []);

    const handleOcrImageCaptured = useCallback(async (base64: string) => {
        setIsOcrProcessing(true);

        try {
            // Call secure API route instead of direct API call
            const response = await fetch('/api/ocr', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageData: base64 }),
            });

            const result = await response.json();

            if (response.ok && result.success && result.data) {
                setOcrResult(result.data);
                setShowOcrScanner(false);
                setShowOcrResult(true);
            } else {
                toast.error(result.error || 'Gagal memproses OCR');
            }
        } catch (err) {
            console.error('OCR Error:', err);
            toast.error('Terjadi kesalahan saat memproses gambar');
        } finally {
            setIsOcrProcessing(false);
        }
    }, []);

    const handleOcrConfirm = useCallback((result: OCRReceiptResult) => {
        // Convert OCR result to ParsedVoiceResult format for addTransaction
        const items = (result.items || []).map((item) => ({
            item_name: item.name,
            quantity: parseOCRNumber(item.quantity),
            unit: null,
            price_per_unit: parseOCRNumber(item.unit_price),
            total_amount: parseOCRNumber(item.total_price),
        }));

        const totalAmount = items.reduce((sum, item) => sum + item.total_amount, 0);

        // Create transaction via store
        addTransaction({
            type: 'purchase', // OCR receipts are typically purchases
            transactions: items,
            debt: null,
            stock: null,
            note: result.merchant?.name ? `Belanja di ${result.merchant.name}` : null,
            raw_text: `OCR Scan - ${result.items?.length || 0} items`,
            confidence: result.metadata?.confidence_score || 0.8,
        });

        toast.success('Transaksi berhasil disimpan!');
        setShowOcrResult(false);
        setOcrResult(null);
    }, [addTransaction]);

    const todayTransactions = getTodayTransactions();
    const summary = getTodaySummary();
    const pendingDebts = debts.filter(d => d.status !== 'paid');
    const totalPendingDebt = pendingDebts.reduce((sum, d) => sum + d.remaining_amount, 0);

    // Calculate current sales based on period
    const now = new Date();
    const periodSales = transactions
        .filter(t => {
            if (t.type !== 'sale') return false;
            const tDate = new Date(t.created_at);

            switch (targetPeriod) {
                case 'daily':
                    return tDate.toDateString() === now.toDateString();
                case 'weekly':
                    const weekStart = new Date(now);
                    weekStart.setDate(now.getDate() - now.getDay());
                    weekStart.setHours(0, 0, 0, 0);
                    return tDate >= weekStart;
                case 'monthly':
                    return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
                case 'yearly':
                    return tDate.getFullYear() === now.getFullYear();
                default:
                    return false;
            }
        })
        .reduce((sum, t) => sum + t.total_amount, 0);

    // Get recent history (last 5 transactions, excluding today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const recentHistory = transactions
        .filter(t => new Date(t.created_at) < today)
        .slice(0, 5);

    // Handle transaction click - route debt transactions to DebtDetailSheet
    const handleTransactionClick = (transaction: Transaction) => {
        if (transaction.type === 'debt_add' || transaction.type === 'debt_payment') {
            // For debt transactions, find related debt by:
            // 1. Checking if debtor name is in the items
            // 2. Or searching through debts to find matching name in transaction note/raw_text
            const debtorNameFromItems = transaction.items[0]?.item_name;

            let relatedDebt = debts.find(d =>
                d.debtor_name.toLowerCase() === debtorNameFromItems?.toLowerCase()
            );

            // If not found in items, try to match from note or raw_text
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

    if (!isMounted) {
        return null; // Prevent hydration mismatch
    }

    return (
        <div className="min-h-screen bg-primary">
            <div className="sticky top-0 z-0">
                <Header
                    variant="light"
                    onScanClick={handleScanClick}
                    onAgentClick={() => setShowAgent(true)}
                />

                {/* Stats Grid */}
                <div className="px-4 mb-6">
                    <div className="grid grid-cols-2 gap-3">
                        <div onClick={() => setShowTargetEdit(true)} className="col-span-2 cursor-pointer active:scale-[0.98] transition-transform">
                            <StatCard
                                title={`Target ${targetPeriod === 'daily' ? 'Harian' : targetPeriod === 'weekly' ? 'Mingguan' : targetPeriod === 'monthly' ? 'Bulanan' : 'Tahunan'}`}
                                value={periodSales}
                                icon={Crosshair}
                                variant="default"
                                progress={{ current: periodSales, target: targetAmount }}
                                fullWidth
                            />
                        </div>
                        <StatCard
                            title="Penjualan Hari Ini"
                            value={summary.totalSales}
                            icon={Banknote}
                            variant="sale"
                        />
                        <StatCard
                            title="Pembelian Hari Ini"
                            value={summary.totalPurchases}
                            icon={ShoppingCart}
                            variant="purchase"
                        />
                        <StatCard
                            title="Total Piutang"
                            value={totalPendingDebt}
                            icon={HandCoins}
                            variant="debt"
                        />
                        <StatCard
                            title="Laba Kotor"
                            value={summary.totalSales - summary.totalPurchases}
                            icon={summary.totalSales - summary.totalPurchases >= 0 ? TrendingUp : TrendingDown}
                            variant={summary.totalSales - summary.totalPurchases >= 0 ? 'success' : 'danger'}
                        />
                    </div>
                </div>
            </div>

            {/* Bottom Section: Transactions & History */}
            <div className="relative z-10 bg-background rounded-t-3xl px-4 pt-6 pb-24 min-h-[50dvh] shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.05)]">
                {/* Today's Transactions */}
                <div className="mb-6">
                    <h2 className="text-lg font-bold text-foreground mb-3">Transaksi Hari Ini</h2>

                    {todayTransactions.length === 0 ? (
                        <EmptyState
                            icon={Receipt}
                            title="Belum Ada Transaksi"
                            description="Tekan tombol mikrofon di bawah dan ucapkan transaksi Anda"
                        />
                    ) : (
                        <div className="space-y-3">
                            {todayTransactions.slice(0, 5).map((transaction) => (
                                <div
                                    key={transaction.id}
                                    onClick={() => handleTransactionClick(transaction)}
                                    className="cursor-pointer"
                                >
                                    <TransactionDetailCard transaction={transaction} />
                                </div>
                            ))}
                            {todayTransactions.length > 5 && (
                                <Link
                                    href="/dashboard/riwayat"
                                    className="block text-center text-sm text-primary font-medium py-2 hover:underline"
                                >
                                    Lihat {todayTransactions.length - 5} transaksi lainnya →
                                </Link>
                            )}
                        </div>
                    )}
                </div>

                {/* Recent History */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-bold text-foreground">Riwayat Sebelumnya</h2>
                        <Link
                            href="/dashboard/riwayat"
                            className="text-sm text-primary font-medium hover:underline flex items-center gap-1"
                        >
                            Lihat Semua
                        </Link>
                    </div>

                    {recentHistory.length === 0 ? (
                        <EmptyState
                            icon={Receipt}
                            title="Belum Ada Riwayat"
                            description="Belum ada riwayat transaksi sebelumnya"
                        />
                    ) : (
                        <div className="space-y-3">
                            {recentHistory.map((transaction) => (
                                <div
                                    key={transaction.id}
                                    onClick={() => handleTransactionClick(transaction)}
                                    className="cursor-pointer"
                                >
                                    <TransactionDetailCard transaction={transaction} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Transaction Detail Sheet */}
            <TransactionDetailSheet
                transactionId={selectedTransaction?.id || null}
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

            {/* Target Edit Drawer */}
            <TargetEditDrawer
                isOpen={showTargetEdit}
                onClose={() => setShowTargetEdit(false)}
            />

            {/* OCR Scanner Drawer */}
            <OcrScannerDrawer
                isOpen={showOcrScanner}
                onClose={() => setShowOcrScanner(false)}
                onImageCaptured={handleOcrImageCaptured}
                isProcessing={isOcrProcessing}
            />

            {/* OCR Result Drawer */}
            <OcrResultDrawer
                isOpen={showOcrResult}
                onClose={() => {
                    setShowOcrResult(false);
                    setOcrResult(null);
                    setShowOcrScanner(true); // Reopen scanner when cancelled
                }}
                result={ocrResult}
                onConfirm={handleOcrConfirm}
            />

            {/* Agent Drawer */}
            <AgentDrawer
                isOpen={showAgent}
                onClose={() => setShowAgent(false)}
            />

            <BottomNav />
        </div>
    );
}
