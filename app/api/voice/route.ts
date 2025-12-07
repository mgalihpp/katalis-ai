import { NextRequest, NextResponse } from 'next/server';
import { toFile } from 'openai';
import OpenAI from 'openai';
import type { ParsedVoiceResult, TransactionType } from '@/types';
import { openai, WARUNG_ASSISTANT_PROMPT } from '@/lib/aiService';

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

        // Convert audio to buffer for OpenAI
        const audioBuffer = Buffer.from(await audioFile.arrayBuffer());

        // Determine file extension from MIME type
        const mimeType = audioFile.type || 'audio/webm';
        const extensionMap: Record<string, string> = {
            'audio/webm': 'webm',
            'audio/webm;codecs=opus': 'webm',
            'audio/ogg': 'ogg',
            'audio/ogg;codecs=opus': 'ogg',
            'audio/mp4': 'mp4',
            'audio/x-m4a': 'm4a',
            'audio/m4a': 'm4a',
            'audio/aac': 'aac',
            'audio/mpeg': 'mp3',
            'audio/wav': 'wav',
            'audio/flac': 'flac',
        };

        // Handle MIME types with codec suffixes
        const baseMimeType = mimeType.split(';')[0].trim();
        const extension = extensionMap[mimeType] || extensionMap[baseMimeType] || 'webm';

        // Use toFile helper to create proper file for OpenAI Whisper
        const file = await toFile(audioBuffer, `recording.${extension}`, { type: mimeType });

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
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: WARUNG_ASSISTANT_PROMPT },
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
            const validTypes: TransactionType[] = ['sale', 'purchase', 'debt_add', 'debt_payment', 'stock_add', 'stock_check', 'price_update'];
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
