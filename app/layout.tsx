import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { AuthContextProvider } from '@/context/AuthContext';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Katalis AI - Asisten Kasir Berbasis Suara',
  description: 'Voice-First AI Assistant untuk UMKM Indonesia. Catat transaksi, kelola stok, dan pantau hutang hanya dengan suara Anda. Tap sekali, ngomong, selesai!',
  keywords: ['kasir suara', 'UMKM Indonesia', 'voice assistant', 'AI kasir', 'manajemen stok', 'pencatatan hutang', 'OCR nota'],
  authors: [{ name: 'Katalis AI Team' }],
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: 'https://katalis-ai-xi.vercel.app',
    siteName: 'Katalis AI',
    title: 'Katalis AI - Asisten Kasir Berbasis Suara',
    description: 'Voice-First AI Assistant untuk UMKM Indonesia. Catat transaksi, kelola stok, dan pantau hutang hanya dengan suara Anda.',
    images: [
      {
        url: '/og-cover.png',
        width: 1200,
        height: 630,
        alt: 'Katalis AI - Voice-First AI Assistant untuk UMKM Indonesia',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Katalis AI - Asisten Kasir Berbasis Suara',
    description: 'Voice-First AI Assistant untuk UMKM Indonesia. Tap sekali, ngomong, selesai!',
    images: ['/og-cover.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider >
          <AuthContextProvider>
            {children}
          </AuthContextProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
