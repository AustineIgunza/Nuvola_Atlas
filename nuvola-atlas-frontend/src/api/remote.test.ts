import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { remoteApi } from "./remote";
import { ZONES as MOCK_ZONES } from "./fixtures";

const PILLAR_PATHS = ["pillars.social", "pillars.safety", "pillars.density", "pillars.infra"];

function jsonResponse(body: unknown) {
  return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) } as Response);
}

/** A zone with every indicator missing — what a freshly-seeded county returns. */
function zoneWithNullPillars(id: string) {
  return {
    id,
    name: "Westlands",
    score: 71,
    pillars: { social: null, safety: null, density: null, infra: null },
    deltas: { social: null, safety: null, density: null, infra: null },
    centroid: null,
    lastSyncMin: null,
  };
}

describe("hydrateZone", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("records every synthesised pillar in _hydrated", async () => {
    vi.stubGlobal("fetch", () => jsonResponse(zoneWithNullPillars("westlands")));

    const zone = await remoteApi.getZone("westlands");

    expect(zone._hydrated).toEqual(expect.arrayContaining(PILLAR_PATHS));
    expect(zone._hydrated).toEqual(expect.arrayContaining(["centroid", "lastSyncMin"]));
  });

  it("leaves _hydrated unset when the API supplied everything", async () => {
    vi.stubGlobal("fetch", () =>
      jsonResponse({
        id: "westlands",
        name: "Westlands",
        score: 71,
        pillars: { social: 60, safety: 61, density: 62, infra: 63 },
        deltas: { social: 1, safety: -1, density: 0, infra: 2 },
        centroid: [36.81, -1.26],
        lastSyncMin: 4,
      }),
    );

    const zone = await remoteApi.getZone("westlands");

    expect(zone._hydrated).toBeUndefined();
    expect(zone.pillars).toEqual({ social: 60, safety: 61, density: 62, infra: 63 });
  });

  it("keeps a zero from the API rather than treating it as missing", async () => {
    // `?? fallback` and `|| fallback` differ exactly here, and a measured 0
    // replaced by a fixture is the failure this whole task is about.
    vi.stubGlobal("fetch", () =>
      jsonResponse({
        ...zoneWithNullPillars("westlands"),
        pillars: { social: 0, safety: null, density: null, infra: null },
        lastSyncMin: 0,
      }),
    );

    const zone = await remoteApi.getZone("westlands");

    expect(zone.pillars.social).toBe(0);
    expect(zone._hydrated).not.toContain("pillars.social");
    expect(zone._hydrated).not.toContain("lastSyncMin");
  });

  it("flags every value that came from the fixture rather than the API", async () => {
    // The old implementation spread `...mock` as the base object, so a field
    // absent from the response inherited the fixture's value with nothing to
    // mark it. The invariant now: if a value equals the fixture's and the API
    // did not send it, it must appear in _hydrated.
    const mock = MOCK_ZONES.find((m) => m.id === "westlands")!;
    expect(mock.score).not.toBe(71); // otherwise the assertion below proves nothing

    vi.stubGlobal("fetch", () => jsonResponse({ id: "westlands", name: "Westlands", score: 71 }));

    const zone = await remoteApi.getZone("westlands");

    expect(zone.pillars).toEqual(mock.pillars);
    expect(zone.centroid).toEqual(mock.centroid);
    expect(zone._hydrated).toEqual(
      expect.arrayContaining([...PILLAR_PATHS, "centroid", "lastSyncMin"]),
    );

    // The API's own score survives untouched and is not flagged.
    expect(zone.score).toBe(71);
    expect(zone._hydrated).not.toContain("score");
  });

  it("passes a null delta straight through instead of substituting a fixture", async () => {
    // A pillar score can be synthesised and labelled "estimated"; a direction
    // of travel cannot — an arrow on screen for a movement nobody measured is
    // a claim, not a placeholder. Deltas therefore skip hydration entirely.
    const mock = MOCK_ZONES.find((m) => m.id === "westlands")!;
    expect(mock.deltas.social).not.toBeNull(); // otherwise this proves nothing

    vi.stubGlobal("fetch", () => jsonResponse({ id: "westlands", name: "Westlands", score: 71 }));

    const zone = await remoteApi.getZone("westlands");

    expect(zone.deltas).toEqual({ social: null, safety: null, density: null, infra: null });
    expect(zone.deltaWindowDays).toBeNull();
    expect(zone._hydrated ?? []).not.toContain("deltas.social");
  });

  it("warns once per response, not once per zone", async () => {
    vi.stubGlobal("fetch", () =>
      jsonResponse([zoneWithNullPillars("westlands"), zoneWithNullPillars("starehe")]),
    );

    await remoteApi.getZones();

    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(vi.mocked(console.warn).mock.calls[0][0]).toContain("westlands");
    expect(vi.mocked(console.warn).mock.calls[0][0]).toContain("starehe");
  });

  it("stays silent when nothing was synthesised", async () => {
    vi.stubGlobal("fetch", () =>
      jsonResponse([
        {
          id: "westlands",
          name: "Westlands",
          score: 71,
          pillars: { social: 60, safety: 61, density: 62, infra: 63 },
          deltas: { social: 0, safety: 0, density: 0, infra: 0 },
          centroid: [36.81, -1.26],
          lastSyncMin: 4,
        },
      ]),
    );

    await remoteApi.getZones();

    expect(console.warn).not.toHaveBeenCalled();
  });
});
