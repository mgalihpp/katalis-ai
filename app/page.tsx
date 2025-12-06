'use client';

import { LandingNavbar } from '@/components/LandingNavbar';
import { LandingFooter } from '@/components/LandingFooter';
import {
    HeroSection,
    FeaturesSection,
    HowItWorksSection,
    TestimonialsSection,
    CTASection
} from '@/components/landing';

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-background overflow-x-hidden">
            <LandingNavbar />
            <HeroSection />
            <FeaturesSection />
            <HowItWorksSection />
            <TestimonialsSection />
            <CTASection />
            <LandingFooter />
        </div>
    );
}
