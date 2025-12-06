'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTransactionStore } from '@/store/useTransactionStore';
import { useStockStore } from '@/store/useStockStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useUserStore } from '@/store/useUserStore';
import {
    loadTransactions,
    loadDebts,
    loadStocks,
    loadStockMovements,
    loadUserSettings,
    syncAllWithDeletion,
    saveUserSettings,
    subscribeToTransactions,
    subscribeToDebts,
    subscribeToStocks,
    subscribeToStockMovements,
    subscribeToUserSettings,
} from '@/lib/firestoreService';
import type { Unsubscribe } from 'firebase/firestore';
import type { Transaction, Debt, StockItem, StockMovement } from '@/types';

// Debounce function to avoid too many writes
function debounce<T extends (...args: unknown[]) => void>(fn: T, delay: number): T {
    let timeoutId: NodeJS.Timeout;
    return ((...args: unknown[]) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    }) as T;
}

// Deep compare arrays for change detection
function arraysEqual<T extends { id: string }>(a: T[], b: T[]): boolean {
    if (a.length !== b.length) return false;
    const setA = new Set(a.map(item => JSON.stringify(item)));
    for (const item of b) {
        if (!setA.has(JSON.stringify(item))) return false;
    }
    return true;
}

export function useFirestoreSync() {
    const { user } = useAuth();
    const unsubscribesRef = useRef<Unsubscribe[]>([]);
    const isInitializedRef = useRef(false);
    const isSyncingFromFirestoreRef = useRef(false);
    const isSyncingToFirestoreRef = useRef(false);
    const lastKnownStateRef = useRef<{
        transactions: Transaction[];
        debts: Debt[];
        stocks: StockItem[];
        movements: StockMovement[];
    }>({
        transactions: [],
        debts: [],
        stocks: [],
        movements: [],
    });

    // Cleanup function
    const cleanup = useCallback(() => {
        unsubscribesRef.current.forEach(unsub => unsub());
        unsubscribesRef.current = [];
        isInitializedRef.current = false;
        isSyncingFromFirestoreRef.current = false;
        isSyncingToFirestoreRef.current = false;
    }, []);

    useEffect(() => {
        if (!user) {
            cleanup();
            return;
        }

        if (isInitializedRef.current) return;
        isInitializedRef.current = true;

        const userId = user.uid;

        // ==================== INITIAL DATA LOAD ====================
        const initializeData = async () => {
            try {
                isSyncingFromFirestoreRef.current = true;

                const [transactions, debts, stocks, movements, settings] = await Promise.all([
                    loadTransactions(userId),
                    loadDebts(userId),
                    loadStocks(userId),
                    loadStockMovements(userId),
                    loadUserSettings(userId),
                ]);

                // Store as last known state to prevent echo
                lastKnownStateRef.current = { transactions, debts, stocks, movements };

                // Only set if we have data from Firestore
                if (transactions.length > 0 || debts.length > 0) {
                    useTransactionStore.setState({ transactions, debts });
                }

                if (stocks.length > 0 || movements.length > 0) {
                    useStockStore.setState({ stocks, movements });
                }

                if (settings) {
                    useSettingsStore.setState({
                        targetAmount: settings.targetAmount,
                        targetPeriod: settings.targetPeriod as 'daily' | 'weekly' | 'monthly' | 'yearly',
                    });
                    useUserStore.setState({
                        storeName: settings.storeName,
                        ownerName: settings.ownerName,
                        profileImage: settings.profileImage,
                        appIcon: settings.appIcon as 'store' | 'coffee' | 'shopping-bag' | 'utensils' | 'building',
                    });
                }

                console.log('[FirestoreSync] Initial data loaded from Firestore');
                isSyncingFromFirestoreRef.current = false;
            } catch (error) {
                console.error('[FirestoreSync] Failed to load initial data:', error);
                isSyncingFromFirestoreRef.current = false;
            }
        };

        // ==================== FIRESTORE → LOCAL (Real-time listeners) ====================
        const setupRealtimeListeners = () => {
            // Transactions & Debts listener
            const unsubTransactions = subscribeToTransactions(userId, (transactions) => {
                if (isSyncingToFirestoreRef.current) return; // Prevent echo from our own writes
                if (arraysEqual(transactions, lastKnownStateRef.current.transactions)) return;

                console.log('[FirestoreSync] Transactions updated from Firestore');
                lastKnownStateRef.current.transactions = transactions;
                isSyncingFromFirestoreRef.current = true;
                useTransactionStore.setState({ transactions });
                setTimeout(() => { isSyncingFromFirestoreRef.current = false; }, 100);
            });

            const unsubDebts = subscribeToDebts(userId, (debts) => {
                if (isSyncingToFirestoreRef.current) return;
                if (arraysEqual(debts, lastKnownStateRef.current.debts)) return;

                console.log('[FirestoreSync] Debts updated from Firestore');
                lastKnownStateRef.current.debts = debts;
                isSyncingFromFirestoreRef.current = true;
                useTransactionStore.setState({ debts });
                setTimeout(() => { isSyncingFromFirestoreRef.current = false; }, 100);
            });

            const unsubStocks = subscribeToStocks(userId, (stocks) => {
                if (isSyncingToFirestoreRef.current) return;
                if (arraysEqual(stocks, lastKnownStateRef.current.stocks)) return;

                console.log('[FirestoreSync] Stocks updated from Firestore');
                lastKnownStateRef.current.stocks = stocks;
                isSyncingFromFirestoreRef.current = true;
                useStockStore.setState({ stocks });
                setTimeout(() => { isSyncingFromFirestoreRef.current = false; }, 100);
            });

            const unsubMovements = subscribeToStockMovements(userId, (movements) => {
                if (isSyncingToFirestoreRef.current) return;
                if (arraysEqual(movements, lastKnownStateRef.current.movements)) return;

                console.log('[FirestoreSync] Stock movements updated from Firestore');
                lastKnownStateRef.current.movements = movements;
                isSyncingFromFirestoreRef.current = true;
                useStockStore.setState({ movements });
                setTimeout(() => { isSyncingFromFirestoreRef.current = false; }, 100);
            });

            const unsubSettings = subscribeToUserSettings(userId, (settings) => {
                if (isSyncingToFirestoreRef.current || !settings) return;

                console.log('[FirestoreSync] Settings updated from Firestore');
                isSyncingFromFirestoreRef.current = true;
                useSettingsStore.setState({
                    targetAmount: settings.targetAmount,
                    targetPeriod: settings.targetPeriod as 'daily' | 'weekly' | 'monthly' | 'yearly',
                });
                useUserStore.setState({
                    storeName: settings.storeName,
                    ownerName: settings.ownerName,
                    profileImage: settings.profileImage,
                    appIcon: settings.appIcon as 'store' | 'coffee' | 'shopping-bag' | 'utensils' | 'building',
                });
                setTimeout(() => { isSyncingFromFirestoreRef.current = false; }, 100);
            });

            return [unsubTransactions, unsubDebts, unsubStocks, unsubMovements, unsubSettings];
        };

        // ==================== LOCAL → FIRESTORE (Debounced writes) ====================
        const syncTransactionsToFirestore = debounce(async () => {
            if (isSyncingFromFirestoreRef.current) return;

            const state = useTransactionStore.getState();

            // Check if actually changed
            if (arraysEqual(state.transactions, lastKnownStateRef.current.transactions) &&
                arraysEqual(state.debts, lastKnownStateRef.current.debts)) {
                return;
            }

            try {
                isSyncingToFirestoreRef.current = true;
                await syncAllWithDeletion(userId, {
                    transactions: state.transactions,
                    debts: state.debts,
                });
                lastKnownStateRef.current.transactions = state.transactions;
                lastKnownStateRef.current.debts = state.debts;
                console.log('[FirestoreSync] Transactions synced to Firestore (with deletions)');
            } catch (error) {
                console.error('[FirestoreSync] Failed to sync transactions:', error);
            } finally {
                setTimeout(() => { isSyncingToFirestoreRef.current = false; }, 100);
            }
        }, 1500);

        const syncStocksToFirestore = debounce(async () => {
            if (isSyncingFromFirestoreRef.current) return;

            const state = useStockStore.getState();

            if (arraysEqual(state.stocks, lastKnownStateRef.current.stocks) &&
                arraysEqual(state.movements, lastKnownStateRef.current.movements)) {
                return;
            }

            try {
                isSyncingToFirestoreRef.current = true;
                await syncAllWithDeletion(userId, {
                    stocks: state.stocks,
                    movements: state.movements,
                });
                lastKnownStateRef.current.stocks = state.stocks;
                lastKnownStateRef.current.movements = state.movements;
                console.log('[FirestoreSync] Stocks synced to Firestore (with deletions)');
            } catch (error) {
                console.error('[FirestoreSync] Failed to sync stocks:', error);
            } finally {
                setTimeout(() => { isSyncingToFirestoreRef.current = false; }, 100);
            }
        }, 1500);

        const syncSettingsToFirestore = debounce(async () => {
            if (isSyncingFromFirestoreRef.current) return;

            const settingsState = useSettingsStore.getState();
            const userState = useUserStore.getState();

            try {
                isSyncingToFirestoreRef.current = true;
                await saveUserSettings(userId, {
                    targetAmount: settingsState.targetAmount,
                    targetPeriod: settingsState.targetPeriod,
                    storeName: userState.storeName,
                    ownerName: userState.ownerName,
                    profileImage: userState.profileImage,
                    appIcon: userState.appIcon,
                });
                console.log('[FirestoreSync] Settings synced to Firestore');
            } catch (error) {
                console.error('[FirestoreSync] Failed to sync settings:', error);
            } finally {
                setTimeout(() => { isSyncingToFirestoreRef.current = false; }, 100);
            }
        }, 1500);

        // ==================== INITIALIZE ====================
        initializeData().then(() => {
            // Setup real-time listeners after initial load
            const firestoreUnsubs = setupRealtimeListeners();

            // Subscribe to local store changes
            const unsubTransaction = useTransactionStore.subscribe(syncTransactionsToFirestore);
            const unsubStock = useStockStore.subscribe(syncStocksToFirestore);
            const unsubSettings = useSettingsStore.subscribe(syncSettingsToFirestore);
            const unsubUser = useUserStore.subscribe(syncSettingsToFirestore);

            unsubscribesRef.current = [
                ...firestoreUnsubs,
                unsubTransaction,
                unsubStock,
                unsubSettings,
                unsubUser,
            ];
        });

        return cleanup;
    }, [user, cleanup]);

    return { isInitialized: isInitializedRef.current };
}
