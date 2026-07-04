import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { api } from "@/api";
import { BRAND } from "@/lib/scoreColor";
import { formatDate } from "@/lib/format";
import type { Zone, ProjectStatus } from "@/types";

const STATUS_STYLE: Record<ProjectStatus, { label: string; color: string }> = {
  active: { label: "Active", color: BRAND.teal },
  stalled: { label: "Stalled", color: BRAND.rose },
  planned: { label: "Planned", color: BRAND.steel },
};

interface Props {
  zone: Zone;
}

export default function InfrastructureCard({ zone }: Props) {
  const navigate = useNavigate();
  const { data: projects } = useQuery({ queryKey: ["projects"], queryFn: api.getProjects });
  const zoneProjects = (projects ?? []).filter((p) => p.zoneId === zone.id);
  const avg = zoneProjects.length
    ? Math.round(zoneProjects.reduce((s, p) => s + p.progress, 0) / zoneProjects.length)
    : 0;
  const stalled = zoneProjects.filter((p) => p.status === "stalled").length;

  return (
    <div className="space-y-2.5">
      {zoneProjects.length > 0 ? (
        <>
          <p className="text-[10.5px] text-ink-4">
            {zoneProjects.length} tracked {zoneProjects.length === 1 ? "project" : "projects"} · avg{" "}
            {avg}% complete
            {stalled > 0 ? ` · ${stalled} stalled` : ""}
          </p>
          {zoneProjects.map((p) => {
            const st = STATUS_STYLE[p.status];
            const next = p.milestones.find((ms) => !ms.done);
            const barColor = p.status === "stalled" ? BRAND.rose : BRAND.terracotta;
            return (
              <div key={p.id} className="rounded-card bg-[rgba(255,255,255,0.02)] border border-border p-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-[11.5px] font-semibold text-ink-1 leading-snug">{p.name}</div>
                  <span
                    className="shrink-0 text-[9px] font-medium px-1.5 py-0.5 rounded-full"
                    style={{ background: `${st.color}1A`, color: st.color }}
                  >
                    {st.label}
                  </span>
                </div>
                <div className="text-[10px] text-ink-4 mt-0.5 capitalize">
                  {p.agency} · {p.type}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-[4px] rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: barColor, boxShadow: `0 0 6px ${barColor}55` }}
                      initial={{ width: 0 }}
                      animate={{ width: `${p.progress}%` }}
                      transition={{ type: "spring", stiffness: 120, damping: 20 }}
                    />
                  </div>
                  <span className="text-[11px] font-semibold tabular-nums shrink-0" style={{ color: barColor }}>
                    {p.progress}%
                  </span>
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[10px]">
                  <span className="text-ink-3 font-medium">{p.budget}</span>
                  <span className="text-ink-4">ETA {formatDate(p.eta)}</span>
                </div>
                {next && (
                  <div className="mt-1 text-[10px] text-ink-4 truncate">
                    Next: <span className="text-ink-3">{next.label}</span> · {formatDate(next.date)}
                  </div>
                )}
              </div>
            );
          })}
        </>
      ) : (
        <p className="text-[11px] text-ink-4 leading-[1.5]">
          No tracked infrastructure projects in {zone.name} yet — new KURA / KPLC / KeNHA works will
          appear here as they are ingested.
        </p>
      )}
      <button
        onClick={() => navigate("/infrastructure")}
        className="w-full h-7 rounded-control bg-[rgba(255,255,255,0.04)] border border-border text-ink-3 text-[10.5px] font-medium hover:bg-[rgba(255,255,255,0.08)] transition-colors"
      >
        All infrastructure →
      </button>
    </div>
  );
}
