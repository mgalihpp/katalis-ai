/* eslint-disable react-hooks/static-components */
'use client';

import { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  Package,
  Wallet,
  HandCoins,
  Receipt,
} from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { ProcessingModal } from '@/components/ProcessingModal';
import { EmptyState } from '@/components/EmptyState';
import { useTransactionStore } from '@/store/useTransactionStore';
import { useVoice } from '@/context/VoiceContext';
import { formatRupiah } from '@/lib/utils';
import { cn } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from 'recharts';

type PeriodType = 'today' | 'week' | 'month';

export default function RingkasanPage() {
  const { transactions } = useTransactionStore();
  const [period, setPeriod] = useState<PeriodType>('week');
  const {
    isProcessing,
    showModal,
    currentResult,
    error,
    handleConfirm,
    handleCancel,
    handleRetry,
  } = useVoice();

  // Get transactions for selected period
  const getTransactionsForPeriod = () => {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(startDate.getMonth() - 1);
        break;
    }

    return transactions.filter((t) => new Date(t.created_at) >= startDate);
  };

  const periodTransactions = getTransactionsForPeriod();

  // Calculate summary
  const totalSales = periodTransactions
    .filter((t) => t.type === 'sale')
    .reduce((sum, t) => sum + t.total_amount, 0);

  const totalPurchases = periodTransactions
    .filter((t) => t.type === 'purchase')
    .reduce((sum, t) => sum + t.total_amount, 0);

  const totalDebtAdded = periodTransactions
    .filter((t) => t.type === 'debt_add')
    .reduce((sum, t) => sum + t.total_amount, 0);

  const totalDebtPaid = periodTransactions
    .filter((t) => t.type === 'debt_payment')
    .reduce((sum, t) => sum + t.total_amount, 0);

  const grossProfit = totalSales - totalPurchases;
  const transactionCount = periodTransactions.length;

  // Data for pie chart
  const pieData = [
    { name: 'Penjualan', value: totalSales, color: 'hsl(var(--success))' },
    { name: 'Pembelian', value: totalPurchases, color: 'hsl(var(--purchase))' },
    { name: 'Piutang', value: totalDebtAdded, color: 'hsl(var(--debt))' },
  ].filter((d) => d.value > 0);

  // Data for daily bar chart (last 7 days)
  const getDailyData = () => {
    const days = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayTransactions = transactions.filter((t) => {
        const tDate = new Date(t.created_at);
        return tDate >= date && tDate < nextDate;
      });

      const sales = dayTransactions
        .filter((t) => t.type === 'sale')
        .reduce((sum, t) => sum + t.total_amount, 0);

      days.push({
        name: date.toLocaleDateString('id-ID', { weekday: 'short' }),
        Penjualan: sales,
      });
    }

    return days;
  };

  const dailyData = getDailyData();

  // Get top items
  const itemSales: Record<string, { quantity: number; total: number }> = {};
  periodTransactions
    .filter((t) => t.type === 'sale')
    .forEach((t) => {
      t.items.forEach((item) => {
        const name = item.item_name;
        if (!itemSales[name]) {
          itemSales[name] = { quantity: 0, total: 0 };
        }
        itemSales[name].quantity += item.quantity || 1;
        itemSales[name].total += item.total_amount;
      });
    });

  const topItems = Object.entries(itemSales)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const periodLabels = {
    today: 'Hari Ini',
    week: '7 Hari',
    month: '30 Hari',
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-xl p-3 shadow-lg">
          <p className="text-xs font-medium text-foreground mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p
              key={index}
              className="text-xs font-bold"
              style={{ color: entry.color }}
            >
              {formatRupiah(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-primary">
      {/* Header */}
      <header className="sticky top-0 bg-primary z-0 px-4 pt-4 pb-6">
        <h1 className="text-xl font-bold text-white mb-4">Ringkasan</h1>

        {/* Period Selector */}
        <div className="flex gap-2 bg-white/10 p-1 rounded-xl">
          {(['today', 'week', 'month'] as PeriodType[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                'flex-1 py-2.5 rounded-lg text-sm font-medium transition-all',
                period === p
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-white/80 hover:text-white'
              )}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>
      </header>

      {/* Content Sheet */}
      <div className="relative z-10 bg-background rounded-t-3xl px-4 pt-6 pb-24 min-h-[80dvh] shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.05)]">
        {/* Profit Card - Hero */}
        <div
          className={cn(
            'p-5 rounded-2xl mb-6',
            grossProfit >= 0 ? 'bg-success/10' : 'bg-destructive/10'
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {grossProfit >= 0 ? (
                <div className="p-2 bg-success/20 rounded-xl">
                  <ArrowUpRight className="w-5 h-5 text-success" />
                </div>
              ) : (
                <div className="p-2 bg-destructive/20 rounded-xl">
                  <ArrowDownRight className="w-5 h-5 text-destructive" />
                </div>
              )}
              <span className="text-sm text-muted-foreground">Laba Kotor</span>
            </div>
            <span
              className={cn(
                'text-xs font-medium px-2 py-1 rounded-full',
                grossProfit >= 0
                  ? 'bg-success/20 text-success'
                  : 'bg-destructive/20 text-destructive'
              )}
            >
              {grossProfit >= 0 ? 'Untung' : 'Rugi'}
            </span>
          </div>
          <p
            className={cn(
              'text-3xl font-bold',
              grossProfit >= 0 ? 'text-success' : 'text-destructive'
            )}
          >
            {grossProfit < 0 && '-'}
            {formatRupiah(Math.abs(grossProfit))}
          </p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-muted/30 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-success/10 rounded-lg">
                <TrendingUp className="w-4 h-4 text-success" />
              </div>
              <span className="text-[11px] text-muted-foreground">
                Penjualan
              </span>
            </div>
            <p className="text-base font-bold text-foreground">
              {formatRupiah(totalSales)}
            </p>
          </div>
          <div className="bg-muted/30 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-purchase/10 rounded-lg">
                <TrendingDown className="w-4 h-4 text-purchase" />
              </div>
              <span className="text-[11px] text-muted-foreground">
                Pembelian
              </span>
            </div>
            <p className="text-base font-bold text-foreground">
              {formatRupiah(totalPurchases)}
            </p>
          </div>
          <div className="bg-muted/30 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-debt/10 rounded-lg">
                <HandCoins className="w-4 h-4 text-debt" />
              </div>
              <span className="text-[11px] text-muted-foreground">
                Piutang Baru
              </span>
            </div>
            <p className="text-base font-bold text-foreground">
              {formatRupiah(totalDebtAdded)}
            </p>
          </div>
          <div className="bg-muted/30 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-success/10 rounded-lg">
                <Wallet className="w-4 h-4 text-success" />
              </div>
              <span className="text-[11px] text-muted-foreground">
                Piutang Bayar
              </span>
            </div>
            <p className="text-base font-bold text-foreground">
              {formatRupiah(totalDebtPaid)}
            </p>
          </div>
        </div>

        {/* Transaction Count */}
        <div className="bg-muted/30 rounded-2xl p-4 flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Receipt className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">
              Total Transaksi
            </span>
          </div>
          <span className="text-xl font-bold text-foreground">
            {transactionCount}
          </span>
        </div>

        {/* Daily Chart */}
        <div className="bg-muted/30 rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">
              Penjualan 7 Hari
            </h3>
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData} barGap={4}>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="Penjualan"
                  fill="hsl(var(--success))"
                  radius={[6, 6, 6, 6]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart - Transaction Distribution */}
        {pieData.length > 0 && (
          <div className="bg-muted/30 rounded-2xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">Distribusi</h3>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-32 h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={55}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2 ml-4">
                {pieData.map((entry, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-xs text-muted-foreground">
                        {entry.name}
                      </span>
                    </div>
                    <span className="text-xs font-medium text-foreground ml-4">
                      {formatRupiah(entry.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Top Items */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Package className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground">
              Produk Terlaris
            </h2>
          </div>
          {topItems.length === 0 ? (
            <EmptyState
              icon={BarChart3}
              title="Belum Ada Data"
              description="Data akan muncul setelah ada penjualan"
              compact
            />
          ) : (
            <div className="space-y-2">
              {topItems.map((item, index) => (
                <div
                  key={item.name}
                  className="flex items-center gap-3 bg-muted/30 rounded-2xl p-3"
                >
                  <div
                    className={cn(
                      'w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold',
                      index === 0
                        ? 'bg-warning/20 text-warning'
                        : index === 1
                        ? 'bg-muted text-muted-foreground'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {item.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {item.quantity}x terjual
                    </p>
                  </div>
                  <p className="text-sm font-bold text-foreground">
                    {formatRupiah(item.total)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

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
