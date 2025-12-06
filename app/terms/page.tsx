import { PageLayout } from '@/components/landing';
import Link from 'next/link';

export default function TermsPage() {
    const lastUpdated = new Date().toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <PageLayout>
            {/* Header */}
            <section className="py-12 sm:py-16">
                <div className="max-w-4xl mx-auto px-4 sm:px-6">
                    <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                        Syarat & Ketentuan
                    </h1>
                    <p className="text-muted-foreground">
                        Terakhir diperbarui: {lastUpdated}
                    </p>
                </div>
            </section>

            {/* Content */}
            <section className="pb-16 sm:pb-24">
                <div className="max-w-4xl mx-auto px-4 sm:px-6">
                    <div className="space-y-10">
                        <div>
                            <h2 className="text-xl font-bold text-foreground mb-4">1. Penerimaan Ketentuan</h2>
                            <p className="text-muted-foreground">
                                Dengan mengakses dan menggunakan Katalis AI, Anda menyetujui untuk terikat oleh Syarat dan Ketentuan ini. Jika Anda tidak setuju dengan bagian mana pun dari ketentuan ini, Anda tidak boleh menggunakan layanan kami.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-foreground mb-4">2. Deskripsi Layanan</h2>
                            <p className="text-muted-foreground mb-3">
                                Katalis AI menyediakan layanan pencatatan keuangan berbasis suara untuk UMKM, termasuk:
                            </p>
                            <ul className="list-disc list-inside space-y-2 text-muted-foreground pl-4">
                                <li>Pencatatan transaksi dengan input suara</li>
                                <li>Manajemen stok dan inventaris</li>
                                <li>Pencatatan hutang piutang</li>
                                <li>Laporan dan analitik bisnis</li>
                                <li>Scan struk dengan teknologi OCR</li>
                            </ul>
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-foreground mb-4">3. Akun Pengguna</h2>
                            <p className="text-muted-foreground">
                                Anda bertanggung jawab untuk menjaga kerahasiaan akun dan kata sandi Anda. Anda setuju untuk segera memberitahu kami tentang penggunaan tidak sah atas akun Anda.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-foreground mb-4">4. Penggunaan yang Dilarang</h2>
                            <p className="text-muted-foreground mb-3">
                                Anda tidak diperbolehkan:
                            </p>
                            <ul className="list-disc list-inside space-y-2 text-muted-foreground pl-4">
                                <li>Menggunakan layanan untuk tujuan ilegal</li>
                                <li>Mencoba mengakses sistem secara tidak sah</li>
                                <li>Menyalahgunakan atau memanipulasi layanan</li>
                                <li>Mengganggu atau merusak layanan</li>
                            </ul>
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-foreground mb-4">5. Batasan Tanggung Jawab</h2>
                            <p className="text-muted-foreground">
                                Katalis AI tidak bertanggung jawab atas kerugian langsung, tidak langsung, insidental, atau konsekuensial yang timbul dari penggunaan layanan kami.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-foreground mb-4">6. Hubungi Kami</h2>
                            <p className="text-muted-foreground">
                                Jika Anda memiliki pertanyaan tentang Syarat dan Ketentuan ini, silakan hubungi kami melalui halaman <Link href="/about" className="text-primary hover:underline">Tentang Kami</Link>.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </PageLayout>
    );
}
