import { create } from "zustand";
import type { AuthUser } from "./auth";

/**
 * Local impersonation state. Admin can "View as" any user — the target's
 * profile is remembered here so a banner appears across the app while the
 * session is active, and one-tap "End impersonation" restores the admin.
 *
 * When Phase E backend lands this becomes a thin wrapper over
 * POST /admin/impersonate/{userId} + POST /admin/impersonate/end.
 */

const STORAGE_KEY = "nuvola_impersonation_v1";

interface ImpersonationRecord {
  target: AuthUser;
  reason: string;
  startedAt: string;
  adminEmail: string;
}

interface State {
  active: ImpersonationRecord | null;
  start: (record: ImpersonationRecord) => void;
  end: () => void;
}

function loadStored(): ImpersonationRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ImpersonationRecord) : null;
  } catch {
    return null;
  }
}

function persist(record: ImpersonationRecord | null): void {
  if (typeof window === "undefined") return;
  if (record) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  else window.localStorage.removeItem(STORAGE_KEY);
}

export const useImpersonationStore = create<State>((set) => ({
  active: loadStored(),
  start: (record) => {
    persist(record);
    set({ active: record });
  },
  end: () => {
    persist(null);
    set({ active: null });
  },
}));
