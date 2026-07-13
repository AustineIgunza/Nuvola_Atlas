import type { Zone, Project, AlertItem, PillarKey } from "@/types";
import type { LocaleCode } from "@/lib/i18n/locales";

/**
 * Direct-to-Gemini streaming client for the demo assistant.
 *
 * Called from useChatStream when VITE_GEMINI_API_KEY is present and the
 * chat pipeline is in mock mode. Injects the whole Nairobi ZONES /
 * projects / alerts fixture as a system prompt so the LLM can answer
 * questions grounded in the same data the map + scorecard render.
 *
 * The key is a browser-exposed VITE_ var — fine for the pilot demo,
 * but for production the request should go through the Laravel backend
 * so the secret stays server-side.
 */

const GEMINI_API_KEY: string | undefined = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_MODEL: string = import.meta.env.VITE_GEMINI_MODEL || "gemini-2.0-flash";

export function isGeminiConfigured(): boolean {
  return typeof GEMINI_API_KEY === "string" && GEMINI_API_KEY.length > 0;
}

const PILLAR_LABELS: Record<PillarKey, string> = {
  social: "Social Wellbeing & Human Capital",
  safety: "Safety & Security",
  density: "Density & Scaling Dynamics",
  infra: "Infrastructure & Environmental Safeguards",
};

interface BuildPromptArgs {
  prompt: string;
  zones: Zone[];
  projects: Project[];
  alerts: AlertItem[];
  focusZones: Zone[];       // Zones currently on screen (Compare picker or convo seed).
  locale: LocaleCode;
}

/**
 * Compact, structured context so Gemini has enough to reason over without
 * blowing token budget. Only recent alerts + non-completed projects go in.
 */
function buildSystemPrompt({ zones, projects, alerts, focusZones, locale }: BuildPromptArgs): string {
  const zoneLines = zones.map((z) => {
    return `- ${z.name} (id=${z.id}) overall=${z.score}, ` +
      `Social=${z.pillars.social} (${signed(z.deltas.social)}), ` +
      `Safety=${z.pillars.safety} (${signed(z.deltas.safety)}), ` +
      `Density=${z.pillars.density} (${signed(z.deltas.density)}), ` +
      `Infra=${z.pillars.infra} (${signed(z.deltas.infra)})`;
  }).join("\n");

  const projectLines = projects.slice(0, 40).map((p) => {
    return `- ${p.name} · ${p.type} · ${p.status} · ${p.progress}% · zone=${p.zoneId} · agency=${p.agency} · ETA=${p.eta}`;
  }).join("\n");

  const alertLines = alerts.slice(0, 30).map((a) => {
    return `- [${a.severity}/${a.impactLevel}] ${a.title} · zone=${a.zoneId ?? "system"} · kind=${a.kind}`;
  }).join("\n");

  const focus = focusZones.length > 0
    ? `\nCurrently on screen: ${focusZones.map((z) => z.name).join(", ")}. Prioritise these zones in your answer unless the user asks about others.`
    : "";

  const languageDirective = locale === "sw"
    ? "Answer in Kiswahili (Swahili). Use natural Kenyan Kiswahili — professional, not textbook. Keep proper names (Westlands, Kibra, KURA, KPLC, KeNHA, NPS, ESIA) untranslated."
    : "Answer in English.";

  return [
    "You are Navuuna's spatial intelligence assistant for Nairobi County urban planning.",
    "You have live access to the Vitality Index for all 17 Nairobi sub-counties, plus infrastructure projects and active alerts.",
    "",
    "Rules:",
    "- Ground every claim in the data below. Never invent zones, projects, or numbers.",
    "- Keep answers tight: 3–6 sentences. Investors and planners read in 20 seconds.",
    "- The 4 Vitality pillars are: " + Object.values(PILLAR_LABELS).join(", ") + ".",
    "- Scores are 0–100. Deltas are quarter-over-quarter (in parentheses). Bands: Strong ≥70, Moderate 55–69, At Risk <55.",
    "- When comparing zones, spell out gaps in points. When diagnosing, name the pillar and its delta.",
    "- If asked something you can't answer from the data, say so briefly and suggest a refined question.",
    "- Do NOT emit code, SQL, or JSON. Plain prose only.",
    "- " + languageDirective,
    focus,
    "",
    "── Zone Vitality (all 17 Nairobi sub-counties, scores are 0–100) ──",
    zoneLines,
    "",
    "── Active infrastructure projects ──",
    projectLines || "(none tracked)",
    "",
    "── Active alerts ──",
    alertLines || "(none)",
  ].join("\n");
}

function signed(n: number): string {
  return n >= 0 ? `+${n}` : String(n);
}

interface StreamResult {
  text: string;
}

/**
 * Streams a Gemini response as text deltas. Yields strings.
 * Caller pushes each delta into the chat store's `insight_delta` pipeline.
 */
export async function* streamGeminiAnswer(args: BuildPromptArgs, signal?: AbortSignal): AsyncGenerator<string, StreamResult, void> {
  if (!isGeminiConfigured()) {
    throw new Error("Gemini API key not configured");
  }

  const system = buildSystemPrompt(args);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?alt=sse&key=${encodeURIComponent(GEMINI_API_KEY!)}`;

  const body = {
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: "user", parts: [{ text: args.prompt }] }],
    generationConfig: {
      temperature: 0.35,
      maxOutputTokens: 640,
    },
    // Turn off Gemini's default safety blocks — the domain (infrastructure /
    // safety incidents) legitimately trips them; the content itself is
    // grounded and public. Loosen instead of block outright.
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
    ],
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok || !res.body) {
    const errText = await safeReadError(res);
    throw new Error(`Gemini stream failed (${res.status}): ${errText}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // Gemini SSE frames are `data: {...}\n\n` blocks.
    let sep;
    while ((sep = buffer.indexOf("\n\n")) !== -1) {
      const frame = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);

      for (const line of frame.split("\n")) {
        if (!line.startsWith("data: ")) continue;
        const payload = line.slice(6).trim();
        if (!payload) continue;
        try {
          const json = JSON.parse(payload);
          const parts = json?.candidates?.[0]?.content?.parts;
          if (Array.isArray(parts)) {
            for (const p of parts) {
              const text: string | undefined = p?.text;
              if (typeof text === "string" && text.length > 0) {
                full += text;
                yield text;
              }
            }
          }
        } catch {
          // Ignore malformed frame — keep streaming.
        }
      }
    }
  }

  return { text: full };
}

async function safeReadError(res: Response): Promise<string> {
  try {
    const t = await res.text();
    return t.slice(0, 300);
  } catch {
    return "(no body)";
  }
}
