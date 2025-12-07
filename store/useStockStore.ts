import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { StockItem, StockMovement, ParsedVoiceResult, Transaction, TransactionItem } from '@/types';

interface StockStore {
  stocks: StockItem[];
  movements: StockMovement[];

  // Stock actions
  addStock: (result: ParsedVoiceResult) => void;
  updateStock: (id: string, updates: Partial<StockItem>) => void;
  deleteStock: (id: string) => void;
  updateStockFromTransaction: (itemName: string, quantity: number, type: 'sale' | 'purchase', unit?: string, price?: number, unitsPerPack?: number) => void;
  reverseStockFromTransaction: (itemName: string, quantity: number, type: 'sale' | 'purchase', unit?: string) => void;
  updateStockPrice: (result: ParsedVoiceResult) => boolean; // Returns true if stock found and updated
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

// Helper: Normalize unit names from speech-to-text variations
function normalizeUnit(unit: string): string {
  const normalized = unit.toLowerCase().trim();
  const unitMap: Record<string, string> = {
    'bus': 'dus',
    'dos': 'dus',
    'bos': 'dus',
    'doos': 'dus',
    'box': 'dus',
    'pack': 'pak',
    'pek': 'pak',
    'pax': 'pak',
    'piece': 'pcs',
    'pieces': 'pcs',
    'biji': 'pcs',
    'buah': 'pcs',
    'butir': 'pcs',
    'batang': 'btg',
    'lembar': 'lbr',
    'kilogram': 'kg',
    'kilo': 'kg',
    'gram': 'gr',
    'liter': 'ltr',
    'sachet': 'sct',
    'saset': 'sct',
  };
  return unitMap[normalized] || normalized;
}

// Helper: Check if unit is pack/bulk type (dus, pak, box, etc.)
function isPackUnit(unit: string): boolean {
  const packUnits = ['dus', 'pak', 'box', 'karton', 'lusin', 'krat', 'peti', 'rim', 'ball', 'sak'];
  const normalized = normalizeUnit(unit);
  return packUnits.includes(normalized);
}

// Helper: Check if unit is bulk weight/volume type (kg, ltr, gr, etc.)
// These units should NOT be converted to pcs - they are the primary unit
function isBulkUnit(unit: string): boolean {
  const bulkUnits = ['kg', 'gr', 'ltr', 'ml', 'kilo', 'kilogram', 'gram', 'liter', 'ons', 'kuintal'];
  const normalized = normalizeUnit(unit);
  return bulkUnits.includes(normalized);
}

// Helper: Determine the appropriate small unit based on product type
function determineUnitUnit(unit: string): string {
  const normalizedUnit = normalizeUnit(unit);
  // If it's a bulk unit (kg, ltr, etc.), use that as the unit_unit
  if (isBulkUnit(normalizedUnit)) {
    return normalizedUnit;
  }
  // Otherwise default to pcs for packaged products
  return 'pcs';
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
        const unit = normalizeUnit(result.stock.unit || 'pcs');

        set((state) => {
          const existingIndex = state.stocks.findIndex(
            s => s.normalized_name === normalizedName
          );

          const updatedStocks = [...state.stocks];
          let stockId: string;

          if (existingIndex >= 0) {
            // Update existing stock
            const existing = updatedStocks[existingIndex];
            stockId = existing.id;

            // Get new units_per_pack if provided
            const newUnitsPerPack = result.stock?.units_per_pack ?? existing.units_per_pack;
            const newModalPerPack = result.stock?.modal_per_pack ?? existing.modal_per_pack;

            // Auto-calculate modal_per_unit if we have both values
            let calculatedModalPerUnit = result.stock?.modal_per_unit ?? existing.modal_per_unit;
            if (newUnitsPerPack && newUnitsPerPack > 0 && newModalPerPack && newModalPerPack > 0) {
              calculatedModalPerUnit = Math.round(newModalPerPack / newUnitsPerPack);
            }

            updatedStocks[existingIndex] = {
              ...existing,
              quantity: existing.quantity + quantity,
              units_per_pack: newUnitsPerPack,
              modal_per_pack: newModalPerPack,
              modal_per_unit: calculatedModalPerUnit,
              sell_per_unit: result.stock?.sell_per_unit ?? existing.sell_per_unit,
              sell_per_pack: result.stock?.sell_per_pack ?? existing.sell_per_pack,
              updated_at: now,
            };
          } else {
            // Create new stock
            stockId = generateId();

            // Get units_per_pack from voice result
            const unitsPerPack = result.stock?.units_per_pack ?? null;
            const modalPerPack = result.stock?.modal_per_pack ?? null;

            // Auto-calculate modal_per_unit if we have both values
            let modalPerUnit = result.stock?.modal_per_unit ?? null;
            if (unitsPerPack && unitsPerPack > 0 && modalPerPack && modalPerPack > 0) {
              modalPerUnit = Math.round(modalPerPack / unitsPerPack);
            }

            // Calculate small unit quantity if units_per_pack is available
            const smallUnitQuantity = unitsPerPack ? quantity * unitsPerPack : null;

            const newStock: StockItem = {
              id: stockId,
              name: itemName,
              normalized_name: normalizedName,
              quantity,
              small_unit_quantity: smallUnitQuantity,
              unit,
              pack_unit: isPackUnit(unit) ? unit : (isBulkUnit(unit) ? unit : 'pcs'),
              unit_unit: determineUnitUnit(unit),
              units_per_pack: unitsPerPack,
              modal_per_pack: modalPerPack,
              modal_per_unit: modalPerUnit,
              sell_per_unit: result.stock?.sell_per_unit ?? null,
              sell_per_pack: result.stock?.sell_per_pack ?? null,
              min_stock: 5,
              created_at: now,
              updated_at: now,
            };
            updatedStocks.push(newStock);
          }

          // Record movement - determine type based on quantity sign
          const isAdding = quantity >= 0;
          const movement: StockMovement = {
            id: generateId(),
            stock_id: stockId,
            type: isAdding ? 'in' : 'out',
            quantity: Math.abs(quantity), // Store absolute value
            reason: isAdding ? 'Tambah stok manual' : 'Kurangi stok manual',
            reference_id: null,
            created_at: now,
          };

          return {
            stocks: updatedStocks,
            movements: [movement, ...state.movements],
          };
        });
      },

