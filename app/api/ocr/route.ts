import { NextRequest, NextResponse } from 'next/server';
import type { OCRReceiptResult } from '@/types';
import { KOLOSAL_API_URL, RECEIPT_SCHEMA } from '@/lib/ocrService';

export async function POST(request: NextRequest) {
    try {
        const { imageData } = await request.json();

        if (!imageData) {
            return NextResponse.json(
                { error: 'Image data is required' },
                { status: 400 }
            );
        }

        const apiKey = process.env.KOLOSAL_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: 'OCR API key not configured' },
                { status: 500 }
            );
        }

        // Call Kolosal OCR API
        const response = await fetch(KOLOSAL_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                image_data: imageData,
                auto_fix: true,
                custom_schema: RECEIPT_SCHEMA,
                language: 'id',
                invoice: false,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));

            if (response.status === 400) {
                return NextResponse.json(
                    { error: 'Gambar tidak valid atau tidak dapat dibaca' },
                    { status: 400 }
                );
            }
            if (response.status === 401) {
                return NextResponse.json(
                    { error: 'API key tidak valid' },
                    { status: 401 }
                );
            }
            if (response.status === 500) {
                return NextResponse.json(
                    { error: 'Gagal memproses OCR. Silakan coba lagi' },
                    { status: 500 }
                );
            }

            return NextResponse.json(
                { error: errorData.message || `Error: ${response.status}` },
                { status: response.status }
            );
        }

        const data = await response.json() as OCRReceiptResult;

        return NextResponse.json({
            success: true,
            data,
        });
    } catch (error) {
        console.error('OCR Error:', error);
        return NextResponse.json(
            { error: 'Terjadi kesalahan jaringan' },
            { status: 500 }
        );
    }
}
