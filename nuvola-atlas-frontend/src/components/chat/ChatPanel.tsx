import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { MessageCircleQuestion, Plus, Send, Trash2, X } from "lucide-react";
import { api } from "@/api";
import { useChatStore } from "@/stores/chat";
import { useChromeStore } from "@/stores/chrome";
import { useUIStore } from "@/stores/ui";
import { useChatStream } from "@/hooks/useChatStream";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { BRAND } from "@/lib/scoreColor";
import { springSettle, modalBackdrop, panelSlideUp } from "@/lib/motion";
import type { ChatMessage } from "@/domain/types";
import ResultChart from "./ResultChart";

const STARTER_PROMPTS = [
  "Which sub-counties improved most in the last 30 days?",
  "Why did Westlands' water & sanitation pillar move this quarter?",
  "Compare Kasarani and Embakasi East on road density",
];

export default function ChatPanel() {
  const chatOpen = useChromeStore((s) => s.chatOpen);
  const closeChat = useChromeStore((s) => s.closeChat);
  const selectedZoneId = useUIStore((s) => s.selectedZoneId);
  const reduced = useReducedMotion();

  const isMobile = useMediaQuery("(max-width: 1023px)");

  const {
    conversations,
    setConversations,
    addConversation,
    removeConversation,
    activeConversationId,
    setActive,
    messagesByConv,
    streaming,
    error,
  } = useChatStore();
  const { send } = useChatStream();

  const [prompt, setPrompt] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const messages = activeConversationId ? (messagesByConv[activeConversationId] ?? []) : [];

  useEffect(() => {
    if (!chatOpen) return;
    api
      .listConversations()
      .then(setConversations)
      .catch(() => {
        /* offline is ok */
      });
  }, [chatOpen, setConversations]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages.length, messages[messages.length - 1]?.content]);

  const startNew = async () => {
    const c = await api.createConversation({
      zoneId: selectedZoneId ?? null,
    });
    addConversation(c);
    setActive(c.id);
  };

  const doSend = async (text: string) => {
    if (!text.trim() || streaming) return;
    let convId = activeConversationId;
    if (!convId) {
      const c = await api.createConversation({
        title: text.slice(0, 60),
        zoneId: selectedZoneId ?? null,
      });
      addConversation(c);
      setActive(c.id);
      convId = c.id;
    }
    setPrompt("");
    await send(convId, text);
  };

  const removeConv = async (id: string) => {
    await api.deleteConversation(id).catch(() => {
      /* offline is ok */
    });
    removeConversation(id);
  };

  const body = (
    <>
      <div className="flex items-center gap-2 px-3.5 pt-3 pb-2.5 border-b border-border shrink-0">
        <div
          className="w-7 h-7 rounded-full grid place-items-center"
          style={{ background: `${BRAND.teal}22`, color: BRAND.teal }}
        >
          <MessageCircleQuestion size={14} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[9.5px] font-medium text-ink-4 uppercase tracking-[0.1em]">
            Ask Navuuna
          </div>
          <div className="text-[13px] font-semibold text-ink-1 leading-tight truncate">
            {activeConversationId
              ? (conversations.find((c) => c.id === activeConversationId)?.title ?? "Chat")
              : "New conversation"}
          </div>
        </div>
        <button
          onClick={startNew}
          aria-label="New chat"
          className="w-7 h-7 flex items-center justify-center rounded-full bg-[rgba(255,255,255,0.06)] text-ink-3 hover:text-ink-1 transition-colors shrink-0 btn-press"
        >
          <Plus size={13} />
        </button>
        <button
          onClick={closeChat}
          aria-label="Close chat"
          className="w-7 h-7 flex items-center justify-center rounded-full bg-[rgba(255,255,255,0.06)] text-ink-4 hover:text-ink-2 transition-colors shrink-0 btn-press"
        >
          <X size={13} />
        </button>
      </div>

      {conversations.length > 0 && (
        <div className="px-2 py-1.5 border-b border-border shrink-0 overflow-x-auto whitespace-nowrap flex gap-1.5">
          {conversations.slice(0, 8).map((c) => (
            <div
              key={c.id}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9.5px] transition-colors ${
                activeConversationId === c.id
                  ? "bg-[rgba(255,255,255,0.14)] text-ink-1"
                  : "bg-[rgba(255,255,255,0.04)] text-ink-3 hover:text-ink-1"
              }`}
            >
              <button onClick={() => setActive(c.id)} className="truncate max-w-[100px]">
                {c.title ?? "Untitled"}
              </button>
              <button
                onClick={() => removeConv(c.id)}
                className="opacity-40 hover:opacity-80"
                aria-label={`Delete ${c.title ?? "conversation"}`}
              >
                <Trash2 size={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div ref={listRef} className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {messages.length === 0 ? (
          <div className="space-y-2.5 pt-4">
            <p className="text-[11px] text-ink-3 leading-relaxed">
              Ask a question about Nairobi zones. I write live Postgres queries against the Vitality
              Index dataset and explain what I find. Every query is bounded and read-only.
            </p>
            <div className="space-y-1.5">
              <div className="text-[9px] text-ink-4 uppercase tracking-[0.08em]">Try</div>
              {STARTER_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => doSend(p)}
                  className="w-full text-left px-2.5 py-2 rounded-control bg-[rgba(255,255,255,0.03)] border border-border text-[10.5px] text-ink-2 hover:bg-[rgba(255,255,255,0.06)] transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => <MessageBubble key={m.id} message={m} onFollowup={doSend} />)
        )}
        {error && (
          <div className="mt-2 rounded-control bg-[rgba(211,64,46,0.08)] border border-[rgba(211,64,46,0.25)] p-2 text-[10px] text-danger">
            {error}
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          doSend(prompt);
        }}
        className="border-t border-border p-2.5 shrink-0"
      >
        <div className="flex items-end gap-2">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                doSend(prompt);
              }
            }}
            placeholder={
              selectedZoneId ? `Ask about ${selectedZoneId} or any zone…` : "Ask about any zone…"
            }
            rows={2}
            className="flex-1 resize-none rounded-control bg-[rgba(255,255,255,0.04)] border border-border px-2.5 py-1.5 text-[11px] text-ink-1 placeholder-ink-4 focus:outline-none focus:border-[rgba(255,255,255,0.16)]"
          />
          <button
            type="submit"
            disabled={streaming || !prompt.trim()}
            aria-label="Send"
            className="w-8 h-8 flex items-center justify-center rounded-full bg-accent text-white disabled:opacity-30 disabled:cursor-not-allowed hover:brightness-110 transition-all btn-press"
          >
            <Send size={13} />
          </button>
        </div>
        <div className="mt-1 text-[9px] text-ink-4">
          ⌘/Ctrl + Enter to send. {streaming ? "Thinking…" : "Read-only queries only."}
        </div>
      </form>
    </>
  );

  return (
    <>
      <AnimatePresence>
        {chatOpen && !isMobile && (
          <motion.aside
            key="chat-panel"
            initial={reduced ? { opacity: 0 } : { opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, x: -24 }}
            transition={springSettle}
            role="complementary"
            aria-label="Navuuna assistant"
            className="absolute top-3 left-3 bottom-3 z-20 w-[380px] flex flex-col glass-strong border border-border rounded-modal shadow-modal overflow-hidden"
          >
            <div
              className="h-[2.5px] shrink-0"
              style={{ background: `linear-gradient(90deg, ${BRAND.teal}, ${BRAND.gold})` }}
            />
            {body}
          </motion.aside>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {chatOpen && isMobile && (
          <motion.div key="chat-sheet" className="fixed inset-0 z-40">
            <motion.div
              variants={modalBackdrop}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={closeChat}
            />
            <motion.div
              variants={panelSlideUp}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={springSettle}
              role="dialog"
              aria-modal="true"
              aria-label="Navuuna assistant"
              className="absolute inset-x-0 bottom-0 max-h-[88vh] flex flex-col glass-strong border-t border-border rounded-t-modal shadow-modal pb-safe"
            >
              <div
                className="h-[2.5px] shrink-0 rounded-t-modal"
                style={{ background: `linear-gradient(90deg, ${BRAND.teal}, ${BRAND.gold})` }}
              />
              <div className="relative shrink-0">
                <div className="absolute left-1/2 -translate-x-1/2 top-1.5 w-9 h-1 rounded-full bg-[rgba(255,255,255,0.18)]" />
                {body}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function MessageBubble({
  message,
  onFollowup,
}: {
  message: ChatMessage;
  onFollowup: (s: string) => void;
}) {
  const isUser = message.role === "user";
  const rows = message.resultRows ?? [];
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[92%] rounded-card px-2.5 py-2 border ${
          isUser
            ? "bg-[rgba(31,138,120,0.14)] border-[rgba(31,138,120,0.3)]"
            : "bg-[rgba(255,255,255,0.03)] border-border"
        }`}
      >
        {!isUser && message.intent && (
          <div
            className="mb-1 inline-flex items-center gap-1 text-[8.5px] font-medium uppercase tracking-[0.08em]"
            style={{ color: BRAND.teal }}
          >
            <span className="w-1 h-1 rounded-full" style={{ background: BRAND.teal }} />
            {message.intent}
          </div>
        )}
        <div className="text-[11px] leading-relaxed text-ink-1 whitespace-pre-wrap">
          {message.content}
          {message.streaming && !message.content && <span className="opacity-60">Thinking…</span>}
          {message.streaming && message.content && <span className="opacity-60">▎</span>}
        </div>
        {rows.length > 0 && <ResultChart rows={rows} />}
        {message.followups && message.followups.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {message.followups.map((f) => (
              <button
                key={f}
                onClick={() => onFollowup(f)}
                className="text-[9.5px] px-2 py-0.5 rounded-full bg-[rgba(255,255,255,0.06)] border border-border text-ink-2 hover:bg-[rgba(255,255,255,0.1)] transition-colors"
              >
                {f}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
