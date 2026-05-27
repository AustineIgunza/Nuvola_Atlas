import { motion } from "framer-motion";
import { X, Calendar, User, Tag, Layers } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatDate, formatBytes } from "@/lib/format";
import { springSettle, modalBackdrop, modalContent } from "@/lib/motion";
import { PILLAR_COLORS, PILLAR_LABELS } from "@/lib/scoreColor";
import { STATUS_STYLES, PRIORITY_STYLES, TYPE_LABELS } from "./reports.constants";
import type { Report, PillarKey } from "@/types";

interface Props {
  report: Report;
  zoneName: string;
  onClose: () => void;
}

export default function ReportDetailModal({ report, zoneName, onClose }: Props) {
  const status = STATUS_STYLES[report.status];
  const priority = PRIORITY_STYLES[report.priority] ?? PRIORITY_STYLES.medium;
  const sections = report.sections ?? [];
  const tags = report.tags ?? [];
  const pillarFocus = report.pillarFocus ?? [];

  return (
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
        className="relative glass-strong rounded-modal w-full max-w-[680px] shadow-modal flex flex-col max-h-[85vh]"
      >
        {/* Sticky header */}
        <div className="sticky top-0 z-10 glass-strong rounded-t-modal border-b border-border/40 px-6 py-4 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="text-[17px] font-semibold text-ink-1 leading-snug truncate">
                {report.title}
              </h2>
              <div className="flex items-center gap-3 mt-2 flex-wrap text-[12px]">
                <span className="flex items-center gap-1 text-ink-3">
                  <User size={12} className="text-ink-4" />
                  {report.author}
                </span>
                <span className="flex items-center gap-1 text-ink-3">
                  <Calendar size={12} className="text-ink-4" />
                  {formatDate(report.date)}
                </span>
                <span className="text-ink-4">{zoneName}</span>
              </div>
              {/* Badges */}
              <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                <span
                  className={cn(
                    "px-2.5 py-0.5 rounded-full text-[10px] font-semibold capitalize",
                    status.glow,
                  )}
                  style={{ background: status.bg, color: status.text }}
                >
                  {report.status}
                </span>
                {report.priority && (
                  <span
                    className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold capitalize"
                    style={{ background: priority.bg, color: priority.text }}
                  >
                    {report.priority}
                  </span>
                )}
                {report.type && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-accent/10 text-accent">
                    {TYPE_LABELS[report.type] ?? report.type}
                  </span>
                )}
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold text-ink-4 bg-[rgba(255,255,255,0.06)] uppercase">
                  {report.format}
                </span>
              </div>
            </div>
            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-[rgba(255,255,255,0.06)] text-ink-4 hover:text-ink-2 shrink-0"
              aria-label="Close"
            >
              <X size={14} />
            </motion.button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {report.executiveSummary && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <h3 className="text-[13px] font-semibold text-ink-2 mb-2">
                Executive Summary
              </h3>
              <p className="text-[13px] text-ink-3 leading-relaxed bg-[rgba(255,255,255,0.03)] rounded-control p-3 border border-border/30">
                {report.executiveSummary}
              </p>
            </motion.div>
          )}

          {report.dateRange && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="flex items-center gap-2 text-[12px] text-ink-3"
            >
              <Calendar size={13} className="text-ink-4" />
              <span>
                {formatDate(report.dateRange.from)} &mdash;{" "}
                {formatDate(report.dateRange.to)}
              </span>
            </motion.div>
          )}

          {pillarFocus.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h3 className="text-[13px] font-semibold text-ink-2 mb-2 flex items-center gap-1.5">
                <Layers size={13} className="text-ink-4" />
                Pillar Focus
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                {pillarFocus.map((pk: PillarKey) => (
                  <span
                    key={pk}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
                    style={{
                      background: `${PILLAR_COLORS[pk]}15`,
                      color: PILLAR_COLORS[pk],
                    }}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ background: PILLAR_COLORS[pk] }}
                    />
                    {PILLAR_LABELS[pk] ?? pk}
                  </span>
                ))}
              </div>
            </motion.div>
          )}

          {tags.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
            >
              <h3 className="text-[13px] font-semibold text-ink-2 mb-2 flex items-center gap-1.5">
                <Tag size={13} className="text-ink-4" />
                Tags
              </h3>
              <div className="flex items-center gap-1.5 flex-wrap">
                {tags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-accent/10 text-accent"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          )}

          {sections.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="space-y-4"
            >
              <h3 className="text-[13px] font-semibold text-ink-2">
                Report Sections
              </h3>
              {sections.map((section, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.18 + i * 0.04 }}
                  className="border-l-2 border-accent/20 pl-4"
                >
                  <h4 className="text-[13px] font-semibold text-ink-1 mb-1.5">
                    {section.heading}
                  </h4>
                  <div className="text-[12px] text-ink-3 leading-relaxed space-y-2">
                    {section.content.split("\n").map((para, j) =>
                      para.trim() ? (
                        <p key={j}>{para}</p>
                      ) : null,
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          <div className="pt-3 border-t border-border/30 flex items-center justify-between text-[11px] text-ink-4">
            <span>{formatBytes(report.sizeBytes)}</span>
            <span>ID: {report.id}</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
