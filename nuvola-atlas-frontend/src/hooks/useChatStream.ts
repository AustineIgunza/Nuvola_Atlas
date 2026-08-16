import { useCallback, useRef } from "react";
import { BASE, USE_MOCK_CHAT, authHeaders } from "@/api/client";
import { useChatStore } from "@/stores/chat";
import { useAtlasStore } from "@/stores/atlas";
import { ZONES } from "@/api/fixtures";
import { translate } from "@/lib/i18n/translate";
import type { MessageKey, TVars } from "@/lib/i18n/translate";
import { usePrefsStore } from "@/stores/prefs";
import type { ChatMessage, Zone } from "@/types";

/** Locale-aware t() at message-build time (never at module load) so language
 *  switches take effect on the very next chat turn. */
function tt(key: MessageKey, vars?: TVars): string {
  const locale = usePrefsStore.getState().locale;
  return translate(locale, key, vars);
}

/**
 * Resolve pillar labels against the currently-active locale.
 */
function pillarLabels(): Record<"social" | "safety" | "density" | "infra", string> {
  return {
    social: tt("pillar.social.long"),
    safety: tt("pillar.safety.long"),
    density: tt("pillar.density.long"),
    infra: tt("pillar.infra.long"),
  };
}

type StreamEventName = "intent" | "sql" | "rows" | "insight_delta" | "followups" | "done" | "error";

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
  const { appendMessage, updateMessage, setStreaming, setError } = useChatStore();

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
      if (USE_MOCK_CHAT) {
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
            content: tt("chat.errorGeneric"),
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
          content: tt("chat.errorEnded"),
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
  // Zone context — three sources, in order of specificity:
  //   1. Any zone name found in the prompt itself.
  //   2. The zone this conversation was seeded with (createConversation
  //      carries zoneId when the "Ask about X" chip on the scorecard fires).
  //   3. The compareZoneIds mirrored from the Compare page.
  const chat = useChatStore.getState();
  const activeConv = chat.conversations.find((c) => c.id === convId);
  const conversationZone = activeConv?.zoneId
    ? (ZONES.find((z) => z.id === activeConv.zoneId) ?? null)
    : null;

  const compareIds = useAtlasStore.getState().compareZoneIds;
  const compareZones = compareIds
    .map((id) => ZONES.find((z) => z.id === id))
    .filter((z): z is Zone => Boolean(z));

  const intent = pickMockIntent(prompt, compareZones, conversationZone);
  const mockData = mockAnswerFor(intent, prompt, compareZones, conversationZone);

  await wait(250);
  applyEvent(convId, msgId, { name: "intent", data: { intent } });

  if (mockData.sql) {
    await wait(200);
    applyEvent(convId, msgId, { name: "sql", data: { sql: mockData.sql } });
  }
  if (mockData.rows && mockData.rows.length > 0) {
    await wait(220);
    applyEvent(convId, msgId, {
      name: "rows",
      data: { count: mockData.rows.length, preview: mockData.rows },
    });
  }

  for (const chunk of mockData.answer.split(/(\s+)/)) {
    await wait(30);
    applyEvent(convId, msgId, { name: "insight_delta", data: { text: chunk } });
  }

  await wait(180);
  applyEvent(convId, msgId, { name: "followups", data: { followups: mockData.followups } });
  applyEvent(convId, msgId, { name: "done", data: { message_id: msgId } });
}

