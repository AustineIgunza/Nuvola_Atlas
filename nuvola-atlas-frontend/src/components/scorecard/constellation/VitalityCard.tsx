import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import Ring from "../Ring";
import PillarBar from "../PillarBar";
import ZoneRanking from "../ZoneRanking";
import type { Zone, PillarKey } from "@/types";

const PILLAR_KEYS: PillarKey[] = ["social", "safety", "density", "infra"];

interface Props {
  zone: Zone;
}

export default function VitalityCard({ zone }: Props) {
  const navigate = useNavigate();
  const [exporting, setExporting] = useState(false);

  const totalDelta = Math.round(
    (zone.deltas.social + zone.deltas.safety + zone.deltas.density + zone.deltas.infra) / 4,
  );

  const handleExport = useCallback(() => {
    if (exporting) return;
    setExporting(true);
    const content = [
      `NAVUUNA ATLAS — Zone Report`,
      `Zone: ${zone.name}`,
      `Vitality Score: ${zone.score}/100`,
      ``,
      `Pillar Scores:`,
      `  Social Wellbeing: ${zone.pillars.social}`,
      `  Safety & Security: ${zone.pillars.safety}`,
      `  Density & Scaling: ${zone.pillars.density}`,
      `  Infrastructure & Environmental: ${zone.pillars.infra}`,
      ``,
      `Generated: ${new Date().toLocaleString()}`,
    ].join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${zone.id}-vitality-report.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  }, [zone, exporting]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Ring score={zone.score} size={72} />
        <div className="min-w-0">
          <div className="text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em]">
            UE Vitality Index
          </div>
          <div
            className="mt-1 inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium"
            style={{
              background: totalDelta >= 0 ? "rgba(31,138,120,0.12)" : "rgba(211,64,46,0.12)",
              color: totalDelta >= 0 ? "#1F8A78" : "#D3402E",
            }}
          >
            {totalDelta >= 0 ? "▲" : "▼"} {Math.abs(totalDelta)} pts this quarter
          </div>
          <p className="text-[10px] text-ink-4 mt-1">Last sync {zone.lastSyncMin} min ago</p>
        </div>
      </div>

      <div className="rounded-card bg-[rgba(255,255,255,0.02)] border border-border px-3 py-1.5">
        {PILLAR_KEYS.map((key, i) => (
          <PillarBar key={key} pillarKey={key} score={zone.pillars[key]} delta={zone.deltas[key]} index={i} />
        ))}
      </div>

      <ZoneRanking currentZone={zone} />

      <div className="flex gap-2">
        <button
          onClick={() => navigate(`/reports?zone=${zone.id}`)}
          className="flex-1 h-8 rounded-control bg-accent text-white text-[11px] font-medium hover:brightness-110 transition-all btn-glow"
        >
          Open full report
        </button>
        <button
          onClick={handleExport}
          className="flex-1 h-8 rounded-control bg-[rgba(255,255,255,0.06)] border border-border text-ink-2 text-[11px] font-medium hover:bg-[rgba(255,255,255,0.1)] transition-colors"
        >
          {exporting ? "Exporting…" : "Export summary"}
        </button>
      </div>
    </div>
  );
}
