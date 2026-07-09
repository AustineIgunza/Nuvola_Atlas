import { useCallback, useRef } from "react";
import { BASE, USE_MOCK, authHeaders } from "@/api/client";
import { useChatStore } from "@/stores/chat";
import type { ChatMessage } from "@/types";

type StreamEventName =
  | "intent"
  | "sql"
  | "rows"
  | "insight_delta"
  | "followups"
  | "done"
  | "error";

interface ServerEvent {
  name: StreamEventName;
  data: Record<string, unknown>;
}

/**
 * Streams a chat turn from the backend via SSE. EventSource doesn't
 * support POST, so we hand-roll a fetch + ReadableStream reader that
 * parses text/event-stream frames.
 *
 * The hook mutates the chat store as events land:
 *  - creates a placeholder assistant message on send
 *  - fills in intent/sql/rows/insight/followups as they stream
 *  - sets streaming=false on done or error
 */
export function useChatStream() {
  const abortRef = useRef<AbortController | null>(null);
  const {
    appendMessage,
    updateMessage,
    setStreaming,
    setError,
  } = useChatStore();

  const send = useCallback(
    async (conversationId: string, prompt: string) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      // Optimistic user + assistant placeholder.
      const now = new Date().toISOString();
      const userId = `local-user-${Date.now()}`;
      const assistantId = `local-assistant-${Date.now()}`;

      appendMessage(conversationId, {
        id: userId,
        role: "user",
        content: prompt,
        createdAt: now,
      });
      appendMessage(conversationId, {
        id: assistantId,
        role: "assistant",
        content: "",
        streaming: true,
        createdAt: now,
      });

      setStreaming(true);
      setError(null);

      // Mock mode fakes the whole stream with a typewriter effect so the
      // UI is testable without a backend + AI Gateway key. Swaps out
      // transparently in production via VITE_USE_REMOTE_API.
      if (USE_MOCK) {
        await runMockStream(conversationId, assistantId, prompt);
        setStreaming(false);
        return;
      }

      try {
        const res = await fetch(`${BASE}/chat/conversations/${conversationId}/messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream",
            ...authHeaders(),
          },
          body: JSON.stringify({ prompt }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          setError(`Chat request failed (${res.status}).`);
          updateMessage(conversationId, assistantId, {
            streaming: false,
            content: "Sorry — that request could not be sent.",
          });
          setStreaming(false);
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let sep;
          while ((sep = buffer.indexOf("\n\n")) !== -1) {
            const frame = buffer.slice(0, sep);
            buffer = buffer.slice(sep + 2);
            const parsed = parseFrame(frame);
            if (parsed) {
              applyEvent(conversationId, assistantId, parsed);
            }
          }
        }

        updateMessage(conversationId, assistantId, { streaming: false });
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError((err as Error).message);
        updateMessage(conversationId, assistantId, {
          streaming: false,
          content: "The chat stream ended unexpectedly.",
        });
      } finally {
        setStreaming(false);
      }
    },
    [appendMessage, updateMessage, setStreaming, setError],
  );

  const abort = useCallback(() => {
    abortRef.current?.abort();
    setStreaming(false);
  }, [setStreaming]);

  return { send, abort };
}

function parseFrame(frame: string): ServerEvent | null {
  let name: StreamEventName | null = null;
  let data = "";
  for (const line of frame.split("\n")) {
    if (line.startsWith("event: ")) name = line.slice(7).trim() as StreamEventName;
    else if (line.startsWith("data: ")) data += line.slice(6);
  }
  if (!name) return null;
  try {
    return { name, data: JSON.parse(data) as Record<string, unknown> };
  } catch {
    return null;
  }
}

async function runMockStream(convId: string, msgId: string, prompt: string) {
  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
  const intent = pickMockIntent(prompt);
  const mockData = mockAnswerFor(intent, prompt);

  await wait(250);
  applyEvent(convId, msgId, { name: "intent", data: { intent } });
  await wait(200);
  applyEvent(convId, msgId, { name: "sql", data: { sql: mockData.sql } });
  await wait(220);
  applyEvent(convId, msgId, { name: "rows", data: { count: mockData.rows.length, preview: mockData.rows } });

  for (const chunk of mockData.answer.split(/(\s+)/)) {
    await wait(35);
    applyEvent(convId, msgId, { name: "insight_delta", data: { text: chunk } });
  }

  await wait(200);
  applyEvent(convId, msgId, { name: "followups", data: { followups: mockData.followups } });
  applyEvent(convId, msgId, { name: "done", data: { message_id: msgId } });
}

function pickMockIntent(prompt: string): string {
  const p = prompt.toLowerCase();
  if (/compare|vs|versus|between/.test(p)) return "comparison";
  if (/why|dropped|fell|rose|caused/.test(p)) return "diagnostic";
  if (/trend|over time|history|last month|last year|last week/.test(p)) return "trend";
  if (/top|best|worst|leaderboard|ranked|which zones/.test(p)) return "distribution";
  if (/pillar|breakdown|composition|make up/.test(p)) return "composition";
  if (/how does|methodology|explain the score/.test(p)) return "methodology";
  return "summary";
}

interface MockAnswer {
  sql: string;
  rows: Array<Record<string, unknown>>;
  answer: string;
  followups: string[];
}

function mockAnswerFor(intent: string, prompt: string): MockAnswer {
  const base = {
    sql: "SELECT name, score FROM zones ORDER BY score DESC LIMIT 5",
    rows: [
      { name: "Westlands", score: 76 },
      { name: "Embakasi East", score: 76 },
      { name: "Dagoretti North", score: 72 },
      { name: "Langata", score: 70 },
      { name: "Starehe", score: 69 },
    ],
    answer:
      "Westlands and Embakasi East lead at 76, followed by Dagoretti North (72) and Langata (70). " +
      "The top five are separated by only seven points, suggesting Nairobi's strongest sub-counties are tightly clustered — no runaway leader.",
    followups: [
      "Which pillars are driving Westlands' score?",
      "Compare the top 5 with the bottom 5",
      "How has Embakasi East changed over the last 30 days?",
    ],
  };

  if (intent === "diagnostic") {
    return {
      ...base,
      answer:
        "Safety in Westlands dipped 1 point over the last quarter — the smallest of the four pillars. " +
        "Looking at the underlying feeds, the drop tracks two active alerts around Waiyaki Way that likely nudged the score down. Density and Infrastructure held or gained, so the overall Vitality Score is still up 2 points.",
    };
  }
  if (intent === "trend") {
    return {
      ...base,
      sql: "SELECT date_trunc('day', captured_at), avg(score) FROM zone_score_snapshots WHERE zone_id = 'westlands' AND captured_at >= now() - interval '30 days' GROUP BY 1 ORDER BY 1",
      answer:
        "Westlands has held steady between 74 and 77 over the last 30 days, with a small uptick this week driven by the Infrastructure pillar. No sudden movements — the trend is best described as 'stable but improving'.",
    };
  }
  if (intent === "comparison") {
    return {
      ...base,
      sql: "SELECT name, score, pillar_social, pillar_safety FROM zones WHERE id IN ('kasarani','embakasi-east') ORDER BY score DESC",
      rows: [
        { name: "Embakasi East", score: 76, pillar_social: 78, pillar_safety: 72 },
        { name: "Kasarani", score: 63, pillar_social: 60, pillar_safety: 62 },
      ],
      answer:
        "Embakasi East (76) outranks Kasarani (63) by 13 points overall. The gap is widest on Social Wellbeing (+18) and narrowest on Density. If you're evaluating water infrastructure investment, Embakasi East has better documented ESIA coverage; Kasarani has stronger population growth trends.",
      followups: [
        "Show me the pillar-by-pillar breakdown for Kasarani",
        "Which infrastructure projects are active in Embakasi East?",
        "How has the gap changed over the last quarter?",
      ],
    };
  }
  return base;
}

function applyEvent(convId: string, msgId: string, event: ServerEvent) {
  const { updateMessage, setError } = useChatStore.getState();
  const store = useChatStore.getState();
  const current = (store.messagesByConv[convId] ?? []).find((m) => m.id === msgId);
  if (!current) return;

  switch (event.name) {
    case "intent":
      updateMessage(convId, msgId, { intent: event.data.intent as ChatMessage["intent"] });
      break;
    case "sql":
      updateMessage(convId, msgId, { sql: event.data.sql as string });
      break;
    case "rows":
      updateMessage(convId, msgId, {
        resultRows: (event.data.preview as Array<Record<string, unknown>>) ?? [],
      });
      break;
    case "insight_delta":
      updateMessage(convId, msgId, {
        content: (current.content ?? "") + (event.data.text as string),
      });
      break;
    case "followups":
      updateMessage(convId, msgId, { followups: event.data.followups as string[] });
      break;
    case "done":
      updateMessage(convId, msgId, { streaming: false });
      break;
    case "error":
      setError(event.data.error as string);
      updateMessage(convId, msgId, {
        streaming: false,
        content: current.content || (event.data.error as string) || "Something went wrong.",
      });
      break;
  }
}
