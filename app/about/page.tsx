'use client';

import Image from 'next/image';
import { Target, Users, Zap, Heart, Shield, Sparkles, Mic, Camera, Brain, Cloud } from 'lucide-react';
import { PageLayout, PageCTA, AnimatedCounter } from '@/components/landing';

const stats = [
    { value: '2+', label: 'UMKM Terbantu' },
    { value: '100+', label: 'Transaksi Diproses' },
    { value: '93%', label: 'Akurasi AI' },
    { value: '24/7', label: 'Ketersediaan' },
];

const values = [
    {
        icon: Users,
        title: 'Untuk Semua',
        description: 'Dirancang agar mudah digunakan oleh siapa saja, dari yang muda hingga yang tua. Tidak perlu keahlian teknis.',
        color: 'from-primary to-emerald-600',
    },
    {
        icon: Target,
        title: 'Fokus UMKM',
        description: 'Fitur yang benar-benar dibutuhkan UMKM Indonesia: transaksi, stok, hutang, dan laporan sederhana.',
        color: 'from-orange-500 to-red-500',
    },
    {
        icon: Zap,
        title: 'Teknologi Terdepan',
        description: 'Menggunakan AI terbaru untuk pengalaman yang cepat, akurat, dan terus berkembang.',
        color: 'from-blue-500 to-indigo-600',
    },
    {
        icon: Heart,
        title: 'Dibuat dengan Cinta',
        description: 'Lahir dari keinginan tulus untuk membantu jutaan pemilik usaha kecil di Indonesia.',
        color: 'from-pink-500 to-rose-600',
    },
    {
        icon: Shield,
        title: 'Aman & Terpercaya',
        description: 'Data Anda terenkripsi dan tersimpan aman di cloud dengan standar keamanan tinggi.',
        color: 'from-teal-500 to-cyan-600',
    },
    {
        icon: Sparkles,
        title: 'Selalu Berinovasi',
        description: 'Terus menambahkan fitur baru berdasarkan masukan dari pengguna di lapangan.',
        color: 'from-purple-500 to-violet-600',
    },
];

export default function AboutPage() {
    return (
        <PageLayout>
            {/* Hero Section */}
            <section className="py-16 sm:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                            <Sparkles className="w-4 h-4" />
                            Tentang Kami
                        </div>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
                            Memberdayakan <span className="text-gradient-primary">UMKM Indonesia</span> dengan AI
                        </h1>
                        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
                            Katalis AI lahir dari keinginan untuk membantu jutaan pemilik UMKM yang masih kesulitan mencatat transaksi dan mengelola keuangan usahanya.
                        </p>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-16 sm:py-20 relative overflow-hidden">
                {/* Background Decoration */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-emerald-500/5 to-primary/5" />
                <div className="absolute top-0 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
                    <div className="text-center mb-10">
                        <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
                            Dipercaya oleh UMKM Indonesia
                        </h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8">
                        {stats.map((stat) => (
                            <AnimatedCounter key={stat.label} value={stat.value} label={stat.label} />
                        ))}
                    </div>
                </div>
            </section>

            {/* Mission Section */}
            <section className="py-16 sm:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-6">Misi Kami</h2>
                            <div className="space-y-4 text-muted-foreground">
                                <p>
                                    Di Indonesia, ada lebih dari <span className="text-foreground font-semibold">64 juta UMKM</span> yang menjadi tulang punggung ekonomi nasional. Namun, banyak dari mereka masih kesulitan dalam hal pencatatan keuangan.
                                </p>
                                <p>
                                    Kami percaya bahwa <span className="text-foreground font-semibold">teknologi harus memudahkan, bukan menyulitkan</span>. Dengan memanfaatkan kecerdasan buatan dan pengenalan suara, kami membuat pencatatan keuangan semudah berbicara.
                                </p>
                                <p>
                                    Tidak perlu lagi repot menulis atau mengetik transaksi satu per satu. <span className="text-foreground font-semibold">Cukup ucapkan, dan AI akan mencatatnya untuk Anda.</span>
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-center">
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary/20 rounded-3xl blur-sm" />
                                <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white/20">
                                    <Image
                                        src="/umkm.png"
                                        alt="UMKM Indonesia"
                                        width={400}
                                        height={400}
                                        className="w-64 h-64 sm:w-80 sm:h-80 object-cover"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Values Section */}
            <section className="py-16 sm:py-24 bg-muted/30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="text-center mb-12">
                        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                            Nilai-Nilai <span className="text-gradient-primary">Kami</span>
                        </h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            Prinsip yang memandu setiap keputusan dan fitur yang kami bangun
                        </p>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {values.map((value) => (
                            <div key={value.title} className="p-6 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300">
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${value.color} flex items-center justify-center mb-4`}>
                                    <value.icon className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="font-bold text-foreground mb-2">{value.title}</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">{value.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Technology Section */}
            <section className="py-16 sm:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                                Teknologi di Balik <span className="text-gradient-primary">Katalis AI</span>
                            </h2>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-6">
                            <div className="group p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-emerald-500/10 border border-primary/20 hover:border-primary/40 transition-all duration-300">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Mic className="w-5 h-5 text-white" />
                                    </div>
                                    <h3 className="font-bold text-foreground">Speech-to-Text AI</h3>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Menggunakan model AI canggih untuk mengubah ucapan menjadi teks dengan akurasi tinggi, mendukung Bahasa Indonesia.
                                </p>
                            </div>
                            <div className="group p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 hover:border-blue-500/40 transition-all duration-300">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Brain className="w-5 h-5 text-white" />
                                    </div>
                                    <h3 className="font-bold text-foreground">Natural Language Processing</h3>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    AI memahami konteks ucapan dan mengekstrak data transaksi secara otomatis dari kalimat natural.
                                </p>
                            </div>
                            <div className="group p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Camera className="w-5 h-5 text-white" />
                                    </div>
                                    <h3 className="font-bold text-foreground">OCR Recognition</h3>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Scan struk belanja dan AI akan membaca serta mencatat item-item pembelian secara otomatis.
                                </p>
                            </div>
                            <div className="group p-6 rounded-2xl bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 hover:border-orange-500/40 transition-all duration-300">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Cloud className="w-5 h-5 text-white" />
                                    </div>
                                    <h3 className="font-bold text-foreground">Cloud Sync</h3>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Data tersinkronisasi secara real-time ke cloud, aman dan dapat diakses dari perangkat manapun.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <PageCTA />
        </PageLayout>
    );
}
