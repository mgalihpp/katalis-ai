'use client';

const steps = [
    {
        number: 1,
        title: 'Bicara',
        description: 'Tekan mikrofon dan ucapkan transaksi Anda',
        video: '/video/step1_suara.mp4',
    },
    {
        number: 2,
        title: 'AI Proses',
        description: 'Suara diubah menjadi data terstruktur',
        video: '/video/step2_process_dan_output.mp4',
    },
    {
        number: 3,
        title: 'Selesai!',
        description: 'Transaksi tercatat dan ringkasan diperbarui',
        video: '/video/step3_hasil.mp4',
    },
];

export function HowItWorksSection() {
    return (
        <section id="how-it-works" className="py-12 sm:py-20 md:py-32">
            <div className="px-5 max-w-7xl mx-auto sm:px-6">
                {/* Section Header */}
                <div className="text-center mb-10 sm:mb-16">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4">
                        Cara Kerjanya? <span className="text-gradient-primary">Sederhana</span>
                    </h2>
                    <p className="text-muted-foreground text-sm sm:text-lg max-w-2xl mx-auto">
                        Sederhanakan hidup Anda dengan langkah mudah.
                    </p>
                </div>

                {/* Steps - Zigzag Layout */}
                <div className="max-w-6xl mx-auto relative px-4">
                    {/* Vertical connecting line - desktop only */}
                    <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2">
                        <div
                            className="h-full w-full"
                            style={{
                                backgroundSize: '1px 8px',
                                backgroundImage: 'linear-gradient(to bottom, hsl(var(--primary) / 0.4) 50%, transparent 50%)'
                            }}
                        />
                    </div>

                    <div className="space-y-24 sm:space-y-40">
                        {steps.map((step, index) => (
                            <div
                                key={step.number}
                                className="relative flex flex-col md:flex-row items-center justify-between"
                            >
                                {/* Content Side */}
                                <div className={`w-full md:w-[40%] ${index % 2 === 1 ? 'md:order-2 md:text-right md:pl-16' : 'md:order-1 md:text-left md:pr-16'} text-center mb-8 md:mb-0`}>
                                    {/* Step Label */}
                                    <div className={`flex items-center gap-3 mb-4 ${index % 2 === 1 ? 'md:justify-end' : 'md:justify-start'} justify-center`}>
                                        <span className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                                            Step {index + 1}
                                        </span>
                                        {/* Checkmark */}
                                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                                            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    </div>

                                    {/* Title */}
                                    <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
                                        {step.title}
                                    </h3>

                                    {/* Description */}
                                    <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
                                        {step.description}
                                    </p>
                                </div>

                                {/* Center dot on timeline - desktop only */}
                                <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-primary border-4 border-background shadow-lg z-20" />

                                {/* Video Side */}
                                <div className={`w-full md:w-[40%] ${index % 2 === 1 ? 'md:order-1 md:pr-16' : 'md:order-2 md:pl-16'} relative`}>
                                    {/* Video Card */}
                                    <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl">
                                        <video
                                            src={step.video}
                                            autoPlay
                                            loop
                                            muted
                                            playsInline
                                            className="w-full h-full aspect-video object-cover"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
