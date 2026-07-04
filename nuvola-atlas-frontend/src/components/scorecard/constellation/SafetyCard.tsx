import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/cn";
import { api } from "@/api";
import { BRAND, PILLAR_COLORS } from "@/lib/scoreColor";
import { formatRelative } from "@/lib/format";
import SubMetricList from "./SubMetricList";
import type { Zone, AlertSeverity } from "@/types";

const SEVERITY_COLOR: Record<AlertSeverity, string> = {
  high: BRAND.rose,
  medium: BRAND.gold,
  low: BRAND.steel,
};

// Same thresholds as the map's Safety & Security layer popup.
function riskStatus(safety: number): { label: string; color: string } {
  const risk = 100 - safety;
  if (risk >= 40) return { label: "At risk", color: BRAND.rose };
  if (risk >= 30) return { label: "Watch", color: BRAND.gold };
  return { label: "Secure", color: BRAND.steel };
}

interface Props {
  zone: Zone;
}

export default function SafetyCard({ zone }: Props) {
  const navigate = useNavigate();
  const { data: alerts } = useQuery({ queryKey: ["alerts"], queryFn: api.getAlerts });
  const zoneAlerts = (alerts ?? []).filter((a) => a.zoneId === zone.id).slice(0, 3);
  const status = riskStatus(zone.pillars.safety);
  const delta = zone.deltas.safety;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2.5">
        <span
          className="text-[26px] font-semibold tabular-nums leading-none"
          style={{ color: PILLAR_COLORS.safety }}
        >
          {zone.pillars.safety}
        </span>
        <span
          className={cn(
            "text-[10px] font-medium tabular-nums",
            delta >= 0 ? "text-success" : "text-danger",
          )}
        >
          {delta >= 0 ? "+" : ""}{delta} qtr
        </span>
        <span
          className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full"
          style={{ background: `${status.color}1A`, color: status.color }}
        >
          {status.label}
        </span>
      </div>

      <SubMetricList pillarKey="safety" />

      <div>
        <div className="text-[10px] font-medium text-ink-4 uppercase tracking-[0.08em] mb-1.5">
          Active alerts
        </div>
        {zoneAlerts.length > 0 ? (
          <div className="space-y-1.5">
            {zoneAlerts.map((a) => {
              const color = SEVERITY_COLOR[a.severity];
              return (
                <div key={a.id} className="rounded-card bg-[rgba(255,255,255,0.02)] border border-border p-2">
                  <div className="flex items-start gap-1.5">
                    <span
                      className="w-1.5 h-1.5 rounded-full mt-1 shrink-0"
                      style={{ background: color, boxShadow: `0 0 6px ${color}66` }}
                    />
                    <div className="min-w-0">
                      <div className="text-[11px] text-ink-2 font-medium leading-snug">{a.title}</div>
                      <div className="mt-1 flex items-center gap-1.5 text-[9.5px] text-ink-4">
                        <span
                          className="px-1.5 py-px rounded-full font-medium capitalize"
                          style={{ background: `${color}14`, color }}
                        >
                          {a.impactLevel}
                        </span>
                        <span>{formatRelative(a.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-[11px] text-ink-4 leading-[1.5]">
            No active alerts for this zone — monitoring feeds are quiet.
          </p>
        )}
      </div>

      <button
        onClick={() => navigate("/alerts")}
        className="w-full h-7 rounded-control bg-[rgba(255,255,255,0.04)] border border-border text-ink-3 text-[10.5px] font-medium hover:bg-[rgba(255,255,255,0.08)] transition-colors"
      >
        View all alerts →
      </button>
    </div>
  );
}
