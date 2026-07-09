import { delay } from "./client";
import {
  ZONES,
  PROJECTS,
  ALERTS,
  REPORTS,
  HISTORY,
  ACTIVITIES,
  METHODOLOGY,
  generateZoneHistory,
} from "./fixtures";
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
  ZoneForecastPoint,
  ChatConversation,
  ChatMessage,
} from "@/types";

// Mock state persists to localStorage so a page reload doesn't wipe a
// freshly-created report or a freshly-read alert — which is confusing for
// anyone demoing the UI before the real backend is wired.
const ALERTS_KEY = "nuvola_mock_alerts_v1";
const REPORTS_KEY = "nuvola_mock_reports_v1";

function load<T>(key: string, fallback: T[]): T[] {
  if (typeof window === "undefined") return structuredClone(fallback);
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : structuredClone(fallback);
  } catch {
    return structuredClone(fallback);
  }
}

function save<T>(key: string, value: T[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota — best-effort persistence */
  }
}

let alerts = load<typeof ALERTS[number]>(ALERTS_KEY, ALERTS);
let reports = load<typeof REPORTS[number]>(REPORTS_KEY, REPORTS);

const CHAT_CONVS_KEY = "nuvola_mock_chat_convs_v1";
let chatConversations = load<ChatConversation>(CHAT_CONVS_KEY, []);
const chatMessages: Record<string, ChatMessage[]> = {};

