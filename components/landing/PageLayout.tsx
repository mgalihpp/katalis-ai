import { LandingNavbar } from '@/components/LandingNavbar';
import { LandingFooter } from '@/components/LandingFooter';

interface PageLayoutProps {
    children: React.ReactNode;
    className?: string;
}

export function PageLayout({ children, className = '' }: PageLayoutProps) {
    return (
        <div className={`min-h-screen bg-gradient-to-b from-primary/5 via-background to-background ${className}`}>
            <LandingNavbar />
            <main className="pt-20">
                {children}
            </main>
            <LandingFooter />
        </div>
    );
}
