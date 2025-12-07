// Kasir Suara - Type Definitions

export type TransactionType = 'sale' | 'purchase' | 'debt_add' | 'debt_payment' | 'stock_add' | 'stock_check' | 'price_update';

// Stock Item
export interface StockItem {
  id: string;
  name: string;
  normalized_name: string;
  quantity: number;                    // Legacy: stok dalam satuan pack (dus/pak) - for display
  small_unit_quantity: number | null;  // Stok total dalam satuan kecil (pcs/bungkus) - source of truth
  unit: string;                        // Legacy: kept for compatibility, same as pack_unit
  pack_unit: string;                   // Satuan pack/kemasan (dus, pak, peti)
  unit_unit: string;                   // Satuan kecil/eceran (pcs, bungkus, kg)
  units_per_pack: number | null;       // Isi per pack (contoh: 40 = "1 dus = 40 pcs")
  modal_per_pack: number | null;       // Harga modal beli per dus/pak
  modal_per_unit: number | null;       // Harga modal beli per satuan kecil
  sell_per_unit: number | null;        // Harga jual per satuan kecil
  sell_per_pack: number | null;        // Harga jual per dus/pak
  min_stock: number;
  created_at: string;
  updated_at: string;
}

export interface StockMovement {
  id: string;
  stock_id: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason: string;
  reference_id: string | null;
  created_at: string;
}

export interface TransactionItem {
  item_name: string;
  quantity: number | null;
  unit: string | null;
  price_per_unit: number | null;
  total_amount: number;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  items: TransactionItem[];
  total_amount: number;
  note: string | null;
  raw_text: string;
  created_at: string;
}

export interface Debt {
  id: string;
  debtor_name: string;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  status: 'pending' | 'partial' | 'paid';
  transactions: DebtTransaction[];
  created_at: string;
  updated_at: string;
}

export interface DebtTransaction {
  id: string;
  debt_id: string;
  type: 'add' | 'payment';
  amount: number;
  note: string | null;
  created_at: string;
}

export interface DailySummary {
  date: string;
  total_sales: number;
  total_purchases: number;
  total_debt_added: number;
  total_debt_paid: number;
  net_profit: number;
  transaction_count: number;
  top_items: { name: string; quantity: number; total: number }[];
}

export interface ParsedVoiceResult {
  type: TransactionType;
  transactions: {
    item_name: string | null;
    quantity: number | null;
    unit: string | null;
    price_per_unit: number | null;
    total_amount: number | null;
  }[];
  debt: {
    debtor_name: string | null;
    amount: number | null;
    original_amount: number | null; // For compound scenarios: "hutang 50rb, bayar 25rb" -> original=50000, amount=25000
  } | null;
  stock: {
    item_name: string | null;
    quantity: number | null;
    unit: string | null;
    units_per_pack: number | null;
    modal_per_pack: number | null;
    modal_per_unit: number | null;
    sell_per_unit: number | null;
    sell_per_pack: number | null;
  } | null;
  note: string | null;
  raw_text: string;
  confidence: number;
}

export interface VoiceRecordingState {
  isRecording: boolean;
  isProcessing: boolean;
  audioBlob: Blob | null;
  transcript: string | null;
  parsedResult: ParsedVoiceResult | null;
  error: string | null;
}

// OCR Types for Kolosal AI
export interface OCRMerchant {
  name?: string;
  address?: string;
  contact?: string;
}

export interface OCRReceiptInfo {
  receipt_number?: string;
  date?: string;
  additional_info?: Record<string, unknown>;
}

export interface OCRItem {
  name: string;
  quantity?: number | string;
  unit?: string; // Added for stock integration
  unit_price?: number | string;
  total_price?: number | string;
  code?: string;
  category?: string;
  extra_fields?: Record<string, unknown>;
}

export interface OCRSummary {
  subtotal?: number | string;
  discount?: number | string | null;
  tax?: number | string | null;
  total?: number | string;
}

export interface OCRFooter {
  notes?: string;
  signature?: string;
}

export interface OCRMetadata {
  confidence_score?: number;
  processing_time?: number;
  source?: string;
}

export interface OCRReceiptResult {
  merchant?: OCRMerchant;
  receipt_info?: OCRReceiptInfo;
  items?: OCRItem[];
  summary?: OCRSummary;
  footer?: OCRFooter;
  metadata?: OCRMetadata;
}
