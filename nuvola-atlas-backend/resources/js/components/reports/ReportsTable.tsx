import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, FileText, ChevronDown, X } from "lucide-react";
import { api } from "../../api";
import { cn } from "../../lib/cn";
import { formatDate, formatBytes } from "../../lib/format";
import { staggerContainer, staggerItem, springSettle } from "../../lib/motion";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import type { Report, ReportStatus } from "../../types";

const STATUS_BADGE: Record<ReportStatus, string> = {
  published: "bg-[#1B9C6B]/10 text-[#1B9C6B]",
  review: "bg-[#C9A227]/10 text-[#C9A227]",
  draft: "bg-ink/5 text-ink/50",
};

const FILTER_OPTIONS: Array<"all" | ReportStatus> = ["all", "published", "review", "draft"];

export default function ReportsTable() {
  const reduced = usePrefersReducedMotion();
  const queryClient = useQueryClient();
  const { data: reports = [], isLoading } = useQuery({ queryKey: ["reports"], queryFn: api.getReports });

  const [filter, setFilter] = useState<"all" | ReportStatus>("all");
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [detailReport, setDetailReport] = useState<Report | null>(null);

  const createReport = useMutation({
    mutationFn: () => api.createReport({ title: newTitle, zoneId: null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      setShowNew(false);
      setNewTitle("");
    },
  });

  const filtered = reports.filter((r) => filter === "all" || r.status === filter);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-ink/30 text-sm">Loading reports...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-[22px] font-semibold tracking-[-0.02em]">Reports</h1>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-accent text-white text-[13px] font-medium rounded-control hover:opacity-90 transition-opacity"
        >
          <Plus size={15} /> New Report
        </button>
      </div>

      {/* New report form */}
      {showNew && (
        <div className="bg-card rounded-card shadow-card p-4 mb-4 flex items-center gap-3">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Report title..."
            className="flex-1 text-[13px] border border-border rounded-control px-3 py-2 bg-surface outline-none focus:ring-2 focus:ring-accent/30 text-ink"
            onKeyDown={(e) => e.key === "Enter" && newTitle.trim() && createReport.mutate()}
            autoFocus
          />
          <button
            onClick={() => createReport.mutate()}
            disabled={!newTitle.trim() || createReport.isPending}
            className="px-4 py-2 bg-accent text-white text-[13px] font-medium rounded-control hover:opacity-90 disabled:opacity-40 transition-opacity"
          >
            {createReport.isPending ? "Creating..." : "Create"}
          </button>
          <button
            onClick={() => { setShowNew(false); setNewTitle(""); }}
            className="text-[13px] text-ink/40 hover:text-ink/60"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {FILTER_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              "px-3 py-1 text-[12px] rounded-pill transition-colors capitalize",
              filter === s ? "bg-accent text-white" : "bg-ink/5 text-ink/50 hover:bg-ink/8"
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card rounded-card shadow-card p-12 text-center">
          <FileText className="mx-auto mb-3 text-ink/20" size={32} />
          <p className="text-[13px] text-ink/40">No reports match your filter</p>
        </div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial={reduced ? false : "hidden"}
          animate="visible"
          key={filter}
          className="space-y-3"
        >
          {filtered.map((r) => (
            <motion.div
              key={r.id}
              variants={staggerItem}
              onClick={() => setDetailReport(r)}
              className="bg-card rounded-card shadow-card p-4 cursor-pointer transition-shadow hover:shadow-lg"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0 pr-3">
                  <div className="text-[14px] font-semibold text-ink truncate">{r.title}</div>
                  <div className="flex items-center gap-3 mt-1 text-[12px] text-ink/40">
                    <span>{r.author}</span>
                    <span>{formatDate(r.date)}</span>
                    <span>{formatBytes(r.sizeBytes)}</span>
                  </div>
                </div>
                <span className={cn("text-[11px] px-2 py-0.5 rounded-chip shrink-0 capitalize", STATUS_BADGE[r.status])}>
                  {r.status}
                </span>
              </div>
              {r.tags && r.tags.length > 0 && (
                <div className="flex gap-1.5 flex-wrap mt-2">
                  {r.tags.map((tag) => (
                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded-chip bg-accent/10 text-accent">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              {r.sections && r.sections.length > 0 && (
                <div className="mt-2 text-[11px] text-ink/30">
                  {r.sections.length} section{r.sections.length !== 1 ? "s" : ""} — click to view
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Report detail modal */}
      <AnimatePresence>
        {detailReport && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              onClick={() => setDetailReport(null)}
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              transition={springSettle}
              className="fixed inset-4 sm:inset-auto sm:top-[10%] sm:left-1/2 sm:-translate-x-1/2 sm:w-[640px] sm:max-h-[80vh] z-50 bg-card rounded-card shadow-modal overflow-y-auto"
            >
              <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between z-10">
                <div>
                  <h2 className="text-[18px] font-semibold text-ink">{detailReport.title}</h2>
                  <div className="flex items-center gap-3 mt-1 text-[12px] text-ink/40">
                    <span>{detailReport.author}</span>
                    <span>{formatDate(detailReport.date)}</span>
                    <span className={cn("px-2 py-0.5 rounded-chip capitalize", STATUS_BADGE[detailReport.status])}>
                      {detailReport.status}
                    </span>
                    <span>{formatBytes(detailReport.sizeBytes)}</span>
                  </div>
                </div>
                <button
                  onClick={() => setDetailReport(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-control text-ink/40 hover:text-ink/70 hover:bg-ink/5 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="px-6 py-5 space-y-5">
                {detailReport.tags && detailReport.tags.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap">
                    {detailReport.tags.map((tag) => (
                      <span key={tag} className="text-[11px] px-2.5 py-1 rounded-chip bg-accent/10 text-accent font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {detailReport.sections && detailReport.sections.length > 0 ? (
                  detailReport.sections.map((section, idx) => (
                    <div key={idx} className="border-l-2 border-accent/20 pl-4">
                      <h3 className="text-[14px] font-semibold text-ink mb-1.5">{section.heading}</h3>
                      <p className="text-[13px] text-ink/60 leading-relaxed">{section.body}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <FileText className="mx-auto mb-3 text-ink/20" size={32} />
                    <p className="text-[13px] text-ink/40">No structured sections yet</p>
                    <p className="text-[11px] text-ink/30 mt-1">Sections can be added via AI agent automation</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
