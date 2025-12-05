// OCR Service for Kolosal AI
import type { OCRReceiptResult } from '@/types';

const KOLOSAL_API_URL = 'https://api.kolosal.ai/ocr';

// GenericReceipt schema for OCR extraction
const RECEIPT_SCHEMA = {
    name: "GenericReceipt",
    schema: {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "title": "GenericReceipt",
        "description": "Schema umum untuk berbagai jenis nota / struk belanja.",
        "type": "object",
        "properties": {
            "merchant": {
                "type": "object",
                "description": "Informasi toko atau merchant.",
                "properties": {
                    "name": { "type": "string" },
                    "address": { "type": "string" },
                    "contact": { "type": "string" }
                }
            },
            "receipt_info": {
                "type": "object",
                "description": "Informasi dasar nota.",
                "properties": {
                    "receipt_number": { "type": "string" },
                    "date": { "type": "string" },
                    "additional_info": {
                        "type": "object",
                        "description": "Field tambahan seperti kasir, shift, atau referensi lain.",
                        "additionalProperties": true
                    }
                }
            },
            "items": {
                "type": "array",
                "description": "Daftar item/barang pada nota.",
                "items": {
                    "type": "object",
                    "properties": {
                        "name": { "type": "string" },
                        "quantity": { "type": ["number", "string"] },
                        "unit_price": { "type": ["number", "string"] },
                        "total_price": { "type": ["number", "string"] },
                        "code": { "type": "string" },
                        "category": { "type": "string" },
                        "extra_fields": {
                            "type": "object",
                            "description": "Field bebas untuk nota yang punya kolom spesial.",
                            "additionalProperties": true
                        }
                    },
                    "required": ["name"]
                }
            },
            "summary": {
                "type": "object",
                "description": "Ringkasan pembayaran.",
                "properties": {
                    "subtotal": { "type": ["number", "string"] },
                    "discount": { "type": ["number", "string", "null"] },
                    "tax": { "type": ["number", "string", "null"] },
                    "total": { "type": ["number", "string"] }
                }
            },
            "footer": {
                "type": "object",
                "description": "Bagian catatan atau tanda tangan.",
                "properties": {
                    "notes": { "type": "string" },
                    "signature": { "type": "string" }
                }
            },
            "metadata": {
                "type": "object",
                "description": "Informasi tambahan dari OCR atau sistem (opsional).",
                "properties": {
                    "confidence_score": { "type": "number" },
                    "processing_time": { "type": "number" },
                    "source": { "type": "string" }
                },
                "additionalProperties": true
            }
        },
        "additionalProperties": false
    },
    strict: true
};

export interface OCROptions {
    autoFix?: boolean;
    language?: string;
    apiKey: string;
}

export interface OCRResponse {
    success: boolean;
    data?: OCRReceiptResult;
    error?: string;
}

/**
 * Convert file to base64 string
 */
export async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            // Remove the data URL prefix (e.g., "data:image/png;base64,")
            const base64 = result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = (error) => reject(error);
    });
}

/**
 * Process receipt image with Kolosal AI OCR
 */
export async function processReceiptOCR(
    imageData: string,
    options: OCROptions
): Promise<OCRResponse> {
    try {
        const response = await fetch(KOLOSAL_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${options.apiKey}`,
            },
            body: JSON.stringify({
                image_data: imageData,
                auto_fix: options.autoFix ?? true,
                custom_schema: RECEIPT_SCHEMA,
                language: options.language ?? 'auto',
                invoice: false,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));

            if (response.status === 400) {
                return { success: false, error: 'Gambar tidak valid atau tidak dapat dibaca' };
            }
            if (response.status === 401) {
                return { success: false, error: 'API key tidak valid' };
            }
            if (response.status === 500) {
                return { success: false, error: 'Gagal memproses OCR. Silakan coba lagi' };
            }

            return {
                success: false,
                error: errorData.message || `Error: ${response.status}`
            };
        }

        const data = await response.json();

        return {
            success: true,
            data: data as OCRReceiptResult,
        };
    } catch (error) {
        console.error('OCR Error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Terjadi kesalahan jaringan',
        };
    }
}

/**
 * Parse numeric value from OCR result (handles string/number)
 * Supports various formats:
 * - Indonesian: 1.500.000 or 1.500.000,50
 * - International: 1,500,000 or 1,500,000.50
 * - Decimal comma: 12,7 or 2,822 (treated as 12.7 and 2.822)
 * - Plain: 1500000
 */
export function parseOCRNumber(value: number | string | null | undefined): number {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;

    let str = value.toString().trim();

    // Remove currency symbols and spaces
    str = str.replace(/[Rp\s]/gi, '');

    // Handle empty or invalid
    if (!str || str === '-') return 0;

    // Count dots and commas
    const dotCount = (str.match(/\./g) || []).length;
    const commaCount = (str.match(/,/g) || []).length;
    const lastDot = str.lastIndexOf('.');
    const lastComma = str.lastIndexOf(',');

    // Both dot and comma present - determine which is decimal
    if (lastComma > -1 && lastDot > -1) {
        if (lastComma > lastDot) {
            // Comma after dot: dots are thousands, comma is decimal
            // e.g., "1.500.000,50" or "1.000,5"
            str = str.replace(/\./g, '');
            str = str.replace(',', '.');
        } else {
            // Dot after comma: commas are thousands, dot is decimal
            // e.g., "1,500,000.50" or "1,000.5"
            str = str.replace(/,/g, '');
        }
    }
    // Only commas
    else if (commaCount > 0 && dotCount === 0) {
        if (commaCount > 1) {
            // Multiple commas = thousand separators
            // e.g., "1,500,000"
            str = str.replace(/,/g, '');
        } else {
            // Single comma - always treat as decimal for OCR context
            // e.g., "12,7" or "2,822" or "150,50"
            // For Indonesian OCR, comma is typically decimal
            str = str.replace(',', '.');
        }
    }
    // Only dots
    else if (dotCount > 0 && commaCount === 0) {
        if (dotCount > 1) {
            // Multiple dots = thousand separators
            // e.g., "1.500.000"
            str = str.replace(/\./g, '');
        } else {
            // Single dot - check if thousand separator or decimal
            const afterDot = str.substring(lastDot + 1);
            const beforeDot = str.substring(0, lastDot);

            // If exactly 3 digits after AND number before is 1-3 digits, it's thousand separator
            // e.g., "150.000" (150000) vs "15.50" (15.5)
            if (afterDot.length === 3 && /^\d+$/.test(afterDot) && beforeDot.length <= 3) {
                str = str.replace(/\./g, '');
            }
            // Otherwise keep dot as decimal
        }
    }

    // Remove any remaining non-numeric chars except dot and minus
    str = str.replace(/[^\d.-]/g, '');

    const parsed = parseFloat(str);
    return isNaN(parsed) ? 0 : parsed;
}
