import { Droplets, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { BRAND, PILLAR_COLORS, PILLAR_LABELS, PILLAR_GLYPHS } from "@/lib/scoreColor";
import { waterProfile } from "@/lib/waterSanitation";
import { Section, Chip, StatCell, LayerHintButton } from "./bits";
import type { PanelView } from "./panel-types";
import type { Zone, PillarKey } from "@/types";

/** The context-specific sanitation toolkit the Atlas recommends where trunk
 *  sewerage is not viable. `terms` match against the zone's solutionTag. */
const TOOLKIT: { name: string; desc: string; terms: string[] }[] = [
  {
    name: "Container-based sanitation",
    desc: "Sealed cartridge latrines emptied on a scheduled collection route, with treatment off-site. Fits dense, unplanned plots where no sewer line can be laid.",
    terms: ["Container-based"],
  },
  {
    name: "Faecal-sludge management (FSM)",
    desc: "Scheduled emptying, transfer stations, and dedicated sludge treatment — the service backbone for every non-sewered system.",
    terms: ["FSM", "desludging"],
  },
  {
    name: "DEWATS",
    desc: "Decentralized wastewater treatment: cluster bio-digesters and baffled reactors serving a neighbourhood — no trunk main required.",
    terms: ["DEWATS"],
  },
  {
    name: "Raised ablution blocks",
    desc: "Communal wash blocks elevated above the flood line — sealed, maintainable, and resilient in riverine valleys.",
    terms: ["Raised blocks"],
  },
];

/** How the water read feeds the Vitality Index. */
const PILLAR_LINKS: { key: PillarKey; note: string }[] = [
  { key: "social", note: "Safe access lifts the basic-services and amenities sub-metrics" },
  { key: "infra", note: "Greywater reuse scores under Circular Economy Freedom" },
];

interface Props {
  zone: Zone;
  onNavigate: (view: PanelView) => void;
}

export default function WaterExplainer({ zone, onNavigate }: Props) {
  const wp = waterProfile(zone);
  const accent = wp.opportunity ? BRAND.teal : BRAND.steel;

  return (
    <div className="space-y-3">
      {/* Zone water reading */}
      <Section>
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-control flex items-center justify-center shrink-0"
            style={{ background: `${accent}1F`, color: accent }}
          >
            <Droplets size={14} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-medium text-ink-4 uppercase tracking-[0.08em]">
              Unmet water &amp; sanitation need
            </div>
            <div className="text-[22px] font-semibold tabular-nums leading-tight" style={{ color: accent }}>
              {wp.needPct}
              <span className="text-[12px] text-ink-4 font-medium">/100</span>
            </div>
          </div>
          <Chip color={accent}>{wp.contextLabel}</Chip>
        </div>
        <div className="mt-2 h-[4px] rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: accent, boxShadow: `0 0 6px ${accent}55` }}
            initial={{ width: 0 }}
            animate={{ width: `${wp.needPct}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
        </div>
        <div className="mt-2.5 grid grid-cols-3 gap-1.5">
          <StatCell value={`${wp.accessPct}%`} label="Safe access" />
          <StatCell value={`${wp.sharedPointPct}%`} label="Shared points" />
          <StatCell value={`${wp.waitMin} min`} label="Queue time" />
        </div>
      </Section>

      {/* Context verdict — is conventional sewerage the right call here? */}
      <Section title="Context verdict">
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{
              background: wp.sewerViable ? BRAND.teal : BRAND.terracotta,
              boxShadow: `0 0 6px ${wp.sewerViable ? BRAND.teal : BRAND.terracotta}66`,
            }}
          />
          <span className="flex-1 text-[11px] font-semibold text-ink-1">
            {wp.sewerViable ? "Trunk sewerage is viable" : "Trunk sewerage is not viable"}
          </span>
          <Chip color={accent}>{wp.solutionTag}</Chip>
        </div>
        <p className="mt-2 text-[11px] text-ink-2 leading-[1.6]">{wp.solution}</p>
        <p className="mt-1.5 text-[10px] text-ink-4 leading-[1.55]">
          <span className="text-ink-3 font-medium">Why:</span> {wp.rationale}
        </p>
        {wp.opportunity && (
          <div
            className="mt-2.5 rounded-control border px-2 py-1.5 text-[10px] leading-[1.5]"
            style={{ background: `${BRAND.teal}0F`, borderColor: `${BRAND.teal}33`, color: BRAND.teal }}
          >
            Flagged as a decentralized-sanitation investment opportunity — context-fit systems here
            deliver SDG 6 outcomes faster and cheaper than extending the trunk network.
          </div>
        )}
      </Section>

      {/* The reframe the platform carries */}
      <Section title="Reimagining water futures — SDG 6">
        <p className="text-[10.5px] text-ink-3 leading-[1.65]">
          Clean water and sanitation for all does not mean one pipe network for all. Where trunk
          sewerage cannot be laid or maintained — dense informal settlements, flood-prone valleys,
          peri-urban edges — the Atlas recommends sustainable, affordable,{" "}
          <span className="text-ink-2 font-medium">context-specific systems</span> instead of
          defaulting to &ldquo;extend the sewer.&rdquo; The readiness question becomes: which
          sanitation architecture actually fits this ground?
        </p>
      </Section>

      {/* Toolkit catalogue, with the zone's recommended entries highlighted */}
      <Section title="Context-specific toolkit">
        <div className="space-y-1.5">
          {TOOLKIT.map((t) => {
            const recommended = t.terms.some((term) => wp.solutionTag.includes(term));
            return (
              <div
                key={t.name}
                className="rounded-control border p-2 transition-colors"
                style={
                  recommended
                    ? { background: `${BRAND.teal}0F`, borderColor: `${BRAND.teal}40` }
                    : { background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.08)" }
                }
              >
                <div className="flex items-center gap-1.5">
                  <span className="flex-1 min-w-0 text-[10.5px] font-semibold text-ink-1 truncate">
                    {t.name}
                  </span>
                  {recommended && <Chip color={BRAND.teal}>Recommended here</Chip>}
                </div>
                <p className="mt-1 text-[9.5px] text-ink-4 leading-[1.5]">{t.desc}</p>
              </div>
            );
          })}
        </div>
      </Section>

      {/* How this reading feeds the Vitality Index */}
      <Section title="Feeds the Vitality Index">
        <div className="space-y-1.5">
          {PILLAR_LINKS.map(({ key, note }) => {
            const color = PILLAR_COLORS[key];
            return (
              <button
                key={key}
                onClick={() => onNavigate({ type: "pillar", key })}
                className="group w-full flex items-center gap-2 text-left rounded-control bg-[rgba(255,255,255,0.02)] border border-border px-2 py-1.5 hover:bg-[rgba(255,255,255,0.06)] transition-colors"
              >
                <div
                  className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                  style={{ background: color, boxShadow: `0 0 6px ${color}44` }}
                >
                  {PILLAR_GLYPHS[key]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10.5px] font-medium text-ink-2 truncate">
                    {PILLAR_LABELS[key]}
                  </div>
                  <div className="text-[9px] text-ink-4 truncate">{note}</div>
                </div>
                <ChevronRight size={12} className="shrink-0 text-ink-4 group-hover:text-ink-2 transition-colors" />
              </button>
            );
          })}
        </div>
      </Section>

      <LayerHintButton layer="water" label="Water & Sanitation" />
    </div>
  );
}
