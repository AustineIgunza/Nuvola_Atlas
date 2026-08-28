import { create } from "zustand";
import type { ChatConversation, ChatMessage } from "@/domain/types";

interface ChatState {
  conversations: ChatConversation[];
  activeConversationId: string | null;
  messagesByConv: Record<string, ChatMessage[]>;
  streaming: boolean;
  error: string | null;

  setConversations: (rows: ChatConversation[]) => void;
  addConversation: (c: ChatConversation) => void;
  removeConversation: (id: string) => void;
  setActive: (id: string | null) => void;
  setMessages: (convId: string, msgs: ChatMessage[]) => void;
  appendMessage: (convId: string, msg: ChatMessage) => void;
  updateMessage: (convId: string, msgId: string, patch: Partial<ChatMessage>) => void;
  setStreaming: (on: boolean) => void;
  setError: (msg: string | null) => void;
  reset: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  activeConversationId: null,
  messagesByConv: {},
  streaming: false,
  error: null,

  setConversations: (rows) => set({ conversations: rows }),
  addConversation: (c) => set((s) => ({ conversations: [c, ...s.conversations] })),
  removeConversation: (id) =>
    set((s) => ({
      conversations: s.conversations.filter((c) => c.id !== id),
      activeConversationId: s.activeConversationId === id ? null : s.activeConversationId,
    })),
  setActive: (id) => set({ activeConversationId: id, error: null }),
  setMessages: (convId, msgs) =>
    set((s) => ({ messagesByConv: { ...s.messagesByConv, [convId]: msgs } })),
  appendMessage: (convId, msg) =>
    set((s) => ({
      messagesByConv: {
        ...s.messagesByConv,
        [convId]: [...(s.messagesByConv[convId] ?? []), msg],
      },
    })),
  updateMessage: (convId, msgId, patch) =>
    set((s) => ({
      messagesByConv: {
        ...s.messagesByConv,
        [convId]: (s.messagesByConv[convId] ?? []).map((m) =>
          m.id === msgId ? { ...m, ...patch } : m,
        ),
      },
    })),
  setStreaming: (on) => set({ streaming: on }),
  setError: (msg) => set({ error: msg }),
  reset: () =>
    set({
      conversations: [],
      activeConversationId: null,
      messagesByConv: {},
      streaming: false,
      error: null,
    }),
}));
