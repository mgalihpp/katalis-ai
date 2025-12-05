import { Home, HandCoins, BarChart3, Package, Mic, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useVoice } from '@/context/VoiceContext';
import { usePathname, useRouter } from 'next/navigation';
import { createRippleEffect } from '@/hooks/useRipple';

const navItems = [
  { path: '/dashboard', icon: Home, label: 'Beranda' },
  { path: '/dashboard/stok', icon: Package, label: 'Stok' },
  { path: 'voice', icon: Mic, label: 'Suara', isVoice: true },
  { path: '/dashboard/hutang', icon: HandCoins, label: 'Hutang' },
  { path: '/dashboard/ringkasan', icon: BarChart3, label: 'Ringkasan' },
];

export function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { isRecording, isProcessing, handleVoicePress, handleVoiceRelease } = useVoice();

  return (
    <nav className="fixed bg-transparent bottom-0 left-0 right-0 z-50">
      <div className="max-w-lg mx-auto px-2 py-2 bg-card border-t border-border ">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            if (item.isVoice) {
              return (
                <div key="voice" className="flex flex-col items-center -mt-8">
                  <button
                    className={cn(
                      'w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all duration-200',
                      'bg-primary hover:bg-primary/90',
                      isRecording && 'bg-accent animate-pulse scale-110',
                      isProcessing && 'bg-muted'
                    )}
                    onMouseDown={handleVoicePress}
                    onMouseUp={handleVoiceRelease}
                    onMouseLeave={() => isRecording && handleVoiceRelease()}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      handleVoicePress();
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      handleVoiceRelease();
                    }}
                    disabled={isProcessing}
                    aria-label={isRecording ? 'Sedang merekam' : 'Tekan untuk bicara'}
                  >
                    {isProcessing ? (
                      <Loader2 className="w-7 h-7 text-primary-foreground animate-spin" />
                    ) : isRecording ? (
                      <div className="flex items-center justify-center gap-0.5">
                        {[...Array(3)].map((_, i) => (
                          <div
                            key={i}
                            className="w-1 bg-primary-foreground rounded-full animate-pulse"
                            style={{
                              height: `${12 + Math.random() * 8}px`,
                              animationDelay: `${i * 0.15}s`
                            }}
                          />
                        ))}
                      </div>
                    ) : (
                      <Mic className="w-7 h-7 text-primary-foreground" />
                    )}
                  </button>
                  <span className={cn(
                    'text-xs font-medium mt-1',
                    isRecording ? 'text-accent' : 'text-muted-foreground'
                  )}>
                    {isProcessing ? 'Proses...' : isRecording ? 'Lepas' : 'Suara'}
                  </span>
                </div>
              );
            }

            const isActive = pathname === item.path;
            const Icon = item.icon;

            return (
              <button
                key={item.path}
                onClick={() =>
                  router.push(item.path)
                }
                onMouseDown={createRippleEffect}
                className={cn('nav-item flex-1 ripple', isActive && 'active')}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
