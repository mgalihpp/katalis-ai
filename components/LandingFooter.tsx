import Link from 'next/link';
import Image from 'next/image';

const footerLinks = {
    product: [
        { href: '/#features', label: 'Fitur' },
        { href: '/#how-it-works', label: 'Cara Kerja' },
        { href: '/dashboard', label: 'Dashboard' },
    ],
    company: [
        { href: '/about', label: 'Tentang Kami' },
        { href: '/privacy', label: 'Kebijakan Privasi' },
        { href: '/terms', label: 'Syarat & Ketentuan' },
    ],
};

export function LandingFooter() {
    return (
        <footer className="bg-muted/50 border-t border-border">
            <div className="container mx-auto px-4 sm:px-6 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="md:col-span-2">
                        <Link href="/" className="flex items-center gap-2 mb-4">
                            <Image src="/logo_nobg.png" alt="Katalis AI" width={32} height={32} className="w-8 h-8" />
                            <span className="font-bold text-lg text-gradient-primary">Katalis AI</span>
                        </Link>
                        <p className="text-sm text-muted-foreground max-w-sm">
                            Asisten AI untuk pemilik UMKM Indonesia. Kelola keuangan, stok, dan hutang hanya dengan suara.
                        </p>
                    </div>

                    {/* Product Links */}
                    <div>
                        <h3 className="font-semibold text-foreground mb-4">Produk</h3>
                        <ul className="space-y-2">
                            {footerLinks.product.map((link) => (
                                <li key={link.href}>
                                    <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Company Links */}
                    <div>
                        <h3 className="font-semibold text-foreground mb-4">Perusahaan</h3>
                        <ul className="space-y-2">
                            {footerLinks.company.map((link) => (
                                <li key={link.href}>
                                    <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-border mt-8 pt-8 text-center">
                    <p className="text-sm text-muted-foreground">
                        © {new Date().getFullYear()} Katalis AI. Dibuat dengan ❤️ untuk UMKM Indonesia
                    </p>
                </div>
            </div>
        </footer>
    );
}