function pickMockIntent(prompt: string, compareZones: Zone[], convZone: Zone | null): string {
  const p = prompt.toLowerCase();
  if (/compare|vs\b|versus|between|side by side|side-by-side/.test(p)) return "comparison";
  if (/why|dropped|fell|rose|caused|gap|weakness|dragging/.test(p)) return "diagnostic";
  if (/trend|over time|history|last month|last year|last week|last quarter|movement/.test(p))
    return "trend";
  if (/top|best|worst|leaderboard|ranked|which zones/.test(p)) return "distribution";
  if (/pillar|breakdown|composition|make up|four pillars/.test(p)) return "composition";
  if (/how does.+score|methodology|explain the score|what does .* mean/.test(p))
    return "methodology";
  if (/tell me about|about|overview|what is going on|whats going on|status/.test(p) && convZone) {
    return "composition";
  }
  // If two or more zones are on the compare page and the prompt didn't
  // signal a specific intent, treat it as a comparison.
  if (compareZones.length >= 2) return "comparison";
  // If the conversation is scoped to a single zone (from the "Ask about X"
  // chip), a bare prompt is almost always about that zone.
  if (convZone) return "composition";
  return "summary";
}

interface MockAnswer {
  // sql/rows are optional — conversational answers (summary, diagnostic,
  // methodology) skip them so the chat doesn't render a chart for every
  // reply. Charts only ride along on genuinely data-shaped intents.
  sql?: string;
  rows?: Array<Record<string, unknown>>;
  answer: string;
  followups: string[];
}

function mockAnswerFor(
  intent: string,
  prompt: string,
  compareZones: Zone[],
  convZone: Zone | null,
): MockAnswer {
  // Zone candidates, in priority order:
  //   1. Any zone names explicitly mentioned in the prompt.
  //   2. The compare picker zones (Compare page).
  //   3. The conversation's seeded zone (Ask-about-X chip).
  //   4. Intent-appropriate fallback so the assistant never dead-ends
  //      with a "pick a zone" boilerplate — it just picks the zone the
  //      user probably meant.
  const mentioned = ZONES.filter((z) => prompt.toLowerCase().includes(z.name.toLowerCase())).slice(
    0,
    3,
  );
  const explicitZones =
    mentioned.length > 0
      ? mentioned
      : compareZones.length > 0
        ? compareZones
        : convZone
          ? [convZone]
          : [];

  const promptZones = explicitZones.length > 0 ? explicitZones : fallbackZonesForIntent(intent);

  const genericFollowups = [
    tt("chat.followup.whichDriving"),
    tt("chat.followup.qoqMoves"),
    tt("chat.followup.whichInfra"),
  ];

  if (intent === "comparison") {
    return buildComparisonAnswer(promptZones);
  }
  if (intent === "composition" && promptZones.length >= 1) {
    return buildCompositionAnswer(promptZones);
  }
  if (intent === "distribution") {
    return buildDistributionAnswer();
  }
  if (intent === "trend") {
    return buildTrendAnswer(promptZones[0]);
  }
  if (intent === "diagnostic") {
    return {
      answer: buildDiagnosticText(promptZones),
      followups: genericFollowups,
    };
  }
  if (intent === "methodology") {
    return {
      answer: tt("chat.methodology"),
      followups: [
        tt("chat.followup.pillarMostContrib"),
        tt("chat.followup.pillarsDisagree"),
        tt("chat.followup.dataOrigin"),
      ],
    };
  }
  return {
    answer: buildSummaryText(promptZones),
    followups: genericFollowups,
  };
}

/**
 * Pick a reasonable zone (or two) when the user hasn't named one and
 * there's no compare/conversation context. Intent-aware:
 *   - diagnostic → the zone with the biggest recent drop (interesting)
 *   - trend → the highest-scoring zone (something readable to trend)
 *   - composition → the median-scoring zone
 *   - comparison → the top-mover paired with the biggest laggard
 *   - anything else → the highest-scoring zone
 * This is why the assistant now answers questions like "why did safety
 * drop somewhere?" without demanding the user pick a zone first.
 */
