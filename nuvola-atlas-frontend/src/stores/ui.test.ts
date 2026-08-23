import { describe, it, expect, beforeEach } from "vitest";
import { useAtlasStore } from "./atlas";
import { useChromeStore } from "./chrome";

describe("atlas store", () => {
  beforeEach(() => {
    useAtlasStore.setState({
      selectedZoneId: null,
      activeLayers: {
        vitality: true,
        roads: false,
        energy: false,
        water: false,
      },
      scrubMonthIdx: 11,
      mapStyle: "mapbox://styles/mapbox/light-v11",
    });
    useChromeStore.setState({
      panelOpen: false,
      searchOpen: false,
      methodOpen: false,
      sidebarCollapsed: false,
    });
  });

  it("selects a zone and opens panel", async () => {
    useAtlasStore.getState().setSelectedZone("westlands");
    expect(useAtlasStore.getState().selectedZoneId).toBe("westlands");
    await new Promise((r) => setTimeout(r, 10));
    expect(useChromeStore.getState().panelOpen).toBe(true);
  });

  it("deselects zone when null passed", async () => {
    useAtlasStore.getState().setSelectedZone("westlands");
    await new Promise((r) => setTimeout(r, 10));
    useAtlasStore.getState().setSelectedZone(null);
    expect(useAtlasStore.getState().selectedZoneId).toBe(null);
    await new Promise((r) => setTimeout(r, 10));
    expect(useChromeStore.getState().panelOpen).toBe(false);
  });

  it("toggles layers independently", () => {
    useAtlasStore.getState().toggleLayer("roads");
    expect(useAtlasStore.getState().activeLayers.roads).toBe(true);
    expect(useAtlasStore.getState().activeLayers.energy).toBe(false);

    useAtlasStore.getState().toggleLayer("roads");
    expect(useAtlasStore.getState().activeLayers.roads).toBe(false);
  });

  it("sets scrub month", () => {
    useAtlasStore.getState().setScrubMonth(5);
    expect(useAtlasStore.getState().scrubMonthIdx).toBe(5);
  });
});

describe("chrome store", () => {
  beforeEach(() => {
    useChromeStore.setState({
      panelOpen: false,
      searchOpen: false,
      methodOpen: false,
      sidebarCollapsed: false,
    });
  });

  it("toggles panel", () => {
    useChromeStore.getState().togglePanel();
    expect(useChromeStore.getState().panelOpen).toBe(true);
    useChromeStore.getState().togglePanel();
    expect(useChromeStore.getState().panelOpen).toBe(false);
  });

  it("opens and closes search", () => {
    useChromeStore.getState().openSearch();
    expect(useChromeStore.getState().searchOpen).toBe(true);
    useChromeStore.getState().closeSearch();
    expect(useChromeStore.getState().searchOpen).toBe(false);
  });

  it("toggles sidebar", () => {
    useChromeStore.getState().toggleSidebar();
    expect(useChromeStore.getState().sidebarCollapsed).toBe(true);
  });

  it("toggles the ESG lens and persists to localStorage", () => {
    useChromeStore.setState({ esgLens: false });
    useChromeStore.getState().toggleEsgLens();
    expect(useChromeStore.getState().esgLens).toBe(true);
    expect(window.localStorage.getItem("nuvola_esg_lens")).toBe("1");
    useChromeStore.getState().toggleEsgLens();
    expect(useChromeStore.getState().esgLens).toBe(false);
    expect(window.localStorage.getItem("nuvola_esg_lens")).toBe("0");
  });
});
