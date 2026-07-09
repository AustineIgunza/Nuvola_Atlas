import { BASE, authHeaders, handleResponse } from "./client";
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

export const remoteApi = {
  getZones: () => get<Zone[]>("/zones"),

  getZone: (id: string) => get<Zone>(`/zones/${id}`),

  getZoneActivity: (id: string) => get<ActivityEntry[]>(`/zones/${id}/activity`),

  getProjects: () => get<Project[]>("/projects"),

  getProject: (id: string) => get<Project>(`/projects/${id}`),

  getAlerts: () => get<AlertItem[]>("/alerts"),

  markAllRead: async (): Promise<{ ok: true }> => {
    const res = await fetch(`${BASE}/alerts/mark-all-read`, { method: "POST", headers: authHeaders() });
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
  createConversation: async (data: { title?: string; zoneId?: string | null }): Promise<ChatConversation> => {
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

  register: async (name: string, email: string, password: string, password_confirmation: string) => {
    const res = await fetch(`${BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, password_confirmation }),
    });
    return handleResponse<{ token: string; expires_at: string; user: { id: number; name: string; email: string; role: string } }>(res);
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
      | { token: string; user: { name: string; email: string; role?: string; email_verified?: boolean } }
      | { requires_two_factor: true; channel: "email"; challenge_token: string; email_hint: string }
    >(res);
  },
};
