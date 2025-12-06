import { PageLayout } from '@/components/landing';
import Link from 'next/link';

export default function PrivacyPage() {
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
                        Kebijakan Privasi
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
                            <h2 className="text-xl font-bold text-foreground mb-4">1. Informasi yang Kami Kumpulkan</h2>
                            <p className="text-muted-foreground mb-3">
                                Kami mengumpulkan informasi yang Anda berikan secara langsung kepada kami, termasuk:
                            </p>
                            <ul className="list-disc list-inside space-y-2 text-muted-foreground pl-4">
                                <li>Data akun (email, nama toko)</li>
                                <li>Data transaksi penjualan dan pembelian</li>
                                <li>Data stok dan inventaris</li>
                                <li>Data hutang piutang</li>
                                <li>Rekaman suara untuk fitur input suara</li>
                            </ul>
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-foreground mb-4">2. Penggunaan Informasi</h2>
                            <p className="text-muted-foreground mb-3">
                                Informasi yang kami kumpulkan digunakan untuk:
                            </p>
                            <ul className="list-disc list-inside space-y-2 text-muted-foreground pl-4">
                                <li>Menyediakan dan memelihara layanan kami</li>
                                <li>Memproses transaksi dan mengirim notifikasi terkait</li>
                                <li>Meningkatkan dan mengembangkan fitur baru</li>
                                <li>Menganalisis penggunaan untuk optimasi layanan</li>
                            </ul>
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-foreground mb-4">3. Keamanan Data</h2>
                            <p className="text-muted-foreground">
                                Kami mengimplementasikan langkah-langkah keamanan yang sesuai untuk melindungi informasi Anda dari akses tidak sah, pengubahan, pengungkapan, atau penghancuran data. Data Anda dienkripsi dan disimpan dengan aman di cloud.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-foreground mb-4">4. Hak Anda</h2>
                            <p className="text-muted-foreground mb-3">
                                Anda memiliki hak untuk:
                            </p>
                            <ul className="list-disc list-inside space-y-2 text-muted-foreground pl-4">
                                <li>Mengakses data pribadi Anda</li>
                                <li>Memperbarui atau mengoreksi data Anda</li>
                                <li>Menghapus akun dan data Anda</li>
                                <li>Mengekspor data Anda</li>
                            </ul>
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-foreground mb-4">5. Hubungi Kami</h2>
                            <p className="text-muted-foreground">
                                Jika Anda memiliki pertanyaan tentang Kebijakan Privasi ini, silakan hubungi kami melalui email atau halaman <Link href="/about" className="text-primary hover:underline">Tentang Kami</Link>.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </PageLayout>
    );
}
