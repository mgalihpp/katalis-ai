import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    onSnapshot,
    writeBatch,
    query,
    orderBy,
    Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Transaction, Debt, StockItem, StockMovement } from '@/types';

// Helper to get user-specific collection reference
const getUserCollection = (userId: string, collectionName: string) => {
    return collection(db, 'users', userId, collectionName);
};

// Helper to sanitize StockItem - converts undefined to null for Firebase compatibility
const sanitizeStockItem = (stock: StockItem): StockItem => {
    return {
        ...stock,
        pack_unit: stock.pack_unit || stock.unit || 'pcs',
        unit_unit: stock.unit_unit || 'pcs',
        small_unit_quantity: stock.small_unit_quantity ?? null,
        units_per_pack: stock.units_per_pack ?? null,
        modal_per_pack: stock.modal_per_pack ?? null,
        modal_per_unit: stock.modal_per_unit ?? null,
        sell_per_unit: stock.sell_per_unit ?? null,
        sell_per_pack: stock.sell_per_pack ?? null,
    };
};

// Helper to get user settings document (users/{userId}/userSettings/config)
const getUserSettingsDoc = (userId: string) => {
    return doc(db, 'users', userId, 'userSettings', 'config');
};

// Helper to sanitize Transaction - converts undefined to null/0 for Firebase compatibility
const sanitizeTransaction = (transaction: Transaction): Transaction => {
    return {
        ...transaction,
        total_amount: transaction.total_amount ?? 0,
        note: transaction.note ?? null,
        items: (transaction.items || []).map(item => ({
            item_name: item.item_name ?? '',
            quantity: item.quantity ?? 0,
            unit: item.unit ?? null,
            price_per_unit: item.price_per_unit ?? 0,
            total_amount: item.total_amount ?? 0,
        })),
    };
};

// ==================== TRANSACTIONS ====================

export const saveTransaction = async (userId: string, transaction: Transaction) => {
    const docRef = doc(getUserCollection(userId, 'transactions'), transaction.id);
    await setDoc(docRef, sanitizeTransaction(transaction));
};

export const updateTransaction = async (userId: string, id: string, updates: Partial<Transaction>) => {
    const docRef = doc(getUserCollection(userId, 'transactions'), id);
    await updateDoc(docRef, { ...updates, updated_at: new Date().toISOString() });
};

export const deleteTransaction = async (userId: string, id: string) => {
    const docRef = doc(getUserCollection(userId, 'transactions'), id);
    await deleteDoc(docRef);
};

