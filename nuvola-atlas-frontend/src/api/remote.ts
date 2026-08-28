import { BASE, authHeaders, handleResponse } from "./client";
import { ZONES as MOCK_ZONES } from "./fixtures";
import { PILLARS } from "@/domain/pillars.generated";
import type {
  Zone,
  PillarKey,
  PillarDeltas,
  PillarScores,
  Project,
  AlertItem,
  Report,
  HistoryPoint,
  ActivityEntry,
  Methodology,
  ZoneHistory,
  HistoryRange,
  ZoneForecast,
  ChatConversation,
  ChatMessage,
  CountyContextReading,
} from "@/domain/types";

type Paged = { data: unknown[]; meta?: { current_page?: number; last_page?: number } };

function isPaged(json: unknown): json is Paged {
  return (
    !!json &&
    typeof json === "object" &&
    "data" in json &&
    "meta" in json &&
    Array.isArray((json as Paged).data)
  );
}

async function fetchJson(path: string): Promise<unknown> {
  const res = await fetch(`${BASE}${path}`, { headers: authHeaders() });
  return handleResponse<unknown>(res);
}

/**
 * Collections come back length-aware (`paginate(15)`), and the zone index is a
 * closed set of 17 sub-counties — so taking page 1 alone dropped two of them
 * off the map with nothing on screen to say so. Walk the pages instead: for a
 * bounded set this is one extra request, and it keeps a collection that later
 * outgrows its page size from truncating in silence.
 */
async function get<T>(path: string): Promise<T> {
  const json = await fetchJson(path);
  if (!isPaged(json)) return json as T;

  const lastPage = json.meta?.last_page ?? 1;
  if (lastPage <= 1) return json.data as T;

  const rest = await Promise.all(
    Array.from({ length: lastPage - 1 }, (_, i) => {
      const sep = path.includes("?") ? "&" : "?";
      return fetchJson(`${path}${sep}page=${i + 2}`);
    }),
  );

  return rest.reduce<unknown[]>(
    (all, page) => (isPaged(page) ? all.concat(page.data) : all),
    [...json.data],
  ) as T;
}

const PILLAR_KEYS = PILLARS.map((p) => p.key as PillarKey);

const NO_PILLARS = (): PillarScores =>
  Object.fromEntries(PILLAR_KEYS.map((k) => [k, null])) as PillarScores;

/**
 * Substitute a value for one the API returned as null, recording the field
 * so the UI can mark it. Returns the API value untouched when it has one.
 */
function fill<T>(hydrated: string[], path: string, actual: T | null | undefined, fallback: T): T {
  if (actual !== null && actual !== undefined) return actual;
  hydrated.push(path);
  return fallback;
}

/**
 * Fill the gaps a thin backend leaves, so the UI does not crash: a zone with
 * no readings seeded returns every pillar as null, and a zone with no
 * geometry returns a null centroid that breaks the coordinate math.
 *
 * Every substituted field is recorded in `_hydrated`. That list is what makes
 * this honest rather than a lie: the number on screen is a fixture, and the
 * scorecard renders it struck through with an "estimated" tooltip instead of
 * as a measurement. The previous version spread the whole mock zone in as the
 * base object, so a fixture could surface in any field the API omitted, with
 * nothing anywhere to say it had.
 */
function hydrateZone(z: Partial<Zone> & { id: string; name: string }): Zone {
  const mock = MOCK_ZONES.find((m) => m.id === z.id);
  const _hydrated: string[] = [];

  // A pillar the API listed as missing was measured to be absent. That is a
  // result, and substituting a fixture for it would publish an invented number
  // for the very zones — Kibra, Mathare — whose gaps are the finding.
  const declaredGaps = new Set<string>(z.missingPillars ?? []);

  const pillars = NO_PILLARS();
  for (const k of PILLAR_KEYS) {
    // A zone the API could not score has nothing to stand in for its pillars
    // either. Passing the null through unmarked is right: there is no fixture
    // behind it, so calling it an estimate would overstate what we have.
    const fallback = declaredGaps.has(k) ? null : (mock?.pillars[k] ?? z.score ?? null);
    pillars[k] =
      fallback === null
        ? (z.pillars?.[k] ?? null)
        : fill(_hydrated, `pillars.${k}`, z.pillars?.[k], fallback);
  }

  // Deltas are deliberately NOT hydrated. A pillar score can be estimated and
  // labelled as such; a direction of travel cannot — substituting a fixture
  // would put an arrow on screen for a movement that was never measured.
  // Null flows straight through and renders as no delta at all.
  const deltas = Object.fromEntries(
    PILLAR_KEYS.map((k) => [k, z.deltas?.[k] ?? null]),
  ) as PillarDeltas;

  const centroid =
    Array.isArray(z.centroid) && z.centroid.length === 2
      ? (z.centroid as [number, number])
      : fill<[number, number]>(_hydrated, "centroid", null, mock?.centroid ?? [36.82, -1.283]);

  return {
    ...z,
    score: z.score ?? null,
    pillars,
    deltas,
    deltaWindowDays: z.deltaWindowDays ?? null,
    centroid,
    lastSyncMin: fill(_hydrated, "lastSyncMin", z.lastSyncMin, mock?.lastSyncMin ?? 0),
    ...(_hydrated.length > 0 ? { _hydrated } : {}),
  } as Zone;
}

