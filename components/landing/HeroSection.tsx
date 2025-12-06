'use client';

import Link from 'next/link';
import { Sparkles, ArrowRight, Mic, BarChart3, Package, HandCoins, Camera, Bot } from 'lucide-react';


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
        <section className="relative flex items-center justify-center pt-24 pb-16 sm:pt-28 sm:pb-20">
            {/* Background Gradient - Fixed to viewport */}
            <div className="fixed inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/5 -z-10" />

            {/* Animated Background Circles - Fixed to viewport */}
            <div className="fixed inset-0 overflow-hidden hidden sm:block -z-10 pointer-events-none">
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
            <FloatingIcon icon={Mic} className="top-[20%] left-[20%]" delay="0.3s" />

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
                <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed px-2">
                    Cukup bicara, AI kami akan mencatat transaksi, stok, dan hutang secara otomatis.
                </p>

                {/* Wave Animation */}
                <div className="mb-6 sm:mb-8">
                    <div className="flex items-end justify-center gap-1 h-12 sm:h-14">
                        {/* Wave Bars with gradient effect */}
                        {[0.6, 0.8, 1, 0.8, 0.6].map((scale, index) => (
                            <div
                                key={index}
                                className="w-1.5 sm:w-2 rounded-full"
                                style={{
                                    height: `${scale * 100}%`,
                                    background: 'linear-gradient(to top, hsl(var(--primary)), hsl(160, 84%, 45%))',
                                    boxShadow: '0 0 12px hsl(var(--primary) / 0.5)',
                                    animation: 'wave 1.2s ease-in-out infinite',
                                    animationDelay: `${index * 0.15}s`
                                }}
                            />
                        ))}
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
