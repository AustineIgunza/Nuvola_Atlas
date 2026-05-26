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
  mapStyle: string;
  darkMode: boolean;

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
  setMapStyle: (style: string) => void;
  toggleDarkMode: () => void;
  initDarkMode: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  selectedZoneId: null,
  panelOpen: false,
  activeLayers: { roads: false, energy: false, density: false },
  scrubMonthIdx: 11,
  searchOpen: false,
  methodOpen: false,
  sidebarCollapsed: false,
  mapStyle: "mapbox://styles/mapbox/light-v11",
  darkMode: false,

  setSelectedZone: (id) => set({ selectedZoneId: id, panelOpen: id !== null }),
  togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),
  openPanel: () => set({ panelOpen: true }),
  closePanel: () => set({ panelOpen: false }),
  toggleLayer: (key) => set((s) => ({ activeLayers: { ...s.activeLayers, [key]: !s.activeLayers[key] } })),
  setScrubMonth: (idx) => set({ scrubMonthIdx: idx }),
  openSearch: () => set({ searchOpen: true }),
  closeSearch: () => set({ searchOpen: false }),
  openMethod: () => set({ methodOpen: true }),
  closeMethod: () => set({ methodOpen: false }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setMapStyle: (style) => set({ mapStyle: style }),

  toggleDarkMode: () => {
    const next = !get().darkMode;
    set({ darkMode: next });
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("nuvola-dark", next ? "1" : "0");
  },

  initDarkMode: () => {
    const stored = localStorage.getItem("nuvola-dark");
    const dark = stored === "1" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches);
    set({ darkMode: dark });
    document.documentElement.classList.toggle("dark", dark);
  },
}));
