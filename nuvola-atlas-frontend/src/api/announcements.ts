/**
 * Announcements — mock parity with the future announcements table.
 * Admins compose messages that appear as a dismissible banner across
 * the app; investors + viewers see them until dismissed.
 *
 * Structure mirrors what the backend will hold (severity, scope,
 * schedule, dismissible flag) so switching to a live endpoint is a
 * one-line swap in AnnouncementsBanner.tsx.
 */

const STORAGE_ANNOUNCEMENTS = "nuvola_announcements_v1";
const STORAGE_DISMISSED = "nuvola_announcements_dismissed_v1";

export type AnnouncementSeverity = "info" | "warning" | "critical";
export type AnnouncementScope =
  | { kind: "global" }
  | { kind: "role"; role: "viewer" | "partner" | "investor" | "editor" | "admin" }
  | { kind: "firm"; firmId: string };

export interface Announcement {
  id: string;
  title: string;
  body: string;
  severity: AnnouncementSeverity;
  scope: AnnouncementScope;
  startsAt: string;
  endsAt: string | null;
  dismissible: boolean;
  createdBy: string;
  createdAt: string;
}

const SEED: Announcement[] = [
  {
    id: "ann-pilot-live",
    title: "Nairobi Pilot: Live",
    body: "The pilot deployment covers all 17 sub-counties. Vitality Scores are live; Daystar delivery is inbound and the '9 of 13 indicators active' chip tracks per-zone rollout.",
    severity: "info",
    scope: { kind: "global" },
    startsAt: "2026-07-01T00:00:00Z",
    endsAt: null,
    dismissible: true,
    createdBy: "austine@nuvola.dev",
    createdAt: "2026-07-01T09:00:00Z",
  },
  {
    id: "ann-daystar-slip",
    title: "Daystar delivery ETA: Aug 15",
    body: "Devyan confirmed the ingestion cutover window with Daystar this morning. Investor watchlists will start seeing real indicator freshness at the mid-August window.",
    severity: "warning",
    scope: { kind: "role", role: "investor" },
    startsAt: "2026-07-12T00:00:00Z",
    endsAt: "2026-08-20T00:00:00Z",
    dismissible: true,
    createdBy: "devyan@nuvola.dev",
    createdAt: "2026-07-12T08:30:00Z",
  },
  {
    id: "ann-methodology-v11",
    title: "Methodology v1.1 preview open",
    body: "Preview the diff for the proposed weights change under Admin → Methodology. Publish is gated on typed 'publish' confirmation and triggers RecalculateAllZones.",
    severity: "info",
    scope: { kind: "role", role: "admin" },
    startsAt: "2026-07-10T00:00:00Z",
    endsAt: null,
    dismissible: true,
    createdBy: "khillon@nuvola.dev",
    createdAt: "2026-07-10T14:00:00Z",
  },
];

function loadStored<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveStored<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export const announcementsApi = {
  list(): Announcement[] {
    return loadStored<Announcement[]>(STORAGE_ANNOUNCEMENTS, SEED);
  },
  save(announcement: Announcement): void {
    const list = announcementsApi.list();
    const existingIdx = list.findIndex((a) => a.id === announcement.id);
    const next = [...list];
    if (existingIdx >= 0) next[existingIdx] = announcement;
    else next.unshift(announcement);
    saveStored(STORAGE_ANNOUNCEMENTS, next);
  },
  delete(id: string): void {
    const list = announcementsApi.list().filter((a) => a.id !== id);
    saveStored(STORAGE_ANNOUNCEMENTS, list);
  },
  reset(): void {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(STORAGE_ANNOUNCEMENTS);
    window.localStorage.removeItem(STORAGE_DISMISSED);
  },
  dismissed(): string[] {
    return loadStored<string[]>(STORAGE_DISMISSED, []);
  },
  dismiss(id: string): void {
    const set = new Set(announcementsApi.dismissed());
    set.add(id);
    saveStored(STORAGE_DISMISSED, [...set]);
  },
};

export function visibleAnnouncements(
  user: { role?: string; firm?: { id: string } } | null,
): Announcement[] {
  if (!user) return [];
  const now = new Date();
  const dismissed = new Set(announcementsApi.dismissed());
  return announcementsApi.list().filter((a) => {
    if (dismissed.has(a.id)) return false;
    const startsAt = new Date(a.startsAt);
    if (startsAt > now) return false;
    if (a.endsAt) {
      const endsAt = new Date(a.endsAt);
      if (endsAt < now) return false;
    }
    if (a.scope.kind === "global") return true;
    if (a.scope.kind === "role") return a.scope.role === user.role;
    if (a.scope.kind === "firm") return a.scope.firmId === user.firm?.id;
    return false;
  });
}
