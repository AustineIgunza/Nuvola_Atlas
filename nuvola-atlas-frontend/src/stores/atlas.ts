import { create } from "zustand";

interface LayerState {
  roads: boolean;
  energy: boolean;
  density: boolean;
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

type ChromeModule = typeof import("./chrome");
let _chromeStore: ChromeModule["useChromeStore"] | null = null;
async function getChromeStore() {
  if (!_chromeStore) {
    const mod = await import("./chrome");
    _chromeStore = mod.useChromeStore;
  }
  return _chromeStore;
}

export const useAtlasStore = create<AtlasState>((set) => ({
  selectedZoneId: null,
  activeLayers: { roads: false, energy: false, density: false },
  scrubMonthIdx: 11,
  mapStyle: "mapbox://styles/mapbox/light-v11",

  setSelectedZone: (id) => {
    set({ selectedZoneId: id });
    getChromeStore().then((chrome) => {
      if (id !== null) chrome.getState().openPanel();
      else chrome.getState().closePanel();
    });
  },
  toggleLayer: (key) =>
    set((s) => ({
      activeLayers: { ...s.activeLayers, [key]: !s.activeLayers[key] },
    })),
  setScrubMonth: (idx) => set({ scrubMonthIdx: idx }),
  setMapStyle: (style) => set({ mapStyle: style }),
}));
