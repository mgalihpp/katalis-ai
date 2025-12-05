import { NextRequest, NextResponse } from 'next/server';
import OpenAI, { toFile } from 'openai';
import type { ParsedVoiceResult, TransactionType } from '@/types';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `Kamu adalah asisten kasir warung Indonesia. Tugasmu adalah menganalisis transaksi dari ucapan pelanggan dan mengekstrak informasi terstruktur.

Format output HARUS SELALU dalam JSON yang valid dengan struktur berikut:
{
  "type": "sale" | "purchase" | "debt_add" | "debt_payment" | "stock_add" | "stock_check",
  "transactions": [
    {
      "item_name": "nama barang" | null,
      "quantity": number | null,
      "unit": "string satuan" | null,
      "price_per_unit": number | null,
      "total_amount": number | null
    }
  ],
  "debt": {
    "debtor_name": "nama orang yang hutang" | null,
    "amount": number | null
  } | null,
  "stock": {
    "item_name": "nama barang" | null,
    "quantity": number | null,
    "unit": "string satuan" | null,
    "buy_price": number | null,
    "sell_price": number | null
  } | null,
  "note": "catatan tambahan" | null,
  "raw_text": "teks asli dari user",
  "confidence": number (0.0 - 1.0)
}

Aturan konversi angka:
- "ribu" = 1000 (contoh: "5 ribu" = 5000, "32 ribu" = 32000)
- "juta" = 1000000 (contoh: "1 juta" = 1000000)
- "setengah" sebelum ribu = 500
- Angka desimal bisa ditulis "koma" atau "titik"

Jenis transaksi:
- "sale" (penjualan): kata kunci seperti "jual", "laku", "beli" (dari sudut pandang pembeli), "ambil"
- "purchase" (pembelian/kulakan): kata kunci seperti "beli", "kulak", "belanja", "ambil barang", "restock"
- "debt_add" (tambah hutang): kata kunci seperti "hutang", "ngutang", "bon", "kasbon"
- "debt_payment" (bayar hutang): kata kunci seperti "bayar hutang", "bayar", "lunas", "cicil"
- "stock_add" (tambah stok): kata kunci seperti "tambah stok", "masuk barang", "stok masuk"
- "stock_check" (cek stok): kata kunci seperti "cek stok", "stok berapa", "sisa stok"

Contoh parsing:
- "Jual telur 2 kilo, 32 ribu per kilo" → type: "sale", item: telur, qty: 2, unit: kilo, price_per_unit: 32000, total: 64000
- "Bu Tejo ngutang 50 ribu" → type: "debt_add", debtor: Bu Tejo, amount: 50000
- "Bu Tejo bayar hutang 20 ribu" → type: "debt_payment", debtor: Bu Tejo, amount: 20000
- "Beli minyak goreng 1 dus, 24 bungkus, 14 ribu satu" → type: "purchase", item: Minyak Goreng, qty: 24, unit: bungkus, price_per_unit: 14000, total: 336000
- "Tambah stok beras 50 kilo, harga beli 12 ribu" → type: "stock_add", item: Beras, qty: 50, unit: kilo, buy_price: 12000

PENTING: Selalu return JSON yang valid tanpa markdown formatting.`;

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const audioFile = formData.get('audio') as File | null;

        if (!audioFile) {
            return NextResponse.json(
                { error: 'Audio file is required' },
                { status: 400 }
            );
        }

        // Convert webm to buffer for OpenAI
        const audioBuffer = Buffer.from(await audioFile.arrayBuffer());

        // Use toFile helper to create proper file for OpenAI Whisper
        const file = await toFile(audioBuffer, 'recording.webm', { type: 'audio/webm' });

        // Step 1: Transcribe audio using Whisper
        const transcription = await openai.audio.transcriptions.create({
            file: file,
            model: 'whisper-1',
            language: 'id', // Indonesian
        });

        const transcript = transcription.text;

        // Skip GPT if transcript is empty or too short (< 3 chars = noise)
        if (!transcript || transcript.trim().length < 3) {
            return NextResponse.json(
                { error: 'Tidak dapat mengenali suara. Silakan coba lagi.' },
                { status: 400 }
            );
        }

        // Step 2: Parse transcript using GPT
        const completion = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL!,
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: transcript },
            ],
            response_format: { type: 'json_object' },
        });

        const responseContent = completion.choices[0]?.message?.content;

        if (!responseContent) {
            return NextResponse.json(
                { error: 'Gagal memproses transaksi. Silakan coba lagi.' },
                { status: 500 }
            );
        }

        // Parse and validate the response
        let parsed: ParsedVoiceResult;
        try {
            const rawParsed = JSON.parse(responseContent);

            // Ensure the type is valid
            const validTypes: TransactionType[] = ['sale', 'purchase', 'debt_add', 'debt_payment', 'stock_add', 'stock_check'];
            if (!validTypes.includes(rawParsed.type)) {
                rawParsed.type = 'sale'; // Default to sale
            }

            parsed = {
                type: rawParsed.type,
                transactions: rawParsed.transactions || [],
                debt: rawParsed.debt || null,
                stock: rawParsed.stock || null,
                note: rawParsed.note || null,
                raw_text: transcript,
                confidence: rawParsed.confidence || 0.8,
            };
        } catch {
            return NextResponse.json(
                { error: 'Gagal memproses respons AI. Silakan coba lagi.' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            transcript,
            parsed,
        });
    } catch (error) {
        console.error('Voice processing error:', error);

        if (error instanceof OpenAI.APIError) {
            if (error.status === 401) {
                return NextResponse.json(
                    { error: 'API key tidak valid. Hubungi administrator.' },
                    { status: 401 }
                );
            }
            if (error.status === 429) {
                return NextResponse.json(
                    { error: 'Terlalu banyak permintaan. Coba lagi nanti.' },
                    { status: 429 }
                );
            }
        }

        return NextResponse.json(
            { error: 'Terjadi kesalahan. Silakan coba lagi.' },
            { status: 500 }
        );
    }
}