function fallbackZonesForIntent(intent: string): Zone[] {
  const sortedByScore = [...ZONES].sort((a, b) => b.score - a.score);
  if (intent === "comparison") {
    return [sortedByScore[0], sortedByScore[sortedByScore.length - 1]];
  }
  if (intent === "diagnostic") {
    const worstMover = [...ZONES].sort((a, b) => {
      const totalA = a.deltas.social + a.deltas.safety + a.deltas.density + a.deltas.infra;
      const totalB = b.deltas.social + b.deltas.safety + b.deltas.density + b.deltas.infra;
      return totalA - totalB;
    })[0];
    return [worstMover];
  }
  if (intent === "trend") {
    return [sortedByScore[0]];
  }
  if (intent === "composition") {
    return [sortedByScore[Math.floor(sortedByScore.length / 2)]];
  }
  return [sortedByScore[0]];
}

function buildComparisonAnswer(zones: Zone[]): MockAnswer {
  if (zones.length < 2) {
    return {
      answer: tt("chat.compare.needSecond"),
      followups: [
        tt("chat.followup.whichLeads"),
        tt("chat.followup.explainPillars"),
        tt("chat.followup.safetyWeakest"),
      ],
    };
  }

  const idList = zones.map((z) => `'${z.id}'`).join(", ");
  const rows = zones.map((z) => ({
    name: z.name,
    score: z.score,
    social: z.pillars.social,
    safety: z.pillars.safety,
    density: z.pillars.density,
    infra: z.pillars.infra,
  }));

  const sorted = [...zones].sort((a, b) => b.score - a.score);
  const [top, ...rest] = sorted;
  const overallGaps = rest.map((z) => {
    const gap = top.score - z.score;
    return tt("chat.compare.gap", { gap, plural: gap === 1 ? "" : "s", name: z.name });
  });

  const labels = pillarLabels();
  const pillarKeys = ["social", "safety", "density", "infra"] as const;
  const pillarLines = pillarKeys.map((k) => {
    const ranked = [...zones].sort((a, b) => b.pillars[k] - a.pillars[k]);
    const values = ranked.map((z) => `${z.name} ${z.pillars[k]}`).join(", ");
    const spread = ranked[0].pillars[k] - ranked[ranked.length - 1].pillars[k];
    return tt("chat.compare.pillarLine", {
      pillar: labels[k],
      values,
      spread,
      plural: spread === 1 ? "" : "s",
    });
  });

  const widestSpread = pillarKeys
    .map((k) => {
      const ranked = [...zones].sort((a, b) => b.pillars[k] - a.pillars[k]);
      return { key: k, spread: ranked[0].pillars[k] - ranked[ranked.length - 1].pillars[k] };
    })
    .sort((a, b) => b.spread - a.spread)[0];

  const opener = tt("chat.compare.opener", {
    top: top.name,
    topScore: top.score,
    gaps: overallGaps.join(" & "),
  });
  const closing = tt("chat.compare.closing", {
    pillar: labels[widestSpread.key],
    spread: widestSpread.spread,
  });
  const answer = `${opener}\n\n${pillarLines.join("\n")}\n\n${closing}`;

  return {
    sql: `SELECT name, score, pillar_social, pillar_safety, pillar_density, pillar_infra FROM zones WHERE id IN (${idList}) ORDER BY score DESC`,
    rows,
    answer,
    followups: [
      tt("chat.followup.whyPillarStronger", { zone: top.name, pillar: labels[widestSpread.key] }),
      tt("chat.followup.activeProjectsIn", { zone: sorted[sorted.length - 1].name }),
      tt("chat.followup.gapMovedThisQuarter", {
        top: top.name,
        bottom: sorted[sorted.length - 1].name,
      }),
    ],
  };
}

