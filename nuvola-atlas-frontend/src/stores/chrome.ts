import { create } from "zustand";

const AUTO_REFRESH_KEY = "nuvola_auto_refresh";
const ESG_LENS_KEY = "nuvola_esg_lens";

function loadAutoRefresh(): boolean {
  if (typeof window === "undefined") return true;
  const raw = window.localStorage.getItem(AUTO_REFRESH_KEY);
  return raw === null ? true : raw === "1";
}

function loadEsgLens(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(ESG_LENS_KEY) === "1";
}

interface ChromeState {
  panelOpen: boolean;
  searchOpen: boolean;
  methodOpen: boolean;
  chatOpen: boolean;
  sidebarCollapsed: boolean;
  // Cross-page "quick view" project overlay — set when the user picks a
  // project result from SearchModal so the current page doesn't have to
  // navigate away to show the detail.
  quickViewProjectId: string | null;
  autoRefresh: boolean;
  // Investor "ESG lens" — additive framing chip that reorders the scorecard
  // to lead with Safety + Infra when on. Only rendered to investor users;
  // the boolean lives here so non-investor sessions can still round-trip
  // through localStorage without collisions.
  esgLens: boolean;

  togglePanel: () => void;
  openPanel: () => void;
  closePanel: () => void;
  openSearch: () => void;
  closeSearch: () => void;
  openMethod: () => void;
  closeMethod: () => void;
  toggleChat: () => void;
  openChat: () => void;
  closeChat: () => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  openQuickView: (projectId: string) => void;
  closeQuickView: () => void;
  setAutoRefresh: (on: boolean) => void;
  setEsgLens: (on: boolean) => void;
  toggleEsgLens: () => void;
}

export const useChromeStore = create<ChromeState>((set) => ({
  panelOpen: false,
  searchOpen: false,
  methodOpen: false,
  chatOpen: false,
  sidebarCollapsed: false,
  quickViewProjectId: null,
  autoRefresh: loadAutoRefresh(),
  esgLens: loadEsgLens(),

  togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),
  openPanel: () => set({ panelOpen: true }),
  closePanel: () => set({ panelOpen: false }),
  openSearch: () => set({ searchOpen: true }),
  closeSearch: () => set({ searchOpen: false }),
  openMethod: () => set({ methodOpen: true }),
  closeMethod: () => set({ methodOpen: false }),
  toggleChat: () => set((s) => ({ chatOpen: !s.chatOpen })),
  openChat: () => set({ chatOpen: true }),
  closeChat: () => set({ chatOpen: false }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  openQuickView: (projectId) => set({ quickViewProjectId: projectId }),
  closeQuickView: () => set({ quickViewProjectId: null }),
  setAutoRefresh: (on) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(AUTO_REFRESH_KEY, on ? "1" : "0");
    }
    set({ autoRefresh: on });
  },
  setEsgLens: (on) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ESG_LENS_KEY, on ? "1" : "0");
    }
    set({ esgLens: on });
  },
  toggleEsgLens: () => {
    const next = !useChromeStore.getState().esgLens;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ESG_LENS_KEY, next ? "1" : "0");
    }
    set({ esgLens: next });
  },
}));
