import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TargetPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type ThemeMode = 'light' | 'dark' | 'system';

interface SettingsState {
    targetAmount: number;
    targetPeriod: TargetPeriod;
    theme: ThemeMode;
    setTarget: (amount: number, period: TargetPeriod) => void;
    setTheme: (theme: ThemeMode) => void;
}

export const periodLabels: Record<TargetPeriod, string> = {
    daily: 'Harian',
    weekly: 'Mingguan',
    monthly: 'Bulanan',
    yearly: 'Tahunan',
};

export const themeLabels: Record<ThemeMode, string> = {
    light: 'Terang',
    dark: 'Gelap',
    system: 'Sistem',
};

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            targetAmount: 1000000,
            targetPeriod: 'daily',
            theme: 'system',
            setTarget: (amount, period) => set({ targetAmount: amount, targetPeriod: period }),
            setTheme: (theme) => set({ theme }),
        }),
        {
            name: 'Katalis AI-settings',
        }
    )
);
