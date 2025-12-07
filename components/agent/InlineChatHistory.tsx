'use client';

import { ArrowLeft, Trash2, MessageSquare } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChatHistoryStore, Conversation } from '@/store/useChatHistoryStore';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

interface InlineChatHistoryProps {
  onBack: () => void;
  onSelectConversation: (conversation: Conversation) => void;
}

export function InlineChatHistory({ onBack, onSelectConversation }: InlineChatHistoryProps) {
  const { conversations, activeConversationId, deleteConversation } = useChatHistoryStore();

  const handleSelect = (conversation: Conversation) => {
    onSelectConversation(conversation);
    onBack();
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteConversation(id);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 flex items-center gap-3 p-4 border-b border-border/50">
        <button
          onClick={onBack}
          className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Riwayat Chat</h2>
        </div>
      </div>

      {/* History List */}
      <ScrollArea className="flex-1">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground">
            <MessageSquare className="w-12 h-12 mb-3 opacity-30" />
            <p className="font-medium">Belum ada riwayat chat</p>
            <p className="text-sm mt-1">Percakapan yang kamu mulai akan muncul di sini</p>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                role="button"
                tabIndex={0}
                onClick={() => handleSelect(conversation)}
                onKeyDown={(e) => e.key === 'Enter' && handleSelect(conversation)}
                className={cn(
                  'w-full text-left p-3 rounded-xl transition-colors group cursor-pointer',
                  'hover:bg-muted/80 border border-transparent',
                  activeConversationId === conversation.id && 'bg-primary/10 border-primary/20'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{conversation.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(conversation.updatedAt, { 
                        addSuffix: true, 
                        locale: localeId 
                      })} • {conversation.messages.length} pesan
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDelete(e, conversation.id)}
                    className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
