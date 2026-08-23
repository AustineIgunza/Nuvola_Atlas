import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { History, MessageCircle, Plus, Send, Sparkles, Trash2, X } from "lucide-react";
import AppShell from "@/components/chrome/AppShell";
import { modalBackdrop, panelSlideLeft } from "@/lib/motion";
import ResultChart from "@/components/chat/ResultChart";
import { api } from "@/api";
import { useChatStore } from "@/stores/chat";
import { useChromeStore } from "@/stores/chrome";
import { useChatStream } from "@/hooks/useChatStream";
import { useT } from "@/lib/i18n/use-t";
import { BRAND } from "@/lib/scoreColor";
import { cn } from "@/lib/cn";
import { springSettle } from "@/lib/motion";
import type { ChatConversation, ChatMessage } from "@/types";

/**
 * A dedicated Assistant surface — mirrors the sidebar/main-area layout used
 * by Compare and Infrastructure. Left column: past conversations + "new
 * chat". Main area: the active conversation, or a starter screen when none
 * is picked.
 */
export default function AssistantPage() {
  const t = useT();
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [historyOpen, setHistoryOpen] = useState(false);

  const messages = activeConversationId ? (messagesByConv[activeConversationId] ?? []) : [];

  useEffect(() => {
    api
      .listConversations()
      .then(setConversations)
      .catch(() => {
        /* offline is ok */
      });
  }, [setConversations]);

  // Auto-collapse the sidebar while on the Assistant page — the chat area
  // benefits from the extra horizontal room (long answers, wide tables from
  // ResultChart). Restore the previous state on unmount so the user isn't
  // left stuck in collapsed mode after leaving. Mirrors the Compare page.
  useEffect(() => {
    const chrome = useChromeStore.getState();
    const wasCollapsed = chrome.sidebarCollapsed;
    if (!wasCollapsed) chrome.setSidebarCollapsed(true);
    return () => {
      if (!wasCollapsed) chrome.setSidebarCollapsed(false);
    };
  }, []);

  // Deep-link entry: /assistant?ask=<prompt>[&zone=<id>] opens a fresh
  // conversation and fires the question immediately, so the "Ask about
  // Kibra" chip on the scorecard drops the user straight into an answer.
  // The zone param seeds the conversation's zoneId so follow-up questions
  // in the same conversation stay scoped to that zone even when the user
  // types a bare prompt like "and what about sanitation?".
  useEffect(() => {
    const seed = searchParams.get("ask");
    if (!seed) return;
    const zoneId = searchParams.get("zone") ?? null;
    (async () => {
      const c = await api.createConversation({
        title: seed.slice(0, 60),
        zoneId,
      });
      addConversation(c);
      setActive(c.id);
      // Strip the query params before sending so a page reload doesn't
      // duplicate the message.
      setSearchParams({}, { replace: true });
      await send(c.id, seed);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages.length, messages[messages.length - 1]?.content]);

  const startNew = async () => {
    const c = await api.createConversation({});
    addConversation(c);
    setActive(c.id);
  };

  const doSend = async (text: string) => {
    if (!text.trim() || streaming) return;
    let convId = activeConversationId;
    if (!convId) {
      const c = await api.createConversation({ title: text.slice(0, 60) });
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

  const starters = useMemo(
    () => [
      t("assistant.starter.leaders"),
      t("assistant.starter.explainPillars"),
      t("assistant.starter.weakWater"),
    ],
    [t],
  );

  return (
    <AppShell>
      <div
        className="flex-1 flex overflow-hidden"
        style={{ height: "calc(100dvh - var(--mobile-nav-h))" }}
      >
        <HistoryRail
          t={t}
          conversations={conversations}
          activeId={activeConversationId}
          onPick={setActive}
          onDelete={removeConv}
          onNew={startNew}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <header className="px-4 sm:px-6 py-3 border-b border-border shrink-0">
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-medium text-ink-4 uppercase tracking-[0.12em]">
                  {t("nav.assistant")}
                </div>
                <h1 className="text-[18px] font-semibold text-ink-1 leading-tight flex items-center gap-2">
                  <Sparkles size={16} style={{ color: BRAND.teal }} />
                  <span className="truncate">
                    {activeConversationId
                      ? (conversations.find((c) => c.id === activeConversationId)?.title ??
                        t("assistant.title"))
                      : t("assistant.title")}
                  </span>
                </h1>
                <p className="mt-0.5 text-[11.5px] text-ink-3 line-clamp-2">
                  {t("assistant.subtitle")}
                </p>
              </div>
              {/* Mobile-only controls — history sheet + new chat. Desktop
                  uses the persistent HistoryRail on the left instead. */}
              <div className="md:hidden flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setHistoryOpen(true)}
                  aria-label={t("assistant.history")}
                  className="w-9 h-9 flex items-center justify-center rounded-control bg-[rgba(255,255,255,0.05)] text-ink-2 hover:text-ink-1 btn-press"
                >
                  <History size={15} />
                </button>
                <button
                  onClick={startNew}
                  aria-label={t("assistant.newChat")}
                  className="w-9 h-9 flex items-center justify-center rounded-control bg-accent text-white btn-press"
                >
                  <Plus size={15} />
                </button>
              </div>
            </div>
          </header>

          <div ref={listRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
            {messages.length === 0 ? (
              <StarterScreen
                t={t}
                starters={starters}
                onPick={doSend}
                activeId={activeConversationId}
              />
            ) : (
              messages.map((m) => <MessageBubble key={m.id} message={m} onFollowup={doSend} />)
            )}
            {error && (
              <div className="mt-2 rounded-control bg-[rgba(211,64,46,0.08)] border border-[rgba(211,64,46,0.25)] p-2 text-[11px] text-danger">
                {error}
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              doSend(prompt);
            }}
            className="border-t border-border p-3 sm:p-4 shrink-0"
          >
            <div className="flex items-end gap-2 max-w-[860px] mx-auto">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    doSend(prompt);
                  }
                }}
                placeholder={t("assistant.placeholder")}
                rows={2}
                className="flex-1 resize-none rounded-control bg-[rgba(255,255,255,0.04)] border border-border px-3 py-2 text-[12.5px] text-ink-1 placeholder-ink-4 focus:outline-none focus:border-[rgba(255,255,255,0.16)]"
              />
              <button
                type="submit"
                disabled={streaming || !prompt.trim()}
                aria-label={t("assistant.send")}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-accent text-white disabled:opacity-30 disabled:cursor-not-allowed hover:brightness-110 transition-all btn-press"
              >
                <Send size={15} />
              </button>
            </div>
            <div className="mt-1.5 text-[10px] text-ink-4 text-center">
              {streaming ? t("assistant.thinking") : t("assistant.readonlyNote")}
            </div>
          </form>
        </div>

        {/* Mobile history sheet — a drawer from the left that mirrors the
            desktop rail. Hidden on md+ (that has the persistent rail). */}
        <AnimatePresence>
          {historyOpen && (
            <div className="fixed inset-0 z-50 md:hidden">
              <motion.div
                variants={modalBackdrop}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.2 }}
                className="absolute inset-0 bg-black/60"
                onClick={() => setHistoryOpen(false)}
              />
              <motion.aside
                variants={panelSlideLeft}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ type: "spring", stiffness: 260, damping: 30 }}
                className="absolute inset-y-0 left-0 w-[280px] glass-strong flex flex-col shadow-modal"
              >
                <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border">
                  <div className="text-[11px] font-semibold text-ink-1 uppercase tracking-[0.08em] flex-1">
                    {t("assistant.history")}
                  </div>
                  <button
                    onClick={() => setHistoryOpen(false)}
                    aria-label={t("common.close")}
                    className="w-7 h-7 flex items-center justify-center rounded-full text-ink-4 hover:text-ink-2"
                  >
                    <X size={13} />
                  </button>
                </div>
                <div className="p-3 border-b border-border">
                  <button
                    onClick={() => {
                      startNew();
                      setHistoryOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 h-9 rounded-control bg-accent text-white text-[12.5px] font-semibold btn-press"
                  >
                    <Plus size={14} /> {t("assistant.newChat")}
                  </button>
                </div>
                <nav className="flex-1 overflow-y-auto p-2 space-y-1">
                  {conversations.length === 0 ? (
                    <div className="text-[11px] text-ink-4 italic px-2 py-4">
                      {t("assistant.historyEmpty")}
                    </div>
                  ) : (
                    conversations.map((c) => {
                      const active = activeConversationId === c.id;
                      return (
                        <div
                          key={c.id}
                          className={`w-full flex items-start gap-2 px-2.5 py-2 rounded-control transition-colors ${
                            active
                              ? "bg-[rgba(192,85,43,0.14)] text-ink-1"
                              : "text-ink-2 hover:bg-[rgba(255,255,255,0.04)]"
                          }`}
                        >
                          <button
                            onClick={() => {
                              setActive(c.id);
                              setHistoryOpen(false);
                            }}
                            className="flex items-start gap-2 min-w-0 flex-1 text-left"
                          >
                            <MessageCircle size={12} className="mt-0.5 shrink-0 opacity-70" />
                            <div className="min-w-0 flex-1">
                              <div className="text-[11.5px] font-medium truncate">
                                {c.title ?? t("common.new")}
                              </div>
                              <div className="text-[9.5px] text-ink-4">
                                {formatRelative(c.updatedAt)}
                              </div>
                            </div>
                          </button>
                          <button
                            aria-label={t("common.delete")}
                            onClick={() => removeConv(c.id)}
                            className="w-6 h-6 flex items-center justify-center rounded-full text-ink-4 hover:text-danger shrink-0"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      );
                    })
                  )}
                </nav>
              </motion.aside>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AppShell>
  );
}

function HistoryRail({
  t,
  conversations,
  activeId,
  onPick,
  onDelete,
  onNew,
}: {
  t: ReturnType<typeof useT>;
  conversations: ChatConversation[];
  activeId: string | null;
  onPick: (id: string | null) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
}) {
  return (
    <aside className="hidden md:flex flex-col w-[260px] border-r border-border bg-[rgba(255,255,255,0.02)] shrink-0">
      <div className="p-3 border-b border-border shrink-0">
        <motion.button
          onClick={onNew}
          whileTap={{ scale: 0.97 }}
          transition={springSettle}
          className="w-full flex items-center justify-center gap-1.5 h-9 rounded-control bg-accent text-white text-[12.5px] font-semibold hover:brightness-110 btn-press"
        >
          <Plus size={14} /> {t("assistant.newChat")}
        </motion.button>
      </div>

      <div className="px-3 pt-3 text-[9.5px] font-medium text-ink-4 uppercase tracking-[0.1em]">
        {t("assistant.history")}
      </div>

      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {conversations.length === 0 ? (
          <div className="text-[11px] text-ink-4 italic px-2 py-4">
            {t("assistant.historyEmpty")}
          </div>
        ) : (
          conversations.map((c) => {
            const active = activeId === c.id;
            return (
              <div key={c.id} className="group relative">
                <button
                  onClick={() => onPick(c.id)}
                  className={cn(
                    "w-full flex items-start gap-2 px-2.5 py-2 rounded-control text-left transition-colors",
                    active
                      ? "bg-[rgba(192,85,43,0.14)] text-ink-1"
                      : "text-ink-2 hover:bg-[rgba(255,255,255,0.04)]",
                  )}
                >
                  <MessageCircle size={12} className="mt-0.5 shrink-0 opacity-70" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[11.5px] font-medium truncate">
                      {c.title ?? t("common.new")}
                    </div>
                    <div className="text-[9.5px] text-ink-4">{formatRelative(c.updatedAt)}</div>
                  </div>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(c.id);
                  }}
                  aria-label={t("common.delete")}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 text-ink-4 hover:text-danger hover:bg-[rgba(0,0,0,0.15)] transition-all"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            );
          })
        )}
      </nav>
    </aside>
  );
}

function StarterScreen({
  t,
  starters,
  onPick,
  activeId,
}: {
  t: ReturnType<typeof useT>;
  starters: string[];
  onPick: (s: string) => void;
  activeId: string | null;
}) {
  return (
    <div className="max-w-[560px] mx-auto text-center pt-10">
      <div
        className="w-14 h-14 rounded-full mx-auto grid place-items-center mb-4"
        style={{ background: `${BRAND.teal}20`, color: BRAND.teal }}
      >
        <Sparkles size={22} />
      </div>
      <h2 className="text-[18px] font-semibold text-ink-1">{t("assistant.title")}</h2>
      <p className="text-[12.5px] text-ink-3 mt-1.5 leading-relaxed max-w-[44ch] mx-auto">
        {activeId ? t("assistant.subtitle") : t("assistant.pickConversation")}
      </p>
      <div className="mt-6 text-[10px] text-ink-4 uppercase tracking-[0.1em]">
        {t("assistant.starterHint")}
      </div>
      <div className="mt-2 grid gap-1.5 sm:grid-cols-1 max-w-[420px] mx-auto">
        {starters.map((p) => (
          <button
            key={p}
            onClick={() => onPick(p)}
            className="w-full text-left px-3 py-2.5 rounded-control bg-[rgba(255,255,255,0.03)] border border-border text-[12px] text-ink-2 hover:bg-[rgba(255,255,255,0.06)] transition-colors"
          >
            {p}
          </button>
        ))}
      </div>
    </div>
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
        className={cn(
          "max-w-[720px] rounded-card px-3 py-2 border",
          isUser
            ? "bg-[rgba(31,138,120,0.14)] border-[rgba(31,138,120,0.3)]"
            : "bg-[rgba(255,255,255,0.03)] border-border",
        )}
      >
        {!isUser && message.intent && (
          <div
            className="mb-1 inline-flex items-center gap-1 text-[9px] font-medium uppercase tracking-[0.08em]"
            style={{ color: BRAND.teal }}
          >
            <span className="w-1 h-1 rounded-full" style={{ background: BRAND.teal }} />
            {message.intent}
          </div>
        )}
        <div className="text-[12px] leading-relaxed text-ink-1 whitespace-pre-wrap">
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
                className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(255,255,255,0.06)] border border-border text-ink-2 hover:bg-[rgba(255,255,255,0.1)] transition-colors"
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

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(iso).toLocaleDateString();
}
