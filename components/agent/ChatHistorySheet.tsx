'use client';

import { X, Trash2, MessageSquare } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChatHistoryStore, Conversation } from '@/store/useChatHistoryStore';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

interface ChatHistorySheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectConversation: (conversation: Conversation) => void;
}

export function ChatHistorySheet({ isOpen, onClose, onSelectConversation }: ChatHistorySheetProps) {
  const { conversations, activeConversationId, deleteConversation } = useChatHistoryStore();

  const handleSelect = (conversation: Conversation) => {
    onSelectConversation(conversation);
    onClose();
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteConversation(id);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-[300px] sm:w-[350px] p-0">
        <SheetHeader className="p-4 border-b border-border">
          <SheetTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Riwayat Chat
          </SheetTitle>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-80px)]">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Belum ada riwayat chat</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => handleSelect(conversation)}
                  className={cn(
                    'w-full text-left p-3 rounded-lg transition-colors group',
                    'hover:bg-muted/80',
                    activeConversationId === conversation.id && 'bg-primary/10 border border-primary/20'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{conversation.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDistanceToNow(conversation.updatedAt, { 
                          addSuffix: true, 
                          locale: localeId 
                        })}
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleDelete(e, conversation.id)}
                      className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {conversation.messages.length} pesan
                  </p>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
