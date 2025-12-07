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
        } else if (result.debt?.amount && typeof result.debt.amount === 'number') {
          totalAmount = result.debt.amount;
        } else if (result.type === 'stock_add' && result.stock?.quantity) {
          // For stock_add, calculate total from stock info
          const stockStore = useStockStore.getState();
          const existingStock = result.stock.item_name ? stockStore.getStockByName(result.stock.item_name) : null;
          const unit = result.stock.unit?.toLowerCase() || 'pcs';
          const packUnits = ['dus', 'pak', 'box', 'karton', 'lusin', 'krat', 'peti'];
          const isPack = packUnits.includes(unit);
          
          // Use modal price from result or existing stock
          let pricePerUnit = isPack 
            ? (result.stock.modal_per_pack || existingStock?.modal_per_pack || existingStock?.modal_per_unit || 0)
            : (result.stock.modal_per_unit || existingStock?.modal_per_unit || 0);
          
          totalAmount = Math.abs(result.stock.quantity) * pricePerUnit;
        }

        // Create transaction record
        let transactionItems = result.transactions?.map(t => ({
          item_name: t.item_name || '',
          quantity: t.quantity,
          unit: t.unit,
          price_per_unit: t.price_per_unit,
          total_amount: t.total_amount || 0,
        })) || [];

        // For stock_add, create items from stock info
        if (result.type === 'stock_add' && result.stock?.item_name && result.stock?.quantity) {
          const stockStore = useStockStore.getState();
          const existingStock = stockStore.getStockByName(result.stock.item_name);
          const unit = result.stock.unit?.toLowerCase() || 'pcs';
          const packUnits = ['dus', 'pak', 'box', 'karton', 'lusin', 'krat', 'peti'];
          const isPack = packUnits.includes(unit);
          
          const pricePerUnit = isPack 
            ? (result.stock.modal_per_pack || existingStock?.modal_per_pack || existingStock?.modal_per_unit || null)
            : (result.stock.modal_per_unit || existingStock?.modal_per_unit || null);
          
          transactionItems = [{
            item_name: result.stock.item_name,
            quantity: Math.abs(result.stock.quantity),
            unit: result.stock.unit || 'pcs',
            price_per_unit: pricePerUnit,
            total_amount: pricePerUnit ? Math.abs(result.stock.quantity) * pricePerUnit : 0,
          }];
        }

        const transaction: Transaction = {
          id: generateId(),
          type: result.type,
          items: transactionItems,
          total_amount: totalAmount,
          note: result.note,
          raw_text: result.raw_text,
          created_at: now,
        };

        // Handle debt-related transactions
        if ((result.type === 'debt_add' || result.type === 'debt_payment') && result.debt?.debtor_name) {
          const debtorName = result.debt.debtor_name;
          const normalizedName = normalizeDebtorName(debtorName);
          const stockStore = useStockStore.getState();

          // For debt_add with items, enrich items with prices from stock (like sale)
          let enrichedItems = result.transactions || [];
          let calculatedTotal = 0;

          if (result.type === 'debt_add' && enrichedItems.length > 0) {
            console.log('[debt_add] Processing items:', enrichedItems.length);
            
            enrichedItems = enrichedItems.map(item => {
              if (!item.item_name) return item;

              console.log('[debt_add] Looking up stock for:', item.item_name);
              const stock = stockStore.getStockByName(item.item_name);
              console.log('[debt_add] Stock found:', stock ? { name: stock.name, sell_per_pack: stock.sell_per_pack, sell_per_unit: stock.sell_per_unit } : 'NOT FOUND');
              
              let pricePerUnit = item.price_per_unit;
              console.log('[debt_add] Initial price_per_unit:', pricePerUnit);

              // If price not provided (null or undefined), look up from stock
              if ((pricePerUnit === null || pricePerUnit === undefined) && stock) {
                const unit = item.unit?.toLowerCase() || 'pcs';
                const packUnits = ['dus', 'pak', 'box', 'karton', 'lusin', 'krat', 'peti'];
                const isPack = packUnits.includes(unit);
                console.log('[debt_add] Unit:', unit, 'isPack:', isPack);

                pricePerUnit = isPack
                  ? (stock.sell_per_pack ?? stock.sell_per_unit ?? null)
                  : (stock.sell_per_unit ?? null);
                console.log('[debt_add] Looked up price:', pricePerUnit);
              }

              const qty = item.quantity || 1;
              const total = pricePerUnit ? qty * pricePerUnit : 0;
              console.log('[debt_add] qty:', qty, 'total:', total);

              return {
                ...item,
                quantity: qty,
                price_per_unit: pricePerUnit,
                total_amount: total,
              };
            });

            calculatedTotal = enrichedItems.reduce((sum, t) => sum + (t.total_amount || 0), 0);
            console.log('[debt_add] Calculated total:', calculatedTotal);

            // Update stock for debt_add (reduce stock like a sale)
            enrichedItems.forEach((item) => {
              if (item.item_name && item.quantity) {
                stockStore.updateStockFromTransaction(
                  item.item_name,
                  item.quantity,
                  'sale', // Treat debt as sale for stock reduction
                  item.unit || 'pcs',
                  item.price_per_unit || undefined
                );
              }
            });
          }

          // Use calculated total from items if available, otherwise use debt.amount (if numeric)
          const rawAmount = result.debt.amount;
          const numericAmount = typeof rawAmount === 'number' ? rawAmount : 0;
          const amount = calculatedTotal > 0 ? calculatedTotal : numericAmount;

          // Create enriched transaction record for debt
          const enrichedTransaction: Transaction = {
            id: generateId(),
            type: result.type,
            items: enrichedItems.map(t => ({
              item_name: t.item_name || '',
              quantity: t.quantity,
              unit: t.unit,
              price_per_unit: t.price_per_unit,
              total_amount: t.total_amount || 0,
            })),
            total_amount: amount,
            note: result.note,
            raw_text: result.raw_text,
            created_at: now,
          };

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
              // Check if amount is "LUNAS" (full payoff) - cast to any for string check
              const debtAmount = result.debt?.amount;
              const isFullPayoff = (debtAmount as unknown) === 'LUNAS' || debtAmount === null;
              
              if (existingDebtIndex >= 0) {
                // Process payment for existing debtor
                const existingDebt = updatedDebts[existingDebtIndex];
                
                // If LUNAS, pay off full remaining amount; otherwise use specified amount
                const requestedAmount = isFullPayoff ? existingDebt.remaining_amount : (typeof debtAmount === 'number' ? debtAmount : 0);
                const paymentAmount = Math.min(requestedAmount, existingDebt.remaining_amount);
                const newPaidAmount = existingDebt.paid_amount + paymentAmount;
                const newRemaining = existingDebt.total_amount - newPaidAmount;

                // Update enrichedTransaction total_amount to reflect actual payment
                // This is important for LUNAS payments where amount was initially 0
                enrichedTransaction.total_amount = paymentAmount;

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
                // Debtor doesn't exist - only create new debt record if we have a valid amount
                // Skip LUNAS payments for non-existent debts (can't payoff what doesn't exist)
                if (isFullPayoff || amount === 0) {
                  // LUNAS with no existing debt - skip silently, debt will be removed from transaction
                  return {
                    transactions: [...state.transactions], // Don't add this transaction
                    debts: updatedDebts,
                  };
                }
                
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
              transactions: [enrichedTransaction, ...state.transactions],
              debts: updatedDebts,
            };
          });
        } else if (result.type === 'stock_add') {
          // Stock add - just save the transaction (already has items from above)
          set((state) => ({
            transactions: [transaction, ...state.transactions],
          }));
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
        
        if (!transaction) return;
        
        console.log('[deleteTransaction] Transaction found:', transaction);
        
        // Reverse stock changes for sale, purchase, and debt_add transactions
        if (transaction.type === 'sale' || transaction.type === 'purchase' || transaction.type === 'debt_add') {
          console.log('[deleteTransaction] Reversing stock for', transaction.items.length, 'items');
          transaction.items.forEach(item => {
            console.log('[deleteTransaction] Reversing item:', item.item_name, 'qty:', item.quantity, 'unit:', item.unit, 'type:', transaction.type);
            if (item.item_name && item.quantity) {
              // For debt_add, treat as sale reversal (add stock back)
              const effectiveType = transaction.type === 'debt_add' ? 'sale' : transaction.type;
              reverseStockFromTransaction(
                item.item_name,
                item.quantity,
                effectiveType as 'sale' | 'purchase',
                item.unit || 'pcs'
              );
            }
          });
        }
        
        // Handle debt-related transactions
        set((state) => {
          let updatedDebts = [...state.debts];
          
          if (transaction.type === 'debt_add' || transaction.type === 'debt_payment') {
            // Find related debt by matching debtor name from raw_text or note
            const searchText = (transaction.raw_text || transaction.note || '').toLowerCase();
            
            const debtIndex = updatedDebts.findIndex(d => {
              const debtorName = d.debtor_name.toLowerCase();
              const normalizedDebtorName = normalizeDebtorName(d.debtor_name);
              // Check both original and normalized name
              return searchText.includes(debtorName) || 
                     searchText.includes(normalizedDebtorName) ||
                     debtorName.includes(normalizeDebtorName(searchText));
            });
            
            if (debtIndex >= 0) {
              const debt = updatedDebts[debtIndex];
              
              // Find and remove matching transaction from debt's internal history
              // Match by amount and type (add -> 'add', payment -> 'payment')
              const debtTxType = transaction.type === 'debt_add' ? 'add' : 'payment';
              const matchingTxIndex = debt.transactions.findIndex(dt => 
                dt.type === debtTxType && dt.amount === transaction.total_amount
              );
              
              // Filter out the matching internal transaction
              const updatedDebtTransactions = matchingTxIndex >= 0 
                ? debt.transactions.filter((_, i) => i !== matchingTxIndex)
                : debt.transactions;
              
              if (transaction.type === 'debt_add') {
                // Reduce debt amount or delete if it becomes 0
                const newTotal = debt.total_amount - transaction.total_amount;
                const newRemaining = debt.remaining_amount - transaction.total_amount;
                
                if (newTotal <= 0) {
                  // Remove the debt entirely
                  updatedDebts = updatedDebts.filter((_, i) => i !== debtIndex);
                } else {
                  // Reduce the debt amount
                  updatedDebts[debtIndex] = {
                    ...debt,
                    total_amount: newTotal,
                    remaining_amount: Math.max(0, newRemaining),
                    status: newRemaining <= 0 ? 'paid' : debt.status,
                    transactions: updatedDebtTransactions,
                    updated_at: new Date().toISOString(),
                  };
                }
              } else if (transaction.type === 'debt_payment') {
                // Reverse payment - add back to remaining amount
                const newPaid = debt.paid_amount - transaction.total_amount;
                const newRemaining = debt.remaining_amount + transaction.total_amount;
                
                updatedDebts[debtIndex] = {
                  ...debt,
                  paid_amount: Math.max(0, newPaid),
                  remaining_amount: newRemaining,
                  status: newRemaining > 0 ? (newPaid > 0 ? 'partial' : 'pending') : 'paid',
                  transactions: updatedDebtTransactions,
                  updated_at: new Date().toISOString(),
                };
              }
            }
          }
          
          return {
            transactions: state.transactions.filter(t => t.id !== id),
            debts: updatedDebts,
          };
        });
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

        // Debt payments count as sales income
        const salesAmount = todayTransactions
          .filter(t => t.type === 'sale')
          .reduce((sum, t) => sum + t.total_amount, 0);
        const debtPaymentAmount = todayTransactions
          .filter(t => t.type === 'debt_payment')
          .reduce((sum, t) => sum + t.total_amount, 0);

        return {
          totalSales: salesAmount + debtPaymentAmount, // Include debt payments as sales
          // Stock add is treated as purchase (restocking inventory)
          totalPurchases: todayTransactions
            .filter(t => t.type === 'purchase' || t.type === 'stock_add')
            .reduce((sum, t) => sum + t.total_amount, 0),
          totalDebtAdded: todayTransactions
            .filter(t => t.type === 'debt_add')
            .reduce((sum, t) => sum + t.total_amount, 0),
          totalDebtPaid: debtPaymentAmount,
          transactionCount: todayTransactions.length,
        };
      },
    }),
    {
      name: 'kasir-suara-storage',
    }
  )
);
