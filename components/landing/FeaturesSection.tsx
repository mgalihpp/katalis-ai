import { Mic, BarChart3, Package, Camera, Bot, HandCoins } from 'lucide-react';

const features = [
    {
        icon: Mic,
        title: 'Input Suara',
        description: 'Bicara seperti biasa, AI mengubah jadi catatan transaksi.',
        bgColor: 'from-primary/20 to-emerald-500/10',
        iconColor: 'text-primary',
    },
    {
        icon: BarChart3,
        title: 'Laporan Otomatis',
        description: 'Ringkasan harian, mingguan, bulanan langsung tersedia.',
        bgColor: 'from-blue-500/20 to-indigo-500/10',
        iconColor: 'text-blue-500',
    },
    {
        icon: Package,
        title: 'Manajemen Stok',
        description: 'Pantau stok realtime dengan notifikasi stok menipis.',
        bgColor: 'from-orange-500/20 to-amber-500/10',
        iconColor: 'text-orange-500',
    },
    {
        icon: Camera,
        title: 'OCR Scanner',
        description: 'Scan struk belanja dan AI akan mencatat otomatis.',
        bgColor: 'from-purple-500/20 to-pink-500/10',
        iconColor: 'text-purple-500',
    },
    {
        icon: Bot,
        title: 'AI Agent',
        description: 'Asisten pintar untuk menjawab pertanyaan bisnis Anda.',
        bgColor: 'from-cyan-500/20 to-teal-500/10',
        iconColor: 'text-cyan-500',
    },
    {
        icon: HandCoins,
        title: 'Kelola Hutang',
        description: 'Catat piutang pelanggan dan hutang ke supplier.',
        bgColor: 'from-rose-500/20 to-red-500/10',
        iconColor: 'text-rose-500',
    },
];

export function FeaturesSection() {
    return (
        <section className="py-12 sm:py-20 md:py-32 bg-muted/30">
            <div className="px-5 max-w-6xl mx-auto sm:px-6">
                {/* Section Header */}
                <div className="text-center mb-8 sm:mb-12">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4">
                        Fitur <span className="text-gradient-primary">Unggulan</span>
                    </h2>
                    <p className="text-muted-foreground text-sm sm:text-lg max-w-2xl mx-auto">
                        Semua yang Anda butuhkan untuk mengelola usaha, dalam satu aplikasi sederhana
                    </p>
                </div>

                {/* Features Grid - Notion Style */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {features.map((feature, index) => {
                        const Icon = feature.icon;
                        return (
                            <div
                                key={feature.title}
                                className="group p-6 sm:p-8 rounded-2xl bg-card border border-transparent hover:border-border hover:bg-muted/50 transition-all duration-300"
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                {/* Icon */}
                                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br ${feature.bgColor} flex items-center justify-center mb-4 sm:mb-5 group-hover:scale-110 transition-transform`}>
                                    <Icon className={`w-6 h-6 sm:w-7 sm:h-7 ${feature.iconColor}`} />
                                </div>

                                {/* Title */}
                                <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
                                    {feature.title}
                                </h3>

                                {/* Description */}
                                <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
