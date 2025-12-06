'use client';

import { Bot, User, Loader2, Wrench } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getToolLabel } from '@/lib/agentExecutor';

interface Message {
    role: 'user' | 'assistant' | 'system' | 'tool';
    content: string;
    tool_call_id?: string;
    name?: string;
    tool_calls?: any[];
}

// User message bubble
export function UserMessage({ content }: { content: string }) {
    return (
        <div className="flex gap-3 max-w-[85%] ml-auto flex-row-reverse">
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-primary text-primary-foreground">
                <User className="w-4 h-4" />
            </div>
            <div className="p-3 rounded-2xl text-sm leading-relaxed prose prose-sm max-w-none bg-primary text-primary-foreground rounded-tr-none prose-invert">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </div>
        </div>
    );
}

// Assistant message bubble
export function AssistantMessage({ content }: { content: string }) {
    return (
        <div className="flex gap-3 max-w-[85%]">
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-muted border border-border">
                <Bot className="w-4 h-4" />
            </div>
            <div className="p-3 rounded-2xl text-sm leading-relaxed prose prose-sm max-w-none bg-background border border-border rounded-tl-none shadow-sm">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </div>
        </div>
    );
}

// Tool call message
export function ToolCallMessage({ toolCalls }: { toolCalls: any[] }) {
    return (
        <div className="flex gap-3 max-w-[85%]">
            <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                <Wrench className="w-4 h-4 text-amber-600" />
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 p-3 rounded-2xl rounded-tl-none shadow-sm space-y-2">
                {toolCalls.map((tc, idx) => {
                    const args = JSON.parse(tc.function.arguments);
                    return (
                        <div key={idx} className="text-sm text-amber-700 dark:text-amber-400">
                            <div className="font-medium">{getToolLabel(tc.function.name)}</div>
                            <div className="text-xs mt-1 font-mono bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded">
                                {JSON.stringify(args, null, 2)}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// Tool calling indicator
export function ToolCallingIndicator({ tools }: { tools: string[] }) {
    return (
        <div className="flex gap-3 max-w-[85%]">
            <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                <Wrench className="w-4 h-4 text-amber-600 animate-pulse" />
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 p-3 rounded-2xl rounded-tl-none shadow-sm">
                <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span className="font-medium">
                        {tools.map(getToolLabel).join(', ')}...
                    </span>
                </div>
            </div>
        </div>
    );
}

// Loading indicator (typing)
export function TypingIndicator() {
    return (
        <div className="flex gap-3 max-w-[85%]">
            <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
            </div>
            <div className="bg-background border border-border p-3 rounded-2xl rounded-tl-none shadow-sm">
                <div className="flex gap-1">
                    <span className="w-2 h-2 bg-muted-foreground/30 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-2 h-2 bg-muted-foreground/30 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-2 h-2 bg-muted-foreground/30 rounded-full animate-bounce" />
                </div>
            </div>
        </div>
    );
}

// Empty state when no messages
export function EmptyAgentState({ storeName }: { storeName: string }) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground space-y-2 opacity-50">
            <Bot className="w-12 h-12 mb-2" />
            <p className="font-medium">Halo! Saya Asisten {storeName}.</p>
            <p className="text-sm">Tanya saya tentang stok, hutang, atau laporan hari ini.</p>
        </div>
    );
}

// Render a single message
export function ChatMessage({ message, index }: { message: Message; index: number }) {
    if (message.role === 'tool') return null;

    if (message.role === 'user') {
        return <UserMessage key={index} content={message.content} />;
    }

    if (message.role === 'assistant' && message.tool_calls) {
        return <ToolCallMessage key={index} toolCalls={message.tool_calls} />;
    }

    if (message.role === 'assistant' && message.content) {
        return <AssistantMessage key={index} content={message.content} />;
    }

    return null;
}
