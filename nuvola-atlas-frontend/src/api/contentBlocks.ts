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
      "The UE Vitality Index turns fused infrastructure and social data into a single 0–100 readiness score for each sub-county — how ready a locality is to absorb, operate, and sustain new infrastructure.\n\nGrounded in Amartya Sen's *Development as Freedom*: readiness is the expansion of real freedoms — economic opportunity, safety, social wellbeing, and environmental security — not infrastructure counts alone.",
    updatedAt: "2026-07-01T09:00:00Z",
    updatedBy: "austine@nuvola.dev",
  },
  {
    key: "methodology.pillar.social",
    title: "Pillar · Social Wellbeing & Human Capital",
    bodyMd:
      "Whether the local population is thriving. Combines healthcare access, education access, and digital connectivity. A low score predicts future strikes, unrest, or a skills shortage.",
    updatedAt: "2026-07-01T09:00:00Z",
    updatedBy: "austine@nuvola.dev",
  },
  {
    key: "methodology.pillar.safety",
    title: "Pillar · Safety & Security",
    bodyMd:
      "Freedom from physical, legal, and digital threats. Weighs crime rates, emergency response access, and disaster exposure.",
    updatedAt: "2026-07-01T09:00:00Z",
    updatedBy: "austine@nuvola.dev",
  },
  {
    key: "methodology.pillar.density",
    title: "Pillar · Density & Scaling Dynamics",
    bodyMd:
      "Whether the region's density supports growth or strangles it. Combines population density, congestion, and housing pressure.",
    updatedAt: "2026-07-01T09:00:00Z",
    updatedBy: "austine@nuvola.dev",
  },
  {
    key: "methodology.pillar.infra",
    title: "Pillar · Infrastructure & Environmental Safeguards",
    bodyMd:
      "Whether documentation and legal architecture exist to back up large projects. Combines road quality, energy reliability, food risk, and waste management.",
    updatedAt: "2026-07-01T09:00:00Z",
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
