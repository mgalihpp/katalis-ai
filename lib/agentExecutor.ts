'use client';

import { useStockStore } from '@/store/useStockStore';
import { useTransactionStore } from '@/store/useTransactionStore';

// Tool call type from OpenAI
interface ToolCall {
    id: string;
    type: 'function';
    function: {
        name: string;
        arguments: string;
    };
}

/**
 * Execute agent tool calls and return results
 */
export function executeAgentTool(
    toolCall: ToolCall,
    stockStore: ReturnType<typeof useStockStore.getState>,
    transactionStore: ReturnType<typeof useTransactionStore.getState>
): string {
    const functionName = toolCall.function.name;
    const args = JSON.parse(toolCall.function.arguments);

    try {
        if (functionName === 'check_stock') {
            const stock = stockStore.getStockByName(args.item_name);
            return JSON.stringify(
                stock
                    ? { name: stock.name, quantity: stock.quantity, unit: stock.unit, price: stock.sell_per_unit }
                    : { status: 'stok tidak ditemukan', item: args.item_name }
            );
        }

        if (functionName === 'check_debt') {
            const debtorName = args.debtor_name.toLowerCase();
            const debts = transactionStore.debts.filter(
                (d) => d.debtor_name.toLowerCase().includes(debtorName) && d.status !== 'paid'
            );

            if (debts.length === 0) {
                return JSON.stringify({ status: 'tidak ada hutang', debtor: args.debtor_name });
            }

            const totalDebt = debts.reduce((sum, d) => sum + d.remaining_amount, 0);
            return JSON.stringify({ debtor: debts[0].debtor_name, total_debt: totalDebt, count: debts.length });
        }

        if (functionName === 'get_today_summary') {
            return JSON.stringify(transactionStore.getTodaySummary());
        }

        if (functionName === 'get_low_stock') {
            const threshold = args.threshold || 5;
            const lowStocks = stockStore
                .getLowStocks()
                .filter((s) => s.quantity <= threshold)
                .map((s) => ({ name: s.name, quantity: s.quantity, min_stock: s.min_stock, unit: s.unit }));

            if (lowStocks.length === 0) {
                return JSON.stringify({ status: 'Aman', message: `Tidak ada stok di bawah ${threshold}` });
            }
            return JSON.stringify({ low_stocks: lowStocks, count: lowStocks.length });
        }

        if (functionName === 'get_top_selling') {
            const limit = args.limit || 5;
            const transactions = transactionStore.getTodayTransactions();
            const sales = transactions.filter((t) => t.type === 'sale').flatMap((t) => t.items);

            const itemSales: Record<string, number> = {};
            sales.forEach((item) => {
                itemSales[item.item_name] = (itemSales[item.item_name] || 0) + (item.quantity || 0);
            });

            const topSelling = Object.entries(itemSales)
                .map(([name, quantity]) => ({ name, quantity }))
                .sort((a, b) => b.quantity - a.quantity)
                .slice(0, limit);

            if (topSelling.length === 0) {
                return JSON.stringify({ message: 'Belum ada penjualan hari ini' });
            }
            return JSON.stringify({ top_selling: topSelling });
        }

        return JSON.stringify({ error: 'Function not found' });
    } catch (error) {
        console.error('Tool execution error:', error);
        return JSON.stringify({ error: 'Failed to execute tool' });
    }
}

/**
 * Get human-readable label for tool name
 */
export function getToolLabel(toolName: string): string {
    const labels: Record<string, string> = {
        check_stock: '🔍 Mengecek stok',
        check_debt: '💰 Mengecek hutang',
        get_today_summary: '📊 Mengambil laporan',
        get_low_stock: '📉 Cek stok menipis',
        get_top_selling: '🏆 Cek barang terlaris',
    };
    return labels[toolName] || '🔧 Memanggil fungsi';
}