export const loadTransactions = async (userId: string): Promise<Transaction[]> => {
    const q = query(getUserCollection(userId, 'transactions'), orderBy('created_at', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Transaction);
};

export const subscribeToTransactions = (
    userId: string,
    callback: (transactions: Transaction[]) => void
): Unsubscribe => {
    const q = query(getUserCollection(userId, 'transactions'), orderBy('created_at', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const transactions = snapshot.docs.map(doc => doc.data() as Transaction);
        callback(transactions);
    }, (error) => {
        // Silently ignore permission-denied errors during logout
        if (error.code !== 'permission-denied') {
            console.error('[Firestore] Transaction subscription error:', error);
        }
    });
};

// ==================== DEBTS ====================

export const saveDebt = async (userId: string, debt: Debt) => {
    const docRef = doc(getUserCollection(userId, 'debts'), debt.id);
    await setDoc(docRef, debt);
};

export const updateDebt = async (userId: string, id: string, updates: Partial<Debt>) => {
    const docRef = doc(getUserCollection(userId, 'debts'), id);
    await updateDoc(docRef, { ...updates, updated_at: new Date().toISOString() });
};

export const deleteDebt = async (userId: string, id: string) => {
    const docRef = doc(getUserCollection(userId, 'debts'), id);
    await deleteDoc(docRef);
};

export const loadDebts = async (userId: string): Promise<Debt[]> => {
    const q = query(getUserCollection(userId, 'debts'), orderBy('created_at', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Debt);
};

export const subscribeToDebts = (
    userId: string,
    callback: (debts: Debt[]) => void
): Unsubscribe => {
    const q = query(getUserCollection(userId, 'debts'), orderBy('created_at', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const debts = snapshot.docs.map(doc => doc.data() as Debt);
        callback(debts);
    }, (error) => {
        if (error.code !== 'permission-denied') {
            console.error('[Firestore] Debts subscription error:', error);
        }
    });
};

// ==================== STOCKS ====================

export const saveStock = async (userId: string, stock: StockItem) => {
    const docRef = doc(getUserCollection(userId, 'stocks'), stock.id);
    await setDoc(docRef, sanitizeStockItem(stock));
};

export const updateStock = async (userId: string, id: string, updates: Partial<StockItem>) => {
    const docRef = doc(getUserCollection(userId, 'stocks'), id);
    await updateDoc(docRef, { ...updates, updated_at: new Date().toISOString() });
};

export const deleteStock = async (userId: string, id: string) => {
    const docRef = doc(getUserCollection(userId, 'stocks'), id);
    await deleteDoc(docRef);
};

export const loadStocks = async (userId: string): Promise<StockItem[]> => {
    const snapshot = await getDocs(getUserCollection(userId, 'stocks'));
    return snapshot.docs.map(doc => doc.data() as StockItem);
};

export const subscribeToStocks = (
    userId: string,
    callback: (stocks: StockItem[]) => void
): Unsubscribe => {
    return onSnapshot(getUserCollection(userId, 'stocks'), (snapshot) => {
        const stocks = snapshot.docs.map(doc => doc.data() as StockItem);
        callback(stocks);
    }, (error) => {
        if (error.code !== 'permission-denied') {
            console.error('[Firestore] Stocks subscription error:', error);
        }
    });
};

// ==================== STOCK MOVEMENTS ====================

export const saveStockMovement = async (userId: string, movement: StockMovement) => {
    const docRef = doc(getUserCollection(userId, 'stockMovements'), movement.id);
    await setDoc(docRef, movement);
};

export const loadStockMovements = async (userId: string): Promise<StockMovement[]> => {
    const q = query(getUserCollection(userId, 'stockMovements'), orderBy('created_at', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as StockMovement);
};

export const subscribeToStockMovements = (
    userId: string,
    callback: (movements: StockMovement[]) => void
): Unsubscribe => {
    const q = query(getUserCollection(userId, 'stockMovements'), orderBy('created_at', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const movements = snapshot.docs.map(doc => doc.data() as StockMovement);
        callback(movements);
    }, (error) => {
        if (error.code !== 'permission-denied') {
            console.error('[Firestore] Stock movements subscription error:', error);
        }
    });
};

// ==================== USER SETTINGS ====================

export interface UserSettings {
    storeName: string;
    ownerName: string;
    profileImage: string | null;
    appIcon: string;
    targetAmount: number;
    targetPeriod: string;
}

export const saveUserSettings = async (userId: string, settings: Partial<UserSettings>) => {
    const docRef = getUserSettingsDoc(userId);
    await setDoc(docRef, settings, { merge: true });
};

export const loadUserSettings = async (userId: string): Promise<UserSettings | null> => {
    const docRef = getUserSettingsDoc(userId);
    const snapshot = await getDoc(docRef);
    return snapshot.exists() ? (snapshot.data() as UserSettings) : null;
};

export const subscribeToUserSettings = (
    userId: string,
    callback: (settings: UserSettings | null) => void
): Unsubscribe => {
    const docRef = getUserSettingsDoc(userId);
    return onSnapshot(docRef, (snapshot) => {
        callback(snapshot.exists() ? (snapshot.data() as UserSettings) : null);
    }, (error) => {
        if (error.code !== 'permission-denied') {
            console.error('[Firestore] Settings subscription error:', error);
        }
    });
};

// ==================== BATCH OPERATIONS ====================

export const batchSaveAll = async (
    userId: string,
    data: {
        transactions?: Transaction[];
        debts?: Debt[];
        stocks?: StockItem[];
        movements?: StockMovement[];
    }
) => {
    const batch = writeBatch(db);

    data.transactions?.forEach(t => {
        const ref = doc(getUserCollection(userId, 'transactions'), t.id);
        batch.set(ref, t);
    });

    data.debts?.forEach(d => {
        const ref = doc(getUserCollection(userId, 'debts'), d.id);
        batch.set(ref, d);
    });

    data.stocks?.forEach(s => {
        const ref = doc(getUserCollection(userId, 'stocks'), s.id);
        batch.set(ref, sanitizeStockItem(s));
    });

    data.movements?.forEach(m => {
        const ref = doc(getUserCollection(userId, 'stockMovements'), m.id);
        batch.set(ref, m);
    });

    await batch.commit();
};

// ==================== SYNC WITH DELETIONS ====================

// Helper to sync a collection with deletion support
const syncCollectionWithDeletion = async <T extends { id: string }>(
    userId: string,
    collectionName: string,
    localItems: T[]
) => {
    // Get current Firestore items
    const snapshot = await getDocs(getUserCollection(userId, collectionName));
    const firestoreIds = new Set(snapshot.docs.map(d => d.id));
    const localIds = new Set(localItems.map(item => item.id));

    const batch = writeBatch(db);

    // Add/update local items
    localItems.forEach(item => {
        const ref = doc(getUserCollection(userId, collectionName), item.id);
        batch.set(ref, item);
    });

    // Delete items that exist in Firestore but not locally
    snapshot.docs.forEach(docSnapshot => {
        if (!localIds.has(docSnapshot.id)) {
            batch.delete(docSnapshot.ref);
        }
    });

    await batch.commit();

    return {
        added: localItems.filter(item => !firestoreIds.has(item.id)).length,
        deleted: snapshot.docs.filter(d => !localIds.has(d.id)).length,
    };
};

export const syncTransactionsWithDeletion = async (userId: string, transactions: Transaction[]) => {
    return syncCollectionWithDeletion(userId, 'transactions', transactions);
};

export const syncDebtsWithDeletion = async (userId: string, debts: Debt[]) => {
    return syncCollectionWithDeletion(userId, 'debts', debts);
};

export const syncStocksWithDeletion = async (userId: string, stocks: StockItem[]) => {
    // Sanitize all stocks before syncing to Firebase
    const sanitizedStocks = stocks.map(sanitizeStockItem);
    return syncCollectionWithDeletion(userId, 'stocks', sanitizedStocks);
};

export const syncMovementsWithDeletion = async (userId: string, movements: StockMovement[]) => {
    return syncCollectionWithDeletion(userId, 'stockMovements', movements);
};

export const syncAllWithDeletion = async (
    userId: string,
    data: {
        transactions?: Transaction[];
        debts?: Debt[];
        stocks?: StockItem[];
        movements?: StockMovement[];
    }
) => {
    const results = await Promise.all([
        data.transactions ? syncTransactionsWithDeletion(userId, data.transactions) : null,
        data.debts ? syncDebtsWithDeletion(userId, data.debts) : null,
        data.stocks ? syncStocksWithDeletion(userId, data.stocks) : null,
        data.movements ? syncMovementsWithDeletion(userId, data.movements) : null,
    ]);

    return results;
};

