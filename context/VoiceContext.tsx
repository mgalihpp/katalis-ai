'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { toast } from 'sonner';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { useTransactionStore } from '@/store/useTransactionStore';
import { useStockStore } from '@/store/useStockStore';
import type { ParsedVoiceResult } from '@/types';

interface VoiceContextType {
  isRecording: boolean;
  isProcessing: boolean;
  error: string | null;
  showModal: boolean;
  currentResult: { transcript: string; parsed: ParsedVoiceResult } | null;
  handleVoicePress: () => void;
  handleVoiceRelease: () => Promise<void>;
  handleConfirm: () => void;
  handleCancel: () => void;
  handleRetry: () => void;
}

const VoiceContext = createContext<VoiceContextType | null>(null);

// Minimum audio size in bytes (skip if too small - likely empty/silent)
const MIN_AUDIO_SIZE = 1000; // ~1KB

// Get file extension from MIME type
function getExtensionFromMimeType(mimeType: string): string {
  const extensionMap: Record<string, string> = {
    'audio/webm': 'webm',
    'audio/webm;codecs=opus': 'webm',
    'audio/ogg': 'ogg',
    'audio/ogg;codecs=opus': 'ogg',
    'audio/mp4': 'mp4',
    'audio/x-m4a': 'm4a',
    'audio/aac': 'aac',
    'audio/mpeg': 'mp3',
    'audio/wav': 'wav',
  };

  // Check for exact match first, then partial match
  if (extensionMap[mimeType]) {
    return extensionMap[mimeType];
  }

  // Handle cases like 'audio/mp4; codecs=...'
  const baseMimeType = mimeType.split(';')[0].trim();
  return extensionMap[baseMimeType] || 'webm';
}

// Process voice via OpenAI API
async function processVoice(audioBlob: Blob): Promise<{ transcript: string; parsed: ParsedVoiceResult }> {
  // Check if audio is too small (likely empty/silent recording)
  if (audioBlob.size < MIN_AUDIO_SIZE) {
    throw new Error('Rekaman terlalu pendek. Tekan dan tahan lebih lama saat bicara.');
  }

  // Get the correct file extension based on the blob's MIME type
  const extension = getExtensionFromMimeType(audioBlob.type);
  const filename = `audio.${extension}`;

  const formData = new FormData();
  formData.append('audio', audioBlob, filename);

  const response = await fetch('/api/voice', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Gagal memproses suara. Silakan coba lagi.');
  }

  return response.json();
}

// Normalize units for sales (piece, pc → pcs)
// IMPORTANT: Bulk units (kg, ltr, gr) should NOT be converted to pcs
function normalizeUnitForSale(unit: string | null): string {
  if (!unit) return 'pcs';
  const normalized = unit.toLowerCase().trim();

  // Preserve bulk units - these are primary units for curah products
  const bulkUnits = ['kg', 'gr', 'ltr', 'ml', 'kilo', 'kilogram', 'gram', 'liter', 'ons'];
  if (bulkUnits.includes(normalized)) {
    // Normalize variations to standard form
    const bulkNormalize: Record<string, string> = {
      'kilo': 'kg',
      'kilogram': 'kg',
      'gram': 'gr',
      'liter': 'ltr',
    };
    return bulkNormalize[normalized] || normalized;
  }

  // For packaged products, normalize to pcs or standard units
  const unitMap: Record<string, string> = {
    'piece': 'pcs',
    'pieces': 'pcs',
    'pc': 'pcs',
    'bungkus': 'pcs',
    'biji': 'pcs',
    'buah': 'pcs',
    'bus': 'dus',
    'dos': 'dus',
    'bos': 'dus',
  };
  return unitMap[normalized] || normalized;
}