      updateStockFromTransaction: (itemName, quantity, type, unit = 'pcs', price, unitsPerPack) => {
        const normalizedName = normalizeItemName(itemName);
        const normalizedUnit = normalizeUnit(unit);
        const now = new Date().toISOString();

        set((state) => {
          const existingIndex = state.stocks.findIndex(
            s => s.normalized_name === normalizedName
          );

          const updatedStocks = [...state.stocks];
          let stockId: string;

          if (existingIndex >= 0) {
            // Update existing stock
            const existing = updatedStocks[existingIndex];
            stockId = existing.id;
            const newQuantity = type === 'sale'
              ? Math.max(0, existing.quantity - quantity)
              : existing.quantity + quantity;

            // Determine which price field to update based on unit type
            const isPack = isPackUnit(normalizedUnit);

            // Calculate modal_per_unit if we have pack price and units_per_pack
            const effectiveUnitsPerPack = unitsPerPack || existing.units_per_pack;
            const calculatedModalPerUnit = (type === 'purchase' && isPack && price && effectiveUnitsPerPack)
              ? Math.round(price / effectiveUnitsPerPack)
              : existing.modal_per_unit;

            // Update small_unit_quantity for sales - decrease by qty (in small units)
            // For pack sales, multiply by units_per_pack; for unit sales, use qty directly
            let newSmallUnitQty = existing.small_unit_quantity;
            if (existing.small_unit_quantity !== null) {
              if (type === 'sale') {
                const unitsToSubtract = isPack && effectiveUnitsPerPack
                  ? quantity * effectiveUnitsPerPack
                  : quantity;
                newSmallUnitQty = Math.max(0, existing.small_unit_quantity - unitsToSubtract);
              } else if (type === 'purchase') {
                const unitsToAdd = isPack && effectiveUnitsPerPack
                  ? quantity * effectiveUnitsPerPack
                  : quantity;
                newSmallUnitQty = existing.small_unit_quantity + unitsToAdd;
              }
            }

            // Calculate new pack quantity from small_unit_quantity
            const newPackQty = (newSmallUnitQty !== null && effectiveUnitsPerPack)
              ? Math.floor(newSmallUnitQty / effectiveUnitsPerPack)
              : newQuantity;

            updatedStocks[existingIndex] = {
              ...existing,
              quantity: newPackQty,
              small_unit_quantity: newSmallUnitQty,
              // NEVER overwrite pack_unit/unit_unit from transactions
              // Only update units_per_pack if provided AND not already set
              units_per_pack: existing.units_per_pack || unitsPerPack || null,
              // Update price based on unit type and transaction type
              modal_per_pack: type === 'purchase' && isPack && price ? price : existing.modal_per_pack,
              modal_per_unit: type === 'purchase' && isPack && price ? calculatedModalPerUnit : (type === 'purchase' && !isPack && price ? price : existing.modal_per_unit),
              sell_per_pack: type === 'sale' && isPack && price ? price : existing.sell_per_pack,
              sell_per_unit: type === 'sale' && !isPack && price ? price : existing.sell_per_unit,
              updated_at: now,
            };
          } else {
            // Create new stock entry (only for purchases)
            if (type === 'purchase') {
              stockId = generateId();
              const isPack = isPackUnit(normalizedUnit);

              // Calculate modal_per_unit from pack price and units_per_pack
              const calculatedModalPerUnit = (isPack && price && unitsPerPack)
                ? Math.round(price / unitsPerPack)
                : null;

              // Determine pack_unit and unit_unit based on transaction unit
              const packUnit = isPack ? normalizedUnit : (isBulkUnit(normalizedUnit) ? normalizedUnit : 'pcs');
              const unitUnit = determineUnitUnit(normalizedUnit);

              const newStock: StockItem = {
                id: stockId,
                name: itemName,
                normalized_name: normalizedName,
                quantity,
                small_unit_quantity: unitsPerPack ? quantity * unitsPerPack : null,
                unit: packUnit,  // Legacy: same as pack_unit
                pack_unit: packUnit,
                unit_unit: unitUnit,
                units_per_pack: unitsPerPack || null,
                modal_per_pack: isPack ? (price ?? null) : null,
                modal_per_unit: isPack ? calculatedModalPerUnit : (price ?? null),
                sell_per_unit: null,
                sell_per_pack: null,
                min_stock: 5,
                created_at: now,
                updated_at: now,
              };
              updatedStocks.push(newStock);
            } else {
              // Sale without existing stock - still record it with 0 quantity
              stockId = generateId();
              const isPack = isPackUnit(unit);
              const newStock: StockItem = {
                id: stockId,
                name: itemName,
                normalized_name: normalizedName,
                quantity: 0,
                small_unit_quantity: null,
                unit,
                pack_unit: isPack ? unit : (isBulkUnit(unit) ? unit : 'pcs'),
                unit_unit: determineUnitUnit(unit),
                units_per_pack: null,
                modal_per_pack: null,
                modal_per_unit: null,
                sell_per_unit: !isPack ? (price ?? null) : null,
                sell_per_pack: isPack ? (price ?? null) : null,
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

      // Reverse stock changes when a transaction is deleted
      // For purchase: subtract the quantity that was added
      // For sale: add back the quantity that was subtracted
      reverseStockFromTransaction: (itemName, quantity, type, unit = 'pcs') => {
        console.log('[reverseStock] Called with:', { itemName, quantity, type, unit });
        const normalizedName = normalizeItemName(itemName);
        const normalizedUnit = normalizeUnit(unit);
        const now = new Date().toISOString();

        console.log('[reverseStock] Normalized:', { normalizedName, normalizedUnit });

        set((state) => {
          const existingIndex = state.stocks.findIndex(
            s => s.normalized_name === normalizedName
          );

          if (existingIndex < 0) {
            // Stock doesn't exist, nothing to reverse
            return state;
          }

          const updatedStocks = [...state.stocks];
          const existing = updatedStocks[existingIndex];
          const isPack = isPackUnit(normalizedUnit);
          const effectiveUnitsPerPack = existing.units_per_pack;

          // Reverse the operation: purchase becomes subtract, sale becomes add
          let newSmallUnitQty = existing.small_unit_quantity;
          if (existing.small_unit_quantity !== null) {
            if (type === 'purchase') {
              // Reverse purchase: subtract the quantity that was added
              const unitsToSubtract = isPack && effectiveUnitsPerPack
                ? quantity * effectiveUnitsPerPack
                : quantity;
              newSmallUnitQty = Math.max(0, existing.small_unit_quantity - unitsToSubtract);
            } else if (type === 'sale') {
              // Reverse sale: add back the quantity that was subtracted
              const unitsToAdd = isPack && effectiveUnitsPerPack
                ? quantity * effectiveUnitsPerPack
                : quantity;
              newSmallUnitQty = existing.small_unit_quantity + unitsToAdd;
            }
          }

          // Calculate new pack quantity from small_unit_quantity
          const newPackQty = (newSmallUnitQty !== null && effectiveUnitsPerPack)
            ? Math.floor(newSmallUnitQty / effectiveUnitsPerPack)
            : (type === 'purchase' 
                ? Math.max(0, existing.quantity - quantity) 
                : existing.quantity + quantity);

          // Create movement record for the reversal
          const movement: StockMovement = {
            id: generateId(),
            stock_id: existing.id,
            type: type === 'purchase' ? 'out' : 'in',
            quantity,
            reason: `Transaksi ${type === 'purchase' ? 'pembelian' : 'penjualan'} dihapus`,
            reference_id: null,
            created_at: now,
          };

          updatedStocks[existingIndex] = {
            ...existing,
            quantity: newPackQty,
            small_unit_quantity: newSmallUnitQty,
            updated_at: now,
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

      updateStockPrice: (result: ParsedVoiceResult) => {
        if (result.type !== 'price_update' || !result.stock?.item_name) return false;

        const itemName = result.stock.item_name;
        const normalizedName = normalizeItemName(itemName);
        const now = new Date().toISOString();

        const existingStock = get().stocks.find(s => s.normalized_name === normalizedName);
        if (!existingStock) return false;

        // Build price updates from the parsed result
        const priceUpdates: Partial<StockItem> = {};

        if (result.stock.sell_per_unit !== null && result.stock.sell_per_unit !== undefined) {
          priceUpdates.sell_per_unit = result.stock.sell_per_unit;
        }
        if (result.stock.sell_per_pack !== null && result.stock.sell_per_pack !== undefined) {
          priceUpdates.sell_per_pack = result.stock.sell_per_pack;
        }
        if (result.stock.modal_per_unit !== null && result.stock.modal_per_unit !== undefined) {
          priceUpdates.modal_per_unit = result.stock.modal_per_unit;
        }
        if (result.stock.modal_per_pack !== null && result.stock.modal_per_pack !== undefined) {
          priceUpdates.modal_per_pack = result.stock.modal_per_pack;
          // Auto-calculate modal_per_unit if units_per_pack exists
          if (existingStock.units_per_pack && existingStock.units_per_pack > 0) {
            priceUpdates.modal_per_unit = Math.round(result.stock.modal_per_pack / existingStock.units_per_pack);
          }
        }

        // Apply updates
        set((state) => ({
          stocks: state.stocks.map(s =>
            s.id === existingStock.id
              ? { ...s, ...priceUpdates, updated_at: now }
              : s
          ),
        }));

        return true;
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
        // Get the stock item name before deleting
        const stock = get().stocks.find(s => s.id === id);
        const normalizedName = stock ? normalizeItemName(stock.name) : null;

        // Delete stock and movements
        set((state) => ({
          stocks: state.stocks.filter(s => s.id !== id),
          movements: state.movements.filter(m => m.stock_id !== id),
        }));

        // Remove this item from transactions (don't delete entire transactions)
        // Using dynamic import to avoid circular dependency
        if (normalizedName) {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const { useTransactionStore: transactionStore } = require('./useTransactionStore');
          transactionStore.setState((state: { transactions: Transaction[] }) => {
            const updatedTransactions = state.transactions.map((t: Transaction) => {
              // Remove matching items from this transaction
              const filteredItems = t.items.filter((item: TransactionItem) =>
                normalizeItemName(item.item_name) !== normalizedName
              );
              
              // Recalculate total amount
              const newTotal = filteredItems.reduce((sum, item) => sum + item.total_amount, 0);
              
              return {
                ...t,
                items: filteredItems,
                total_amount: newTotal,
              };
            });
            
            // Only keep transactions that still have items
            return {
              transactions: updatedTransactions.filter(t => t.items.length > 0),
            };
          });
        }
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
