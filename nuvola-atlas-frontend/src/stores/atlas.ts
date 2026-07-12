import { create } from "zustand";
import { useChromeStore } from "./chrome";
import { useThemeStore } from "./theme";
import { defaultStyleForTheme } from "@/components/map/atlas-map.constants";

interface LayerState {
  vitality: boolean;
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
  // Compare-mode context: the zone ids currently on the Compare page, mirrored
  // here so the Assistant panel (and mock chat stream) can craft answers
  // scoped to what the user is actually comparing.
  compareZoneIds: string[];

  setSelectedZone: (id: string | null) => void;
  toggleLayer: (key: keyof LayerState) => void;
  setScrubMonth: (idx: number) => void;
  setMapStyle: (style: string) => void;
  setCompareZoneIds: (ids: string[]) => void;
}

export const useAtlasStore = create<AtlasState>((set) => ({
  selectedZoneId: null,
  // Vitality choropleth is the signature view — on by default; overlays opt-in.
  activeLayers: { vitality: true, roads: false, energy: false, density: false, water: false, momentum: false, safety: false },
  scrubMonthIdx: 11,
  mapStyle: defaultStyleForTheme(useThemeStore.getState().theme),
  compareZoneIds: [],

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
  setCompareZoneIds: (ids) => set({ compareZoneIds: ids }),
}));
