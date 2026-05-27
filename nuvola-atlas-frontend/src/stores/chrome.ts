import { create } from "zustand";

interface ChromeState {
  panelOpen: boolean;
  searchOpen: boolean;
  methodOpen: boolean;
  sidebarCollapsed: boolean;

  togglePanel: () => void;
  openPanel: () => void;
  closePanel: () => void;
  openSearch: () => void;
  closeSearch: () => void;
  openMethod: () => void;
  closeMethod: () => void;
  toggleSidebar: () => void;
}

export const useChromeStore = create<ChromeState>((set) => ({
  panelOpen: false,
  searchOpen: false,
  methodOpen: false,
  sidebarCollapsed: false,

  togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),
  openPanel: () => set({ panelOpen: true }),
  closePanel: () => set({ panelOpen: false }),
  openSearch: () => set({ searchOpen: true }),
  closeSearch: () => set({ searchOpen: false }),
  openMethod: () => set({ methodOpen: true }),
  closeMethod: () => set({ methodOpen: false }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
}));
