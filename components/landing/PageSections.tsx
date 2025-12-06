import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface PageHeroProps {
    badge?: string;
    title: React.ReactNode;
    description: string;
}

export function PageHero({ badge, title, description }: PageHeroProps) {
    return (
        <section className="py-16 sm:py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="max-w-4xl mx-auto text-center">
                    {badge && (
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                            {badge}
                        </div>
                    )}
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
                        {title}
                    </h1>
                    <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
                        {description}
                    </p>
                </div>
            </div>
        </section>
    );
}

export function PageCTA() {
    return (
        <section className="py-16 sm:py-24 bg-gradient-to-r from-primary to-emerald-600">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Siap Mencoba Katalis AI?</h2>
                <p className="text-white/80 mb-8 max-w-xl mx-auto">
                    Mulai kelola usaha Anda dengan lebih mudah hari ini. Gratis dan tanpa perlu kartu kredit.
                </p>
                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-primary font-semibold hover:bg-white/90 transition-colors shadow-lg"
                >
                    Mulai Sekarang — Gratis
                    <ArrowRight className="w-5 h-5" />
                </Link>
            </div>
        </section>
    );
}