// Enrich transactions with prices from stock (for sales, purchases, and stock_add)
function enrichTransactionsWithPrices(
  parsed: ParsedVoiceResult,
  getStockByName: (name: string) => ReturnType<typeof useStockStore.getState>['stocks'][number] | undefined
): ParsedVoiceResult {
  // Only enrich sales, purchases, and stock_add
  if (parsed.type !== 'sale' && parsed.type !== 'purchase' && parsed.type !== 'stock_add') return parsed;
  
  // For stock_add, check if stock field has item_name
  if (parsed.type === 'stock_add') {
    if (!parsed.stock?.item_name) return parsed;
    
    const existingStock = getStockByName(parsed.stock.item_name);
    // Only enrich if modal_per_pack or modal_per_unit is not already set
    if (existingStock && parsed.stock.modal_per_pack === null && parsed.stock.modal_per_unit === null) {
      // Use modal price from stock for stock_add
      const packUnits = ['dus', 'pak', 'box', 'karton', 'lusin', 'krat', 'peti'];
      const normalizedUnit = normalizeUnitForSale(parsed.stock.unit);
      const isPack = packUnits.includes(normalizedUnit);
      
      return {
        ...parsed,
        stock: {
          ...parsed.stock,
          modal_per_pack: isPack ? (existingStock.modal_per_pack ?? null) : parsed.stock.modal_per_pack,
          modal_per_unit: existingStock.modal_per_unit ?? null,
          sell_per_unit: existingStock.sell_per_unit ?? null,
          sell_per_pack: isPack ? (existingStock.sell_per_pack ?? null) : parsed.stock.sell_per_pack,
          units_per_pack: existingStock.units_per_pack ?? parsed.stock.units_per_pack,
        },
      };
    }
    return parsed;
  }
  
  if (!parsed.transactions) return parsed;

  const packUnits = ['dus', 'pak', 'box', 'karton', 'lusin', 'krat', 'peti'];

  const enrichedTransactions = parsed.transactions.map(item => {
    if (!item.item_name) return item;

    const stock = getStockByName(item.item_name);
    const normalizedUnit = normalizeUnitForSale(item.unit);
    const isPack = packUnits.includes(normalizedUnit);

    let pricePerUnit = item.price_per_unit;

    // Only look up price if not provided
    if (pricePerUnit === null && stock) {
      if (parsed.type === 'sale') {
        // For sales, use sell prices
        pricePerUnit = isPack
          ? (stock.sell_per_pack ?? stock.sell_per_unit ?? null)
          : (stock.sell_per_unit ?? null);
      } else if (parsed.type === 'purchase') {
        // For purchases, use modal (cost) prices
        pricePerUnit = isPack
          ? (stock.modal_per_pack ?? stock.modal_per_unit ?? null)
          : (stock.modal_per_unit ?? null);
      }
    }

    const qty = item.quantity || 1;

    // IMPORTANT: Preserve existing total_amount if set by AI (e.g., "totalnya 65 ribu")
    // Only calculate if pricePerUnit exists AND item.total_amount is not already set
    let total = item.total_amount;
    if (pricePerUnit && !item.total_amount) {
      total = qty * pricePerUnit;
    }

    return {
      ...item,
      unit: normalizedUnit,
      quantity: qty,
      price_per_unit: pricePerUnit,
      total_amount: total,
    };
  });

  return {
    ...parsed,
    transactions: enrichedTransactions,
  };
}

export function VoiceProvider({ children }: { children: ReactNode }) {
  const { state, startRecording, stopRecording, resetState, setProcessing, setError } = useVoiceRecorder();
  const { addTransaction } = useTransactionStore();
  const { addStock, getStockByName, updateStockPrice } = useStockStore();

  const [showModal, setShowModal] = useState(false);
  const [currentResult, setCurrentResult] = useState<{ transcript: string; parsed: ParsedVoiceResult } | null>(null);

  const handleVoicePress = useCallback(() => {
    // Don't start new recording if modal is open or processing
    if (showModal || state.isProcessing) return;
    startRecording();
  }, [startRecording, showModal, state.isProcessing]);

  const handleVoiceRelease = useCallback(async () => {
    // Only process if we were actually recording
    if (!state.isRecording) return;

    const audioBlob = await stopRecording();
    if (!audioBlob) return;

    setShowModal(true);
    setProcessing(true);

    try {
      const result = await processVoice(audioBlob);

      // Enrich transactions with prices from stock (for sales)
      const enrichedParsed = enrichTransactionsWithPrices(result.parsed, getStockByName);

      setCurrentResult({
        transcript: result.transcript,
        parsed: enrichedParsed,
      });
      setProcessing(false);
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : 'Gagal memproses suara. Silakan coba lagi.';
      setError(errorMessage);
    }
  }, [state.isRecording, stopRecording, setProcessing, setError, getStockByName]);

  const handleConfirm = useCallback(() => {
    if (currentResult) {
      if (currentResult.parsed.type === 'stock_add' && currentResult.parsed.stock) {
        addStock(currentResult.parsed);
        toast.success('Stok berhasil ditambahkan!');
      } else if (currentResult.parsed.type === 'price_update' && currentResult.parsed.stock) {
        const updated = updateStockPrice(currentResult.parsed);
        if (updated) {
          toast.success('Harga berhasil diupdate!');
        } else {
          toast.error('Barang tidak ditemukan. Pastikan nama barang sudah ada di stok.');
        }
      } else {
        addTransaction(currentResult.parsed);
        toast.success('Transaksi berhasil disimpan!');
      }
    }
    setShowModal(false);
    setCurrentResult(null);
    resetState();
  }, [currentResult, addTransaction, addStock, updateStockPrice, resetState]);

  const handleCancel = useCallback(() => {
    setShowModal(false);
    setCurrentResult(null);
    resetState();
  }, [resetState]);

  const handleRetry = useCallback(() => {
    setShowModal(false);
    setCurrentResult(null);
    resetState();
  }, [resetState]);

  return (
    <VoiceContext.Provider
      value={{
        isRecording: state.isRecording,
        isProcessing: state.isProcessing,
        error: state.error,
        showModal,
        currentResult,
        handleVoicePress,
        handleVoiceRelease,
        handleConfirm,
        handleCancel,
        handleRetry,
      }}
    >
      {children}
    </VoiceContext.Provider>
  );
}

export function useVoice() {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error('useVoice must be used within a VoiceProvider');
  }
  return context;
}
