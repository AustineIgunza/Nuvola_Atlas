import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { FileText, Plus } from "lucide-react";
import { cn } from "@/lib/cn";
import { api } from "@/api";
import { formatDate, formatBytes } from "@/lib/format";
import { springSettle, staggerContainer, staggerItem } from "@/lib/motion";
import NewReportModal from "./NewReportModal";
import type { ReportStatus } from "@/types";

const STATUS_STYLES: Record<ReportStatus, { bg: string; text: string }> = {
  published: { bg: "rgba(52,201,122,0.12)", text: "#34c97a" },
  review: { bg: "rgba(255,179,64,0.12)", text: "#ffb340" },
  draft: { bg: "rgba(255,255,255,0.06)", text: "#8a91a0" },
};

const FILTERS: { label: string; value: ReportStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Published", value: "published" },
  { label: "Review", value: "review" },
  { label: "Draft", value: "draft" },
];

export default function ReportsTable() {
  const [filter, setFilter] = useState<ReportStatus | "all">("all");
  const [modalOpen, setModalOpen] = useState(false);

  const { data: reports } = useQuery({ queryKey: ["reports"], queryFn: api.getReports });
  const { data: zones } = useQuery({ queryKey: ["zones"], queryFn: api.getZones });

  const filtered = reports?.filter((r) => filter === "all" || r.status === filter) ?? [];

  function zoneName(id: string | null) {
    if (!id) return "All zones";
    return zones?.find((z) => z.id === id)?.name ?? id;
  }

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
          <div className="flex items-center gap-1.5 flex-wrap relative">
            {FILTERS.map((f) => (
              <motion.button
                key={f.value}
                onClick={() => setFilter(f.value)}
                whileTap={{ scale: 0.93 }}
                className={cn(
                  "relative px-3.5 h-8 rounded-chip text-[11px] font-medium transition-colors",
                  filter === f.value ? "text-white" : "text-ink-3 hover:text-ink-2",
                )}
              >
                {filter === f.value && (
                  <motion.div layoutId="report-filter" className="absolute inset-0 bg-accent rounded-chip glow-accent" transition={springSettle} />
                )}
                <span className="relative z-10">{f.label}</span>
              </motion.button>
            ))}
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 h-9 px-4 rounded-control bg-accent text-white text-[12px] font-medium hover:brightness-110 transition-all self-start btn-glow"
          >
            <Plus size={14} />
            New report
          </motion.button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto -mx-4 sm:-mx-6 px-4 sm:px-6">
          <table className="w-full text-[12px] min-w-[600px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2.5 px-2 text-ink-4 font-medium">Title</th>
                <th className="text-left py-2.5 px-2 text-ink-4 font-medium hidden sm:table-cell">Zone</th>
                <th className="text-left py-2.5 px-2 text-ink-4 font-medium hidden md:table-cell">Author</th>
                <th className="text-left py-2.5 px-2 text-ink-4 font-medium">Status</th>
                <th className="text-left py-2.5 px-2 text-ink-4 font-medium hidden sm:table-cell">Date</th>
                <th className="text-right py-2.5 px-2 text-ink-4 font-medium hidden lg:table-cell">Size</th>
              </tr>
            </thead>
            <motion.tbody variants={staggerContainer} initial="hidden" animate="visible" key={filter}>
              {filtered.map((r) => {
                const style = STATUS_STYLES[r.status];
                return (
                  <motion.tr
                    key={r.id}
                    variants={staggerItem}
                    transition={springSettle}
                    whileHover={{ backgroundColor: "rgba(255,255,255,0.03)" }}
                    className="border-b border-border/40 transition-colors"
                  >
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-ink-4 shrink-0" />
                        <span className="text-ink-1 font-medium text-[13px]">{r.title}</span>
                        <span className="px-1 py-0.5 rounded text-[9px] font-bold text-ink-4 bg-[rgba(255,255,255,0.06)] uppercase shrink-0">{r.format}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-ink-3 hidden sm:table-cell">{zoneName(r.zoneId)}</td>
                    <td className="py-3 px-2 text-ink-3 hidden md:table-cell">{r.author}</td>
                    <td className="py-3 px-2">
                      <motion.span
                        className="px-2.5 py-1 rounded-full text-[10px] font-semibold capitalize inline-block"
                        style={{ background: style.bg, color: style.text }}
                        whileHover={{ scale: 1.05 }}
                      >
                        {r.status}
                      </motion.span>
                    </td>
                    <td className="py-3 px-2 text-ink-3 tabular-nums hidden sm:table-cell">{formatDate(r.date)}</td>
                    <td className="py-3 px-2 text-right text-ink-4 tabular-nums hidden lg:table-cell">{formatBytes(r.sizeBytes)}</td>
                  </motion.tr>
                );
              })}
            </motion.tbody>
          </table>
        </div>
      </motion.div>

      <NewReportModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
