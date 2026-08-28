import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpDown, Download, ChevronRight, X, MapPin } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { api } from "@/api";
import { scoreColor, PILLAR_COLORS } from "@/shared/lib/scoreColor";
import { formatScore } from "@/domain/scores";
import {
  springSettle,
  staggerContainer,
  staggerItem,
  modalBackdrop,
  modalContent,
} from "@/shared/lib/motion";
import { useUIStore } from "@/shared/stores/ui";
import { useT } from "@/shared/lib/i18n/use-t";
import { PILLAR_KEYS, PILLARS_BY_KEY } from "@/domain/pillars.generated";
import type { PillarKey, Zone } from "@/domain/types";

type SortKey = "score" | PillarKey;

export default function Leaderboard() {
  const t = useT();
  const navigate = useNavigate();
  const setSelectedZone = useUIStore((s) => s.setSelectedZone);
  const [sortBy, setSortBy] = useState<SortKey>("score");
  const [filter, setFilter] = useState("");
  const [popupZone, setPopupZone] = useState<Zone | null>(null);

  const { data: zones } = useQuery({ queryKey: ["zones"], queryFn: api.getZones });

  const sorted = useMemo(() => {
    if (!zones) return [];
    const filtered = zones.filter((z) => z.name.toLowerCase().includes(filter.toLowerCase()));
    return [...filtered].sort((a, b) => {
      const av = sortBy === "score" ? a.score : a.pillars[sortBy];
      const bv = sortBy === "score" ? b.score : b.pillars[sortBy];
      // Nulls sink to the bottom on either sort axis. `bv - av` would treat
      // null as 0 and rank an unmeasured zone as the worst in the column.
      if (av === null) return bv === null ? 0 : 1;
      if (bv === null) return -1;
      return bv - av;
    });
  }, [zones, sortBy, filter]);

  function openOnAtlas(id: string) {
    setSelectedZone(id);
    navigate(`/atlas?zone=${id}`);
  }

  function exportCSV() {
    if (!sorted.length) return;
    // Empty cell for a null reading — the standard CSV signal for "no value",
    // which downstream spreadsheets treat as blank instead of a real 0.
    const cell = (v: number | null): string => (v === null ? "" : String(v));
    const header = ["Rank", "Sub-county", "Overall", ...PILLAR_KEYS.map((k) => PILLARS_BY_KEY[k].displayName)].join(",");
    // A second header row names the source and vintage per pillar
    // column, so a downstream spreadsheet carries the attribution the UI
    // shows. Definition-of-done from NAVUUNA_REFOCUS_WORKFLOW.md §9.
    const sourceHeader = ["", "", "", ...PILLAR_KEYS.map((k) => {
      const p = PILLARS_BY_KEY[k];
      return p.vintage ? `${p.sourceId ?? ""} ${p.vintage}`.trim() : "";
    })].join(",");
    const rows = sorted.map((z, i) =>
      [i + 1, z.name, cell(z.score), ...PILLAR_KEYS.map((k) => cell(z.pillars[k]))].join(","),
    );
    const blob = new Blob([[header, sourceHeader, ...rows].join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "service-performance-leaderboard.csv";
    a.click();
  }

  const headers: { key: SortKey; label: string }[] = [
    { key: "score", label: t("vitality.overall") },
    ...PILLAR_KEYS.map((k) => ({ key: k, label: t(`pillar.${k}.short` as const) })),
  ];

  return (
    <>
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
            {t("vitality.leaderboard")}
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
            {t("common.exportCsv")}
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
          placeholder={t("vitality.filterByName")}
          className="w-full h-10 px-4 mb-5 rounded-control bg-[rgba(255,255,255,0.04)] border border-border text-ink-2 text-[13px] placeholder:text-ink-4 focus:border-accent transition-all"
        />

        {/* MOBILE: compact name list — tap a name to open the detail popup */}
        <motion.ul
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="md:hidden divide-y divide-border/40 -mx-1"
        >
          {sorted.map((z, i) => (
            <motion.li key={z.id} variants={staggerItem} transition={springSettle}>
              <button
                onClick={() => setPopupZone(z)}
                className="w-full flex items-center gap-3 py-3 px-2 text-left rounded-control hover:bg-[rgba(255,255,255,0.04)] transition-colors btn-press"
              >
                <span className="text-[11px] tabular-nums text-ink-4 w-5">{i + 1}</span>
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{
                    background: scoreColor(z.score),
                    boxShadow: `0 0 8px ${scoreColor(z.score)}55`,
                  }}
                />
                <span className="flex-1 min-w-0 text-[14px] font-medium text-ink-1 truncate">
                  {z.name}
                </span>
                <span
                  className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold tabular-nums text-white"
                  style={{ background: scoreColor(z.score) }}
                >
                  {formatScore(z.score)}
                </span>
                <ChevronRight size={14} className="text-ink-4 shrink-0" />
              </button>
            </motion.li>
          ))}
        </motion.ul>

        {/* DESKTOP: full table */}
        <div className="hidden md:block overflow-x-auto -mx-4 sm:-mx-6 px-4 sm:px-6">
          <table className="w-full text-[12px] min-w-[700px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2.5 px-2 text-ink-4 font-medium w-10">#</th>
                <th className="text-left py-2.5 px-2 text-ink-4 font-medium">
                  {t("vitality.subCounty")}
                </th>
                {headers.map((h) => (
                  <th
                    key={h.key}
                    className="text-right py-2.5 px-2 font-medium cursor-pointer select-none transition-colors"
                    style={{
                      color:
                        sortBy === h.key
                          ? h.key === "score"
                            ? "#C0552B"
                            : PILLAR_COLORS[h.key]
                          : undefined,
                    }}
                    onClick={() => setSortBy(h.key)}
                  >
                    <span className="inline-flex items-center gap-1 hover:text-ink-2">
                      {h.label}
                      <ArrowUpDown
                        size={10}
                        className={sortBy === h.key ? "opacity-100" : "opacity-40"}
                      />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <motion.tbody variants={staggerContainer} initial="hidden" animate="visible">
              {sorted.map((z, i) => (
                <motion.tr
                  key={z.id}
                  variants={staggerItem}
                  transition={springSettle}
                  onClick={() => openOnAtlas(z.id)}
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
                      {formatScore(z.score)}
                    </motion.span>
                  </td>
                  {PILLAR_KEYS.map((key) => {
                    const pv = z.pillars[key];
                    return (
                      <td key={key} className="py-3 px-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-14 h-1.5 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
                            {pv !== null && (
                              <motion.div
                                className="h-full rounded-full"
                                style={{ background: PILLAR_COLORS[key] }}
                                initial={{ width: 0 }}
                                animate={{ width: `${pv}%` }}
                                transition={{
                                  delay: i * 0.03,
                                  duration: 0.6,
                                  ease: [0.32, 0.72, 0, 1],
                                }}
                              />
                            )}
                          </div>
                          <span className="tabular-nums text-ink-2 w-6 text-right">
                            {formatScore(pv)}
                          </span>
                        </div>
                      </td>
                    );
                  })}
                </motion.tr>
              ))}
            </motion.tbody>
          </table>
        </div>

        {/* Attribution footer — every pillar column names its source and
            vintage. Same discipline as the county banner and the scorecard
            provenance ledger: a number on screen with no source next to
            it is a number a regulator cannot check. */}
        <div className="mt-4 pt-3 border-t border-border text-[10px] text-ink-4 leading-[1.6]">
          <span className="font-semibold uppercase tracking-[0.06em] text-ink-3">
            Sources ·
          </span>
          {PILLAR_KEYS.map((k, i) => {
            const p = PILLARS_BY_KEY[k];
            if (!p.vintage) return null;
            return (
              <span key={k}>
                {i > 0 && " · "}
                <span className="text-ink-3">{p.displayName}:</span>{" "}
                {p.sourceId ?? ""} {p.vintage}
              </span>
            );
          })}
        </div>
      </motion.div>

      {/* Mobile detail popup */}
      <AnimatePresence>
        {popupZone && (
          <motion.div
            key="leaderboard-modal"
            className="fixed inset-0 z-50 flex items-center justify-center p-3 pb-safe"
          >
            <motion.div
              variants={modalBackdrop}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setPopupZone(null)}
            />
            <motion.div
              variants={modalContent}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={springSettle}
              className="relative w-full max-w-[420px] max-h-[85vh] glass-strong border border-border rounded-modal overflow-y-auto shadow-modal"
              role="dialog"
              aria-modal="true"
              aria-label={t("leaderboard.previewAria", { zone: popupZone.name })}
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-[11px] font-medium text-ink-4 uppercase tracking-[0.1em]">
                      {t("leaderboard.subCountyNairobi")}
                    </div>
                    <h2 className="text-[20px] font-semibold tracking-[-0.02em] text-ink-1 mt-1">
                      {popupZone.name}
                    </h2>
                  </div>
                  <button
                    onClick={() => setPopupZone(null)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-[rgba(255,255,255,0.06)] text-ink-4 hover:text-ink-2 transition-colors btn-press"
                    aria-label={t("common.close")}
                  >
                    <X size={14} />
                  </button>
                </div>

                <div className="flex items-center gap-3 mb-5">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-white text-[18px] font-bold tabular-nums"
                    style={{
                      background: scoreColor(popupZone.score),
                      boxShadow: `0 0 18px ${scoreColor(popupZone.score)}55`,
                    }}
                  >
                    {formatScore(popupZone.score)}
                  </div>
                  <div className="flex-1">
                    <div className="text-[11px] font-medium text-ink-4 uppercase tracking-[0.1em]">
                      {t("leaderboard.indexTitle")}
                    </div>
                    <div className="text-[12px] text-ink-3 mt-1">
                      {t("leaderboard.updatedAgo", { min: popupZone.lastSyncMin })}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-5">
                  {PILLAR_KEYS.map((key) => {
                    const pv = popupZone.pillars[key];
                    return (
                      <div key={key}>
                        <div className="flex items-center justify-between text-[12px] mb-1.5">
                          <span className="text-ink-3 font-medium">
                            {t(`pillar.${key}.long` as const)}
                          </span>
                          <span className="tabular-nums text-ink-1 font-semibold">
                            {formatScore(pv)}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
                          {pv !== null && (
                            <motion.div
                              className="h-full rounded-full"
                              style={{ background: PILLAR_COLORS[key] }}
                              initial={{ width: 0 }}
                              animate={{ width: `${pv}%` }}
                              transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={() => {
                    const id = popupZone.id;
                    setPopupZone(null);
                    openOnAtlas(id);
                  }}
                  className={cn(
                    "w-full h-10 rounded-control bg-accent text-white text-[13px] font-medium",
                    "flex items-center justify-center gap-2 hover:brightness-110 transition-all btn-glow",
                  )}
                >
                  <MapPin size={14} />
                  {t("leaderboard.openAtlas")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
