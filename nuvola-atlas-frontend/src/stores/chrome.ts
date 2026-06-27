import { create } from "zustand";

const AUTO_REFRESH_KEY = "nuvola_auto_refresh";

function loadAutoRefresh(): boolean {
  if (typeof window === "undefined") return true;
  const raw = window.localStorage.getItem(AUTO_REFRESH_KEY);
  return raw === null ? true : raw === "1";
}

interface ChromeState {
  panelOpen: boolean;
  searchOpen: boolean;
  methodOpen: boolean;
  sidebarCollapsed: boolean;
  // Cross-page "quick view" project overlay — set when the user picks a
  // project result from SearchModal so the current page doesn't have to
  // navigate away to show the detail.
  quickViewProjectId: string | null;
  autoRefresh: boolean;

  togglePanel: () => void;
  openPanel: () => void;
  closePanel: () => void;
  openSearch: () => void;
  closeSearch: () => void;
  openMethod: () => void;
  closeMethod: () => void;
  toggleSidebar: () => void;
  openQuickView: (projectId: string) => void;
  closeQuickView: () => void;
  setAutoRefresh: (on: boolean) => void;
}

export const useChromeStore = create<ChromeState>((set) => ({
  panelOpen: false,
  searchOpen: false,
  methodOpen: false,
  sidebarCollapsed: false,
  quickViewProjectId: null,
  autoRefresh: loadAutoRefresh(),

  togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),
  openPanel: () => set({ panelOpen: true }),
  closePanel: () => set({ panelOpen: false }),
  openSearch: () => set({ searchOpen: true }),
  closeSearch: () => set({ searchOpen: false }),
  openMethod: () => set({ methodOpen: true }),
  closeMethod: () => set({ methodOpen: false }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  openQuickView: (projectId) => set({ quickViewProjectId: projectId }),
  closeQuickView: () => set({ quickViewProjectId: null }),
  setAutoRefresh: (on) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(AUTO_REFRESH_KEY, on ? "1" : "0");
    }
    set({ autoRefresh: on });
  },
}));
