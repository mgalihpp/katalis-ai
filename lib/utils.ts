import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Kasir Suara - Formatting Utilities

/**
 * Format number as Indonesian Rupiah currency
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format number with thousand separators (Indonesian style)
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('id-ID').format(num);
}

/**
 * Format date to Indonesian locale
 */
export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

/**
 * Format time to Indonesian locale
 */
export function formatTime(date: string | Date): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/**
 * Format relative time (e.g., "5 menit lalu")
 */
export function formatRelativeTime(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Baru saja';
  if (diffMins < 60) return `${diffMins} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays < 7) return `${diffDays} hari lalu`;

  return formatDate(d);
}

/**
 * Get greeting based on time of day
 */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 11) return 'Selamat Pagi';
  if (hour < 15) return 'Selamat Siang';
  if (hour < 18) return 'Selamat Sore';
  return 'Selamat Malam';
}

/**
 * Format transaction type to Indonesian label
 */
export function formatTransactionType(type: string): string {
  const labels: Record<string, string> = {
    sale: 'Penjualan',
    purchase: 'Pembelian',
    debt_add: 'Hutang Baru',
    debt_payment: 'Bayar Hutang',
    stock_add: 'Tambah Stok',
    stock_check: 'Cek Stok',
    price_update: 'Update Harga',
  };
  return labels[type] || type;
}

/**
 * Get icon name for transaction type
 */
export function getTransactionIcon(type: string): string {
  const icons: Record<string, string> = {
    sale: 'trending-up',
    purchase: 'shopping-cart',
    debt_add: 'user-plus',
    debt_payment: 'check-circle',
    stock_add: 'package-plus',
    stock_check: 'package-search',
    price_update: 'tag',
  };
  return icons[type] || 'circle';
}
