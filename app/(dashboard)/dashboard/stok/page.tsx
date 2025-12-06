"use client";

import { useState } from 'react';
import { Package, AlertTriangle, Search } from 'lucide-react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { StockCard } from '@/components/StockCard';
import { StockDetailSheet } from '@/components/StockDetailSheet';
import { ProcessingModal } from '@/components/ProcessingModal';
import { EmptyState } from '@/components/EmptyState';
import { useStockStore } from '@/store/useStockStore';
import { useVoice } from '@/context/VoiceContext';
import { cn } from '@/lib/utils';
import type { StockItem } from '@/types';

type FilterType = 'all' | 'low' | 'out';

export default function StockPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<FilterType>('all');
    const [selectedStock, setSelectedStock] = useState<StockItem | null>(null);

    const { stocks, getLowStocks } = useStockStore();
    const {
        isProcessing,
        showModal,
        currentResult,
        error,
        handleConfirm,
        handleCancel,
        handleRetry
    } = useVoice();

    const lowStocks = getLowStocks();
    const outOfStockCount = stocks.filter(s => s.quantity === 0).length;

    // Filter stocks
    const filteredStocks = stocks.filter(stock => {
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            if (!stock.name.toLowerCase().includes(query)) {
                return false;
            }
        }

        if (filter === 'low') {
            return stock.quantity <= stock.min_stock && stock.quantity > 0;
        }
        if (filter === 'out') {
            return stock.quantity === 0;
        }

        return true;
    });

    // Sort: out of stock first, then low stock, then by name
    const sortedStocks = [...filteredStocks].sort((a, b) => {
        if (a.quantity === 0 && b.quantity !== 0) return -1;
        if (a.quantity !== 0 && b.quantity === 0) return 1;
        if (a.quantity <= a.min_stock && b.quantity > b.min_stock) return -1;
        if (a.quantity > a.min_stock && b.quantity <= b.min_stock) return 1;
        return a.name.localeCompare(b.name);
    });

    const filters: { key: FilterType; label: string; count?: number }[] = [
        { key: 'all', label: 'Semua', count: stocks.length },
        { key: 'low', label: 'Stok Rendah', count: lowStocks.length },
        { key: 'out', label: 'Habis', count: outOfStockCount },
    ];

    return (
        <div className="min-h-screen bg-primary">
            <header className="sticky top-0 bg-primary z-0 px-4 pt-4">
                <h1 className="text-xl font-bold text-white mb-4">Stok Barang</h1>


            </header>

            {/* Main Content Sheet */}
            <div className="relative z-10 bg-background rounded-t-3xl px-4 pt-6 pb-24 min-h-[90dvh] shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.05)]">
                {/* Stats */}
                <div className="mb-6">
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-primary/10 rounded-xl p-3 text-center">
                            <Package className="w-5 h-5 text-primary mx-auto mb-1" />
                            <p className="text-lg font-bold text-foreground">{stocks.length}</p>
                            <p className="text-xs text-muted-foreground">Total Item</p>
                        </div>
                        <div className="bg-accent/10 rounded-xl p-3 text-center">
                            <AlertTriangle className="w-5 h-5 text-accent mx-auto mb-1" />
                            <p className="text-lg font-bold text-foreground">{lowStocks.length}</p>
                            <p className="text-xs text-muted-foreground">Stok Rendah</p>
                        </div>
                        <div className="bg-destructive/10 rounded-xl p-3 text-center">
                            <Package className="w-5 h-5 text-destructive mx-auto mb-1" />
                            <p className="text-lg font-bold text-foreground">{outOfStockCount}</p>
                            <p className="text-xs text-muted-foreground">Habis</p>
                        </div>
                    </div>
                </div>

                {/* Search */}
                <div className="mb-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Cari barang..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>
                </div>

                {/* Filters */}
                <div className="mb-4">
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        {filters.map((f) => (
                            <button
                                key={f.key}
                                onClick={() => setFilter(f.key)}
                                className={cn(
                                    'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                                    filter === f.key
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-card text-muted-foreground border border-border'
                                )}
                            >
                                {f.label}
                                {f.count !== undefined && (
                                    <span className="ml-1.5 opacity-70">({f.count})</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Stock List */}
                <div className="space-y-3">
                    {sortedStocks.length === 0 ? (
                        <EmptyState
                            icon={Package}
                            title={searchQuery ? 'Tidak ditemukan' : 'Belum ada stok'}
                            description={
                                searchQuery
                                    ? `Tidak ada barang dengan nama "${searchQuery}"`
                                    : 'Tambahkan stok dengan menekan tombol mikrofon di bawah'
                            }
                        />
                    ) : (
                        sortedStocks.map((stock) => (
                            <StockCard
                                key={stock.id}
                                stock={stock}
                                onClick={() => setSelectedStock(stock)}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* Stock Detail Sheet */}
            <StockDetailSheet
                stockId={selectedStock?.id || ''}
                isOpen={!!selectedStock}
                onClose={() => setSelectedStock(null)}
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
