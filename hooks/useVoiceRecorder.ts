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
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
      ];

      let selectedMimeType = mimeTypes[0];
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          break;
        }
      }

      console.log('Using audio MIME type:', selectedMimeType);

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: selectedMimeType,
      });

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
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

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
