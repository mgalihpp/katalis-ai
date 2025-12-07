'use client';

import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Store,
  Coffee,
  ShoppingBag,
  UtensilsCrossed,
  Building2,
  Sun,
  Moon,
  Monitor,
  User,
  Palette,
  Info,
  Check,
  Camera,
  LogOut,
  Lock,
  Loader2,
  HelpCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useUserStore, AppIconType } from '@/store/useUserStore';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import { logoutAndClearData } from '@/lib/logout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useUploadThing } from '@/lib/uploadthing-components';
import { toast } from 'sonner';

type ThemeMode = 'light' | 'dark' | 'system';

const themeLabels: Record<ThemeMode, string> = {
  light: 'Terang',
  dark: 'Gelap',
  system: 'Sistem',
};

// Icon mapping for app icons
const appIcons: Record<
  AppIconType,
  React.ComponentType<{ className?: string }>
> = {
  store: Store,
  coffee: Coffee,
  'shopping-bag': ShoppingBag,
  utensils: UtensilsCrossed,
  building: Building2,
};

const appIconLabels: Record<AppIconType, string> = {
  store: 'Toko',
  coffee: 'Kopi',
  'shopping-bag': 'Belanja',
  utensils: 'Makanan',
  building: 'Bangunan',
};

const themeIcons: Record<
  ThemeMode,
  React.ComponentType<{ className?: string }>
> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

