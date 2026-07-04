import { create } from "zustand";
import { useChromeStore } from "./chrome";
import { useThemeStore } from "./theme";
import { defaultStyleForTheme } from "@/components/map/atlas-map.constants";

interface LayerState {
  roads: boolean;
  energy: boolean;
  density: boolean;
  water: boolean;
  momentum: boolean;
  safety: boolean;
}

interface AtlasState {
  selectedZoneId: string | null;
  activeLayers: LayerState;
  scrubMonthIdx: number;
  mapStyle: string;

  setSelectedZone: (id: string | null) => void;
  toggleLayer: (key: keyof LayerState) => void;
  setScrubMonth: (idx: number) => void;
  setMapStyle: (style: string) => void;
}

export const useAtlasStore = create<AtlasState>((set) => ({
  selectedZoneId: null,
  activeLayers: { roads: false, energy: false, density: false, water: false, momentum: false, safety: false },
  scrubMonthIdx: 11,
  mapStyle: defaultStyleForTheme(useThemeStore.getState().theme),

  setSelectedZone: (id) => {
    set({ selectedZoneId: id });
    const chrome = useChromeStore.getState();
    if (id !== null) chrome.openPanel();
    else chrome.closePanel();
  },
  toggleLayer: (key) =>
    set((s) => ({
      activeLayers: { ...s.activeLayers, [key]: !s.activeLayers[key] },
    })),
  setScrubMonth: (idx) => set({ scrubMonthIdx: idx }),
  setMapStyle: (style) => set({ mapStyle: style }),
}));
