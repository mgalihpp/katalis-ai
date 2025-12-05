'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AppIconType = 'store' | 'coffee' | 'shopping-bag' | 'utensils' | 'building';

interface UserState {
    storeName: string;
    ownerName: string;
    profileImage: string | null;
    appIcon: AppIconType;
    setStoreName: (name: string) => void;
    setOwnerName: (name: string) => void;
    setProfileImage: (image: string | null) => void;
    setAppIcon: (icon: AppIconType) => void;
}

export const useUserStore = create<UserState>()(
    persist(
        (set) => ({
            storeName: 'Warung Saya',
            ownerName: '',
            profileImage: null,
            appIcon: 'store',
            setStoreName: (name) => set({ storeName: name }),
            setOwnerName: (name) => set({ ownerName: name }),
            setProfileImage: (image) => set({ profileImage: image }),
            setAppIcon: (icon) => set({ appIcon: icon }),
        }),
        {
            name: 'Katalis AI-user',
        }
    )
);
