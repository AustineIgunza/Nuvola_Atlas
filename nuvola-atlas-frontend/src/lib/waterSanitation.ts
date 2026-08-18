import type { Zone } from "@/types";

/** Clean Water & Sanitation (SDG 6) intelligence.
 *
 *  The Atlas reads each zone's *unmet water & sanitation need* from its pillar
 *  scores (weak infrastructure + weak social wellbeing + high density pressure
 *  = greater need) and classifies the sanitation context so the map can
 *  recommend a *context-specific* infrastructure solution.
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
  /** 0-100 unmet water & sanitation need (higher = weaker access). */
  needPct: number;
  /** % of households with safe/basic water access. */
  accessPct: number;
  /** % dependent on shared / communal water points. */
  sharedPointPct: number;
  /** Median queue time at shared points, minutes. */
  waitMin: number;
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

/** Ground-truthed detail for the flagged informal-settlement zones — overrides
 *  the derived defaults with the real access picture and a specific solution. */
const NAMED: Record<string, Partial<WaterProfile>> = {
  kibra: {
    accessPct: 38,
    sharedPointPct: 62,
    waitMin: 31,
    solutionTag: "Container-based + FSM",
    solution:
      "Container-based sanitation — sealed cartridge latrines emptied on a scheduled collection route and treated off-site — paired with decentralized faecal-sludge management and raised communal ablution blocks.",
    rationale:
      "Dense, unplanned plots with no road reserves: trunk sewers and a treatment works can neither be laid nor desludged here, so collection-and-treatment is the only maintainable path.",
  },
  mathare: {
    accessPct: 41,
    sharedPointPct: 57,
    waitMin: 27,
    solutionTag: "Raised blocks + FSM",
    solution:
      "Raised ablution blocks sited above the flood line, scheduled faecal-sludge emptying, and small cluster bio-digesters where plot sizes allow.",
    rationale:
      "A riverine valley with seasonal flooding: ground-level sewerage and treatment would be inundated and contaminate the watercourse, so elevated, sealed systems are the context fit.",
  },
};

function need01(z: Zone): number | null {
  const { infra, social, density } = z.pillars;
  // Any missing pillar means the need weighting is a guess. A zone that has
  // not been measured has no computable water need — say so with null rather
  // than fabricate a midpoint by treating the gap as zero.
  if (infra === null || social === null || density === null) return null;
  const infraGap = (100 - infra) / 100;
  const socialGap = (100 - social) / 100;
  const densityPressure = density / 100;
  let n = infraGap * 0.5 + socialGap * 0.3 + densityPressure * 0.2;
  if (INFORMAL.has(z.id)) n = n + 0.18;
  return Math.max(0, Math.min(1, n));
}

export function waterProfile(z: Zone): WaterProfile | null {
  const need = need01(z);
  if (need === null) return null;
  const needPct = Math.round(need * 100);

  // Below ~0.40 unmet need the trunk network is close enough that conventional
  // sewerage extension wins; above it, cluster-scale decentralized treatment is
  // the faster, cheaper, context-fit path — so those zones flag as opportunities.
  const context: SanitationContext = INFORMAL.has(z.id)
    ? "informal"
    : need >= 0.4
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
    accessPct: Math.round(90 - need * 55),
    sharedPointPct: Math.round(need * 55),
    waitMin: Math.round(4 + need * 26),
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
