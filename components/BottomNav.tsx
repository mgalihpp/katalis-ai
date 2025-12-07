import { Home, HandCoins, BarChart3, Package, Mic, Loader2, Square } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useVoice } from '@/context/VoiceContext';
import { usePathname, useRouter } from 'next/navigation';
import { createRippleEffect } from '@/hooks/useRipple';
import { useRef, useCallback, useEffect } from 'react';

const navItems = [
  { path: '/dashboard', icon: Home, label: 'Beranda' },
  { path: '/dashboard/stok', icon: Package, label: 'Stok' },
  { path: 'voice', icon: Mic, label: 'Suara', isVoice: true },
  { path: '/dashboard/hutang', icon: HandCoins, label: 'Hutang' },
  { path: '/dashboard/ringkasan', icon: BarChart3, label: 'Ringkasan' },
];

// Threshold to differentiate tap vs hold (in ms)
const TAP_THRESHOLD = 300;
const MIN_RECORDING_MS = 500;

export function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { isRecording, isProcessing, handleVoicePress, handleVoiceRelease } = useVoice();

  // Track touch vs mouse
  const isTouchDevice = useRef(false);
  // Track press start time
  const pressStartTime = useRef<number>(0);
  // Track if we started recording
  const hasStartedRecording = useRef(false);
  // Track if in hold mode
  const isHoldMode = useRef(false);

  const handleStart = useCallback(() => {
    if (isProcessing) return;

    // If already recording (tap mode), this tap should stop
    if (isRecording) {
      hasStartedRecording.current = false;
      isHoldMode.current = false;
      handleVoiceRelease();
      return;
    }

    // Start new recording
    pressStartTime.current = Date.now();
    hasStartedRecording.current = true;
    isHoldMode.current = false;
    handleVoicePress();
  }, [isProcessing, isRecording, handleVoicePress, handleVoiceRelease]);

  const handleEnd = useCallback(() => {
    if (!hasStartedRecording.current || !isRecording) return;

    const pressDuration = Date.now() - pressStartTime.current;

    // If held long enough, treat as hold-to-record (stop immediately)
    if (pressDuration >= TAP_THRESHOLD) {
      if (pressDuration < MIN_RECORDING_MS) {
        setTimeout(() => {
          hasStartedRecording.current = false;
          handleVoiceRelease();
        }, MIN_RECORDING_MS - pressDuration);
      } else {
        hasStartedRecording.current = false;
        handleVoiceRelease();
      }
    }
    // Short tap - keep recording until next tap (toggle mode)
  }, [isRecording, handleVoiceRelease]);

  // Mouse handlers
  const handleMouseDown = useCallback(() => {
    if (isTouchDevice.current) return;
    handleStart();
  }, [handleStart]);

  const handleMouseUp = useCallback(() => {
    if (isTouchDevice.current) return;
    handleEnd();
  }, [handleEnd]);

  const handleMouseLeave = useCallback(() => {
    if (isTouchDevice.current) return;
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
    if (hasStartedRecording.current) {
      hasStartedRecording.current = false;
      handleVoiceRelease();
    }
  }, [handleVoiceRelease]);

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

  // Get voice button label
  const getVoiceLabel = () => {
    if (isProcessing) return 'Proses...';
    if (isRecording) return 'Stop';
    return 'Suara';
  };

  return (
    <nav className="fixed bg-transparent bottom-0 left-0 right-0 z-50">
      <div className="max-w-lg mx-auto px-2 py-2 bg-card border-t border-border ">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            if (item.isVoice) {
              return (
                <div key="voice" id="voice-button" className="flex flex-col items-center -mt-6 select-none">
                  <button
                    className={cn(
                      'w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 touch-none relative',
                      'bg-primary hover:bg-primary/90',
                      isRecording && 'bg-accent scale-110',
                      isProcessing && 'bg-muted'
                    )}
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseLeave}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    onTouchCancel={handleTouchCancel}
                    onContextMenu={handleContextMenu}
                    disabled={isProcessing}
                    aria-label={isRecording ? 'Sedang merekam' : 'Tekan untuk bicara'}
                  >
                    {isProcessing ? (
                      <Loader2 className="w-6 h-6 text-primary-foreground animate-spin" />
                    ) : isRecording ? (
                      <Square className="w-5 h-5 text-primary-foreground fill-current" />
                    ) : (
                      <Mic className="w-6 h-6 text-primary-foreground" />
                    )}

                    {/* Recording pulse indicator */}
                    {isRecording && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                    )}
                  </button>
                  <span className={cn(
                    'text-xs font-medium mt-1',
                    isRecording ? 'text-accent' : 'text-muted-foreground'
                  )}>
                    {getVoiceLabel()}
                  </span>
                </div>
              );
            }

            const isActive = pathname === item.path;
            const Icon = item.icon;

            // Generate ID from path for tour targeting
            const navId = item.path.replace('/dashboard/', 'nav-').replace('/dashboard', 'nav-home');

            return (
              <button
                key={item.path}
                id={navId}
                onClick={() =>
                  router.push(item.path)
                }
                onMouseDown={createRippleEffect}
                className={cn('nav-item flex-1 ripple', isActive && 'active')}
              >
                <Icon className="w-4 h-4" />
                <span className="text-xs font-medium max-[329px]:text-[10px]">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
