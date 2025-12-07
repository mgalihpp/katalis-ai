import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { WARUNG_ASSISTANT_PROMPT } from '@/lib/aiService';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: NextRequest) {
    try {
        const { transcript } = await request.json();

        if (!transcript) {
            return NextResponse.json({ error: 'No transcript provided' }, { status: 400 });
        }

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
            return NextResponse.json({ error: 'No response from AI' }, { status: 500 });
        }

        const parsed = JSON.parse(responseContent);

        return NextResponse.json({
            transcript,
            parsed,
            raw_response: responseContent
        });

    } catch (error) {
        console.error('Test API Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