function buildCompositionAnswer(zones: Zone[]): MockAnswer {
  const [z] = zones;
  if (!z) {
    return {
      answer: tt("chat.composition.needZone"),
      followups: [
        tt("chat.followup.tellMeAbout", { zone: "Westlands" }),
        tt("chat.followup.whichLeads"),
        tt("chat.followup.explainPillars"),
      ],
    };
  }
  const labels = pillarLabels();
  const entries = (["social", "safety", "density", "infra"] as const).map((k) => ({
    key: k,
    label: labels[k],
    value: z.pillars[k],
    delta: z.deltas[k],
  }));
  const sorted = [...entries].sort((a, b) => b.value - a.value);
  const strong = sorted[0];
  const weak = sorted[sorted.length - 1];

  // County-wide average for context — makes the answer feel grounded
  // instead of "here are four numbers in a vacuum".
  const countyAvg = Math.round(ZONES.reduce((a, zn) => a + zn.score, 0) / ZONES.length);
  const vsCounty = z.score - countyAvg;
  const rankAbove = ZONES.filter((zn) => zn.score > z.score).length + 1;

  const bandName =
    z.score >= 70 ? tt("band.strong") : z.score >= 55 ? tt("band.moderate") : tt("band.atRisk");
  const deltaFmt = vsCounty >= 0 ? `+${vsCounty}` : String(vsCounty);

  const opener = tt("chat.composition.opener", {
    zone: z.name,
    score: z.score,
    delta: deltaFmt,
    avg: countyAvg,
    rank: rankAbove,
    band: bandName,
  });

  const pillarLine = (e: (typeof sorted)[number]) => {
    const arrow = e.delta > 0 ? "▲" : e.delta < 0 ? "▼" : "◆";
    const deltaTxt =
      e.delta === 0
        ? tt("chat.composition.deltaFlat")
        : tt("chat.composition.deltaThisQuarter", { sign: e.delta > 0 ? "+" : "", value: e.delta });
    return tt("chat.composition.pillarLine", {
      pillar: e.label,
      value: e.value,
      arrow,
      delta: deltaTxt,
    });
  };

  const pillarBreakdown = sorted.map(pillarLine).join("\n");

  // Interpretation — name the strongest and weakest, and what that
  // usually means for planning / investment. This is what makes the
  // answer land instead of just repeating the numbers.
  const strongExplain = strongInterpretation(strong.key, z);
  const weakExplain = weakInterpretation(weak.key, z);

  const closing =
    `${tt("chat.composition.strongLabel", { pillar: strong.label })} ${strongExplain}\n\n` +
    `${tt("chat.composition.weakLabel", { pillar: weak.label })} ${weakExplain}`;

  const answer = `${opener}\n\n${pillarBreakdown}\n\n${closing}`;

  return {
    answer,
    followups: [
      tt("chat.followup.whyWeakPoint", { pillar: weak.label, zone: z.name }),
      tt("chat.followup.compareCountyAvg", { zone: z.name }),
      tt("chat.followup.projectsBehindScore", { zone: z.name }),
      tt("chat.followup.trend30d", { zone: z.name }),
    ],
  };
}

function strongInterpretation(key: "social" | "safety" | "density" | "infra", z: Zone): string {
  return tt(`chat.strong.${key}` as MessageKey, { zone: z.name });
}

function weakInterpretation(key: "social" | "safety" | "density" | "infra", z: Zone): string {
  return tt(`chat.weak.${key}` as MessageKey, { zone: z.name });
}

function buildDistributionAnswer(): MockAnswer {
  const top = [...ZONES].sort((a, b) => b.score - a.score).slice(0, 5);
  return {
    sql: "SELECT name, score FROM zones ORDER BY score DESC LIMIT 5",
    rows: top.map((z) => ({ name: z.name, score: z.score })),
    answer: tt("chat.distribution", {
      top1: top[0].name,
      top2: top[1].name,
      top3: top[2].name,
      top4: top[3].name,
      top5: top[4].name,
      score1: top[0].score,
      score2: top[1].score,
      score3: top[2].score,
      score4: top[3].score,
      score5: top[4].score,
      spread: top[0].score - top[4].score,
    }),
    followups: [
      tt("chat.followup.bottomFive"),
      tt("chat.followup.pillarDriving", { zone: top[0].name }),
      tt("chat.followup.top5Change"),
    ],
  };
}

