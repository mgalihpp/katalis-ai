'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  tool_call_id?: string;
  name?: string;
  tool_calls?: any[];
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

interface ChatHistoryState {
  conversations: Conversation[];
  activeConversationId: string | null;
  
  // Actions
  createConversation: () => string;
  saveConversation: (id: string, messages: ChatMessage[]) => void;
  loadConversation: (id: string) => Conversation | null;
  deleteConversation: (id: string) => void;
  setActiveConversation: (id: string | null) => void;
  getConversationList: () => Conversation[];
  updateConversationTitle: (id: string, title: string) => void;
}

const MAX_CONVERSATIONS = 20;

// Generate title from first user message
function generateTitle(messages: ChatMessage[]): string {
  const firstUserMessage = messages.find(m => m.role === 'user');
  if (firstUserMessage) {
    const content = firstUserMessage.content;
    return content.length > 40 ? content.substring(0, 40) + '...' : content;
  }
  return 'Percakapan Baru';
}

export const useChatHistoryStore = create<ChatHistoryState>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeConversationId: null,

      createConversation: () => {
        const id = `conv-${Date.now()}`;
        const newConversation: Conversation = {
          id,
          title: 'Percakapan Baru',
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        
        set((state) => {
          // Add new conversation and limit to MAX_CONVERSATIONS
          const updated = [newConversation, ...state.conversations].slice(0, MAX_CONVERSATIONS);
          return { 
            conversations: updated,
            activeConversationId: id 
          };
        });
        
        return id;
      },

      saveConversation: (id, messages) => {
        if (messages.length === 0) return;
        
        set((state) => {
          const existingIndex = state.conversations.findIndex(c => c.id === id);
          const title = generateTitle(messages);
          
          if (existingIndex !== -1) {
            // Update existing conversation
            const updated = [...state.conversations];
            updated[existingIndex] = {
              ...updated[existingIndex],
              messages,
              title,
              updatedAt: Date.now(),
            };
            return { conversations: updated };
          } else {
            // Create new conversation
            const newConversation: Conversation = {
              id,
              title,
              messages,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            };
            const updated = [newConversation, ...state.conversations].slice(0, MAX_CONVERSATIONS);
            return { conversations: updated };
          }
        });
      },

      loadConversation: (id) => {
        const conversation = get().conversations.find(c => c.id === id);
        if (conversation) {
          set({ activeConversationId: id });
        }
        return conversation || null;
      },

      deleteConversation: (id) => {
        set((state) => ({
          conversations: state.conversations.filter(c => c.id !== id),
          activeConversationId: state.activeConversationId === id ? null : state.activeConversationId,
        }));
      },

      setActiveConversation: (id) => {
        set({ activeConversationId: id });
      },

      getConversationList: () => {
        return get().conversations;
      },

      updateConversationTitle: (id, title) => {
        set((state) => ({
          conversations: state.conversations.map(c => 
            c.id === id ? { ...c, title } : c
          ),
        }));
      },
    }),
    {
      name: 'katalis-ai-chat-history',
    }
  )
);
