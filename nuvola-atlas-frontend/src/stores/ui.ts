import { create } from "zustand";

interface LayerState {
  roads: boolean;
  energy: boolean;
  density: boolean;
}

interface UIState {
  selectedZoneId: string | null;
  panelOpen: boolean;
  activeLayers: LayerState;
  scrubMonthIdx: number;
  searchOpen: boolean;
  methodOpen: boolean;
  sidebarCollapsed: boolean;

  setSelectedZone: (id: string | null) => void;
  togglePanel: () => void;
  openPanel: () => void;
  closePanel: () => void;
  toggleLayer: (key: keyof LayerState) => void;
  setScrubMonth: (idx: number) => void;
  openSearch: () => void;
  closeSearch: () => void;
  openMethod: () => void;
  closeMethod: () => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  selectedZoneId: null,
  panelOpen: false,
  activeLayers: { roads: false, energy: false, density: false },
  scrubMonthIdx: 11,
  searchOpen: false,
  methodOpen: false,
  sidebarCollapsed: false,

  setSelectedZone: (id) =>
    set({ selectedZoneId: id, panelOpen: id !== null }),
  togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),
  openPanel: () => set({ panelOpen: true }),
  closePanel: () => set({ panelOpen: false }),
  toggleLayer: (key) =>
    set((s) => ({
      activeLayers: { ...s.activeLayers, [key]: !s.activeLayers[key] },
    })),
  setScrubMonth: (idx) => set({ scrubMonthIdx: idx }),
  openSearch: () => set({ searchOpen: true }),
  closeSearch: () => set({ searchOpen: false }),
  openMethod: () => set({ methodOpen: true }),
  closeMethod: () => set({ methodOpen: false }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
}));
