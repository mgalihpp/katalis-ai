'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, Send } from 'lucide-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { useStockStore } from '@/store/useStockStore';
import { useTransactionStore } from '@/store/useTransactionStore';
import { useUserStore } from '@/store/useUserStore';
import { createRippleEffect } from '@/hooks/useRipple';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { executeAgentTool } from '@/lib/agentExecutor';
import {
  ChatMessage,
  ToolCallingIndicator,
  TypingIndicator,
  EmptyAgentState,
} from '@/components/agent/ChatMessages';

interface Message {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  tool_call_id?: string;
  name?: string;
  tool_calls?: any[];
}

interface AgentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AgentDrawer({ isOpen, onClose }: AgentDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const { storeName } = useUserStore();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [callingTools, setCallingTools] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const stockStore = useStockStore();
  const transactionStore = useTransactionStore();

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const executeTool = useCallback(
    (toolCall: any) => executeAgentTool(toolCall, stockStore, transactionStore),
    [stockStore, transactionStore]
  );

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const currentMessages = [...messages, userMessage];

      for (let i = 0; i < 5; i++) {
        const response = await fetch('/api/agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: currentMessages }),
        });

        if (!response.ok) throw new Error('Failed to fetch');

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        if (!reader) throw new Error('No reader');

        let accumulatedContent = '';
        const accumulatedToolCalls: any[] = [];
        let currentRole: 'assistant' | null = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const lines = decoder.decode(value).split('\n');
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const delta = JSON.parse(data);
              if (delta.role) currentRole = delta.role;

              if (delta.content) {
                accumulatedContent += delta.content;
                if (accumulatedContent.length > 0) setIsLoading(false);

                setMessages((prev) => {
                  const newMessages = [...prev];
                  const lastMsg = newMessages[newMessages.length - 1];

                  if (lastMsg?.role === 'assistant' && !lastMsg.tool_calls) {
                    newMessages[newMessages.length - 1] = { ...lastMsg, content: accumulatedContent };
                  } else {
                    newMessages.push({ role: 'assistant', content: accumulatedContent });
                  }
                  return newMessages;
                });
              }

              if (delta.tool_calls) {
                for (const tc of delta.tool_calls) {
                  const idx = tc.index;
                  if (!accumulatedToolCalls[idx]) {
                    accumulatedToolCalls[idx] = { id: '', type: 'function', function: { name: '', arguments: '' } };
                  }
                  if (tc.id) accumulatedToolCalls[idx].id = tc.id;
                  if (tc.function?.name) accumulatedToolCalls[idx].function.name = tc.function.name;
                  if (tc.function?.arguments) accumulatedToolCalls[idx].function.arguments += tc.function.arguments;
                }
              }
            } catch { /* Skip invalid JSON */ }
          }
        }

        const finalMessage: any = { role: currentRole || 'assistant' };
        if (accumulatedContent) finalMessage.content = accumulatedContent;
        if (accumulatedToolCalls.length > 0) finalMessage.tool_calls = accumulatedToolCalls;

        if (!accumulatedContent && accumulatedToolCalls.length === 0) {
          const fallback: Message = { role: 'assistant', content: 'Maaf, saya tidak bisa memproses permintaan itu. Bisa coba tanya dengan cara lain? 😅' };
          currentMessages.push(fallback);
          setMessages((prev) => [...prev, fallback]);
          setIsLoading(false);
          break;
        }

        currentMessages.push(finalMessage);
        setMessages((prev) => {
          const filtered = prev.filter((m) => !(m.role === 'assistant' && m.content === accumulatedContent && !m.tool_calls));
          return [...filtered, finalMessage];
        });

        if (finalMessage.tool_calls?.length > 0) {
          setCallingTools(finalMessage.tool_calls.map((tc: any) => tc.function.name));

          for (const toolCall of finalMessage.tool_calls) {
            const toolResult = executeTool(toolCall);
            const toolMessage: Message = { role: 'tool', tool_call_id: toolCall.id, name: toolCall.function.name, content: toolResult };
            currentMessages.push(toolMessage);
            setMessages((prev) => [...prev, toolMessage]);
          }

          setCallingTools([]);
          continue;
        }

        break;
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Gagal terhubung dengan asisten');
    } finally {
      setIsLoading(false);
      setCallingTools([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="h-[85dvh] flex flex-col overflow-hidden">
        <div className="mx-auto w-full max-w-lg flex flex-col h-full min-h-0">
          <DrawerHeader className="shrink-0 border-b border-border/50 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <DrawerTitle className="text-lg">Asisten {storeName}</DrawerTitle>
                <p className="text-sm text-muted-foreground">Tanya stok, hutang, atau omset</p>
              </div>
            </div>
          </DrawerHeader>

          {/* Chat Area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0 p-4 space-y-4 bg-muted/20">
            {messages.length === 0 && <EmptyAgentState storeName={storeName} />}
            {messages.map((msg, idx) => <ChatMessage key={idx} message={msg} index={idx} />)}
            {callingTools.length > 0 && <ToolCallingIndicator tools={callingTools} />}
            {isLoading && callingTools.length === 0 && <TypingIndicator />}
          </div>

          {/* Shortcut Templates */}
          {messages.length === 0 && (
            <div className="shrink-0 px-4 py-2 bg-background border-t border-border/50 overflow-x-auto">
              <div className="flex gap-2 whitespace-nowrap">
                {[
                  { label: '❓ Kamu bisa apa?', query: 'Kamu bisa melakukan apa saja?' },
                  { label: '📊 Omset hari ini', query: 'Berapa omset hari ini?' },
                  { label: '📦 Stok menipis', query: 'Barang apa yang stoknya menipis?' },
                  { label: '🔥 Produk terlaris', query: 'Barang apa yang paling laris hari ini?' },
                  { label: '💰 Siapa yang hutang?', query: 'Siapa saja yang punya hutang?' },
                ].map((shortcut, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInput(shortcut.query);
                      inputRef.current?.focus();
                    }}
                    className="px-3 py-1.5 text-xs bg-muted hover:bg-muted/80 rounded-full text-foreground font-medium transition-colors"
                  >
                    {shortcut.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="shrink-0 p-4 bg-background border-t border-border">
            <div className="flex items-center gap-2 bg-muted/50 p-2 rounded-2xl border border-transparent focus-within:border-primary/50 transition-colors">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ketik pesan..."
                className="flex-1 bg-transparent border-none outline-none px-2 text-sm"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                onMouseDown={createRippleEffect}
                disabled={!input.trim() || isLoading}
                className={cn(
                  'p-2 rounded-xl transition-all',
                  input.trim() && !isLoading
                    ? 'bg-primary text-primary-foreground shadow-sm hover:translate-y-[-1px]'
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                )}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
