/**
 * Content Blocks — mock parity for the future content_blocks table.
 * Admin edits editorial copy shown on /public and inside the scorecard
 * drill-in. Every save creates a revision so a mistake can be rolled back.
 */

const STORAGE_KEY = "nuvola_content_blocks_v1";
const REV_STORAGE_KEY = "nuvola_content_blocks_revisions_v1";

export interface ContentBlock {
  key: string;
  title: string;
  bodyMd: string;
  updatedAt: string;
  updatedBy: string;
}

export interface Revision {
  id: string;
  blockKey: string;
  bodyMd: string;
  savedAt: string;
  savedBy: string;
}

const SEED_BLOCKS: ContentBlock[] = [
  {
    key: "methodology.overview",
    title: "Methodology · Overview",
    bodyMd:
      "Navuuna is a service-performance record for Nairobi's 17 sub-counties. Each sub-county carries a single 0–100 composite blended from a small set of pillars, every one of them measured against a named public source.\n\nThe record only publishes what it can measure. A pillar with no reading is dropped from both the numerator and the divisor rather than counted as a zero, and every value states its source, vintage, granularity and method on the face of it. Where a figure is collected at county or utility level, it stays on the county banner — spreading it across 17 sub-counties would be inventing data.",
    updatedAt: "2026-08-22T09:00:00Z",
    updatedBy: "austine@nuvola.dev",
  },
  {
    key: "methodology.pillar.water_sanitation",
    title: "Pillar · Water & Sanitation",
    bodyMd:
      "The flagship pillar. Household water source and sanitation type from the KNBS 2019 census, set against the utility's own reported service performance in the WASREB IMPACT report.\n\nWhere trunk sewerage is not viable — dense informal settlements, flood-prone valleys — the record recommends context-specific sanitation rather than assuming the sewer will arrive.",
    updatedAt: "2026-08-22T09:00:00Z",
    updatedBy: "austine@nuvola.dev",
  },
  {
    key: "methodology.pillar.road_density",
    title: "Pillar · Road Density",
    bodyMd:
      "Kilometres of mapped road per square kilometre of sub-county, measured off the HOT OSM extract.\n\nRead it as mapped road, not built road: a mapping campaign can add kilometres that were always on the ground, so check the extract date before reading a movement as construction.",
    updatedAt: "2026-08-22T09:00:00Z",
    updatedBy: "austine@nuvola.dev",
  },
  {
    key: "methodology.pillar.transit_access",
    title: "Pillar · Transit Access",
    bodyMd:
      "The share of residents living within walking distance of a matatu stop, from the Digital Matatus GTFS feed intersected with WorldPop population raster.\n\nA route withdrawal shows up here before it shows up anywhere else.",
    updatedAt: "2026-08-22T09:00:00Z",
    updatedBy: "austine@nuvola.dev",
  },
  {
    key: "methodology.pillar.electricity_access",
    title: "Pillar · Electricity Access",
    bodyMd:
      "The share of households using electricity for lighting, from the KNBS 2019 census.\n\nHeld, not active: the census is the newest sub-county figure that exists, so the reading is published with its vintage stated loudly and carries no weight in the composite. Read it as a floor, not as today.",
    updatedAt: "2026-08-22T09:00:00Z",
    updatedBy: "austine@nuvola.dev",
  },
  {
    key: "public.intro",
    title: "Public Portal · Intro",
    bodyMd:
      "A read-only community view of infrastructure delivery in your ward. Every project shown here comes from a named public source — KURA, KPLC, NCWSC, Athi Water, or the county's own delivery register.",
    updatedAt: "2026-07-01T09:00:00Z",
    updatedBy: "austine@nuvola.dev",
  },
];

function loadStored<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveStored<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export const contentBlocksApi = {
  list(): ContentBlock[] {
    return loadStored<ContentBlock[]>(STORAGE_KEY, SEED_BLOCKS);
  },
  get(key: string): ContentBlock | null {
    return contentBlocksApi.list().find((b) => b.key === key) ?? null;
  },
  save(block: ContentBlock): void {
    // Snapshot revision first so we can roll back.
    const revisions = loadStored<Revision[]>(REV_STORAGE_KEY, []);
    const existing = contentBlocksApi.get(block.key);
    if (existing) {
      const rev: Revision = {
        id: `rev-${Date.now().toString(36)}`,
        blockKey: block.key,
        bodyMd: existing.bodyMd,
        savedAt: existing.updatedAt,
        savedBy: existing.updatedBy,
      };
      saveStored(REV_STORAGE_KEY, [rev, ...revisions]);
    }
    const list = contentBlocksApi.list();
    const idx = list.findIndex((b) => b.key === block.key);
    const next = [...list];
    if (idx >= 0) next[idx] = block;
    else next.push(block);
    saveStored(STORAGE_KEY, next);
  },
  revisions(blockKey: string): Revision[] {
    return loadStored<Revision[]>(REV_STORAGE_KEY, []).filter((r) => r.blockKey === blockKey);
  },
};
