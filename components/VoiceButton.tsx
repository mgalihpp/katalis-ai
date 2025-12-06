import { Mic, Loader2, Square } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createRippleEffect } from '@/hooks/useRipple';
import { useRef, useCallback, useEffect, useState } from 'react';

interface VoiceButtonProps {
  isRecording: boolean;
  isProcessing: boolean;
  onPress: () => void;
  onRelease: () => void;
  disabled?: boolean;
}

// Threshold to differentiate tap vs hold (in ms)
const TAP_THRESHOLD = 300;

export function VoiceButton({
  isRecording,
  isProcessing,
  onPress,
  onRelease,
  disabled = false,
}: VoiceButtonProps) {
  // Track touch vs mouse
  const isTouchDevice = useRef(false);
  // Track press start time to differentiate tap vs hold
  const pressStartTime = useRef<number>(0);
  // Track if we're in "hold mode" - will auto-stop on release
  const isHoldMode = useRef(false);
  // Track if we started recording
  const hasStartedRecording = useRef(false);
  // Minimum recording duration
  const MIN_RECORDING_MS = 500;

  // Recording mode indicator
  const [showModeHint, setShowModeHint] = useState(false);

  const handleStart = useCallback(() => {
    if (disabled || isProcessing) return;

    // If already recording (tap mode), this tap should stop
    if (isRecording) {
      hasStartedRecording.current = false;
      isHoldMode.current = false;
      onRelease();
      return;
    }

    // Start new recording
    pressStartTime.current = Date.now();
    hasStartedRecording.current = true;
    isHoldMode.current = false; // Will be determined on release
    onPress();
  }, [disabled, isProcessing, isRecording, onPress, onRelease]);

  const handleEnd = useCallback(() => {
    if (!hasStartedRecording.current || !isRecording) return;

    const pressDuration = Date.now() - pressStartTime.current;

    // If held long enough, treat as hold-to-record (stop immediately)
    if (pressDuration >= TAP_THRESHOLD) {
      // Ensure minimum recording time
      if (pressDuration < MIN_RECORDING_MS) {
        setTimeout(() => {
          hasStartedRecording.current = false;
          onRelease();
        }, MIN_RECORDING_MS - pressDuration);
      } else {
        hasStartedRecording.current = false;
        onRelease();
      }
    } else {
      // Short tap - switch to tap mode, keep recording until next tap
      isHoldMode.current = false;
      // Show mode hint
      setShowModeHint(true);
      setTimeout(() => setShowModeHint(false), 2000);
    }
  }, [isRecording, onRelease]);

  // Mouse handlers
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    if (isTouchDevice.current) return;
    createRippleEffect(e);
    handleStart();
  }, [handleStart]);

  const handleMouseUp = useCallback(() => {
    if (isTouchDevice.current) return;
    handleEnd();
  }, [handleEnd]);

  const handleMouseLeave = useCallback(() => {
    if (isTouchDevice.current) return;
    // Only auto-stop if in hold mode
    if (hasStartedRecording.current && isHoldMode.current) {
      handleEnd();
    }
  }, [handleEnd]);

  // Touch handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isTouchDevice.current = true;
    handleStart();
  }, [handleStart]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleEnd();
  }, [handleEnd]);

  const handleTouchCancel = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // On cancel, stop recording
    if (hasStartedRecording.current) {
      hasStartedRecording.current = false;
      onRelease();
    }
  }, [onRelease]);

  // Reset touch device flag
  useEffect(() => {
    if (isTouchDevice.current) {
      const timer = setTimeout(() => {
        isTouchDevice.current = false;
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isRecording]);

  // Prevent context menu
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  // Get status text
  const getStatusText = () => {
    if (isProcessing) return 'Memproses...';
    if (isRecording) {
      if (showModeHint) return 'Tekan lagi untuk selesai';
      return 'Sedang merekam... Tekan untuk selesai';
    }
    return 'Tekan untuk bicara';
  };

  return (
    <div className="flex flex-col items-center gap-3 select-none">
      <button
        className={cn(
          'btn-voice w-20 h-20 md:w-24 md:h-24 ripple touch-none relative',
          isRecording && 'recording',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        onContextMenu={handleContextMenu}
        disabled={disabled || isProcessing}
        aria-label={isRecording ? 'Sedang merekam' : 'Tekan untuk bicara'}
      >
        {isProcessing ? (
          <Loader2 className="w-8 h-8 md:w-10 md:h-10 text-primary-foreground animate-spin" />
        ) : isRecording ? (
          <div className="flex flex-col items-center justify-center gap-1">
            <Square className="w-6 h-6 md:w-8 md:h-8 text-primary-foreground fill-current" />
          </div>
        ) : (
          <Mic className="w-8 h-8 md:w-10 md:h-10 text-primary-foreground" />
        )}

        {/* Recording indicator pulse */}
        {isRecording && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse" />
        )}
      </button>

      <p className="text-sm text-muted-foreground font-medium text-center max-w-[200px]">
        {getStatusText()}
      </p>
    </div>
  );
}