/**
 * One line per response, not one per zone — a 17-zone list with no indicators
 * seeded would otherwise bury the console.
 */
function warnHydrated(zones: Zone[]): void {
  const affected = zones.filter((z) => z._hydrated?.length);
  if (affected.length === 0) return;
  console.warn(
    `[navuuna] ${affected.length} zone(s) returned null fields; the values shown for these are ` +
      `client-side estimates, not measurements: ` +
      affected.map((z) => `${z.id} (${z._hydrated!.join(", ")})`).join("; "),
  );
}

export const remoteApi = {
  getZones: async () => {
    const zones = (await get<Zone[]>("/zones")).map(hydrateZone);
    warnHydrated(zones);
    return zones;
  },

  getZone: async (id: string) => {
    const zone = hydrateZone(await get<Zone>(`/zones/${id}`));
    warnHydrated([zone]);
    return zone;
  },

  getZoneActivity: (id: string) => get<ActivityEntry[]>(`/zones/${id}/activity`),

  getProjects: () => get<Project[]>("/projects"),

  getProject: (id: string) => get<Project>(`/projects/${id}`),

  getAlerts: () => get<AlertItem[]>("/alerts"),

  markAllRead: async (): Promise<{ ok: true }> => {
    const res = await fetch(`${BASE}/alerts/mark-all-read`, {
      method: "POST",
      headers: authHeaders(),
    });
    return handleResponse<{ ok: true }>(res);
  },

  getReports: () => get<Report[]>("/reports"),

  createReport: async (data: { title: string; zoneId: string | null }): Promise<Report> => {
    const res = await fetch(`${BASE}/reports`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(data),
    });
    return handleResponse<Report>(res);
  },

  getHistory: () => get<HistoryPoint[]>("/history"),

  getZoneHistory: (id: string, range: HistoryRange = "week") =>
    get<ZoneHistory>(`/zones/${id}/history?range=${range}`),

  getZoneForecast: (id: string, horizon = 14) =>
    get<ZoneForecast>(`/zones/${id}/forecast?horizon=${horizon}`),

  listConversations: () => get<ChatConversation[]>(`/chat/conversations`),
  createConversation: async (data: {
    title?: string;
    zoneId?: string | null;
  }): Promise<ChatConversation> => {
    const res = await fetch(`${BASE}/chat/conversations`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(data),
    });
    return handleResponse<ChatConversation>(res);
  },
  deleteConversation: async (id: string): Promise<{ ok: true }> => {
    const res = await fetch(`${BASE}/chat/conversations/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error(`Delete failed (${res.status}).`);
    return { ok: true as const };
  },
  getConversationMessages: (id: string) => get<ChatMessage[]>(`/chat/conversations/${id}/messages`),

  // Only the live weights and the registry version come off the wire. The
  // pillar definitions are compiled into the bundle from the same pillars.json
  // the server generates its config from, so asking for them again would only
  // create a second shape that could drift.
  getMethodology: () => get<Methodology>("/vitality/methodology"),

  // County-level indicator readings for the banner above the map. Distinct
  // from /vitality/county — that endpoint averages sub-county pillars up;
  // this one serves raw utility/county figures (WASREB IMPACT, etc.) that
  // never had a sub-county home in the first place.
  getCountyContext: (county: string = "Nairobi") =>
    get<CountyContextReading[]>(`/county-context?county=${encodeURIComponent(county)}`),

  changePassword: async (currentPassword: string, newPassword: string): Promise<{ ok: true }> => {
    const res = await fetch(`${BASE}/auth/change-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: newPassword,
      }),
    });
    return handleResponse<{ ok: true }>(res);
  },

  register: async (
    name: string,
    email: string,
    password: string,
    password_confirmation: string,
  ) => {
    const res = await fetch(`${BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, password_confirmation }),
    });
    return handleResponse<{
      token: string;
      expires_at: string;
      user: { id: number; name: string; email: string; role: string };
    }>(res);
  },

  signIn: async (email: string, password: string) => {
    const res = await fetch(`${BASE}/auth/sign-in`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    // Backend may return either a real token, or a 2FA challenge — the
    // discriminator is `requires_two_factor`. SignInPage branches on it.
    return handleResponse<
      | {
          token: string;
          user: { name: string; email: string; role?: string; email_verified?: boolean };
        }
      | { requires_two_factor: true; channel: "email"; challenge_token: string; email_hint: string }
    >(res);
  },
};
