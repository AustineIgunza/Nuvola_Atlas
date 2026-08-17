import { BASE, authHeaders, handleResponse } from "./client";
import { ZONES as MOCK_ZONES } from "./fixtures";
import type {
  Zone,
  Project,
  AlertItem,
  Report,
  HistoryPoint,
  ActivityEntry,
  PillarDef,
  ZoneHistory,
  HistoryRange,
  ZoneForecast,
  ChatConversation,
  ChatMessage,
} from "@/types";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: authHeaders() });
  const json = await handleResponse<Record<string, unknown>>(res);
  if (json && typeof json === "object" && "data" in json && "meta" in json) {
    return json.data as T;
  }
  return json as T;
}

const PILLAR_KEYS = ["social", "safety", "density", "infra"] as const;

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
 * no indicators seeded returns `pillars: {social: null, ...}`, and a zone
 * with no geometry returns a null centroid that breaks the coordinate math.
 *
 * Every substituted field is recorded in `_hydrated`. That list is what makes
 * this honest rather than a lie: the number on screen is a fixture, and the
 * scorecard renders it struck through with an "estimated" tooltip instead of
 * as a measurement. The previous version spread the whole mock zone in as the
 * base object, so a fixture could surface in any field the API omitted, with
 * nothing anywhere to say it had.
 */
function hydrateZone(z: Partial<Zone> & { id: string; name: string; score: number }): Zone {
  const mock = MOCK_ZONES.find((m) => m.id === z.id);
  const _hydrated: string[] = [];

  const pillars = { social: 0, safety: 0, density: 0, infra: 0 };
  const deltas = { social: 0, safety: 0, density: 0, infra: 0 };
  for (const k of PILLAR_KEYS) {
    pillars[k] = fill(_hydrated, `pillars.${k}`, z.pillars?.[k], mock?.pillars[k] ?? z.score);
    deltas[k] = fill(_hydrated, `deltas.${k}`, z.deltas?.[k], mock?.deltas[k] ?? 0);
  }

  const centroid =
    Array.isArray(z.centroid) && z.centroid.length === 2
      ? (z.centroid as [number, number])
      : fill<[number, number]>(_hydrated, "centroid", null, mock?.centroid ?? [36.82, -1.283]);

  return {
    ...z,
    pillars,
    deltas,
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

  getMethodology: () => get<{ pillars: PillarDef[] }>("/vitality/methodology"),

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
