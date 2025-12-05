'use client';

import { Store, Coffee, ShoppingBag, UtensilsCrossed, Building2, ScanLine } from 'lucide-react';
import { getGreeting, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useUserStore, AppIconType } from '@/store/useUserStore';
import { ProfileMenu } from '@/components/ProfileMenu';
import { createRippleEffect } from '@/hooks/useRipple';

// Icon mapping for app icons
const appIcons: Record<AppIconType, React.ComponentType<{ className?: string }>> = {
  'store': Store,
  'coffee': Coffee,
  'shopping-bag': ShoppingBag,
  'utensils': UtensilsCrossed,
  'building': Building2,
};

interface HeaderProps {
  variant?: 'default' | 'light';
  onScanClick?: () => void;
}

export function Header({ variant = 'default', onScanClick }: HeaderProps) {
  const today = new Date();
  const { storeName, appIcon } = useUserStore();
  const isLight = variant === 'light';
  const AppIcon = appIcons[appIcon];

  return (
    <header className="px-4 pt-6 pb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex items-center justify-center w-10 h-10 rounded-xl",
            isLight ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
          )}>
            <AppIcon className="w-5 h-5" />
          </div>
          <div>
            <p className={cn(
              "text-sm",
              isLight ? "text-white/80" : "text-muted-foreground"
            )}>{getGreeting()}</p>
            <h1 className={cn(
              "text-lg font-bold",
              isLight ? "text-white" : "text-foreground"
            )}>{storeName}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onScanClick && (
            <button
              onClick={onScanClick}
              onMouseDown={createRippleEffect}
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-xl ripple transition-colors",
                isLight
                  ? "bg-white/20 text-white hover:bg-white/30 active:bg-white/40"
                  : "bg-primary/10 text-primary hover:bg-primary/20 active:bg-primary/30"
              )}
              aria-label="Scan nota"
            >
              <ScanLine className="w-5 h-5" />
            </button>
          )}
          <ProfileMenu variant={variant} />
        </div>
      </div>
      <p className={cn(
        "text-sm",
        isLight ? "text-white/80" : "text-muted-foreground"
      )}>
        {formatDate(today)}
      </p>
    </header>
  );
}
