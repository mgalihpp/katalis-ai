'use client';

import { Settings, Info, ChevronRight, Store, Coffee, ShoppingBag, UtensilsCrossed, Building2, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUserStore, AppIconType } from '@/store/useUserStore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { logoutAndClearData } from '@/lib/logout';

// Icon mapping for app icons
export const appIcons: Record<AppIconType, React.ComponentType<{ className?: string }>> = {
    'store': Store,
    'coffee': Coffee,
    'shopping-bag': ShoppingBag,
    'utensils': UtensilsCrossed,
    'building': Building2,
};

export const appIconLabels: Record<AppIconType, string> = {
    'store': 'Toko',
    'coffee': 'Kopi',
    'shopping-bag': 'Belanja',
    'utensils': 'Makanan',
    'building': 'Bangunan',
};

interface ProfileMenuProps {
    variant?: 'default' | 'light';
}

export function ProfileMenu({ variant = 'default' }: ProfileMenuProps) {
    const router = useRouter();
    const { storeName, ownerName, profileImage, appIcon } = useUserStore();
    const isLight = variant === 'light';

    // Get initials from store name or owner name
    const getInitials = () => {
        const name = ownerName || storeName;
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const AppIcon = appIcons[appIcon];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    className={cn(
                        'flex items-center gap-2 p-1 rounded-full transition-all',
                        'hover:bg-black/10 focus:outline-none focus:ring-2 focus:ring-primary/50',
                        isLight && 'hover:bg-white/20'
                    )}
                >
                    <Avatar className="h-9 w-9 border-2 border-white/30 shadow-md">
                        {profileImage ? (
                            <AvatarImage src={profileImage} alt={storeName} />
                        ) : null}
                        <AvatarFallback className={cn(
                            'text-xs font-semibold',
                            isLight ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
                        )}>
                            {getInitials()}
                        </AvatarFallback>
                    </Avatar>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
                            <AppIcon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex flex-col space-y-0.5">
                            <p className="text-sm font-semibold">{storeName}</p>
                            {ownerName && (
                                <p className="text-xs text-muted-foreground">{ownerName}</p>
                            )}
                        </div>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={() => router.push('/dashboard/settings')}
                    className="cursor-pointer focus:bg-primary focus:text-primary-foreground group transition-colors"
                >
                    <Settings className="mr-2 h-4 w-4 group-focus:text-primary-foreground" />
                    <span className="flex-1">Pengaturan</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-focus:text-primary-foreground" />
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => router.push('/dashboard/settings#about')}
                    className="cursor-pointer focus:bg-primary focus:text-primary-foreground group transition-colors"
                >
                    <Info className="mr-2 h-4 w-4 group-focus:text-primary-foreground" />
                    <span className="flex-1">Tentang Aplikasi</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-focus:text-primary-foreground" />
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={async () => {
                        try {
                            await logoutAndClearData();
                            router.push('/login');
                        } catch (error) {
                            console.error('Logout error:', error);
                        }
                    }}
                    className="cursor-pointer focus:bg-destructive group transition-colors"
                >
                    <LogOut className="mr-2 h-4 w-4 group-focus:text-destructive-foreground" />
                    <span className="flex-1">Keluar</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
