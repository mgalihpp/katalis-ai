import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { StockItem, StockMovement, ParsedVoiceResult } from '@/types';

interface StockStore {
  stocks: StockItem[];
  movements: StockMovement[];

  // Stock actions
  addStock: (result: ParsedVoiceResult) => void;
  updateStock: (id: string, updates: Partial<StockItem>) => void;
  deleteStock: (id: string) => void;
  updateStockFromTransaction: (itemName: string, quantity: number, type: 'sale' | 'purchase', unit?: string, price?: number) => void;
  getStockByName: (name: string) => StockItem | undefined;
  getAllStocks: () => StockItem[];
  getLowStocks: () => StockItem[];
  adjustStock: (stockId: string, quantity: number, reason: string) => void;
  getMovementsByStockId: (stockId: string) => StockMovement[];
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function normalizeItemName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

export const useStockStore = create<StockStore>()(
  persist(
    (set, get) => ({
      stocks: [],
      movements: [],

      addStock: (result: ParsedVoiceResult) => {
        if (result.type !== 'stock_add' || !result.stock?.item_name) return;

        const now = new Date().toISOString();
        const itemName = result.stock.item_name;
        const normalizedName = normalizeItemName(itemName);
        const quantity = result.stock.quantity || 0;
        const unit = result.stock.unit || 'pcs';

        set((state) => {
          const existingIndex = state.stocks.findIndex(
            s => s.normalized_name === normalizedName
          );

          let updatedStocks = [...state.stocks];
          let stockId: string;

          if (existingIndex >= 0) {
            // Update existing stock
            const existing = updatedStocks[existingIndex];
            stockId = existing.id;
            updatedStocks[existingIndex] = {
              ...existing,
              quantity: existing.quantity + quantity,
              buy_price: result.stock?.buy_price ?? existing.buy_price,
              sell_price: result.stock?.sell_price ?? existing.sell_price,
              updated_at: now,
            };
          } else {
            // Create new stock
            stockId = generateId();
            const newStock: StockItem = {
              id: stockId,
              name: itemName,
              normalized_name: normalizedName,
              quantity,
              unit,
              buy_price: result.stock?.buy_price ?? null,
              sell_price: result.stock?.sell_price ?? null,
              min_stock: 5,
              created_at: now,
              updated_at: now,
            };
            updatedStocks.push(newStock);
          }

          // Record movement
          const movement: StockMovement = {
            id: generateId(),
            stock_id: stockId,
            type: 'in',
            quantity,
            reason: 'Tambah stok manual',
            reference_id: null,
            created_at: now,
          };

          return {
            stocks: updatedStocks,
            movements: [movement, ...state.movements],
          };
        });
      },

      updateStockFromTransaction: (itemName, quantity, type, unit = 'pcs', price) => {
        const normalizedName = normalizeItemName(itemName);
        const now = new Date().toISOString();

        set((state) => {
          const existingIndex = state.stocks.findIndex(
            s => s.normalized_name === normalizedName
          );

          let updatedStocks = [...state.stocks];
          let stockId: string;

          if (existingIndex >= 0) {
            // Update existing stock
            const existing = updatedStocks[existingIndex];
            stockId = existing.id;
            const newQuantity = type === 'sale'
              ? Math.max(0, existing.quantity - quantity)
              : existing.quantity + quantity;

            updatedStocks[existingIndex] = {
              ...existing,
              quantity: newQuantity,
              buy_price: type === 'purchase' && price ? price : existing.buy_price,
              updated_at: now,
            };
          } else {
            // Create new stock entry (only for purchases)
            if (type === 'purchase') {
              stockId = generateId();
              const newStock: StockItem = {
                id: stockId,
                name: itemName,
                normalized_name: normalizedName,
                quantity,
                unit,
                buy_price: price ?? null,
                sell_price: null,
                min_stock: 5,
                created_at: now,
                updated_at: now,
              };
              updatedStocks.push(newStock);
            } else {
              // Sale without existing stock - still record it with 0 quantity
              stockId = generateId();
              const newStock: StockItem = {
                id: stockId,
                name: itemName,
                normalized_name: normalizedName,
                quantity: 0,
                unit,
                buy_price: null,
                sell_price: price ?? null,
                min_stock: 5,
                created_at: now,
                updated_at: now,
              };
              updatedStocks.push(newStock);
            }
          }

          // Record movement
          const movement: StockMovement = {
            id: generateId(),
            stock_id: stockId,
            type: type === 'sale' ? 'out' : 'in',
            quantity,
            reason: type === 'sale' ? 'Penjualan' : 'Pembelian/Kulakan',
            reference_id: null,
            created_at: now,
          };

          return {
            stocks: updatedStocks,
            movements: [movement, ...state.movements],
          };
        });
      },

      getStockByName: (name: string) => {
        const normalizedName = normalizeItemName(name);
        return get().stocks.find(s => s.normalized_name === normalizedName);
      },

      getAllStocks: () => {
        return get().stocks;
      },

      getLowStocks: () => {
        return get().stocks.filter(s => s.quantity <= s.min_stock);
      },

      updateStock: (id: string, updates: Partial<StockItem>) => {
        const now = new Date().toISOString();
        set((state) => ({
          stocks: state.stocks.map(s =>
            s.id === id ? { ...s, ...updates, updated_at: now } : s
          ),
        }));
      },

      deleteStock: (id: string) => {
        set((state) => ({
          stocks: state.stocks.filter(s => s.id !== id),
          movements: state.movements.filter(m => m.stock_id !== id),
        }));
      },

      adjustStock: (stockId: string, quantity: number, reason: string) => {
        const now = new Date().toISOString();

        set((state) => {
          const stockIndex = state.stocks.findIndex(s => s.id === stockId);
          if (stockIndex < 0) return state;

          const stock = state.stocks[stockIndex];
          const updatedStocks = [...state.stocks];
          updatedStocks[stockIndex] = {
            ...stock,
            quantity: Math.max(0, quantity),
            updated_at: now,
          };

          const movement: StockMovement = {
            id: generateId(),
            stock_id: stockId,
            type: 'adjustment',
            quantity: quantity - stock.quantity,
            reason,
            reference_id: null,
            created_at: now,
          };

          return {
            stocks: updatedStocks,
            movements: [movement, ...state.movements],
          };
        });
      },

      getMovementsByStockId: (stockId: string) => {
        return get().movements.filter(m => m.stock_id === stockId);
      },
    }),
    {
      name: 'kasir-suara-stock',
    }
  )
);
