import { useTransactionStore } from '@/store/useTransactionStore';
import { useStockStore } from '@/store/useStockStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useUserStore } from '@/store/useUserStore';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

/**
 * Clear all local stores and sign out from Firebase
 * Call this when user logs out to prevent data leakage between accounts
 */
export const logoutAndClearData = async () => {
    // Sign out from Firebase first
    await signOut(auth);

    // Clear all Zustand stores
    useTransactionStore.setState({ transactions: [], debts: [] });
    useStockStore.setState({ stocks: [], movements: [] });
    useSettingsStore.setState({
        targetAmount: 1000000,
        targetPeriod: 'daily'
    });
    useUserStore.setState({
        storeName: 'Warung Saya',
        ownerName: '',
        profileImage: null,
        appIcon: 'store'
    });

    // Clear localStorage keys for Zustand persist
    if (typeof window !== 'undefined') {
        localStorage.removeItem('kasir-suara-storage');
        localStorage.removeItem('kasir-suara-stock');
        localStorage.removeItem('Katalis AI-settings');
        localStorage.removeItem('Katalis AI-user');
    }

    console.log('[Logout] All local data cleared');
};
