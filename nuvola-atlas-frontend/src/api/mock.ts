import { delay } from "./client";
import {
  ZONES,
  PROJECTS,
  ALERTS,
  REPORTS,
  HISTORY,
  ACTIVITIES,
  METHODOLOGY,
} from "./fixtures";
import type {
  Zone,
  Project,
  AlertItem,
  Report,
  HistoryPoint,
  ActivityEntry,
  PillarDef,
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
  //   admin@*   → admin   (also: austine@nuvola.dev — matches the seed)
  //   editor@*  → editor
  //   partner@* → partner
  //   anything else → viewer
  // Password is not checked in mock — sign-in succeeds for any value.
  signIn: async (email: string, _password: string) => {
    await delay();
    const lc = email.toLowerCase();
    const role: "admin" | "editor" | "partner" | "viewer" =
      lc === "austine@nuvola.dev" || lc.startsWith("admin@")
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
};
