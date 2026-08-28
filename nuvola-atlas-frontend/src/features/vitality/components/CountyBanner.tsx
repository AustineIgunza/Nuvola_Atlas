import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api";
import { springSettle } from "@/shared/lib/motion";
import type { CountyContextReading } from "@/domain/types";

/**
 * P9 §Task 3 — county-wide banner rendered above the map.
 *
 * These readings are utility- or county-granularity (e.g. NCWSC's 48%
 * non-revenue water covers all 17 Nairobi sub-counties as one number).
 * Spreading them across sub-county bubbles would be inventing data;
 * rendering them here, with the granularity chip and the source next
 * to the number, makes the honest scope of each figure visible.
 *
 * A row with `method === "gap"` renders grey with no number — a declared
 * finding, not a hole to plug with zero.
 */
type Props = {
  county?: string;
};

// Nice-looking labels for the indicators the banner is likely to show. Kept
// small on purpose — the indicator itself is the source of truth; this
// only tidies up display for the handful of WASREB metrics we surface today.
const INDICATOR_LABELS: Record<string, string> = {
  non_revenue_water: "Non-revenue water",
  hours_of_supply: "Hours of supply",
  water_coverage: "Water coverage",
  metering_ratio: "Metering ratio",
  revenue_collection_eff: "Revenue collection",
  drinking_water_quality: "Water quality",
  total_score: "WASREB score",
};

function formatValue(reading: CountyContextReading): string {
  if (reading.value === null) return "—";
  // A number with more than one decimal is noise for a headline banner.
  const n = reading.value;
  const shown = Number.isInteger(n) ? n : n.toFixed(1);
  if (reading.unit === "%") return `${shown}%`;
  if (reading.unit === "hrs/day") return `${shown} hrs/day`;
  if (reading.unit.startsWith("points")) return `${shown} pts`;
  return `${shown} ${reading.unit}`;
}

function formatSource(reading: CountyContextReading): string {
  const bits: string[] = [];
  if (reading.sourceId === "wasreb_impact_17") bits.push("WASREB IMPACT 17");
  else if (reading.sourceId) bits.push(reading.sourceId);
  if (reading.vintage) bits.push(reading.vintage);
  return bits.join(" · ");
}

export default function CountyBanner({ county = "Nairobi" }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ["county-context", county],
    queryFn: () => api.getCountyContext(county),
    staleTime: 5 * 60_000,
  });

  if (isLoading || !data) return null;

  // A row that somehow arrived with sub-county granularity is a contract
  // breach on the server side; the banner must refuse to render it so a
  // regression cannot slip a sub-county number into the county-wide chip.
  // The type system forbids the value on this field, so a runtime string
  // compare needs a cast — the whole point of the guard is that the type
  // won't help if the wire payload lies.
  const rows = data.filter((r) => (r.granularity as string) !== "subcounty");
  if (rows.length === 0) return null;

  return (
    <motion.div
      role="region"
      aria-label={`${county} County — county-wide indicators`}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springSettle}
      className="atlas-county-banner absolute top-3 left-1/2 -translate-x-1/2 z-10
                 max-w-[min(96vw,880px)] flex flex-wrap items-center gap-x-4 gap-y-2
                 bg-bone/95 backdrop-blur-sm rounded-card px-4 py-2.5
                 shadow-[0_1px_2px_rgba(11,34,53,0.06),0_18px_50px_rgba(11,34,53,0.10)]
                 text-[12px] text-navy"
    >
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center rounded-full bg-navy/10 text-navy/80
                         px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.06em]">
          County-wide
        </span>
        <span className="font-semibold text-[13px]">{county} County</span>
      </div>

      {rows.map((r) => {
        const isGap = r.method === "gap" || r.value === null;
        const label = INDICATOR_LABELS[r.indicatorKey] ?? r.indicatorKey;
        const source = formatSource(r);
        return (
          <div
            key={`${r.indicatorKey}-${r.vintage ?? ""}`}
            data-testid={`county-context-row-${r.indicatorKey}`}
            className="flex items-baseline gap-1.5"
          >
            <span className={isGap ? "text-navy/50" : "text-navy/70"}>{label}</span>
            <span
              className={
                isGap
                  ? "text-navy/45 tabular-nums"
                  : "font-semibold tabular-nums"
              }
              aria-label={
                isGap
                  ? `${label}: not measured (${source || "no source"})`
                  : `${label}: ${formatValue(r)} (${source})`
              }
            >
              {isGap ? "Not measured" : formatValue(r)}
            </span>
            {source && (
              <span className="text-[10px] text-navy/45">· {source}</span>
            )}
          </div>
        );
      })}
    </motion.div>
  );
}