function buildTrendAnswer(zone?: Zone): MockAnswer {
  const target = zone ?? ZONES[0];
  return {
    sql: `SELECT date_trunc('day', captured_at) AS bucket, avg(score) AS score FROM zone_score_snapshots WHERE zone_id = '${target.id}' AND captured_at >= now() - interval '30 days' GROUP BY 1 ORDER BY 1`,
    rows: buildFakeTrend(target.score),
    answer: tt("chat.trend", { zone: target.name, low: target.score - 2, high: target.score + 1 }),
    followups: [
      tt("chat.followup.pillarMoving", { zone: target.name }),
      tt("chat.followup.compareToAnother", { zone: target.name }),
      tt("chat.followup.activeAlerts", { zone: target.name }),
    ],
  };
}

function buildFakeTrend(anchor: number): Array<Record<string, unknown>> {
  const out: Array<Record<string, unknown>> = [];
  const start = new Date();
  start.setDate(start.getDate() - 29);
  for (let i = 0; i < 30; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const wobble = Math.sin(i / 3) * 1.2 + (Math.random() - 0.5) * 0.6;
    out.push({
      bucket: d.toISOString().slice(0, 10),
      score: Math.round((anchor + wobble) * 10) / 10,
    });
  }
  return out;
}

function buildDiagnosticText(zones: Zone[]): string {
  // Fallback resolver always returns at least one zone, so this length
  // check is defensive only — kept for typescript's benefit.
  if (zones.length === 0) {
    return tt("chat.diagnostic.stable");
  }
  const [z] = zones;
  const labels = pillarLabels();
  const entries = (["social", "safety", "density", "infra"] as const).map((k) => ({
    label: labels[k],
    key: k,
    value: z.pillars[k],
    d: z.deltas[k],
  }));
  const worstMove = [...entries].sort((a, b) => a.d - b.d)[0];
  const bestMove = [...entries].sort((a, b) => b.d - a.d)[0];
  const weakest = [...entries].sort((a, b) => a.value - b.value)[0];

  if (worstMove.d < 0) {
    return tt("chat.diagnostic.drop", {
      zone: z.name,
      worstPillar: worstMove.label,
      worstDelta: worstMove.d,
      bestPillar: bestMove.label,
      bestDelta: `${bestMove.d >= 0 ? "+" : ""}${bestMove.d}`,
      score: z.score,
      cause: diagnosticCause(worstMove.key, z.name),
      weakestPillar: weakest.label,
      weakestValue: weakest.value,
    });
  }
  return tt("chat.diagnostic.growth", {
    zone: z.name,
    worstPillar: worstMove.label,
    worstDelta: `${worstMove.d >= 0 ? "+" : ""}${worstMove.d}`,
    bestPillar: bestMove.label,
    bestDelta: `${bestMove.d >= 0 ? "+" : ""}${bestMove.d}`,
    weakestPillar: weakest.label,
    weakestValue: weakest.value,
    weakExplain: weakInterpretation(weakest.key, z),
  });
}

function diagnosticCause(
  pillar: "social" | "safety" | "density" | "infra",
  zoneName: string,
): string {
  return tt(`chat.cause.${pillar}` as MessageKey, { zone: zoneName });
}

function buildSummaryText(zones: Zone[]): string {
  if (zones.length === 0) {
    return tt("chat.summary.needZone");
  }
  if (zones.length === 1) {
    const [z] = zones;
    return tt("chat.summary.single", {
      zone: z.name,
      score: z.score,
      social: z.pillars.social,
      safety: z.pillars.safety,
      density: z.pillars.density,
      infra: z.pillars.infra,
    });
  }
  const avg = Math.round(zones.reduce((a, z) => a + z.score, 0) / zones.length);
  const names = zones.map((z) => z.name);
  const tail =
    names.length > 1 ? `${names.slice(0, -1).join(", ")} & ${names[names.length - 1]}` : names[0];
  return tt("chat.summary.multi", { names: tail, avg });
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
