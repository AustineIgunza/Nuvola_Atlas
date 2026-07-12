import { create } from "zustand";

/**
 * Local watchlist state for investors. Seeded from AuthUser.firm.watchlist
 * on sign-in and persisted to localStorage so refreshes don't lose changes.
 * When Phase F backend lands, this store's setters become thin wrappers
 * over /investor/watchlist mutations — the UI never has to change.
 */

const STORAGE_KEY = "nuvola_watchlist_v1";

interface WatchlistState {
  ids: Set<string>;
  isReady: boolean;
  hydrate: (initial: string[]) => void;
  add: (zoneId: string) => void;
  remove: (zoneId: string) => void;
  toggle: (zoneId: string) => boolean; // returns the new membership state
  has: (zoneId: string) => boolean;
}

function loadStored(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function persist(ids: Set<string>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}

const initialIds = new Set(loadStored());

export const useWatchlistStore = create<WatchlistState>((set, get) => ({
  ids: initialIds,
  isReady: initialIds.size > 0,
  hydrate: (initial) => {
    const merged = new Set([...get().ids, ...initial]);
    persist(merged);
    set({ ids: merged, isReady: true });
  },
  add: (zoneId) => {
    const next = new Set(get().ids);
    next.add(zoneId);
    persist(next);
    set({ ids: next });
  },
  remove: (zoneId) => {
    const next = new Set(get().ids);
    next.delete(zoneId);
    persist(next);
    set({ ids: next });
  },
  toggle: (zoneId) => {
    const next = new Set(get().ids);
    let becameMember: boolean;
    if (next.has(zoneId)) {
      next.delete(zoneId);
      becameMember = false;
    } else {
      next.add(zoneId);
      becameMember = true;
    }
    persist(next);
    set({ ids: next });
    return becameMember;
  },
  has: (zoneId) => get().ids.has(zoneId),
}));
