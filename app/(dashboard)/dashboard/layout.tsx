'use client';

import { Toaster } from '@/components/ui/sonner';
import { VoiceProvider } from '@/context/VoiceContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LoadingScreen } from '@/components/LoadingScreen';
import { useFirestoreSync } from '@/hooks/useFirestoreSync';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    // Initialize Firestore sync
    useFirestoreSync();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    if (loading) {
        return <LoadingScreen message="Memuat dashboard..." />;
    }

    if (!user) {
        return null; // or a splash screen while redirecting
    }

    return (
        <main className="max-w-lg mx-auto shadow-xl">
            <VoiceProvider>{children}</VoiceProvider>
            <Toaster richColors position="top-center" />
        </main>
    );
}   