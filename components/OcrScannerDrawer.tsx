"use client";

import { useState, useRef, useCallback } from 'react';
import { Camera, Upload, Loader2, RotateCcw } from 'lucide-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { createRippleEffect } from '@/hooks/useRipple';

interface OcrScannerDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onImageCaptured: (base64: string) => void;
    isProcessing: boolean;
}

export function OcrScannerDrawer({
    isOpen,
    onClose,
    onImageCaptured,
    isProcessing,
}: OcrScannerDrawerProps) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Hanya file gambar yang didukung');
            return;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            setError('Ukuran file maksimal 10MB');
            return;
        }

        setError(null);

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result as string;
            setPreviewUrl(result);
        };
        reader.readAsDataURL(file);
    }, []);

    // Convert image to compressed JPEG base64
    const convertToJpegBase64 = useCallback(async (dataUrl: string): Promise<string> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Could not get canvas context'));
                    return;
                }

                // Limit max dimension to 2000px for faster processing
                const maxDim = 2000;
                let width = img.width;
                let height = img.height;

                if (width > maxDim || height > maxDim) {
                    if (width > height) {
                        height = (height / width) * maxDim;
                        width = maxDim;
                    } else {
                        width = (width / height) * maxDim;
                        height = maxDim;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                // Convert to JPEG data URL (0.85 quality) - keep full data URL format
                const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.85);
                resolve(jpegDataUrl);
            };
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = dataUrl;
        });
    }, []);

    const handleProcess = useCallback(async () => {
        if (!previewUrl) return;

        try {
            // Convert and compress image to JPEG, but keep full data URL format
            // API might need the MIME type prefix to identify the format
            const base64WithPrefix = await convertToJpegBase64(previewUrl);
            onImageCaptured(base64WithPrefix);
        } catch (err) {
            console.error('Image conversion error:', err);
            setError('Gagal memproses gambar. Silakan coba lagi.');
        }
    }, [previewUrl, onImageCaptured, convertToJpegBase64]);

    const handleReset = useCallback(() => {
        setPreviewUrl(null);
        setError(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (cameraInputRef.current) cameraInputRef.current.value = '';
    }, []);

    const handleClose = useCallback(() => {
        handleReset();
        onClose();
    }, [handleReset, onClose]);

    return (
        <Drawer open={isOpen} onOpenChange={handleClose}>
            <DrawerContent className="max-h-[90dvh]">
                <div className="mx-auto w-full max-w-lg flex flex-col overflow-hidden" style={{ maxHeight: '90dvh' }}>
                    <DrawerHeader className="shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                                <Camera className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <DrawerTitle className="text-lg text-left">Scan Nota</DrawerTitle>
                                <p className="text-sm text-muted-foreground">
                                    Ambil foto atau upload gambar nota
                                </p>
                            </div>
                        </div>
                    </DrawerHeader>

                    <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-4">
                        {/* Error Message */}
                        {error && (
                            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-sm text-destructive">
                                {error}
                            </div>
                        )}

                        {/* Image Preview */}
                        {previewUrl ? (
                            <div className="space-y-3">
                                <div className="relative w-full aspect-[3/4] bg-muted rounded-2xl overflow-hidden">
                                    <img
                                        src={previewUrl}
                                        alt="Preview nota"
                                        className="w-full h-full object-contain"
                                    />
                                    {isProcessing && (
                                        <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center gap-3">
                                            <Loader2 className="w-10 h-10 text-primary animate-spin" />
                                            <p className="text-sm text-muted-foreground">Memproses OCR...</p>
                                        </div>
                                    )}
                                </div>
                                {/* Reset Button - Below Image */}
                                {!isProcessing && (
                                    <button
                                        onClick={handleReset}
                                        onMouseDown={createRippleEffect}
                                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-muted/50 text-muted-foreground rounded-xl font-medium ripple hover:bg-muted"
                                    >
                                        <RotateCcw className="w-4 h-4" />
                                        Ganti Gambar
                                    </button>
                                )}
                            </div>
                        ) : (
                            /* Upload/Capture Buttons */
                            <div className="space-y-3">
                                {/* Camera Capture */}
                                <button
                                    onClick={() => cameraInputRef.current?.click()}
                                    onMouseDown={createRippleEffect}
                                    className="w-full flex items-center gap-4 p-4 bg-primary/5 hover:bg-primary/10 rounded-2xl ripple transition-colors"
                                >
                                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                                        <Camera className="w-7 h-7 text-primary" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-semibold text-foreground">Ambil Foto</p>
                                        <p className="text-sm text-muted-foreground">Langsung dari kamera</p>
                                    </div>
                                </button>

                                {/* File Upload */}
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    onMouseDown={createRippleEffect}
                                    className="w-full flex items-center gap-4 p-4 bg-muted/50 hover:bg-muted rounded-2xl ripple transition-colors"
                                >
                                    <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center">
                                        <Upload className="w-7 h-7 text-muted-foreground" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-semibold text-foreground">Upload Gambar</p>
                                        <p className="text-sm text-muted-foreground">Dari galeri atau file</p>
                                    </div>
                                </button>
                            </div>
                        )}

                        {/* Hidden File Inputs */}
                        <input
                            ref={cameraInputRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                    </div>

                    {/* Footer */}
                    {previewUrl && !isProcessing && (
                        <div className="shrink-0 px-6 py-4 pb-8 bg-background border-t border-border">
                            <div className="flex gap-3">
                                <button
                                    onClick={handleClose}
                                    onMouseDown={createRippleEffect}
                                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-muted text-muted-foreground rounded-xl font-medium ripple"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleProcess}
                                    onMouseDown={createRippleEffect}
                                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-primary text-primary-foreground rounded-xl font-medium ripple"
                                >
                                    Proses OCR
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </DrawerContent>
        </Drawer>
    );
}
