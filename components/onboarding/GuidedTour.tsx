'use client';
import dynamic from 'next/dynamic';
import type { CallBackProps, Step, Styles } from 'react-joyride';
import { useOnboardingStore } from '@/store/useOnboardingStore';

// Dynamic import to avoid SSR issues
const Joyride = dynamic(() => import('react-joyride'), { ssr: false });

const tourSteps: Step[] = [
    {
        target: '#voice-button',
        content: '🎤 Tekan tombol ini untuk mulai bicara. Ucapkan transaksi seperti "Jual es teh 5 ribu" atau "Beli beras 50 ribu".',
        placement: 'top',
        disableBeacon: true,
    },
    {
        target: '#scan-button',
        content: '📷 Scan struk belanja untuk otomatis mencatat pembelian. Cukup foto dan biarkan AI membaca isinya!',
        placement: 'bottom',
    },
    {
        target: '#agent-button',
        content: '🤖 Tanya AI tentang usaha Anda. Misalnya "Berapa total penjualan minggu ini?" atau "Stok apa yang hampir habis?"',
        placement: 'bottom',
    },
    {
        target: '#stats-grid',
        content: '📊 Lihat ringkasan keuangan warung Anda di sini. Tap kartu Target untuk mengatur target penjualan.',
        placement: 'bottom',
    },
    {
        target: '#nav-stok',
        content: '📦 Kelola stok barang dagangan Anda. Tambah, edit, dan pantau persediaan dengan mudah.',
        placement: 'top',
    },
    {
        target: '#nav-hutang',
        content: '💰 Catat dan pantau piutang pelanggan. Tidak ada lagi pelanggan yang lupa bayar!',
        placement: 'top',
    },
    {
        target: '#nav-ringkasan',
        content: '📈 Lihat laporan dan grafik penjualan. Analisis performa usaha Anda secara lengkap.',
        placement: 'top',
    },
];

// Custom styles matching app theme - optimized for 320px viewport
const joyrideStyles: Partial<Styles> = {
    options: {
        arrowColor: 'hsl(var(--card))',
        backgroundColor: 'hsl(var(--card))',
        overlayColor: 'rgba(0, 0, 0, 0.7)',
        primaryColor: 'hsl(var(--primary))',
        textColor: 'hsl(var(--foreground))',
        spotlightShadow: '0 0 15px rgba(0, 0, 0, 0.5)',
        zIndex: 10000,
        width: 280,
    },
    tooltip: {
        borderRadius: 12,
        padding: 16,
        maxWidth: 280,
    },
    tooltipContainer: {
        textAlign: 'left' as const,
    },
    tooltipTitle: {
        fontSize: 16,
        fontWeight: 700,
        marginBottom: 6,
    },
    tooltipContent: {
        fontSize: 13,
        lineHeight: 1.5,
        padding: '6px 0',
    },
    buttonNext: {
        backgroundColor: 'hsl(var(--primary))',
        borderRadius: 8,
        color: 'hsl(var(--primary-foreground))',
        fontSize: 13,
        fontWeight: 600,
        padding: '8px 16px',
    },
    buttonBack: {
        color: 'hsl(var(--muted-foreground))',
        fontSize: 13,
        marginRight: 8,
    },
    buttonSkip: {
        color: 'hsl(var(--muted-foreground))',
        fontSize: 13,
    },
    spotlight: {
        borderRadius: 10,
    },
};

// Locale translations
const locale = {
    back: 'Kembali',
    close: 'Tutup',
    last: 'Selesai',
    next: 'Lanjut',
    nextLabelWithProgress: 'Lanjut ({step}/{steps})',
    open: 'Buka dialog',
    skip: 'Lewati',
};

interface GuidedTourProps {
    run: boolean;
    onFinish?: () => void;
}

export function GuidedTour({ run, onFinish }: GuidedTourProps) {
    const { markTourCompleted } = useOnboardingStore();
    // Track client-side hydration without useState in effect
    const isMounted = typeof window !== 'undefined';

    const handleCallback = (data: CallBackProps) => {
        const { status, type } = data;

        // Tour finished or skipped
        if (status === 'finished' || status === 'skipped') {
            markTourCompleted();
            onFinish?.();
        }

        // Log for debugging
        if (type === 'error:target_not_found') {
            console.warn('Tour target not found:', data);
        }
    };

    if (!isMounted) return null;

    return (
        <Joyride
            callback={handleCallback}
            continuous
            disableScrolling
            hideCloseButton
            run={run}
            showProgress
            showSkipButton
            spotlightClicks
            steps={tourSteps}
            styles={joyrideStyles}
            locale={locale}
            floaterProps={{
                disableAnimation: false,
            }}
        />
    );
}
