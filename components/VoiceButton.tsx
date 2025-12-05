import { Mic, MicOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createRippleEffect } from '@/hooks/useRipple';

interface VoiceButtonProps {
  isRecording: boolean;
  isProcessing: boolean;
  onPress: () => void;
  onRelease: () => void;
  disabled?: boolean;
}

export function VoiceButton({
  isRecording,
  isProcessing,
  onPress,
  onRelease,
  disabled = false,
}: VoiceButtonProps) {
  const handleMouseDown = () => {
    if (!disabled && !isProcessing) {
      onPress();
    }
  };

  const handleMouseUp = () => {
    if (isRecording) {
      onRelease();
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    if (!disabled && !isProcessing) {
      onPress();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    if (isRecording) {
      onRelease();
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        className={cn(
          'btn-voice w-20 h-20 md:w-24 md:h-24 ripple',
          isRecording && 'recording',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        onMouseDown={(e) => {
          createRippleEffect(e)
          handleMouseDown()
        }}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        disabled={disabled || isProcessing}
        aria-label={isRecording ? 'Sedang merekam' : 'Tekan untuk bicara'}
      >
        {isProcessing ? (
          <Loader2 className="w-8 h-8 md:w-10 md:h-10 text-primary-foreground animate-spin" />
        ) : isRecording ? (
          <div className="flex items-center justify-center gap-1 h-8">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="voice-wave-bar h-6 text-accent-foreground"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        ) : (
          <Mic className="w-8 h-8 md:w-10 md:h-10 text-primary-foreground" />
        )}
      </button>

      <p className="text-sm text-muted-foreground font-medium">
        {isProcessing
          ? 'Memproses...'
          : isRecording
            ? 'Lepas untuk selesai'
            : 'Tekan & tahan untuk bicara'
        }
      </p>
    </div>
  );
}
