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

            let updatedDebts = [...state.debts];

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
            } else if (result.type === 'debt_payment' && existingDebtIndex >= 0) {
              // Process payment
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
            }

            return {
              transactions: [transaction, ...state.transactions],
              debts: updatedDebts,
            };
          });
        } else {
          // Regular transaction (sale/purchase)
          set((state) => ({
            transactions: [transaction, ...state.transactions],
          }));

          // Auto-update stock for sales and purchases
          if ((result.type === 'sale' || result.type === 'purchase') && result.transactions) {
            const stockStore = useStockStore.getState();
            result.transactions.forEach((item) => {
              if (item.item_name && item.quantity) {
                stockStore.updateStockFromTransaction(
                  item.item_name,
                  item.quantity,
                  result.type as 'sale' | 'purchase',
                  item.unit || 'pcs',
                  item.price_per_unit || undefined
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
        set((state) => ({
          transactions: state.transactions.filter(t => t.id !== id),
        }));
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
        set((state) => ({
          debts: state.debts.filter(d => d.id !== id),
          transactions: state.transactions.filter(t => {
            // Also remove related debt transactions
            if (t.type === 'debt_add' || t.type === 'debt_payment') {
              const debt = state.debts.find(d => d.id === id);
              if (debt && t.note?.includes(debt.debtor_name)) {
                return false;
              }
            }
            return true;
          }),
        }));
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
