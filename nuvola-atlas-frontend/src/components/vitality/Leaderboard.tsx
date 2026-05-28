import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowUpDown, Download } from "lucide-react";
import { cn } from "@/lib/cn";
import { api } from "@/api";
import { scoreColor, PILLAR_COLORS } from "@/lib/scoreColor";
import { springSettle, staggerContainer, staggerItem } from "@/lib/motion";
import { useUIStore } from "@/stores/ui";
import Sparkline from "./Sparkline";
import type { PillarKey } from "@/types";

type SortKey = "score" | PillarKey;

export default function Leaderboard() {
  const navigate = useNavigate();
  const setSelectedZone = useUIStore((s) => s.setSelectedZone);
  const [sortBy, setSortBy] = useState<SortKey>("score");
  const [filter, setFilter] = useState("");

  const { data: zones } = useQuery({ queryKey: ["zones"], queryFn: api.getZones });

  const sorted = useMemo(() => {
    if (!zones) return [];
    const filtered = zones.filter((z) => z.name.toLowerCase().includes(filter.toLowerCase()));
    return [...filtered].sort((a, b) => {
      const av = sortBy === "score" ? a.score : a.pillars[sortBy];
      const bv = sortBy === "score" ? b.score : b.pillars[sortBy];
      return bv - av;
    });
  }, [zones, sortBy, filter]);

  function handleRowClick(id: string) {
    setSelectedZone(id);
    navigate(`/atlas?zone=${id}`);
  }

  function exportCSV() {
    if (!sorted.length) return;
    const header = "Rank,Sub-county,Overall,Social,Safety,Density,Infrastructure\n";
    const rows = sorted.map((z, i) => `${i + 1},${z.name},${z.score},${z.pillars.social},${z.pillars.safety},${z.pillars.density},${z.pillars.infra}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "vitality-leaderboard.csv";
    a.click();
  }

  const headers: { key: SortKey; label: string }[] = [
    { key: "score", label: "Overall" },
    { key: "social", label: "Social" },
    { key: "safety", label: "Safety" },
    { key: "density", label: "Density" },
    { key: "infra", label: "Infra" },
  ];

  function fakeSparkline(score: number): number[] {
    const pts: number[] = [];
    let v = score - 8 + Math.random() * 4;
    for (let i = 0; i < 12; i++) { v += (Math.random() - 0.4) * 3; pts.push(Math.max(0, Math.min(100, Math.round(v)))); }
    pts[11] = score;
    return pts;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
      className="glass-strong rounded-card p-4 sm:p-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <motion.h2
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, ...springSettle }}
          className="text-[18px] font-semibold text-ink-1 tracking-[-0.02em]"
        >
          Vitality Leaderboard
        </motion.h2>
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, ...springSettle }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={exportCSV}
          className="flex items-center gap-1.5 h-9 px-4 rounded-control bg-[rgba(255,255,255,0.06)] border border-border text-ink-3 text-[12px] font-medium hover:bg-[rgba(255,255,255,0.1)] transition-colors self-start"
        >
          <Download size={13} />
          Export CSV
        </motion.button>
      </div>

      {/* Filter */}
      <motion.input
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        type="text"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filter by name..."
        className="w-full h-10 px-4 mb-5 rounded-control bg-[rgba(255,255,255,0.04)] border border-border text-ink-2 text-[13px] placeholder:text-ink-4 focus:border-accent transition-all"
      />

      {/* Table — horizontal scroll on mobile */}
      <div className="overflow-x-auto -mx-4 sm:-mx-6 px-4 sm:px-6">
        <table className="w-full text-[12px] min-w-[700px]">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2.5 px-2 text-ink-4 font-medium w-10">#</th>
              <th className="text-left py-2.5 px-2 text-ink-4 font-medium">Sub-county</th>
              {headers.map((h) => (
                <th
                  key={h.key}
                  className="text-right py-2.5 px-2 font-medium cursor-pointer select-none transition-colors"
                  style={{ color: sortBy === h.key ? (h.key === "score" ? "#4a9eff" : PILLAR_COLORS[h.key]) : undefined }}
                  onClick={() => setSortBy(h.key)}
                >
                  <span className="inline-flex items-center gap-1 hover:text-ink-2">
                    {h.label}
                    <ArrowUpDown size={10} className={sortBy === h.key ? "opacity-100" : "opacity-40"} />
                  </span>
                </th>
              ))}
              <th className="text-right py-2.5 px-2 text-ink-4 font-medium w-24 hidden lg:table-cell">Trend</th>
            </tr>
          </thead>
          <motion.tbody variants={staggerContainer} initial="hidden" animate="visible">
            {sorted.map((z, i) => (
              <motion.tr
                key={z.id}
                variants={staggerItem}
                transition={springSettle}
                onClick={() => handleRowClick(z.id)}
                whileHover={{ backgroundColor: "rgba(255,255,255,0.04)" }}
                className="border-b border-border/40 cursor-pointer transition-colors"
              >
                <td className="py-3 px-2 text-ink-4 tabular-nums">{i + 1}</td>
                <td className="py-3 px-2">
                  <div className="flex items-center gap-2.5">
                    <motion.div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ background: scoreColor(z.score) }}
                      whileHover={{ scale: 1.4 }}
                      transition={springSettle}
                    />
                    <span className="text-ink-1 font-medium text-[13px]">{z.name}</span>
                  </div>
                </td>
                <td className="py-3 px-2 text-right">
                  <motion.span
                    className="inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold tabular-nums text-white"
                    style={{ background: scoreColor(z.score) }}
                    whileHover={{ scale: 1.08 }}
                    transition={springSettle}
                  >
                    {z.score}
                  </motion.span>
                </td>
                {(["social", "safety", "density", "infra"] as PillarKey[]).map((key) => (
                  <td key={key} className="py-3 px-2 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-14 h-1.5 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: PILLAR_COLORS[key] }}
                          initial={{ width: 0 }}
                          animate={{ width: `${z.pillars[key]}%` }}
                          transition={{ delay: i * 0.03, duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
                        />
                      </div>
                      <span className="tabular-nums text-ink-2 w-6 text-right">{z.pillars[key]}</span>
                    </div>
                  </td>
                ))}
                <td className="py-3 px-2 text-right hidden lg:table-cell">
                  <Sparkline points={fakeSparkline(z.score)} />
                </td>
              </motion.tr>
            ))}
          </motion.tbody>
        </table>
      </div>
    </motion.div>
  );
}
