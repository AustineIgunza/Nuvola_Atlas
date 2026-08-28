import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { api } from "@/api";
import { springSettle, modalBackdrop, modalContent } from "@/shared/lib/motion";
import { PILLAR_COLORS, PILLAR_LABELS } from "@/shared/lib/scoreColor";
import { PILLAR_KEYS } from "@/domain/pillars.generated";
import type { PillarKey } from "@/domain/types";

interface Props {
  open: boolean;
  onClose: () => void;
}

const REPORT_TYPES = [
  { value: "service_performance", label: "Service-performance Assessment" },
  { value: "water_sanitation", label: "Water & Sanitation (SDG 6)" },
  { value: "infrastructure", label: "Infrastructure Progress" },
  { value: "methodology", label: "Methodology & Provenance" },
];

const PRIORITIES = [
  { value: "critical", label: "Critical", color: "#D3402E" },
  { value: "high", label: "High", color: "#C0552B" },
  { value: "medium", label: "Medium", color: "#E0A82E" },
  { value: "low", label: "Low", color: "#1F8A78" },
];

const SUGGESTED_TAGS = [
  "quarterly",
  "baseline",
  "county-wide",
  "water",
  "sanitation",
  "SDG-6",
  "infrastructure",
  "road-progress",
  "transit",
  "informal-settlement",
  "provenance",
  "survey",
  "urban-planning",
];

