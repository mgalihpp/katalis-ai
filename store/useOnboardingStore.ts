'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface OnboardingState {
    hasSeenWelcome: boolean;
    hasCompletedTour: boolean;
    markWelcomeSeen: () => void;
    markTourCompleted: () => void;
    resetOnboarding: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
    persist(
        (set) => ({
            hasSeenWelcome: false,
            hasCompletedTour: false,
            markWelcomeSeen: () => set({ hasSeenWelcome: true }),
            markTourCompleted: () => set({ hasCompletedTour: true }),
            resetOnboarding: () => set({ hasSeenWelcome: false, hasCompletedTour: false }),
        }),
        {
            name: 'kasir-suara-onboarding',
        }
    )
);
