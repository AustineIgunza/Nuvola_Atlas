import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Droplets, Info, Download, ChevronDown } from "lucide-react";
import { BASE, USE_MOCK, authHeaders } from "@/api/client";
import { api } from "@/api";
import { BRAND } from "@/lib/scoreColor";
import { averageDelta } from "@/domain/deltas";
import { waterProfile } from "@/domain/water";
import { formatScore } from "@/domain/scores";
import { formatRelative } from "@/lib/format";
import { useT } from "@/lib/i18n/use-t";
import Ring from "../Ring";
import PillarBar from "../PillarBar";
import ZoneRanking from "../ZoneRanking";
import ActivityFeed from "../ActivityFeed";
import ScoreHistoryChart from "./ScoreHistoryChart";
import PillarCoverageChip from "./PillarCoverageChip";
import PillarProvenancePanel from "./PillarProvenancePanel";
import { Section, Chip, StatCell, SEVERITY_COLOR, IMPACT_COLOR, STATUS_STYLE } from "./bits";
import ZoneNotesCard from "@/components/investor/ZoneNotesCard";
import { PILLARS } from "@/domain/pillars.generated";
import { isEstimated } from "@/domain/estimates";
import type { PanelView } from "./panel-types";
import type { Zone, PillarKey } from "@/domain/types";

// Registry order: water first as the flagship, electricity last because it is
// held. There is no second ordering — a lens that reshuffles the pillars would
// imply a reader can reweight them, and only the published weights do that.
const PILLAR_ORDER = PILLARS.map((p) => p.key as PillarKey);

interface Props {
  zone: Zone;
  onNavigate: (view: PanelView) => void;
}

