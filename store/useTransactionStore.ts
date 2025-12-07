import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Transaction, Debt, ParsedVoiceResult } from '@/types';
import { useStockStore } from './useStockStore';

interface TransactionStore {
  transactions: Transaction[];
  debts: Debt[];

  // Transaction actions
  addTransaction: (result: ParsedVoiceResult) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  removeItemFromTransaction: (transactionId: string, itemIndex: number) => void;
  getTransactionsByDate: (date: Date) => Transaction[];
  getTodayTransactions: () => Transaction[];

  // Debt actions
  getDebtByName: (name: string) => Debt | undefined;
  getAllDebts: () => Debt[];
  updateDebt: (id: string, updates: Partial<Debt>) => void;
  deleteDebt: (id: string) => void;
  addDebtPayment: (debtId: string, amount: number, note?: string) => void;

  // Summary
  getTodaySummary: () => {
    totalSales: number;
    totalPurchases: number;
    totalDebtAdded: number;
    totalDebtPaid: number;
    transactionCount: number;
  };
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function normalizeDebtorName(name: string): string {
  // Normalize name for matching (lowercase, trim, remove common prefixes)
  return name
    .toLowerCase()
    .trim()
    .replace(/^(bu|pak|mas|mbak|ibu|bapak)\s+/i, '');
}

export const useTransactionStore = create<TransactionStore>()(
  persist(
    (set, get) => ({
      transactions: [],
      debts: [],

      addTransaction: (result: ParsedVoiceResult) => {
        const now = new Date().toISOString();

        // Calculate total amount
        let totalAmount = 0;
        if (result.transactions && result.transactions.length > 0) {
          totalAmount = result.transactions.reduce((sum, t) => sum + (t.total_amount || 0), 0);
        } else if (result.debt?.amount) {
          totalAmount = result.debt.amount;
        }

        // Create transaction record
        const transaction: Transaction = {
          id: generateId(),
          type: result.type,
          items: result.transactions?.map(t => ({
            item_name: t.item_name || '',
            quantity: t.quantity,
            unit: t.unit,
            price_per_unit: t.price_per_unit,
            total_amount: t.total_amount || 0,
          })) || [],
          total_amount: totalAmount,
          note: result.note,
          raw_text: result.raw_text,
          created_at: now,
        };

        // Handle debt-related transactions
        if ((result.type === 'debt_add' || result.type === 'debt_payment') && result.debt?.debtor_name) {
          const debtorName = result.debt.debtor_name;
          const normalizedName = normalizeDebtorName(debtorName);
          const amount = result.debt.amount || 0;

          set((state) => {
            const existingDebtIndex = state.debts.findIndex(
              d => normalizeDebtorName(d.debtor_name) === normalizedName
            );

            const updatedDebts = [...state.debts];

            if (result.type === 'debt_add') {
              if (existingDebtIndex >= 0) {
                // Add to existing debt
                const existingDebt = updatedDebts[existingDebtIndex];
                updatedDebts[existingDebtIndex] = {
                  ...existingDebt,
                  total_amount: existingDebt.total_amount + amount,
                  remaining_amount: existingDebt.remaining_amount + amount,
                  status: 'pending',
                  transactions: [
                    ...existingDebt.transactions,
                    {
                      id: generateId(),
                      debt_id: existingDebt.id,
                      type: 'add',
                      amount,
                      note: result.note,
                      created_at: now,
                    },
                  ],
                  updated_at: now,
                };
              } else {
                // Create new debt
                const newDebt: Debt = {
                  id: generateId(),
                  debtor_name: debtorName,
                  total_amount: amount,
                  paid_amount: 0,
                  remaining_amount: amount,
                  status: 'pending',
                  transactions: [
                    {
                      id: generateId(),
                      debt_id: '',
                      type: 'add',
                      amount,
                      note: result.note,
                      created_at: now,
                    },
                  ],
                  created_at: now,
                  updated_at: now,
                };
                newDebt.transactions[0].debt_id = newDebt.id;
                updatedDebts.push(newDebt);
              }
            } else if (result.type === 'debt_payment') {
              if (existingDebtIndex >= 0) {
                // Process payment for existing debtor
                const existingDebt = updatedDebts[existingDebtIndex];
                const paymentAmount = Math.min(amount, existingDebt.remaining_amount);
                const newPaidAmount = existingDebt.paid_amount + paymentAmount;
                const newRemaining = existingDebt.total_amount - newPaidAmount;

                // Determine status: paid if no remaining, partial if some paid but not all
                let newStatus: 'pending' | 'partial' | 'paid' = 'pending';
                if (newRemaining === 0) {
                  newStatus = 'paid';
                } else if (newPaidAmount > 0) {
                  newStatus = 'partial';
                }

                updatedDebts[existingDebtIndex] = {
                  ...existingDebt,
                  paid_amount: newPaidAmount,
                  remaining_amount: newRemaining,
                  status: newStatus,
                  transactions: [
                    ...existingDebt.transactions,
                    {
                      id: generateId(),
                      debt_id: existingDebt.id,
                      type: 'payment',
                      amount: paymentAmount,
                      note: result.note,
                      created_at: now,
                    },
                  ],
                  updated_at: now,
                };
              } else {
                // Debtor doesn't exist - create new debt record
                // Use original_amount if available (for compound: "hutang 50rb bayar 25rb")
                const originalDebt = result.debt?.original_amount || amount;
                const paymentAmount = amount;
                const remainingAmount = originalDebt - paymentAmount;

                // Determine status based on remaining
                let status: 'pending' | 'partial' | 'paid' = 'pending';
                if (remainingAmount === 0) {
                  status = 'paid';
                } else if (paymentAmount > 0) {
                  status = 'partial';
                }

                const newDebt: Debt = {
                  id: generateId(),
                  debtor_name: debtorName,
                  total_amount: originalDebt,
                  paid_amount: paymentAmount,
                  remaining_amount: remainingAmount,
                  status,
                  transactions: [
                    {
                      id: generateId(),
                      debt_id: '',
                      type: 'payment',
                      amount: paymentAmount,
                      note: result.note || (result.debt?.original_amount ? null : 'Pembayaran hutang (tidak tercatat sebelumnya)'),
                      created_at: now,
                    },
                  ],
                  created_at: now,
                  updated_at: now,
                };
                newDebt.transactions[0].debt_id = newDebt.id;
                updatedDebts.push(newDebt);
              }
            }

            return {
              transactions: [transaction, ...state.transactions],
              debts: updatedDebts,
            };
          });
        } else {
          // Regular transaction (sale/purchase)
          const stockStore = useStockStore.getState();

          // Enrich transaction items with prices from stock if price is null (for sales)
          const enrichedItems = (result.transactions || []).map(item => {
            if (!item.item_name) return item;

            const stock = stockStore.getStockByName(item.item_name);
            let pricePerUnit = item.price_per_unit;

            // If price not provided and this is a sale, look up from stock
            if (pricePerUnit === null && result.type === 'sale' && stock) {
              const unit = item.unit?.toLowerCase() || 'pcs';
              const packUnits = ['dus', 'pak', 'box', 'karton', 'lusin', 'krat', 'peti'];
              const isPack = packUnits.includes(unit);

              pricePerUnit = isPack
                ? (stock.sell_per_pack ?? stock.sell_per_unit ?? null)
                : (stock.sell_per_unit ?? null);
            }

            const qty = item.quantity || 1;
            const total = pricePerUnit ? qty * pricePerUnit : 0;

            return {
              ...item,
              quantity: qty,
              price_per_unit: pricePerUnit,
              total_amount: total,
            };
          });

          // Recalculate total
          const enrichedTotal = enrichedItems.reduce((sum, t) => sum + (t.total_amount || 0), 0);

          // Update transaction with enriched items
          const enrichedTransaction: Transaction = {
            ...transaction,
            items: enrichedItems.map(t => ({
              item_name: t.item_name || '',
              quantity: t.quantity,
              unit: t.unit,
              price_per_unit: t.price_per_unit,
              total_amount: t.total_amount || 0,
            })),
            total_amount: enrichedTotal,
          };

          set((state) => ({
            transactions: [enrichedTransaction, ...state.transactions],
          }));

          // Auto-update stock for sales and purchases
          if ((result.type === 'sale' || result.type === 'purchase') && enrichedItems.length > 0) {
            enrichedItems.forEach((item) => {
              if (item.item_name && item.quantity) {
                // Get units_per_pack from stock info if available (for purchases)
                const unitsPerPack = result.stock?.units_per_pack || undefined;
                stockStore.updateStockFromTransaction(
                  item.item_name,
                  item.quantity,
                  result.type as 'sale' | 'purchase',
                  item.unit || 'pcs',
                  item.price_per_unit || undefined,
                  unitsPerPack
                );
              }
            });
          }
        }
      },

      getTransactionsByDate: (date: Date) => {
        const state = get();
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        return state.transactions.filter((t) => {
          const tDate = new Date(t.created_at);
          return tDate >= startOfDay && tDate <= endOfDay;
        });
      },

      getTodayTransactions: () => {
        return get().getTransactionsByDate(new Date());
      },

      getDebtByName: (name: string) => {
        const normalizedName = normalizeDebtorName(name);
        return get().debts.find(d => normalizeDebtorName(d.debtor_name) === normalizedName);
      },

      getAllDebts: () => {
        return get().debts;
      },

      updateTransaction: (id: string, updates: Partial<Transaction>) => {
        set((state) => ({
          transactions: state.transactions.map(t =>
            t.id === id ? { ...t, ...updates } : t
          ),
        }));
      },

      deleteTransaction: (id: string) => {
        const { reverseStockFromTransaction } = useStockStore.getState();
        const transaction = get().transactions.find(t => t.id === id);
        
        console.log('[deleteTransaction] Transaction found:', transaction);
        
        // Reverse stock changes for each item in the transaction
        if (transaction && (transaction.type === 'sale' || transaction.type === 'purchase')) {
          console.log('[deleteTransaction] Reversing stock for', transaction.items.length, 'items');
          transaction.items.forEach(item => {
            console.log('[deleteTransaction] Reversing item:', item.item_name, 'qty:', item.quantity, 'unit:', item.unit, 'type:', transaction.type);
            if (item.item_name && item.quantity) {
              reverseStockFromTransaction(
                item.item_name,
                item.quantity,
                transaction.type as 'sale' | 'purchase',
                item.unit || 'pcs'
              );
            }
          });
        } else {
          console.log('[deleteTransaction] No reversal - transaction type:', transaction?.type);
        }
        
        // Now delete the transaction
        set((state) => ({
          transactions: state.transactions.filter(t => t.id !== id),
        }));
      },

      removeItemFromTransaction: (transactionId: string, itemIndex: number) => {
        const { reverseStockFromTransaction } = useStockStore.getState();
        const transaction = get().transactions.find(t => t.id === transactionId);
        
        if (!transaction || !transaction.items[itemIndex]) return;
        
        const item = transaction.items[itemIndex];
        
        // Reverse stock for the removed item
        if ((transaction.type === 'sale' || transaction.type === 'purchase') && item.item_name && item.quantity) {
          reverseStockFromTransaction(
            item.item_name,
            item.quantity,
            transaction.type as 'sale' | 'purchase',
            item.unit || 'pcs'
          );
        }
        
        // Remove the item and recalculate total
        const newItems = transaction.items.filter((_, idx) => idx !== itemIndex);
        const newTotal = newItems.reduce((sum, i) => sum + i.total_amount, 0);
        
        if (newItems.length === 0) {
          // If no items left, delete the transaction
          set((state) => ({
            transactions: state.transactions.filter(t => t.id !== transactionId),
          }));
        } else {
          // Update transaction with remaining items
          set((state) => ({
            transactions: state.transactions.map(t =>
              t.id === transactionId
                ? { ...t, items: newItems, total_amount: newTotal }
                : t
            ),
          }));
        }
      },

      updateDebt: (id: string, updates: Partial<Debt>) => {
        const now = new Date().toISOString();
        set((state) => ({
          debts: state.debts.map(d =>
            d.id === id ? { ...d, ...updates, updated_at: now } : d
          ),
        }));
      },

      deleteDebt: (id: string) => {
        set((state) => {
          // Get the debt BEFORE filtering so we can use its info to match transactions
          const debtToDelete = state.debts.find(d => d.id === id);
          if (!debtToDelete) {
            return { debts: state.debts.filter(d => d.id !== id), transactions: state.transactions };
          }

          const normalizedDebtorName = debtToDelete.debtor_name.toLowerCase().trim();

          return {
            debts: state.debts.filter(d => d.id !== id),
            transactions: state.transactions.filter(t => {
              // Remove related debt transactions
              if (t.type === 'debt_add' || t.type === 'debt_payment') {
                // Check multiple fields for debtor name match
                const noteMatches = t.note?.toLowerCase().includes(normalizedDebtorName);
                const rawTextMatches = t.raw_text?.toLowerCase().includes(normalizedDebtorName);
                const itemMatches = t.items.some(item =>
                  item.item_name.toLowerCase().includes(normalizedDebtorName)
                );

                if (noteMatches || rawTextMatches || itemMatches) {
                  return false; // Remove this transaction
                }
              }
              return true;
            }),
          };
        });
      },

      addDebtPayment: (debtId: string, amount: number, note?: string) => {
        const now = new Date().toISOString();
        set((state) => {
          const debtIndex = state.debts.findIndex(d => d.id === debtId);
          if (debtIndex < 0) return state;

          const debt = state.debts[debtIndex];
          const paymentAmount = Math.min(amount, debt.remaining_amount);
          const newPaidAmount = debt.paid_amount + paymentAmount;
          const newRemaining = debt.total_amount - newPaidAmount;

          let newStatus: 'pending' | 'partial' | 'paid' = 'pending';
          if (newRemaining === 0) {
            newStatus = 'paid';
          } else if (newPaidAmount > 0) {
            newStatus = 'partial';
          }

          const updatedDebts = [...state.debts];
          updatedDebts[debtIndex] = {
            ...debt,
            paid_amount: newPaidAmount,
            remaining_amount: newRemaining,
            status: newStatus,
            transactions: [
              ...debt.transactions,
              {
                id: generateId(),
                debt_id: debtId,
                type: 'payment',
                amount: paymentAmount,
                note: note || null,
                created_at: now,
              },
            ],
            updated_at: now,
          };

          // Add a transaction record
          const transaction: Transaction = {
            id: generateId(),
            type: 'debt_payment',
            items: [],
            total_amount: paymentAmount,
            note: `Pembayaran hutang ${debt.debtor_name}`,
            raw_text: `Bayar hutang ${debt.debtor_name} ${paymentAmount}`,
            created_at: now,
          };

          return {
            debts: updatedDebts,
            transactions: [transaction, ...state.transactions],
          };
        });
      },

      getTodaySummary: () => {
        const todayTransactions = get().getTodayTransactions();

        return {
          totalSales: todayTransactions
            .filter(t => t.type === 'sale')
            .reduce((sum, t) => sum + t.total_amount, 0),
          totalPurchases: todayTransactions
            .filter(t => t.type === 'purchase')
            .reduce((sum, t) => sum + t.total_amount, 0),
          totalDebtAdded: todayTransactions
            .filter(t => t.type === 'debt_add')
            .reduce((sum, t) => sum + t.total_amount, 0),
          totalDebtPaid: todayTransactions
            .filter(t => t.type === 'debt_payment')
            .reduce((sum, t) => sum + t.total_amount, 0),
          transactionCount: todayTransactions.length,
        };
      },
    }),
    {
      name: 'kasir-suara-storage',
    }
  )
);
