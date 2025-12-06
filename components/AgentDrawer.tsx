'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Bot, Send, User, Loader2, Sparkles, Wrench } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { useStockStore } from '@/store/useStockStore';
import { useTransactionStore } from '@/store/useTransactionStore';
import { createRippleEffect } from '@/hooks/useRipple';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useUserStore } from '@/store/useUserStore';

interface Message {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  tool_call_id?: string;
  name?: string;
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
  const [callingTools, setCallingTools] = useState<string[]>([]); // Track which tools are being called
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Stores for tool execution
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
    (toolCall: any) => {
      const functionName = toolCall.function.name;
      const args = JSON.parse(toolCall.function.arguments);

      console.log('Executing tool:', functionName, args);

      try {
        if (functionName === 'check_stock') {
          const stock = stockStore.getStockByName(args.item_name);
          return JSON.stringify(
            stock
              ? {
                  name: stock.name,
                  quantity: stock.quantity,
                  unit: stock.unit,
                  price: stock.sell_price,
                }
              : { status: 'stok tidak ditemukan', item: args.item_name }
          );
        }

        if (functionName === 'check_debt') {
          const debtorName = args.debtor_name.toLowerCase();
          const debts = transactionStore.debts.filter(
            (d) =>
              d.debtor_name.toLowerCase().includes(debtorName) &&
              d.status !== 'paid'
          );

          if (debts.length === 0)
            return JSON.stringify({
              status: 'tidak ada hutang',
              debtor: args.debtor_name,
            });

          const totalDebt = debts.reduce(
            (sum, d) => sum + d.remaining_amount,
            0
          );
          return JSON.stringify({
            debtor: debts[0].debtor_name, // Use actual name from first match
            total_debt: totalDebt,
            count: debts.length,
          });
        }

        if (functionName === 'get_today_summary') {
          const summary = transactionStore.getTodaySummary();
          return JSON.stringify(summary);
        }

        if (functionName === 'get_low_stock') {
          const threshold = args.threshold || 5;
          const lowStocks = stockStore
            .getLowStocks()
            .filter((s) => s.quantity <= threshold)
            .map((s) => ({
              name: s.name,
              quantity: s.quantity,
              min_stock: s.min_stock,
              unit: s.unit,
            }));

          if (lowStocks.length === 0)
            return JSON.stringify({
              status: 'Aman',
              message: `Tidak ada stok di bawah ${threshold}`,
            });
          return JSON.stringify({
            low_stocks: lowStocks,
            count: lowStocks.length,
          });
        }

        if (functionName === 'get_top_selling') {
          const limit = args.limit || 5;
          const transactions = transactionStore.getTodayTransactions();
          const sales = transactions
            .filter((t) => t.type === 'sale')
            .flatMap((t) => t.items);

          const itemSales: Record<string, number> = {};
          sales.forEach((item) => {
            const name = item.item_name;
            itemSales[name] = (itemSales[name] || 0) + (item.quantity || 0);
          });

          const topSelling = Object.entries(itemSales)
            .map(([name, quantity]) => ({ name, quantity }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, limit);

          if (topSelling.length === 0)
            return JSON.stringify({ message: 'Belum ada penjualan hari ini' });
          return JSON.stringify({ top_selling: topSelling });
        }

        return JSON.stringify({ error: 'Function not found' });
      } catch (error) {
        console.error('Tool execution error:', error);
        return JSON.stringify({ error: 'Failed to execute tool' });
      }
    },
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

      // Loop for handling tool calls (max 5 turns)
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

        // Read the stream
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);

              if (data === '[DONE]') continue;

