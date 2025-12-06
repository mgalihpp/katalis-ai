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

export function VoiceProvider({ children }: { children: ReactNode }) {
  const { state, startRecording, stopRecording, resetState, setProcessing, setError } = useVoiceRecorder();
  const { addTransaction } = useTransactionStore();
  const { addStock } = useStockStore();

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
      setCurrentResult(result);
      setProcessing(false);
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : 'Gagal memproses suara. Silakan coba lagi.';
      setError(errorMessage);
    }
  }, [state.isRecording, stopRecording, setProcessing, setError]);

  const handleConfirm = useCallback(() => {
    if (currentResult) {
      if (currentResult.parsed.type === 'stock_add' && currentResult.parsed.stock) {
        addStock(currentResult.parsed);
        toast.success('Stok berhasil ditambahkan!');
      } else {
        addTransaction(currentResult.parsed);
        toast.success('Transaksi berhasil disimpan!');
      }
    }
    setShowModal(false);
    setCurrentResult(null);
    resetState();
  }, [currentResult, addTransaction, addStock, resetState]);

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
