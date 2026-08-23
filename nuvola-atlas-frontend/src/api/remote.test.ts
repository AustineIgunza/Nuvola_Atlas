import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { remoteApi } from "./remote";
import { ZONES as MOCK_ZONES } from "./fixtures";
import { PILLAR_KEYS } from "@/lib/pillars.generated";

const PILLAR_PATHS = PILLAR_KEYS.map((k) => `pillars.${k}`);
const [FIRST_PILLAR] = PILLAR_KEYS;

const allPillars = <T,>(value: (k: string, i: number) => T): Record<string, T> =>
  Object.fromEntries(PILLAR_KEYS.map((k, i) => [k, value(k, i)]));

function jsonResponse(body: unknown) {
  return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) } as Response);
}

/** A zone with every indicator missing — what a freshly-seeded county returns. */
function zoneWithNullPillars(id: string) {
  return {
    id,
    name: "Westlands",
    score: 71,
    pillars: allPillars(() => null),
    deltas: allPillars(() => null),
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
        pillars: allPillars((_k, i) => 60 + i),
        deltas: allPillars((_k, i) => i - 1),
        centroid: [36.81, -1.26],
        lastSyncMin: 4,
      }),
    );

    const zone = await remoteApi.getZone("westlands");

    expect(zone._hydrated).toBeUndefined();
    expect(zone.pillars).toEqual(allPillars((_k, i) => 60 + i));
  });

  it("keeps a zero from the API rather than treating it as missing", async () => {
    // `?? fallback` and `|| fallback` differ exactly here, and a measured 0
    // replaced by a fixture is the failure this whole task is about.
    vi.stubGlobal("fetch", () =>
      jsonResponse({
        ...zoneWithNullPillars("westlands"),
        pillars: allPillars((k) => (k === FIRST_PILLAR ? 0 : null)),
        lastSyncMin: 0,
      }),
    );

    const zone = await remoteApi.getZone("westlands");

    expect(zone.pillars[FIRST_PILLAR]).toBe(0);
    expect(zone._hydrated).not.toContain(`pillars.${FIRST_PILLAR}`);
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
    expect(mock.deltas[FIRST_PILLAR]).not.toBeNull(); // otherwise this proves nothing

    vi.stubGlobal("fetch", () => jsonResponse({ id: "westlands", name: "Westlands", score: 71 }));

    const zone = await remoteApi.getZone("westlands");

    expect(zone.deltas).toEqual(allPillars(() => null));
    expect(zone.deltaWindowDays).toBeNull();
    expect(zone._hydrated ?? []).not.toContain(`deltas.${FIRST_PILLAR}`);
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
          pillars: allPillars((_k, i) => 60 + i),
          deltas: allPillars(() => 0),
          centroid: [36.81, -1.26],
          lastSyncMin: 4,
        },
      ]),
    );

    await remoteApi.getZones();

    expect(console.warn).not.toHaveBeenCalled();
  });
});

describe("paginated collections", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const pagedZone = (id: string) => ({
    id,
    name: id,
    score: 71,
    pillars: allPillars((_k, i) => 60 + i),
    deltas: allPillars(() => 0),
    centroid: [36.81, -1.26],
    lastSyncMin: 4,
  });

  it("walks every page so a closed set is never truncated", async () => {
    const pages: Record<string, unknown> = {
      "1": { data: [pagedZone("a"), pagedZone("b")], meta: { current_page: 1, last_page: 2 } },
      "2": { data: [pagedZone("c")], meta: { current_page: 2, last_page: 2 } },
    };
    const fetchMock = vi.fn((url: string) =>
      jsonResponse(pages[new URL(url, "http://x").searchParams.get("page") ?? "1"]),
    );
    vi.stubGlobal("fetch", fetchMock);

    const zones = await remoteApi.getZones();

    expect(zones.map((z) => z.id)).toEqual(["a", "b", "c"]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("issues no follow-up request when the collection fits on one page", async () => {
    const fetchMock = vi.fn(() =>
      jsonResponse({ data: [pagedZone("a")], meta: { current_page: 1, last_page: 1 } }),
    );
    vi.stubGlobal("fetch", fetchMock);

    expect((await remoteApi.getZones()).map((z) => z.id)).toEqual(["a"]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("passes a bare array through untouched", async () => {
    vi.stubGlobal("fetch", () => jsonResponse([pagedZone("a")]));

    expect((await remoteApi.getZones()).map((z) => z.id)).toEqual(["a"]);
  });
});

describe("declared gaps", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("never substitutes a fixture for a pillar the API measured as absent", async () => {
    // Mathare has a fixture value for every pillar, so before missingPillars
    // was honoured the API's null came back as an invented number.
    const mathare = MOCK_ZONES.find((z) => z.id === "mathare")!;
    expect(mathare.pillars[FIRST_PILLAR]).not.toBeNull();

    vi.stubGlobal("fetch", () =>
      jsonResponse({
        id: "mathare",
        name: "Mathare",
        score: 47,
        pillars: allPillars((k) => (k === FIRST_PILLAR ? null : 60)),
        deltas: allPillars(() => 0),
        missingPillars: [FIRST_PILLAR],
        centroid: [36.86, -1.26],
        lastSyncMin: 4,
      }),
    );

    const zone = await remoteApi.getZone("mathare");

    expect(zone.pillars[FIRST_PILLAR]).toBeNull();
    expect(zone._hydrated ?? []).not.toContain(`pillars.${FIRST_PILLAR}`);
  });

  it("still hydrates a null the API did not declare as a gap", async () => {
    vi.stubGlobal("fetch", () =>
      jsonResponse({
        id: "mathare",
        name: "Mathare",
        score: 47,
        pillars: allPillars((k) => (k === FIRST_PILLAR ? null : 60)),
        deltas: allPillars(() => 0),
        missingPillars: [],
        centroid: [36.86, -1.26],
        lastSyncMin: 4,
      }),
    );

    const zone = await remoteApi.getZone("mathare");

    expect(zone.pillars[FIRST_PILLAR]).not.toBeNull();
    expect(zone._hydrated).toContain(`pillars.${FIRST_PILLAR}`);
  });
});
