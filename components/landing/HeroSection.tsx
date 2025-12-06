'use client';

import Link from 'next/link';
import { Sparkles, ArrowRight, Mic, BarChart3, Package, HandCoins, Camera, Bot } from 'lucide-react';

// Voice Wave Animation Component
function VoiceWave() {
    // Heights for each bar - centered pattern (smaller at edges, bigger in middle)
    const barHeights = [8, 14, 20, 24, 20, 14, 8];
    // Delays - start from center and ripple outward
    const delays = [0.3, 0.2, 0.1, 0, 0.1, 0.2, 0.3];

    return (
        <div className="flex items-center justify-center gap-1">
            {barHeights.map((height, i) => (
                <div
                    key={i}
                    className="w-1 sm:w-1.5 rounded-full bg-primary"
                    style={{
                        height: `${height}px`,
                        animation: 'wave 1s ease-in-out infinite',
                        animationDelay: `${delays[i]}s`,
                    }}
                />
            ))}
        </div>
    );
}

// Floating Icon Component
function FloatingIcon({ icon: Icon, className, delay = '0s' }: { icon: React.ElementType; className: string; delay?: string }) {
    return (
        <div
            className={`absolute hidden md:flex items-center justify-center w-12 h-12 rounded-xl bg-card/80 backdrop-blur border border-border shadow-lg ${className}`}
            style={{
                animation: 'float 3s ease-in-out infinite',
                animationDelay: delay
            }}
        >
            <Icon className="w-6 h-6 text-primary" />
        </div>
    );
}

const voiceExamples = [
    '"Jual minyak goreng 2 liter, 32 ribu"',
    '"Beli gula 5 kg, 75 ribu"',
    '"Pak Ahmad hutang 50 ribu"',
];

export function HeroSection() {
    return (
        <section className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden pt-20 pb-8 sm:pb-0">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/5" />

            {/* Animated Background Circles */}
            <div className="absolute inset-0 overflow-hidden hidden sm:block">
                <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/10 blur-3xl animate-pulse" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-accent/10 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
            </div>

            {/* Floating Icons - Desktop Only */}
            <FloatingIcon icon={BarChart3} className="top-1/4 left-[10%]" delay="0s" />
            <FloatingIcon icon={Package} className="top-1/3 right-[12%]" delay="0.5s" />
            <FloatingIcon icon={HandCoins} className="bottom-1/3 left-[15%]" delay="1s" />
            <FloatingIcon icon={Camera} className="bottom-1/4 right-[10%]" delay="1.5s" />
            <FloatingIcon icon={Bot} className="top-[45%] right-[8%]" delay="2s" />

            {/* Content */}
            <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-6 text-center">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs sm:text-sm font-medium mb-4 sm:mb-6">
                    <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                    AI-Powered untuk UMKM Indonesia
                </div>

                {/* Heading */}
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 sm:mb-6 leading-tight">
                    Catat Transaksi dengan
                    <br />
                    <span className="text-gradient-primary">Suara Anda</span>
                </h1>

                {/* Subheading */}
                <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed px-2">
                    Cukup bicara, AI kami akan mencatat transaksi, stok, dan hutang secara otomatis.
                </p>

                {/* Microphone Button with Wave Animation */}
                <div className="mb-6 sm:mb-8">
                    <div className="relative inline-block">
                        {/* Outer Ring Animation */}
                        <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" style={{ animationDuration: '2s' }} />
                        <div className="absolute -inset-3 rounded-full bg-primary/10 animate-pulse" />

                        {/* Microphone Button */}
                        <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center shadow-2xl shadow-primary/40 cursor-pointer hover:scale-105 transition-transform">
                            <Mic className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                        </div>
                    </div>

                    {/* Wave Animation Below */}
                    <div className="mt-6">
                        <VoiceWave />
                    </div>
                </div>

                {/* Voice Input Examples */}
                <div className="mb-8 sm:mb-10">
                    <p className="text-xs sm:text-sm text-muted-foreground mb-3">Contoh perintah suara:</p>
                    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                        {voiceExamples.map((example, index) => (
                            <span
                                key={index}
                                className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-muted/50 text-xs sm:text-sm text-foreground/80 border border-border/50"
                            >
                                {example}
                            </span>
                        ))}
                    </div>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                    <Link
                        href="/dashboard"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 rounded-full bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl text-sm sm:text-base"
                    >
                        Mulai Gratis
                        <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    </Link>
                    <a
                        href="#how-it-works"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 rounded-full border border-border hover:bg-muted transition-colors font-medium text-sm sm:text-base"
                    >
                        Lihat Demo
                    </a>
                </div>
            </div>

            {/* CSS for animations */}
            <style jsx>{`
                @keyframes wave {
                    0%, 100% { transform: scaleY(1); }
                    50% { transform: scaleY(1.5); }
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                }
            `}</style>
        </section>
    );
}