export default function SettingsPage() {
  const router = useRouter();
  const {
    storeName,
    ownerName,
    profileImage,
    appIcon,
    setStoreName,
    setOwnerName,
    setProfileImage,
    setAppIcon,
  } = useUserStore();
  const { resetOnboarding } = useOnboardingStore();
  const { theme, setTheme } = useTheme();

  const [localStoreName, setLocalStoreName] = useState(storeName);
  const [localOwnerName, setLocalOwnerName] = useState(ownerName);
  const [isMounted, setIsMounted] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { startUpload } = useUploadThing('profileImage', {
    onClientUploadComplete: (res) => {
      if (res && res[0]) {
        setProfileImage(res[0].ufsUrl || res[0].url);
        toast.success('Foto profil berhasil diupload!');
      }
      setIsUploading(false);
      setUploadProgress(0);
    },
    onUploadError: (error) => {
      console.error('Upload error:', error);
      toast.error('Gagal mengupload foto: ' + error.message);
      setIsUploading(false);
      setUploadProgress(0);
    },
    onUploadProgress: (progress) => {
      setUploadProgress(progress);
    },
  });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
    setLocalStoreName(storeName);
    setLocalOwnerName(ownerName);
  }, [storeName, ownerName]);

  const handleSaveProfile = () => {
    setStoreName(localStoreName);
    setOwnerName(localOwnerName);
  };

  const getInitials = () => {
    const name = localOwnerName || localStoreName;
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Handle image upload with UploadThing
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 4MB)
    if (file.size > 4 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 4MB');
      return;
    }

    setIsUploading(true);

    try {
      await startUpload([file]);
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Gagal mengupload foto');
      setIsUploading(false);
    }
  };

  if (!isMounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center gap-3 px-4 py-4">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 hover:bg-primary dark:hover:bg-primary/80"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold">Pengaturan</h1>
        </div>
      </header>

      <div className="p-4 space-y-6 pb-20">
        {/* Profile Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <User className="w-4 h-4" />
            <span>Profil Warung</span>
          </div>

          <div className="bg-card rounded-2xl p-4 space-y-4 shadow-sm border">
            {/* Profile Image */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-16 w-16 border-2 border-primary/20">
                  {profileImage ? (
                    <AvatarImage src={profileImage} alt={localStoreName} />
                  ) : null}
                  <AvatarFallback className="text-lg font-semibold bg-primary/10 text-primary">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                {/* Progress overlay with spinner */}
                {isUploading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-full">
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                    <span className="text-[10px] font-bold text-white mt-0.5">
                      {uploadProgress}%
                    </span>
                  </div>
                )}
                {/* Camera button - hidden during upload */}
                {!isUploading && (
                  <label className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center shadow-md transition-colors bg-primary cursor-pointer hover:bg-primary/90">
                    <Camera className="w-3.5 h-3.5 text-primary-foreground" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                )}
              </div>
              <div className="flex-1">
                <p className="font-semibold">{localStoreName}</p>
                <p className="text-sm text-muted-foreground">
                  {localOwnerName || 'Belum diatur'}
                </p>
              </div>
            </div>

            <Separator />

            {/* Store Name */}
            <div className="space-y-2">
              <Label htmlFor="storeName">Nama Warung</Label>
              <Input
                id="storeName"
                value={localStoreName}
                onChange={(e) => setLocalStoreName(e.target.value)}
                onBlur={handleSaveProfile}
                placeholder="Masukkan nama warung"
              />
            </div>

            {/* Owner Name */}
            <div className="space-y-2">
              <Label htmlFor="ownerName">Nama Pemilik</Label>
              <Input
                id="ownerName"
                value={localOwnerName}
                onChange={(e) => setLocalOwnerName(e.target.value)}
                onBlur={handleSaveProfile}
                placeholder="Masukkan nama pemilik"
              />
            </div>
          </div>
        </section>

        {/* Appearance Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Palette className="w-4 h-4" />
            <span>Tampilan</span>
          </div>

          <div className="bg-card rounded-2xl p-4 space-y-4 shadow-sm border">
            {/* Theme Selection */}
            <div className="space-y-3">
              <Label>Tema Aplikasi</Label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(themeLabels) as ThemeMode[]).map((mode) => {
                  const Icon = themeIcons[mode];
                  const isActive = theme === mode;
                  return (
                    <button
                      key={mode}
                      onClick={() => setTheme(mode)}
                      className={cn(
                        'flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all',
                        isActive
                          ? 'border-primary bg-primary/5'
                          : 'border-transparent bg-muted/50 hover:bg-muted'
                      )}
                    >
                      <div
                        className={cn(
                          'w-10 h-10 rounded-full flex items-center justify-center',
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted-foreground/10'
                        )}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <span
                        className={cn(
                          'text-xs font-medium',
                          isActive ? 'text-primary' : 'text-muted-foreground'
                        )}
                      >
                        {themeLabels[mode]}
                      </span>
                      {isActive && (
                        <Check className="w-4 h-4 text-primary absolute top-2 right-2" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* App Icon Selection */}
            <div className="space-y-3">
              <Label>Ikon Aplikasi</Label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(appIcons) as AppIconType[]).map((iconType) => {
                  const Icon = appIcons[iconType];
                  const isActive = appIcon === iconType;
                  return (
                    <button
                      key={iconType}
                      onClick={() => setAppIcon(iconType)}
                      className={cn(
                        'relative flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all',
                        isActive
                          ? 'border-primary bg-primary/5'
                          : 'border-transparent bg-muted/50 hover:bg-muted'
                      )}
                    >
                      <div
                        className={cn(
                          'w-10 h-10 rounded-xl flex items-center justify-center',
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted-foreground/10'
                        )}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <span
                        className={cn(
                          'text-[10px] font-medium',
                          isActive ? 'text-primary' : 'text-muted-foreground'
                        )}
                      >
                        {appIconLabels[iconType]}
                      </span>
                      {isActive && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-primary-foreground" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Logout Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Lock className="w-4 h-4" />
            <span>Keamanan</span>
          </div>

          <div className="bg-card rounded-2xl p-4 shadow-sm border space-y-3">
            <div className="text-sm text-muted-foreground">
              Keluar dari akun ini akan menghapus sesi login. Data kamu tetap
              tersimpan dan bisa diakses kembali saat login ulang.
            </div>
            <Button
              variant="destructive"
              className="w-full"
              onClick={async () => {
                try {
                  await logoutAndClearData();
                  router.push('/login');
                } catch (error) {
                  console.error('Logout error:', error);
                }
              }}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </section>

        {/* Tutorial Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <HelpCircle className="w-4 h-4" />
            <span>Bantuan</span>
          </div>

          <div className="bg-card rounded-2xl p-4 shadow-sm border space-y-3">
            <div className="text-sm text-muted-foreground">
              Ingin melihat panduan penggunaan aplikasi lagi? Tekan tombol di bawah untuk memulai tutorial dari awal.
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                resetOnboarding();
                router.push('/dashboard');
              }}
            >
              <HelpCircle className="w-4 h-4 mr-2" />
              Putar Ulang Tutorial
            </Button>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Info className="w-4 h-4" />
            <span>Tentang</span>
          </div>

          <div className="bg-card rounded-2xl p-4 space-y-3 shadow-sm border">
            <div className="flex items-center justify-between">
              <span className="text-sm">Versi Aplikasi</span>
              <span className="text-sm text-muted-foreground">1.0.0</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm">Dibuat oleh</span>
              <span className="text-sm text-muted-foreground">
                Tim Katalis AI
              </span>
            </div>
            <Separator />
            <div className="pt-2">
              <p className="text-xs text-muted-foreground text-center">
                Katalis AI - Aplikasi Pembukuan Usaha Berbasis Suara untuk UMKM Indonesia
              </p>
            </div>
            <Separator />
            <div className="flex items-center justify-center gap-4 pt-2">
              <Link
                href="/terms"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                Syarat & Ketentuan
              </Link>
              <span className="text-muted-foreground">-</span>
              <Link
                href="/privacy"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                Kebijakan Privasi
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