              try {
                const delta = JSON.parse(data);

                // Set role
                if (delta.role) {
                  currentRole = delta.role;
                }

                // Accumulate content
                if (delta.content) {
                  accumulatedContent += delta.content;

                  // Hide loading indicator as soon as content starts streaming
                  if (accumulatedContent.length > 0) {
                    setIsLoading(false);
                  }

                  // Update the last message in real-time
                  setMessages((prev) => {
                    const newMessages = [...prev];
                    const lastMsg = newMessages[newMessages.length - 1];

                    if (
                      lastMsg &&
                      lastMsg.role === 'assistant' &&
                      !('tool_calls' in lastMsg)
                    ) {
                      // Update existing assistant message
                      newMessages[newMessages.length - 1] = {
                        ...lastMsg,
                        content: accumulatedContent,
                      };
                    } else {
                      // Add new assistant message
                      newMessages.push({
                        role: 'assistant',
                        content: accumulatedContent,
                      });
                    }

                    return newMessages;
                  });
                }

                // Accumulate tool calls
                if (delta.tool_calls) {
                  for (const tc of delta.tool_calls) {
                    const index = tc.index;
                    if (!accumulatedToolCalls[index]) {
                      accumulatedToolCalls[index] = {
                        id: tc.id || '',
                        type: 'function',
                        function: { name: '', arguments: '' },
                      };
                    }

                    if (tc.id) accumulatedToolCalls[index].id = tc.id;
                    if (tc.function?.name)
                      accumulatedToolCalls[index].function.name =
                        tc.function.name;
                    if (tc.function?.arguments)
                      accumulatedToolCalls[index].function.arguments +=
                        tc.function.arguments;
                  }
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }

        // Build final message
        const finalMessage: any = {
          role: currentRole || 'assistant',
        };

        if (accumulatedContent) {
          finalMessage.content = accumulatedContent;
        }

        if (accumulatedToolCalls.length > 0) {
          finalMessage.tool_calls = accumulatedToolCalls;
          // Do NOT wipe content if tool calls exist
        }

        // Skip if message is empty (no content and no tool calls)
        if (!accumulatedContent && accumulatedToolCalls.length === 0) {
          console.log('Empty response from AI, showing fallback message');

          // Add fallback message
          const fallbackMessage: Message = {
            role: 'assistant',
            content:
              'Maaf, saya tidak bisa memproses permintaan itu. Bisa coba tanya dengan cara lain? 😅',
          };

          currentMessages.push(fallbackMessage);
          setMessages((prev) => [...prev, fallbackMessage]);
          setIsLoading(false);
          break;
        }

        // Update messages with final version
        currentMessages.push(finalMessage);
        setMessages((prev) => {
          const filtered = prev.filter(
            (m) =>
              !(
                m.role === 'assistant' &&
                m.content === accumulatedContent &&
                !('tool_calls' in m)
              )
          );
          return [...filtered, finalMessage];
        });

        // Handle tool calls
        if (finalMessage.tool_calls && finalMessage.tool_calls.length > 0) {
          const toolNames = finalMessage.tool_calls.map(
            (tc: any) => tc.function.name
          );
          setCallingTools(toolNames);

          for (const toolCall of finalMessage.tool_calls) {
            const toolResult = executeTool(toolCall);

            const toolMessage: Message = {
              role: 'tool',
              tool_call_id: toolCall.id,
              name: toolCall.function.name,
              content: toolResult,
            };

            currentMessages.push(toolMessage);
            setMessages((prev) => [...prev, toolMessage]);
          }

          setCallingTools([]);
          continue;
        }

        // No tool calls, we're done
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
      <DrawerContent className="h-[85vh] flex flex-col overflow-hidden">
        <div className="mx-auto w-full max-w-lg flex flex-col h-full min-h-0">
          <DrawerHeader className="shrink-0 border-b border-border/50 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <DrawerTitle className="text-lg">
                  Asisten {storeName}
                </DrawerTitle>
                <p className="text-sm text-muted-foreground">
                  Tanya stok, hutang, atau omset
                </p>
              </div>
            </div>
          </DrawerHeader>

          {/* Chat Area */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto min-h-0 p-4 space-y-4 bg-muted/20"
          >
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground space-y-2 opacity-50">
                <Bot className="w-12 h-12 mb-2" />
                <p className="font-medium">Halo! Saya Asisten {storeName}.</p>
                <p className="text-sm">
                  Tanya saya tentang stok, hutang, atau laporan hari ini.
                </p>
              </div>
            )}

            {messages.map((msg, idx) => {
              // Skip tool messages (internal)
              if (msg.role === 'tool') return null;

              // Render user messages
              if (msg.role === 'user') {
                return (
                  <div
                    key={idx}
                    className="flex gap-3 max-w-[85%] ml-auto flex-row-reverse"
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-primary text-primary-foreground">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="p-3 rounded-2xl text-sm leading-relaxed prose prose-sm max-w-none bg-primary text-primary-foreground rounded-tr-none prose-invert">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                );
              }

              // Render assistant messages with tool_calls
              if (msg.role === 'assistant' && (msg as any).tool_calls) {
                const toolCalls = (msg as any).tool_calls;
                return (
                  <div key={idx} className="flex gap-3 max-w-[85%]">
                    <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                      <Wrench className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 p-3 rounded-2xl rounded-tl-none shadow-sm space-y-2">
                      {toolCalls.map((tc: any, tcIdx: number) => {
                        const toolName = tc.function.name;
                        const args = JSON.parse(tc.function.arguments);

                        let label = '🔧 Memanggil fungsi';
                        if (toolName === 'check_stock')
                          label = '🔍 Mengecek stok';
                        if (toolName === 'check_debt')
                          label = '💰 Mengecek hutang';
                        if (toolName === 'get_today_summary')
                          label = '📊 Mengambil laporan';
                        if (toolName === 'get_low_stock')
                          label = '📉 Cek stok menipis';
                        if (toolName === 'get_top_selling')
                          label = '🏆 Cek barang terlaris';

                        return (
                          <div
                            key={tcIdx}
                            className="text-sm text-amber-700 dark:text-amber-400"
                          >
                            <div className="font-medium">{label}</div>
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

              // Render assistant messages with content
              if (msg.role === 'assistant' && msg.content) {
                return (
                  <div key={idx} className="flex gap-3 max-w-[85%]">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-muted border border-border">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="p-3 rounded-2xl text-sm leading-relaxed prose prose-sm max-w-none bg-background border border-border rounded-tl-none shadow-sm">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                );
              }

              return null;
            })}

            {/* Tool Calling Indicator */}
            {callingTools.length > 0 && (
              <div className="flex gap-3 max-w-[85%]">
                <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                  <Wrench className="w-4 h-4 text-amber-600 animate-pulse" />
                </div>
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 p-3 rounded-2xl rounded-tl-none shadow-sm">
                  <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span className="font-medium">
                      {callingTools
                        .map((tool) => {
                          if (tool === 'check_stock') return '🔍 Mengecek stok';
                          if (tool === 'check_debt')
                            return '💰 Mengecek hutang';
                          if (tool === 'get_today_summary')
                            return '📊 Mengambil laporan';
                          if (tool === 'get_low_stock')
                            return '📉 Cek stok menipis';
                          if (tool === 'get_top_selling')
                            return '🏆 Cek barang terlaris';
                          return tool;
                        })
                        .join(', ')}
                      ...
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Loading indicator - waiting for server */}
            {isLoading && callingTools.length === 0 && (
              <div className="flex gap-3 max-w-[85%]">
                <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-background border border-border p-3 rounded-2xl rounded-tl-none shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-muted-foreground/30 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-2 h-2 bg-muted-foreground/30 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-2 h-2 bg-muted-foreground/30 rounded-full animate-bounce"></span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="shrink-0 p-4 bg-background border-t border-border">
            {' '}
            {/* Changed mt-auto to shrink-0 */}
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
