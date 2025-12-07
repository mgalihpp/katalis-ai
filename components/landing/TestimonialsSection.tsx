import { Quote } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const testimonials = [
    {
        name: 'Bu Siti',
        role: 'Warung Makan',
        content: 'Tidak perlu repot menulis lagi. Tinggal bicara, semua tercatat rapi!',
        avatar: '/bu_siti.png',
        initials: 'BS',
    },
    {
        name: 'Pak Budi',
        role: 'Toko Kelontong',
        content: 'Fitur hutangnya sangat membantu. Tidak ada lagi pelanggan lupa bayar.',
        avatar: '/pak_budi.png',
        initials: 'PB',
    },
    {
        name: 'Bu Dewi',
        role: 'Warung Kopi',
        content: 'Sangat mudah digunakan. Ibu saya yang sudah tua pun bisa pakai!',
        avatar: '/bu_dewi.png',
        initials: 'BD',
    },
];

export function TestimonialsSection() {
    return (
        <section className="py-12 sm:py-20 md:py-32 bg-muted/30">
            <div className="px-5 max-w-7xl mx-auto sm:px-6">
                {/* Section Header */}
                <div className="text-center mb-8 sm:mb-16">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4">
                        Kata <span className="text-gradient-primary">Mereka</span>
                    </h2>
                    <p className="text-muted-foreground text-sm sm:text-lg max-w-2xl mx-auto">
                        Bergabung dengan sebagian pemilik UMKM yang sudah merasakan kemudahan
                    </p>
                </div>

                {/* Testimonials Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto">
                    {testimonials.map((testimonial, index) => (
                        <div
                            key={testimonial.name}
                            className="relative p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-card border border-border/50"
                            style={{ animationDelay: `${index * 0.1}s` }}
                        >
                            {/* Quote Icon */}
                            <Quote className="w-6 h-6 sm:w-8 sm:h-8 text-primary/20 mb-3 sm:mb-4" />

                            {/* Content */}
                            <p className="text-foreground text-sm sm:text-base mb-4 sm:mb-6 leading-relaxed">&quot;{testimonial.content}&quot;</p>

                            {/* Author */}
                            <div className="flex items-center gap-3 sm:gap-4">
                                <Avatar className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-primary/20">
                                    <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-foreground font-medium">
                                        {testimonial.initials}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h4 className="font-semibold text-foreground text-sm sm:text-base">{testimonial.name}</h4>
                                    <p className="text-xs sm:text-sm text-muted-foreground">{testimonial.role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