export const mockApi = {
  getZones: async (): Promise<Zone[]> => {
    await delay();
    return structuredClone(ZONES);
  },

  getZone: async (id: string): Promise<Zone> => {
    await delay();
    const z = ZONES.find((z) => z.id === id);
    if (!z) throw new Error("Zone not found");
    return structuredClone(z);
  },

  getZoneActivity: async (id: string): Promise<ActivityEntry[]> => {
    await delay();
    return structuredClone(ACTIVITIES[id] ?? []);
  },

  getProjects: async (): Promise<Project[]> => {
    await delay();
    return structuredClone(PROJECTS);
  },

  getProject: async (id: string): Promise<Project> => {
    await delay();
    const p = PROJECTS.find((p) => p.id === id);
    if (!p) throw new Error("Project not found");
    return structuredClone(p);
  },

  getAlerts: async (): Promise<AlertItem[]> => {
    await delay();
    return structuredClone(alerts);
  },

  markAllRead: async (): Promise<{ ok: true }> => {
    await delay();
    alerts = alerts.map((a) => ({ ...a, read: true }));
    save(ALERTS_KEY, alerts);
    return { ok: true as const };
  },

  getReports: async (): Promise<Report[]> => {
    await delay();
    return structuredClone(reports);
  },

  createReport: async (data: { title: string; zoneId: string | null }): Promise<Report> => {
    await delay(1200, 1800);
    const r: Report = {
      id: `r${Date.now()}`,
      title: data.title,
      zoneId: data.zoneId,
      date: new Date().toISOString().slice(0, 10),
      status: "draft",
      author: "Austine Igunza",
      sizeBytes: 0,
      format: "PDF",
      type: "vitality",
      priority: "medium",
      tags: [],
      sections: [],
      executiveSummary: "",
    };
    reports = [r, ...reports];
    save(REPORTS_KEY, reports);
    return r;
  },

  getHistory: async (): Promise<HistoryPoint[]> => {
    await delay();
    return structuredClone(HISTORY);
  },

  getZoneHistory: async (id: string, range: HistoryRange = "week"): Promise<ZoneHistory> => {
    await delay();
    return generateZoneHistory(id, range);
  },

  getZoneForecast: async (id: string, horizon = 14): Promise<ZoneForecast> => {
    await delay();
    const zone = ZONES.find((z) => z.id === id);
    const base = zone?.score ?? 65;
    const now = new Date();
    const points: ZoneForecastPoint[] = [];
    for (let k = 1; k <= horizon; k++) {
      // Small deterministic trend + widening band with horizon.
      const trend = base + Math.sin(k / 3) * 1.5 + k * 0.15;
      const band = 1.5 * Math.sqrt(k);
      const clamp = (n: number) => Math.max(0, Math.min(100, n));
      const d = new Date(now);
      d.setDate(d.getDate() + k);
      points.push({
        t: d.toISOString().slice(0, 10),
        score: Math.round(clamp(trend)),
        lower: Math.round(clamp(trend - band)),
        upper: Math.round(clamp(trend + band)),
      });
    }
    return { horizon, points };
  },

  // Chat CRUD (send/stream is handled directly by useChatStream in mock mode
  // — no over-the-wire simulation needed here.)
  listConversations: async (): Promise<ChatConversation[]> => {
    await delay();
    return structuredClone(chatConversations);
  },
  createConversation: async (data: { title?: string; zoneId?: string | null }): Promise<ChatConversation> => {
    await delay();
    const c: ChatConversation = {
      id: crypto.randomUUID(),
      title: data.title ?? null,
      zoneId: data.zoneId ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    chatConversations = [c, ...chatConversations];
    save(CHAT_CONVS_KEY, chatConversations);
    chatMessages[c.id] = [];
    return c;
  },
  deleteConversation: async (id: string): Promise<{ ok: true }> => {
    await delay();
    chatConversations = chatConversations.filter((c) => c.id !== id);
    save(CHAT_CONVS_KEY, chatConversations);
    delete chatMessages[id];
    return { ok: true as const };
  },
  getConversationMessages: async (id: string): Promise<ChatMessage[]> => {
    await delay();
    return structuredClone(chatMessages[id] ?? []);
  },

  getMethodology: async (): Promise<{ pillars: PillarDef[] }> => {
    await delay();
    return { pillars: structuredClone(METHODOLOGY) };
  },

  register: async (name: string, email: string, _password: string, _passwordConfirmation: string) => {
    await delay();
    return {
      token: "mock-token",
      expires_at: new Date(Date.now() + 480 * 60000).toISOString(),
      user: { id: 1, name, email, role: "viewer" as const },
    };
  },

  // Mock-mode promotion by email so the admin dashboard is reachable
  // without a real backend. Mirrors the seed in UserSeeder.php (which
  // creates austine@nuvola.dev as admin) and adds convenience prefixes:
  //   admin@*       → admin (returns the email-2FA challenge so the
  //                  challenge UI can be tested without a backend)
  //   admin-no2fa@* → admin but bypasses 2FA (skip-the-challenge path
  //                  for testing the dashboard quickly)
  //   austine@nuvola.dev → admin without 2FA (matches the seed)
  //   editor@*  → editor
  //   partner@* → partner
  //   anything else → viewer
  // Password is not checked in mock — sign-in succeeds for any value.
  signIn: async (email: string, _password: string) => {
    await delay();
    const lc = email.toLowerCase();
    const isAdmin = lc === "austine@nuvola.dev" || lc.startsWith("admin@") || lc.startsWith("admin-no2fa@");
    const challengeOn2fa = lc.startsWith("admin@") && !lc.startsWith("admin-no2fa@");

    if (challengeOn2fa) {
      // Mock the email-2FA challenge so the SignInPage code-entry UI can
      // be exercised without a backend. The challenge_token is also a
      // sentinel — the mock verify call accepts any 6-digit code while
      // this token is in flight.
      return {
        requires_two_factor: true as const,
        channel: "email" as const,
        challenge_token: "mock-challenge-" + Math.random().toString(36).slice(2, 10),
        email_hint: maskEmail(email),
      };
    }

    const role: "admin" | "editor" | "partner" | "viewer" =
      isAdmin
        ? "admin"
        : lc.startsWith("editor@")
        ? "editor"
        : lc.startsWith("partner@")
        ? "partner"
        : "viewer";
    const inferredName =
      role === "admin" ? "Mock Admin" : role === "editor" ? "Mock Editor" : role === "partner" ? "Mock Partner" : "Mock Viewer";
    return {
      token: "mock-token",
      user: { name: inferredName, email, role, email_verified: true },
    };
  },

  // Mock verify accepts any 6-digit code for any mock challenge token.
  verifyTwoFactor: async (challenge_token: string, code: string) => {
    await delay();
    if (!/^\d{6}$/.test(code)) throw new Error("Enter a 6-digit code.");
    if (!challenge_token.startsWith("mock-challenge-")) throw new Error("Invalid challenge.");
    return {
      token: "mock-token",
      expires_at: new Date(Date.now() + 480 * 60_000).toISOString(),
      user: { id: 1, name: "Mock Admin", email: "admin@nuvola.dev", role: "admin" as const, email_verified: true },
    };
  },
};

function maskEmail(email: string): string {
  const at = email.indexOf("@");
  if (at < 0) return email;
  const local = email.slice(0, at);
  const domain = email.slice(at);
  if (local.length <= 2) return local + "***" + domain;
  return local.slice(0, 2) + "*".repeat(Math.max(3, local.length - 2)) + domain;
}