export default function NewReportModal({ open, onClose }: Props) {
  const [title, setTitle] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [type, setType] = useState("service_performance");
  const [priority, setPriority] = useState("medium");
  const [pillarFocus, setPillarFocus] = useState<PillarKey[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [summary, setSummary] = useState("");
  const queryClient = useQueryClient();

  const { data: zones } = useQuery({ queryKey: ["zones"], queryFn: api.getZones, enabled: open });

  const mutation = useMutation({
    mutationFn: () => api.createReport({ title, zoneId: zoneId || null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      resetForm();
      onClose();
    },
  });

  function resetForm() {
    setTitle("");
    setZoneId("");
    setType("service_performance");
    setPriority("medium");
    setPillarFocus([]);
    setTags([]);
    setTagInput("");
    setSummary("");
  }

  function togglePillar(key: PillarKey) {
    setPillarFocus((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  }

  function addTag(tag: string) {
    const t = tag.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
    setTagInput("");
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            variants={modalBackdrop}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60"
            onClick={onClose}
          />
          <motion.div
            variants={modalContent}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={springSettle}
            className="relative glass-strong rounded-modal w-full max-w-[560px] shadow-modal flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 glass-strong rounded-t-modal border-b border-border/40 px-6 py-4 shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="text-[17px] font-semibold text-ink-1">New Report</h2>
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-[rgba(255,255,255,0.06)] text-ink-4 hover:text-ink-2"
                  aria-label="Close"
                >
                  <X size={14} />
                </motion.button>
              </div>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
              {/* Title */}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
              >
                <label
                  htmlFor="report-title"
                  className="block text-[12px] font-medium text-ink-3 mb-1.5"
                >
                  Title *
                </label>
                <input
                  id="report-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full h-10 px-3 rounded-control bg-[rgba(255,255,255,0.06)] border border-border text-ink-1 text-[13px] placeholder:text-ink-4 focus:border-accent transition-all"
                  placeholder="e.g. Westlands Q2 Infrastructure Progress"
                />
              </motion.div>

              {/* Zone + Type row */}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
                className="grid grid-cols-2 gap-3"
              >
                <div>
                  <label
                    htmlFor="report-zone"
                    className="block text-[12px] font-medium text-ink-3 mb-1.5"
                  >
                    Zone
                  </label>
                  <select
                    id="report-zone"
                    value={zoneId}
                    onChange={(e) => setZoneId(e.target.value)}
                    className="w-full h-10 px-3 rounded-control bg-[rgba(255,255,255,0.06)] border border-border text-ink-1 text-[13px] focus:border-accent transition-all"
                  >
                    <option value="">All zones</option>
                    {zones?.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="report-type"
                    className="block text-[12px] font-medium text-ink-3 mb-1.5"
                  >
                    Report Type
                  </label>
                  <select
                    id="report-type"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full h-10 px-3 rounded-control bg-[rgba(255,255,255,0.06)] border border-border text-ink-1 text-[13px] focus:border-accent transition-all"
                  >
                    {REPORT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </motion.div>

              {/* Priority */}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <span
                  id="report-priority-label"
                  className="block text-[12px] font-medium text-ink-3 mb-2"
                >
                  Priority
                </span>
                <div className="flex gap-2" role="group" aria-labelledby="report-priority-label">
                  {PRIORITIES.map((p) => (
                    <motion.button
                      key={p.value}
                      whileTap={{ scale: 0.93 }}
                      onClick={() => setPriority(p.value)}
                      className={cn(
                        "relative flex-1 h-9 rounded-control text-[12px] font-medium transition-all border",
                        priority === p.value
                          ? "text-white border-transparent"
                          : "text-ink-3 border-border hover:border-border-strong",
                      )}
                      style={
                        priority === p.value
                          ? {
                              background: `${p.color}25`,
                              color: p.color,
                              boxShadow: `0 0 10px ${p.color}33`,
                              borderColor: `${p.color}44`,
                            }
                          : {}
                      }
                    >
                      {p.label}
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {/* Pillar Focus */}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 }}
              >
                <span
                  id="report-pillar-label"
                  className="block text-[12px] font-medium text-ink-3 mb-2"
                >
                  Pillar Focus
                </span>
                <div
                  className="flex flex-wrap gap-2"
                  role="group"
                  aria-labelledby="report-pillar-label"
                >
                  {PILLAR_KEYS.map((pk) => {
                    const active = pillarFocus.includes(pk);
                    const color = PILLAR_COLORS[pk];
                    return (
                      <motion.button
                        key={pk}
                        whileTap={{ scale: 0.93 }}
                        onClick={() => togglePillar(pk)}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all",
                          active
                            ? "border-transparent"
                            : "border-border text-ink-3 hover:border-border-strong",
                        )}
                        style={
                          active
                            ? {
                                background: `${color}18`,
                                color,
                                boxShadow: `0 0 8px ${color}33`,
                                borderColor: `${color}33`,
                              }
                            : {}
                        }
                      >
                        <span
                          className="w-2 h-2 rounded-full transition-opacity"
                          style={{ background: color, opacity: active ? 1 : 0.4 }}
                        />
                        {PILLAR_LABELS[pk]}
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>

              {/* Tags */}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.14 }}
              >
                <label
                  htmlFor="report-tags"
                  className="block text-[12px] font-medium text-ink-3 mb-1.5"
                >
                  Tags
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {tags.map((tag) => (
                    <motion.span
                      key={tag}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-accent/10 text-accent"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="hover:text-white transition-colors"
                      >
                        <X size={10} />
                      </button>
                    </motion.span>
                  ))}
                </div>
                <input
                  id="report-tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      addTag(tagInput);
                    }
                  }}
                  className="w-full h-9 px-3 rounded-control bg-[rgba(255,255,255,0.06)] border border-border text-ink-1 text-[12px] placeholder:text-ink-4 focus:border-accent transition-all"
                  placeholder="Type and press Enter to add"
                />
                <div className="flex flex-wrap gap-1 mt-2">
                  {SUGGESTED_TAGS.filter((t) => !tags.includes(t))
                    .slice(0, 8)
                    .map((t) => (
                      <button
                        key={t}
                        onClick={() => addTag(t)}
                        className="px-2 py-0.5 rounded-full text-[10px] text-ink-4 bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] hover:text-ink-3 transition-colors"
                      >
                        + {t}
                      </button>
                    ))}
                </div>
              </motion.div>

              {/* Executive Summary */}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.16 }}
              >
                <label
                  htmlFor="report-summary"
                  className="block text-[12px] font-medium text-ink-3 mb-1.5"
                >
                  Executive Summary
                </label>
                <textarea
                  id="report-summary"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 rounded-control bg-[rgba(255,255,255,0.06)] border border-border text-ink-1 text-[13px] placeholder:text-ink-4 focus:border-accent transition-all resize-none leading-relaxed"
                  placeholder="Brief overview of the report's key findings and recommendations..."
                />
              </motion.div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 glass-strong rounded-b-modal border-t border-border/40 px-6 py-4 shrink-0">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => mutation.mutate()}
                disabled={!title || mutation.isPending}
                className="w-full h-10 rounded-control bg-accent text-white text-[13px] font-medium hover:brightness-110 disabled:opacity-50 transition-all btn-glow"
              >
                {mutation.isPending ? (
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  "Generate Report"
                )}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
