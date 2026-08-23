import type { Zone } from "@/types";

/** Clean Water & Sanitation (SDG 6) intelligence.
 *
 *  Unmet need is the inverse of the measured `water_sanitation` pillar — no
 *  second weighting, no composite. The pillar is the number; this module only
 *  turns it into a sanitation *context* so the map can recommend a solution
 *  that fits the ground.
 *
 *  The core innovation angle: in dense informal settlements and flood-prone
 *  valleys, conventional trunk sewerage and centralized treatment works are not
 *  viable — so the platform surfaces sustainable, affordable, decentralized
 *  alternatives (container-based sanitation, faecal-sludge management, DEWATS,
 *  raised ablution blocks) instead of defaulting to "extend the sewer." */

export type SanitationContext = "informal" | "peri-urban" | "established";

export interface WaterProfile {
  zoneId: string;
  context: SanitationContext;
  contextLabel: string;
  /** 0-100 unmet water & sanitation need — the inverse of the measured pillar. */
  needPct: number;
  /** Whether conventional trunk sewerage / a treatment works is viable here. */
  sewerViable: boolean;
  /** Flagged as a decentralized-sanitation opportunity (sewerage not viable). */
  opportunity: boolean;
  /** Short chip label for the recommended solution. */
  solutionTag: string;
  /** Full recommended context-specific sanitation infrastructure solution. */
  solution: string;
  /** Why conventional sewerage is / isn't the right call here. */
  rationale: string;
}

/** Nairobi constituencies dominated by informal settlements, where trunk
 *  sewerage and centralized treatment cannot be laid or maintained. */
const INFORMAL = new Set(["kibra", "mathare"]);

/** Above this unmet-need share, extending the trunk main is slower and more
 *  capital-heavy than cluster-scale treatment. A recommendation threshold, not
 *  a scoring weight — it changes which solution is proposed, never a score. */
const DECENTRALISED_THRESHOLD = 0.4;

/** Ground-truthed detail for the flagged informal-settlement zones — overrides
 *  the derived recommendation with a specific, surveyed solution. */
const NAMED: Record<string, Partial<WaterProfile>> = {
  kibra: {
    solutionTag: "Container-based + FSM",
    solution:
      "Container-based sanitation — sealed cartridge latrines emptied on a scheduled collection route and treated off-site — paired with decentralized faecal-sludge management and raised communal ablution blocks.",
    rationale:
      "Dense, unplanned plots with no road reserves: trunk sewers and a treatment works can neither be laid nor desludged here, so collection-and-treatment is the only maintainable path.",
  },
  mathare: {
    solutionTag: "Raised blocks + FSM",
    solution:
      "Raised ablution blocks sited above the flood line, scheduled faecal-sludge emptying, and small cluster bio-digesters where plot sizes allow.",
    rationale:
      "A riverine valley with seasonal flooding: ground-level sewerage and treatment would be inundated and contaminate the watercourse, so elevated, sealed systems are the context fit.",
  },
};

export function waterProfile(z: Zone): WaterProfile | null {
  const measured = z.pillars.water_sanitation;
  // A sub-county with no water & sanitation reading has no computable need.
  // Say so with null rather than fabricate a midpoint from the gap.
  if (measured === null) return null;

  const need = (100 - measured) / 100;
  const needPct = Math.round(need * 100);

  const context: SanitationContext = INFORMAL.has(z.id)
    ? "informal"
    : need >= DECENTRALISED_THRESHOLD
      ? "peri-urban"
      : "established";
  const sewerViable = context === "established";

  const derived: WaterProfile = {
    zoneId: z.id,
    context,
    contextLabel:
      context === "informal"
        ? "Informal settlement"
        : context === "peri-urban"
          ? "Peri-urban · low trunk coverage"
          : "Established urban",
    needPct,
    sewerViable,
    opportunity: !sewerViable,
    solutionTag:
      context === "informal"
        ? "Container-based + FSM"
        : context === "peri-urban"
          ? "DEWATS + desludging"
          : "Sewer extension",
    solution:
      context === "informal"
        ? "Container-based sanitation with decentralized faecal-sludge management and raised communal ablution blocks."
        : context === "peri-urban"
          ? "Decentralized wastewater treatment (DEWATS) with cluster bio-digesters and scheduled septic desludging — faster and cheaper than extending trunk mains."
          : "Conventional sewerage extension is viable — prioritize last-mile connection subsidies and pre-treatment compliance for new developments.",
    rationale:
      context === "informal"
        ? "Dense, unplanned plots with no road reserves — trunk sewers cannot be laid or maintained."
        : context === "peri-urban"
          ? "Sparse trunk-main coverage — network extension is slow and capital-heavy versus cluster-scale treatment."
          : "The existing trunk network is within reach — incremental connections outperform standalone systems.",
  };

  return { ...derived, ...NAMED[z.id] };
}
