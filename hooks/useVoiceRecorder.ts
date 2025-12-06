import { useState, useRef, useCallback } from 'react';
import type { VoiceRecordingState } from '@/types';

interface UseVoiceRecorderReturn {
  state: VoiceRecordingState;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob | null>;
  resetState: () => void;
  setProcessing: (isProcessing: boolean) => void;
  setTranscript: (transcript: string) => void;
  setError: (error: string | null) => void;
}

export function useVoiceRecorder(): UseVoiceRecorderReturn {
  const [state, setState] = useState<VoiceRecordingState>({
    isRecording: false,
    isProcessing: false,
    audioBlob: null,
    transcript: null,
    parsedResult: null,
    error: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const selectedMimeTypeRef = useRef<string>('audio/webm');

  const startRecording = useCallback(async () => {
    try {
      // Reset previous state
      setState(prev => ({
        ...prev,
        isRecording: false,
        audioBlob: null,
        transcript: null,
        parsedResult: null,
        error: null,
      }));

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        }
      });

      // Create MediaRecorder with fallback MIME types for browser compatibility
      // Order matters: prefer formats that work well across platforms
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
        'audio/aac',
        'audio/mpeg',
        '', // Empty string = browser default
      ];

      let selectedMimeType = '';
      for (const mimeType of mimeTypes) {
        if (mimeType === '' || MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          break;
        }
      }

      // Store the selected MIME type for later use
      selectedMimeTypeRef.current = selectedMimeType || 'audio/webm';

      const mediaRecorderOptions: MediaRecorderOptions = selectedMimeType
        ? { mimeType: selectedMimeType }
        : {}; // Let browser choose if no supported type found

      const mediaRecorder = new MediaRecorder(stream, mediaRecorderOptions);

      // Get the actual MIME type from the recorder (browser may adjust it)
      if (mediaRecorder.mimeType) {
        selectedMimeTypeRef.current = mediaRecorder.mimeType;
      }

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100); // Collect data every 100ms

      setState(prev => ({ ...prev, isRecording: true }));
    } catch (error) {
      console.error('Failed to start recording:', error);
      setState(prev => ({
        ...prev,
        error: 'Gagal mengakses mikrofon. Pastikan izin mikrofon sudah diberikan.',
      }));
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
        resolve(null);
        return;
      }

      mediaRecorderRef.current.onstop = () => {
        // Use the actual MIME type from recording, not hardcoded 'audio/webm'
        const actualMimeType = selectedMimeTypeRef.current || mediaRecorderRef.current?.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: actualMimeType });

        // Stop all tracks
        mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());

        setState(prev => ({
          ...prev,
          isRecording: false,
          audioBlob,
        }));

        resolve(audioBlob);
      };

      mediaRecorderRef.current.stop();
    });
  }, []);

  const resetState = useCallback(() => {
    setState({
      isRecording: false,
      isProcessing: false,
      audioBlob: null,
      transcript: null,
      parsedResult: null,
      error: null,
    });
  }, []);

  const setProcessing = useCallback((isProcessing: boolean) => {
    setState(prev => ({ ...prev, isProcessing }));
  }, []);

  const setTranscript = useCallback((transcript: string) => {
    setState(prev => ({ ...prev, transcript }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error, isProcessing: false }));
  }, []);

  return {
    state,
    startRecording,
    stopRecording,
    resetState,
    setProcessing,
    setTranscript,
    setError,
  };
}
