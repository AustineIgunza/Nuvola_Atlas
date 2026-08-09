import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { FileText, Plus, Star } from "lucide-react";
import { cn } from "@/lib/cn";
import { api } from "@/api";
import { formatDate, formatBytes } from "@/lib/format";
import { springSettle, staggerContainer, staggerItem } from "@/lib/motion";
import { STATUS_STYLES } from "./reports.constants";
import { useT } from "@/lib/i18n/use-t";
import DetailPopup from "@/components/common/DetailPopup";
import ReportDetail from "./ReportDetail";
import NewReportModal from "./NewReportModal";
import { useAuthStore, isInvestor } from "@/stores/auth";
import { useWatchlistStore } from "@/stores/watchlist";
import type { Report, ReportStatus } from "@/types";

// Filter labels resolved inside the component via useT so language flips
// take effect on the next render.
const FILTER_VALUES: (ReportStatus | "all")[] = ["all", "published", "review", "draft"];

export default function ReportsTable() {
  const t = useT();
  const [searchParams, setSearchParams] = useSearchParams();
  const zoneParam = searchParams.get("zone");
  const [filter, setFilter] = useState<ReportStatus | "all">("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  // Track which `?zone=` param we've already auto-opened so the user can close
  // the popup without it snapping back on the next re-render.
  const [autoOpenedFor, setAutoOpenedFor] = useState<string | null>(null);

  // Investor default: scope reports to the firm's watchlist. Toggleable so
  // an investor can still browse the whole library when they want to. The
  // toggle is not rendered for non-investors — they never see it.
  const user = useAuthStore((s) => s.user);
  const watchlistIds = useWatchlistStore((s) => s.ids);
  const investor = isInvestor(user);
  const [watchlistOnly, setWatchlistOnly] = useState(investor);
  // If a zone-scoped deeplink lands (`?zone=`) the investor filter would
  // hide the target report — drop the filter for that navigation.
  useEffect(() => {
    if (zoneParam) setWatchlistOnly(false);
  }, [zoneParam]);

  const { data: reports } = useQuery({
    queryKey: ["reports"],
    queryFn: api.getReports,
  });
  const { data: zones } = useQuery({
    queryKey: ["zones"],
    queryFn: api.getZones,
  });

  const detailReport = reports?.find((r) => r.id === detailId);

  const filtered =
    reports?.filter((r) => {
      if (filter !== "all" && r.status !== filter) return false;
      if (zoneParam && r.zoneId !== zoneParam) return false;
      if (investor && watchlistOnly && r.zoneId && !watchlistIds.has(r.zoneId)) return false;
      return true;
    }) ?? [];

  // Coming from the zone scorecard (`/reports?zone=xxx`): auto-open the actual
  // report for that zone — prefer the newest published report matching, then
  // fall back to the newest of any status. Only fires once per `?zone=` value.
  useEffect(() => {
    if (!zoneParam || !reports || autoOpenedFor === zoneParam) return;
    const forZone = reports.filter((r) => r.zoneId === zoneParam);
    const pickNewest = (list: Report[]) =>
      [...list].sort((a, b) => (a.date < b.date ? 1 : -1))[0];
    const target =
      pickNewest(forZone.filter((r) => r.status === "published")) ??
      pickNewest(forZone);
    if (target) setDetailId(target.id);
    setAutoOpenedFor(zoneParam);
  }, [zoneParam, reports, autoOpenedFor]);

  // Closing the auto-opened detail popup drops the `?zone=` param so the URL
  // reflects the visible state and refresh doesn't re-open the popup.
  const handleCloseDetail = () => {
    setDetailId(null);
    if (zoneParam) {
      const next = new URLSearchParams(searchParams);
      next.delete("zone");
      setSearchParams(next, { replace: true });
    }
  };

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
            {FILTER_VALUES.map((v) => {
              const label = v === "all"
                ? t("alerts.filter.all")
                : v === "published"
                ? t("reports.status.published")
                : v === "review"
                ? t("reports.status.review")
                : t("reports.status.draft");
              return (
                <motion.button
                  key={v}
                  onClick={() => setFilter(v)}
                  whileTap={{ scale: 0.93 }}
                  className={cn(
                    "relative px-3.5 h-8 rounded-chip text-[11px] font-medium transition-colors",
                    filter === v ? "text-white" : "text-ink-3 hover:text-ink-2",
                  )}
                >
                  {filter === v && (
                    <motion.div
                      layoutId="report-filter"
                      className="absolute inset-0 bg-accent rounded-chip glow-accent"
                      transition={springSettle}
                    />
                  )}
                  <span className="relative z-10">{label}</span>
                </motion.button>
              );
            })}
          </div>
          <div className="flex items-center gap-2 self-start">
            {investor && !zoneParam && (
              <button
                onClick={() => setWatchlistOnly((v) => !v)}
                aria-pressed={watchlistOnly}
                className={cn(
                  "h-8 px-3 rounded-chip border text-[11px] font-medium inline-flex items-center gap-1.5 transition-colors",
                  watchlistOnly
                    ? "border-[color:var(--gold,#E0A82E)] text-[color:var(--gold,#E0A82E)] bg-[rgba(224,168,46,0.10)]"
                    : "border-border text-ink-3 hover:text-ink-1",
                )}
                title={watchlistOnly ? t("reports.investorFilter.showAll") : t("reports.investorFilter.showWatchlist")}
              >
                <Star size={12} fill={watchlistOnly ? "currentColor" : "none"} />
                {t("reports.investorFilter.badge")}
              </button>
            )}
            {zoneParam && (
              <button
                onClick={() => {
                  const next = new URLSearchParams(searchParams);
                  next.delete("zone");
                  setSearchParams(next, { replace: true });
                }}
                className="h-8 px-3 rounded-chip bg-[rgba(255,255,255,0.06)] border border-border text-ink-2 text-[11px] font-medium hover:bg-[rgba(255,255,255,0.1)] transition-colors"
              >
                Zone: {zoneName(zoneParam)} · Clear
              </button>
            )}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-1.5 h-9 px-4 rounded-control bg-accent text-white text-[12px] font-medium hover:brightness-110 transition-all btn-glow"
            >
              <Plus size={14} />
              {t("reports.new")}
            </motion.button>
          </div>
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
            <motion.tbody
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              key={filter}
            >
              {filtered.map((r) => {
                const style = STATUS_STYLES[r.status];
                return (
                  <motion.tr
                    key={r.id}
                    variants={staggerItem}
                    transition={springSettle}
                    whileHover={{ backgroundColor: "rgba(255,255,255,0.03)" }}
                    onClick={() => setDetailId(r.id)}
                    className="border-b border-border/40 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-ink-4 shrink-0" />
                        <span className="text-ink-1 font-medium text-[13px]">{r.title}</span>
                        <span className="px-1 py-0.5 rounded text-[9px] font-bold text-ink-4 bg-[rgba(255,255,255,0.06)] uppercase shrink-0">
                          {r.format}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-ink-3 hidden sm:table-cell">{zoneName(r.zoneId)}</td>
                    <td className="py-3 px-2 text-ink-3 hidden md:table-cell">{r.author}</td>
                    <td className="py-3 px-2">
                      <motion.span
                        className={cn(
                          "px-2.5 py-1 rounded-full text-[10px] font-semibold capitalize inline-block",
                          style.glow,
                        )}
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

      <DetailPopup
        open={!!detailReport}
        onClose={handleCloseDetail}
        label="Report details"
        ariaLabel={detailReport ? `${detailReport.title} details` : "Report details"}
        wide
      >
        {detailReport && (
          <ReportDetail report={detailReport} zoneName={zoneName(detailReport.zoneId)} />
        )}
      </DetailPopup>

      <NewReportModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
