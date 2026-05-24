import { describe, it, expect, beforeEach } from "vitest";
import { useUIStore } from "./ui";

describe("useUIStore", () => {
  beforeEach(() => {
    useUIStore.setState({
      selectedZoneId: null,
      panelOpen: false,
      activeLayers: { roads: false, energy: false, density: false },
      scrubMonthIdx: 11,
      searchOpen: false,
      methodOpen: false,
      sidebarCollapsed: false,
    });
  });

  it("selects a zone and opens panel", () => {
    useUIStore.getState().setSelectedZone("westlands");
    const s = useUIStore.getState();
    expect(s.selectedZoneId).toBe("westlands");
    expect(s.panelOpen).toBe(true);
  });

  it("deselects zone when null passed", () => {
    useUIStore.getState().setSelectedZone("westlands");
    useUIStore.getState().setSelectedZone(null);
    const s = useUIStore.getState();
    expect(s.selectedZoneId).toBe(null);
    expect(s.panelOpen).toBe(false);
  });

  it("toggles layers independently", () => {
    useUIStore.getState().toggleLayer("roads");
    expect(useUIStore.getState().activeLayers.roads).toBe(true);
    expect(useUIStore.getState().activeLayers.energy).toBe(false);

    useUIStore.getState().toggleLayer("roads");
    expect(useUIStore.getState().activeLayers.roads).toBe(false);
  });

  it("toggles panel", () => {
    useUIStore.getState().togglePanel();
    expect(useUIStore.getState().panelOpen).toBe(true);
    useUIStore.getState().togglePanel();
    expect(useUIStore.getState().panelOpen).toBe(false);
  });

  it("sets scrub month", () => {
    useUIStore.getState().setScrubMonth(5);
    expect(useUIStore.getState().scrubMonthIdx).toBe(5);
  });

  it("opens and closes search", () => {
    useUIStore.getState().openSearch();
    expect(useUIStore.getState().searchOpen).toBe(true);
    useUIStore.getState().closeSearch();
    expect(useUIStore.getState().searchOpen).toBe(false);
  });

  it("toggles sidebar", () => {
    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().sidebarCollapsed).toBe(true);
  });
});
