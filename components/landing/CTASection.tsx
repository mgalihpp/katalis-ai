import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function CTASection() {
    return (
        <section className="py-12 sm:py-20 md:py-32">
            <div className="px-5 max-w-7xl mx-auto sm:px-6">
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary to-emerald-600 p-8 sm:p-12 md:p-16 text-center">
                    {/* Background Decoration */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                    {/* Content */}
                    <div className="relative z-10">
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
                            Siap Memulai?
                        </h2>
                        <p className="text-white/80 text-sm sm:text-lg max-w-xl mx-auto mb-6 sm:mb-8">
                            Ribuan UMKM sudah merasakan kemudahan mencatat transaksi dengan suara. Sekarang giliran Anda!
                        </p>
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 rounded-full bg-white text-primary font-semibold hover:bg-white/90 transition-colors shadow-lg text-sm sm:text-base"
                        >
                            Mulai Sekarang — Gratis
                            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
