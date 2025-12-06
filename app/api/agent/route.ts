import { NextRequest } from 'next/server';
import { kolosalAi } from '@/lib/aiService';
import { AGENT_TOOLS, AGENT_SYSTEM_PROMPT } from '@/lib/agentTools';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { messages } = body;

        const stream = await kolosalAi.chat.completions.create({
            model: 'Claude Sonnet 4.5',
            messages: [
                { role: 'system', content: AGENT_SYSTEM_PROMPT },
                ...messages
            ],
            tools: AGENT_TOOLS,
            tool_choice: 'auto',
            stream: true,
        });

        // Create a ReadableStream to send SSE
        const encoder = new TextEncoder();
        const readable = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of stream) {
                        const delta = chunk.choices[0]?.delta;

                        // Send the chunk as SSE
                        const data = JSON.stringify(delta);
                        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                    }

                    // Signal end of stream
                    controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                    controller.close();
                } catch (error) {
                    console.error('Streaming error:', error);
                    controller.error(error);
                }
            },
        });

        return new Response(readable, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });
    } catch (error) {
        console.error('Agent API Error:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