export default function OverviewView({ zone, onNavigate }: Props) {
  const t = useT();
  const navigate = useNavigate();
  const [exporting, setExporting] = useState(false);
  const { data: projects } = useQuery({ queryKey: ["projects"], queryFn: api.getProjects });
  const { data: alerts } = useQuery({ queryKey: ["alerts"], queryFn: api.getAlerts });
  const zoneProjects = (projects ?? []).filter((p) => p.zoneId === zone.id);
  const zoneAlerts = (alerts ?? []).filter((a) => a.zoneId === zone.id);
  // Null when the zone has no pillar readings — the SDG-6 need weighting has
  // no inputs, and the card is suppressed rather than shown with fabricated
  // access / queue numbers.
  const wp = waterProfile(zone);
  const waterAccent = wp?.opportunity ? BRAND.teal : BRAND.steel;

  const totalDelta = averageDelta(zone.deltas);

  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!exportMenuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setExportMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [exportMenuOpen]);

  const clientTxt = useCallback(() => {
    const scoreLine =
      zone.score === null
        ? "Service-performance score: insufficient data"
        : `Service-performance score: ${zone.score}/100`;
    const waterLines = wp
      ? [
          ``,
          `Water & Sanitation (SDG 6): ${wp.contextLabel}`,
          `  Unmet need: ${wp.needPct}/100`,
          `  Recommended: ${wp.solutionTag}`,
        ]
      : [];
    const content = [
      `NAVUUNA — Sub-county Report`,
      `Sub-county: ${zone.name}`,
      scoreLine,
      ``,
      `Pillars:`,
      ...PILLARS.map(
        (p) =>
          `  ${p.displayName}: ${formatScore(zone.pillars[p.key as PillarKey])}` +
          (p.vintage ? ` (${p.vintage})` : ``),
      ),
      ...waterLines,
      ``,
      `Generated: ${new Date().toLocaleString()}`,
    ].join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    triggerDownload(blob, `${zone.id}-navuuna-report.txt`);
  }, [zone, wp]);

  const serverExport = useCallback(
    async (format: "txt" | "pdf" | "docx") => {
      const res = await fetch(`${BASE}/zones/${zone.id}/export?format=${format}`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error(`Export failed (${res.status})`);
      const blob = await res.blob();
      triggerDownload(blob, `${zone.id}-vitality-report.${format}`);
    },
    [zone.id],
  );

  const handleExport = useCallback(
    async (format: "txt" | "pdf" | "docx") => {
      if (exporting) return;
      setExportMenuOpen(false);
      setExporting(true);
      try {
        // TXT works client-side even in mock/offline mode — the other two
        // formats need the server-generated document. In mock mode we fall
        // back to the client TXT for all three so the UI still demonstrates.
        if (USE_MOCK || format === "txt") {
          clientTxt();
        } else {
          await serverExport(format);
        }
      } finally {
        setExporting(false);
      }
    },
    [exporting, clientTxt, serverExport],
  );

  return (
    <div className="space-y-3">
      {/* Hero — composite score; opens the index methodology explainer */}
      <button
        onClick={() => onNavigate({ type: "index" })}
        className="group w-full text-left rounded-card bg-[rgba(255,255,255,0.02)] border border-border p-3 hover:bg-[rgba(255,255,255,0.05)] transition-colors"
      >
        <div className="flex items-center gap-3">
          <Ring score={zone.score} size={76} />
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-medium text-ink-4 uppercase tracking-[0.1em]">
              {t("scorecard.header.indexTitle")}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              {totalDelta === null || zone.deltaWindowDays === null ? (
                <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium bg-[rgba(255,255,255,0.05)] text-ink-4">
                  {t("scorecard.deltaUnknown")}
                </span>
              ) : (
                <span
                  className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium"
                  style={{
                    background: totalDelta >= 0 ? "rgba(31,138,120,0.12)" : "rgba(211,64,46,0.12)",
                    color: totalDelta >= 0 ? BRAND.teal : BRAND.rose,
                  }}
                >
                  {t("scorecard.deltaOverDays", {
                    arrow: totalDelta >= 0 ? "▲" : "▼",
                    value: Math.abs(totalDelta),
                    days: zone.deltaWindowDays,
                  })}
                </span>
              )}
              <PillarCoverageChip zone={zone} />
            </div>
            <p className="text-[10px] text-ink-4 mt-1">
              {t("scorecard.lastSyncShort", { min: zone.lastSyncMin })}
            </p>
          </div>
          <ChevronRight
            size={14}
            className="shrink-0 text-ink-4 group-hover:text-ink-2 transition-colors"
          />
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-ink-4">
          <Info size={10} className="shrink-0" />
          {t("scorecard.howComputed")}
        </div>
      </button>

      {/* Investor private notes — only rendered when the signed-in user
          is an investor. Non-investors see nothing. Notes are scoped to
          the user's firm and persist locally. */}
      <ZoneNotesCard zoneId={zone.id} zoneName={zone.name} />

      {/* Score history — trend over selected range */}
      <ScoreHistoryChart zoneId={zone.id} />

      {/* Pillars — each row drills into the pillar explainer */}
      <Section title={t("scorecard.pillars")} className="px-1.5 py-1">
        {PILLAR_ORDER.map((key, i) => (
          <button
            key={key}
            onClick={() => onNavigate({ type: "pillar", key })}
            className="group w-full flex items-center gap-1 text-left rounded-control px-1.5 hover:bg-[rgba(255,255,255,0.05)] transition-colors"
          >
            <div className="flex-1 min-w-0">
              <PillarBar
                pillarKey={key}
                score={zone.pillars[key]}
                delta={zone.deltas[key]}
                index={i}
                estimated={isEstimated(zone, `pillars.${key}`)}
              />
            </div>
            <ChevronRight
              size={13}
              className="shrink-0 text-ink-4 group-hover:text-ink-2 transition-colors"
            />
          </button>
        ))}
      </Section>

      {/* Provenance ledger — source, vintage and granularity per pillar */}
      <PillarProvenancePanel zone={zone} />

      {/* Water & Sanitation — opens the SDG 6 explainer. Suppressed entirely
          when the sub-county has no water & sanitation reading. */}
      {wp && (
        <button
          onClick={() => onNavigate({ type: "water" })}
          className="group w-full text-left rounded-card border p-2.5 transition-colors hover:brightness-110"
          style={{ background: `${waterAccent}0F`, borderColor: `${waterAccent}33` }}
        >
          <div className="flex items-center gap-1.5">
            <Droplets size={12} style={{ color: BRAND.teal }} className="shrink-0" />
            <span className="text-[9.5px] font-semibold text-ink-2 uppercase tracking-[0.08em]">
              {t("compare.water")}
            </span>
            <span className="ml-auto shrink-0">
              <Chip color={waterAccent}>{wp.contextLabel}</Chip>
            </span>
            <ChevronRight
              size={13}
              className="shrink-0 text-ink-4 group-hover:text-ink-2 transition-colors"
            />
          </div>
          <div className="mt-2">
            <StatCell value={`${wp.needPct}/100`} label={t("scorecard.water.unmetNeed")} />
          </div>
          <div className="mt-2 flex items-center gap-1.5 min-w-0">
            <span
              className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
              style={{ background: waterAccent, color: BRAND.bone }}
            >
              {wp.solutionTag}
            </span>
            <span className="text-[10px] truncate" style={{ color: waterAccent }}>
              {wp.opportunity ? t("scorecard.water.opportunity") : t("scorecard.water.sewerage")}
            </span>
          </div>
        </button>
      )}

      {/* Infrastructure projects — each row drills into the project explainer */}
      <Section
        title={t("scorecard.infra.title", {
          count: zoneProjects.length,
          noun: t(
            zoneProjects.length === 1 ? "scorecard.infra.noun.one" : "scorecard.infra.noun.many",
          ),
        })}
        action={
          <button
            onClick={() => navigate("/infrastructure")}
            className="text-[10px] text-ink-4 hover:text-ink-2 transition-colors"
          >
            {t("scorecard.viewAll")}
          </button>
        }
      >
        {zoneProjects.length > 0 ? (
          <div className="space-y-1.5">
            {zoneProjects.map((p) => {
              const st = STATUS_STYLE[p.status];
              const barColor = p.status === "stalled" ? BRAND.rose : BRAND.terracotta;
              return (
                <button
                  key={p.id}
                  onClick={() => onNavigate({ type: "project", id: p.id })}
                  className="group w-full text-left rounded-control bg-[rgba(255,255,255,0.02)] border border-border p-2 hover:bg-[rgba(255,255,255,0.06)] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0 text-[11px] font-medium text-ink-1 truncate">
                      {p.name}
                    </div>
                    <Chip color={st.color}>{st.label}</Chip>
                    <ChevronRight
                      size={12}
                      className="shrink-0 text-ink-4 group-hover:text-ink-2 transition-colors"
                    />
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex-1 h-[3px] rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${p.progress}%`,
                          background: barColor,
                          boxShadow: `0 0 4px ${barColor}55`,
                        }}
                      />
                    </div>
                    <span
                      className="text-[10.5px] font-semibold tabular-nums shrink-0"
                      style={{ color: barColor }}
                    >
                      {p.progress}%
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-[10.5px] text-ink-4 leading-[1.5]">
            {t("scorecard.infra.empty", { zone: zone.name })}
          </p>
        )}
      </Section>

      {/* Alerts — each row drills into the alert explainer */}
      <Section
        title={t("scorecard.alerts.title", { count: zoneAlerts.length })}
        action={
          <button
            onClick={() => navigate("/alerts")}
            className="text-[10px] text-ink-4 hover:text-ink-2 transition-colors"
          >
            {t("scorecard.viewAll")}
          </button>
        }
      >
        {zoneAlerts.length > 0 ? (
          <div className="space-y-1.5">
            {zoneAlerts.map((a) => {
              const color = SEVERITY_COLOR[a.severity];
              return (
                <button
                  key={a.id}
                  onClick={() => onNavigate({ type: "alert", id: a.id })}
                  className="group w-full text-left rounded-control bg-[rgba(255,255,255,0.02)] border border-border p-2 hover:bg-[rgba(255,255,255,0.06)] transition-colors"
                >
                  <div className="flex items-start gap-1.5">
                    <span
                      className="w-1.5 h-1.5 rounded-full mt-1 shrink-0"
                      style={{ background: color, boxShadow: `0 0 6px ${color}66` }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] text-ink-2 font-medium leading-snug">
                        {a.title}
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 text-[9.5px] text-ink-4">
                        <span className="capitalize">
                          <Chip color={IMPACT_COLOR[a.impactLevel] ?? BRAND.steel}>
                            {a.impactLevel}
                          </Chip>
                        </span>
                        <span>{formatRelative(a.createdAt)}</span>
                      </div>
                    </div>
                    <ChevronRight
                      size={12}
                      className="shrink-0 mt-0.5 text-ink-4 group-hover:text-ink-2 transition-colors"
                    />
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-[10.5px] text-ink-4 leading-[1.5]">{t("scorecard.alerts.empty")}</p>
        )}
      </Section>

      <ZoneRanking currentZone={zone} />

      <Section>
        <ActivityFeed zoneId={zone.id} />
      </Section>

      <div className="flex gap-2">
        <button
          onClick={() => navigate(`/reports?zone=${zone.id}`)}
          className="flex-1 h-8 rounded-control bg-accent text-white text-[11px] font-medium hover:brightness-110 transition-all btn-glow"
        >
          {t("scorecard.openFullReport")}
        </button>
        <div className="relative flex-1" ref={exportMenuRef}>
          <button
            onClick={() => setExportMenuOpen((v) => !v)}
            disabled={exporting}
            className="w-full h-8 rounded-control bg-[rgba(255,255,255,0.06)] border border-border text-ink-2 text-[11px] font-medium hover:bg-[rgba(255,255,255,0.1)] transition-colors inline-flex items-center justify-center gap-1.5"
          >
            <Download size={12} />
            {exporting ? t("scorecard.exporting") : t("scorecard.export")}
            <ChevronDown size={11} className="opacity-70" />
          </button>
          {exportMenuOpen && (
            <div className="absolute bottom-9 right-0 w-40 rounded-card border border-border bg-[rgba(15,26,38,0.94)] backdrop-blur-md shadow-modal p-1 z-40">
              {(["pdf", "docx", "txt"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => handleExport(f)}
                  className="w-full text-left px-2.5 py-1.5 rounded-chip text-[10.5px] text-ink-2 hover:bg-[rgba(255,255,255,0.06)] transition-colors flex items-center justify-between"
                >
                  <span>
                    {t(
                      f === "pdf"
                        ? "scorecard.export.pdf"
                        : f === "docx"
                          ? "scorecard.export.docx"
                          : "scorecard.export.txt",
                    )}
                  </span>
                  <span className="text-[8.5px] text-ink-4 uppercase">.{f}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
