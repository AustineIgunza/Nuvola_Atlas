import { useEffect, useMemo, useRef, useState } from "react";
import { Send, Sparkles, Trash2 } from "lucide-react";
import { api } from "@/api";
import { useChatStore } from "@/stores/chat";
import { useChatStream } from "@/hooks/useChatStream";
import { BRAND } from "@/lib/scoreColor";
import type { ChatMessage, Zone } from "@/types";
import ResultChart from "./ResultChart";

interface Props {
  zones: Zone[];
}

/**
 * Compare-page Assistant. Docked into the side of the Compare grid instead
 * of floating over the map like ChatPanel. Reads the picked zones so the
 * placeholder, starter prompts, and mock replies all know what's on screen.
 */
export default function CompareAssistant({ zones }: Props) {
  const { activeConversationId, setActive, addConversation, messagesByConv, streaming, error } =
    useChatStore();
  const { send } = useChatStream();
  const [prompt, setPrompt] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const messages = activeConversationId ? (messagesByConv[activeConversationId] ?? []) : [];

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages.length, messages[messages.length - 1]?.content]);

  const zoneNames = useMemo(() => zones.map((z) => z.name), [zones]);
  const contextLabel = useMemo(() => {
    if (zoneNames.length === 0) return "Pick a zone to compare";
    if (zoneNames.length === 1) return `Focused on ${zoneNames[0]}`;
    if (zoneNames.length === 2) return `Comparing ${zoneNames[0]} and ${zoneNames[1]}`;
    return `Comparing ${zoneNames.slice(0, -1).join(", ")} and ${zoneNames[zoneNames.length - 1]}`;
  }, [zoneNames]);

  const starters = useMemo(() => buildStarters(zones), [zones]);

  const doSend = async (text: string) => {
    if (!text.trim() || streaming) return;
    let convId = activeConversationId;
    if (!convId) {
      const c = await api.createConversation({
        title: text.slice(0, 60),
        zoneId: zones[0]?.id ?? null,
      });
      addConversation(c);
      setActive(c.id);
      convId = c.id;
    }
    setPrompt("");
    await send(convId, text);
  };

  const startFresh = () => {
    setActive(null);
    setPrompt("");
  };

  return (
    <aside
      // Mobile: bounded natural height so the assistant doesn't monopolise
      // the screen when stacked under the comparison content. Desktop:
      // sticky column capped at viewport height so the input row lands near
      // the bottom of the viewport, not the bottom of the (very tall) grid.
      className="rounded-card border border-border bg-[rgba(255,255,255,0.02)] flex flex-col overflow-hidden max-h-[60vh] lg:max-h-[calc(100vh-2rem)] lg:sticky lg:top-4"
      aria-label="Comparison assistant"
    >
      <div
        className="h-[2.5px] shrink-0"
        style={{ background: `linear-gradient(90deg, ${BRAND.teal}, ${BRAND.gold})` }}
      />
      <div className="flex items-center gap-2 px-3 pt-2.5 pb-2 border-b border-border shrink-0">
        <div
          className="w-7 h-7 rounded-full grid place-items-center"
          style={{ background: `${BRAND.teal}22`, color: BRAND.teal }}
        >
          <Sparkles size={13} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[9.5px] font-medium text-ink-4 uppercase tracking-[0.1em]">
            Assistant
          </div>
          <div className="text-[12px] font-semibold text-ink-1 leading-tight truncate">
            {contextLabel}
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={startFresh}
            aria-label="Start a new question"
            className="w-7 h-7 flex items-center justify-center rounded-full bg-[rgba(255,255,255,0.06)] text-ink-4 hover:text-ink-2 transition-colors shrink-0 btn-press"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto p-3 space-y-2.5 min-h-[240px]">
        {messages.length === 0 ? (
          <div className="space-y-2.5">
            <p className="text-[11px] text-ink-3 leading-relaxed">
              {zones.length === 0
                ? "Add a zone or two above and I can explain what's driving the differences across the four Vitality pillars."
                : "Ask about the zones on screen. I'll walk through the four Vitality pillars — Social Wellbeing, Safety, Density, and Infrastructure — and flag what's actually driving the gap."}
            </p>
            <div className="space-y-1.5">
              <div className="text-[9px] text-ink-4 uppercase tracking-[0.08em]">Try</div>
              {starters.map((p) => (
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
              zoneNames.length >= 2
                ? `Ask about ${zoneNames[0]} vs ${zoneNames[1]}…`
                : zoneNames.length === 1
                  ? `Ask about ${zoneNames[0]}…`
                  : "Ask about the compared zones…"
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
    </aside>
  );
}

function buildStarters(zones: Zone[]): string[] {
  if (zones.length === 0) {
    return [
      "Which Nairobi zones lead on Vitality?",
      "Where is the Safety pillar weakest?",
      "Explain the four Vitality pillars",
    ];
  }
  if (zones.length === 1) {
    const [a] = zones;
    return [
      `Why is ${a.name}'s Safety pillar where it is?`,
      `Which pillar is dragging ${a.name} down?`,
      `Compare ${a.name} to the county average`,
    ];
  }
  if (zones.length === 2) {
    const [a, b] = zones;
    return [
      `Compare ${a.name} and ${b.name} across all four pillars`,
      `Where is ${a.name} stronger than ${b.name}?`,
      `Which of these two has the better Infrastructure pillar?`,
    ];
  }
  const [a, b, c] = zones;
  return [
    `Rank ${a.name}, ${b.name} and ${c.name} on Vitality`,
    `Compare their four pillars side by side`,
    `Which one has the worst Safety pillar and why?`,
  ];
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
