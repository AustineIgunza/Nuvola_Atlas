import { BadgeCheck, CircleDashed, Clock } from "lucide-react";
import { BRAND, PILLAR_COLORS, PILLAR_SHORT } from "@/lib/scoreColor";
import {
  AVAILABILITY_LABEL,
  VERIFICATION_LABEL,
  zoneIndicatorSummary,
  type IndicatorAvailability,
  type IndicatorVerification,
} from "@/lib/indicators";
import { Section } from "./bits";
import type { PillarKey } from "@/types";

interface Props {
  zoneId: string;
  showAttribution?: boolean;
}

const VERIFICATION_COLOR: Record<IndicatorVerification, string> = {
  verified: BRAND.teal,
  unverified: BRAND.gold,
  pending: BRAND.steel,
};

const AVAILABILITY_DOT: Record<IndicatorAvailability, string> = {
  delivered: BRAND.teal,
  pending: BRAND.gold,
  blocked: BRAND.steel,
};

function VerificationIcon({ v, color }: { v: IndicatorVerification; color: string }) {
  if (v === "verified") return <BadgeCheck size={11} style={{ color }} className="shrink-0" />;
  if (v === "unverified") return <CircleDashed size={11} style={{ color }} className="shrink-0" />;
  return <Clock size={11} style={{ color }} className="shrink-0" />;
}

/**
 * Daystar indicator ledger for a zone: shows all 12 indicators, groups by
 * pillar, and badges each row with its availability + field verification
 * state. Kept as a purely additive block so the legacy sub-metric drill-in
 * (PillarExplainer) can stay untouched during the Phase B rollout.
 */
export default function DaystarIndicatorPanel({ zoneId, showAttribution }: Props) {
  const summary = zoneIndicatorSummary(zoneId);
  const grouped = groupByPillar(summary.states);

  return (
    <Section
      title={`Daystar indicator ledger · ${summary.delivered}/${summary.total}`}
      className="space-y-2"
    >
      <p className="text-[10px] text-ink-4 leading-[1.55]">
        The 12 Vitality indicators the Daystar University data pipeline delivers per sub-county.
        Rows fill in as ingestion coverage rolls out; a field-verified badge confirms a ground
        officer has spot-checked the value.
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[9.5px]">
        <LegendChip color={BRAND.teal} label="Field-verified" />
        <LegendChip color={BRAND.gold} label="Unverified" />
        <LegendChip color={BRAND.steel} label="Awaiting data" />
      </div>

      <div className="mt-2 space-y-2.5">
        {(Object.keys(grouped) as PillarKey[]).map((pk) => {
          const rows = grouped[pk];
          if (rows.length === 0) return null;
          const pillarColor = PILLAR_COLORS[pk];
          return (
            <div key={pk}>
              <div className="flex items-center gap-1.5 mb-1">
                <span
                  className="w-1.5 h-3 rounded-sm shrink-0"
                  style={{ background: pillarColor }}
                />
                <span className="text-[9.5px] font-semibold uppercase tracking-[0.08em] text-ink-3">
                  {PILLAR_SHORT[pk]}
                </span>
              </div>
              <div className="space-y-1">
                {rows.map((r) => {
                  const vColor = VERIFICATION_COLOR[r.verification];
                  const dot = AVAILABILITY_DOT[r.availability];
                  return (
                    <div
                      key={r.key}
                      className="flex items-center gap-1.5 rounded-control bg-[rgba(255,255,255,0.02)] border border-border px-2 py-1.5"
                      title={`${AVAILABILITY_LABEL[r.availability]} · ${VERIFICATION_LABEL[r.verification]}\n${r.description}`}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ background: dot, boxShadow: `0 0 5px ${dot}66` }}
                      />
                      <span className="flex-1 min-w-0 text-[10.5px] text-ink-2 truncate">
                        {r.label}
                      </span>
                      <span
                        className="inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap"
                        style={{ background: `${vColor}1A`, color: vColor }}
                      >
                        <VerificationIcon v={r.verification} color={vColor} />
                        {VERIFICATION_LABEL[r.verification]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {showAttribution && <DaystarAttribution />}
    </Section>
  );
}

function LegendChip({ color, label }: { color: string; label: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full font-medium"
      style={{ background: `${color}1A`, color }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

function groupByPillar(states: ReturnType<typeof zoneIndicatorSummary>["states"]) {
  return {
    social: states.filter((s) => s.pillar === "social"),
    safety: states.filter((s) => s.pillar === "safety"),
    density: states.filter((s) => s.pillar === "density"),
    infra: states.filter((s) => s.pillar === "infra"),
  } as Record<PillarKey, typeof states>;
}

export function DaystarAttribution() {
  return (
    <div
      className="mt-2 rounded-control p-2.5 border"
      style={{ borderColor: `${BRAND.teal}33`, background: `${BRAND.teal}0F` }}
    >
      <div className="flex items-center gap-1.5">
        <BadgeCheck size={12} style={{ color: BRAND.teal }} className="shrink-0" />
        <span
          className="text-[10px] font-semibold uppercase tracking-[0.08em]"
          style={{ color: BRAND.teal }}
        >
          Data partner · Daystar University
        </span>
      </div>
      <p className="mt-1.5 text-[10.5px] text-ink-2 leading-[1.55]">
        The 12-indicator analytical layer is delivered under Navuuna&apos;s data-access partnership
        with Daystar University. Indicators arrive incrementally; zones show a partial-data marker
        until the full set is delivered.
      </p>
    </div>
  );
}
