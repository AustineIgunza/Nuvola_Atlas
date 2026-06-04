import { create } from "zustand";

interface ChromeState {
  panelOpen: boolean;
  searchOpen: boolean;
  methodOpen: boolean;
  sidebarCollapsed: boolean;
  // Cross-page "quick view" project overlay — set when the user picks a
  // project result from SearchModal so the current page doesn't have to
  // navigate away to show the detail.
  quickViewProjectId: string | null;

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
}

export const useChromeStore = create<ChromeState>((set) => ({
  panelOpen: false,
  searchOpen: false,
  methodOpen: false,
  sidebarCollapsed: false,
  quickViewProjectId: null,

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
}));
