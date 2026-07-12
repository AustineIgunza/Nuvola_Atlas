import { useMemo } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight, Building2, Download, Sparkles, Star, TrendingDown, TrendingUp,
  AlertTriangle, Layers, Compass,
} from "lucide-react";
import AppShell from "@/components/chrome/AppShell";
import DealPipelineBoard from "@/components/investor/DealPipelineBoard";
import { api } from "@/api";
import { useAuthStore } from "@/stores/auth";
import { BRAND, PILLAR_COLORS, PILLAR_SHORT, scoreColor } from "@/lib/scoreColor";
import { springSettle } from "@/lib/motion";
import type { Zone, Project, AlertItem, PillarKey } from "@/types";

const PILLAR_KEYS: PillarKey[] = ["social", "safety", "density", "infra"];

/**
 * The purpose-built investor landing page. Aggregates the firm's watchlist
 * into a portfolio view, ranks non-watchlisted zones as opportunities
 * matched to firm tier, and offers a one-click LP-style brief.
 *
 * Same underlying data as the viewer atlas — different framing. The
 * ESG-lens toggle re-orders the scorecard sub-metrics inside the drill-in;
 * that surface lives on the shared Vitality/Compare pages.
 */
export default function InvestorPage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const firm = user?.firm;

  const { data: zones = [] } = useQuery({ queryKey: ["zones"], queryFn: api.getZones });
  const { data: projects = [] } = useQuery({ queryKey: ["projects"], queryFn: api.getProjects });
  const { data: alerts = [] } = useQuery({ queryKey: ["alerts"], queryFn: api.getAlerts });

  // Investors without a firm should never hit this screen — the auth
  // redirect covers login, but a legacy session might slip through.
  if (!firm) return <Navigate to="/atlas" replace />;

  const watchlistZones = useMemo(
    () => firm.watchlist.map((id) => zones.find((z) => z.id === id)).filter((z): z is Zone => Boolean(z)),
    [firm.watchlist, zones],
  );
  const nonWatchlistZones = useMemo(
    () => zones.filter((z) => !firm.watchlist.includes(z.id)),
    [firm.watchlist, zones],
  );

  const countyAvg = zones.length
    ? Math.round(zones.reduce((a, z) => a + z.score, 0) / zones.length)
    : 0;

  const portfolioAvg = watchlistZones.length
    ? Math.round(watchlistZones.reduce((a, z) => a + z.score, 0) / watchlistZones.length)
    : 0;

  const activeAlertsForFirm = alerts.filter(
    (a) => a.zoneId && firm.watchlist.includes(a.zoneId) && !a.read,
  );

  const projectsForFirm = projects.filter((p) => firm.watchlist.includes(p.zoneId));
  const activeProjectsForFirm = projectsForFirm.filter((p) => p.status === "active").length;

  // Investor composite for portfolio ranking — the "capital allocation lens".
  // Weights Safety and Infra heavier than Social/Density since those are the
  // pillars a VC prioritises for a defensible thesis. Not exposed as a knob
  // yet — that's the /investor page settings feature slated for later.
  const investorScore = (z: Zone) =>
    z.pillars.safety * 0.35 + z.pillars.infra * 0.35 + z.pillars.social * 0.15 + z.pillars.density * 0.15;

  const rankedPortfolio = [...watchlistZones].sort(
    (a, b) => investorScore(b) - investorScore(a),
  );

  const opportunities = useMemo(() => {
    // Tier-specific heuristic:
    //   basic     — highest overall Vitality (safest bets)
    //   deal      — high infra + safety spread from watchlist thesis
    //   sovereign — largest score deltas quarter-over-quarter (change opportunities)
    if (firm.tier === "basic") {
      return [...nonWatchlistZones].sort((a, b) => b.score - a.score).slice(0, 5);
    }
    if (firm.tier === "sovereign") {
      const delta = (z: Zone) =>
        z.deltas.social + z.deltas.safety + z.deltas.density + z.deltas.infra;
      return [...nonWatchlistZones].sort((a, b) => delta(b) - delta(a)).slice(0, 5);
    }
    return [...nonWatchlistZones].sort((a, b) => investorScore(b) - investorScore(a)).slice(0, 5);
  }, [nonWatchlistZones, firm.tier]);

  return (
    <AppShell>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto p-4 sm:p-6 space-y-4">
          <header className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-medium text-ink-4 uppercase tracking-[0.12em] flex items-center gap-1.5">
                <Building2 size={11} /> {firm.name} · {firm.tier} tier
              </div>
              <h1 className="text-[24px] font-semibold text-ink-1 leading-tight">Investor Dashboard</h1>
              <p className="mt-1.5 text-[12px] text-ink-3 max-w-[68ch]">
                Your firm's Nairobi portfolio at a glance. Watchlisted zones roll up here;
                the atlas, comparisons, and reports carry the same data with an
                ESG-lens applied to every scorecard.
              </p>
            </div>
            <button
              onClick={() => navigate(`/reports?firm=${firm.id}`)}
              className="shrink-0 inline-flex items-center gap-1.5 px-3 h-8 rounded-control bg-accent text-white text-[11.5px] font-semibold hover:brightness-110 btn-press"
              aria-label="Download investor brief PDF"
            >
              <Download size={12} />
              Download brief
            </button>
          </header>

          {/* Hero KPI tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <KpiTile
              label="Portfolio avg"
              value={portfolioAvg}
              suffix="/100"
              accent={scoreColor(portfolioAvg)}
              delta={portfolioAvg - countyAvg}
              deltaLabel="vs. county"
            />
            <KpiTile
              label="Watchlisted"
              value={firm.watchlist.length}
              suffix=" zones"
              accent={BRAND.teal}
            />
            <KpiTile
              label="Active projects"
              value={activeProjectsForFirm}
              suffix=" tracked"
              accent={BRAND.gold}
            />
            <KpiTile
              label="Alerts"
              value={activeAlertsForFirm.length}
              suffix=" open"
              accent={activeAlertsForFirm.length > 0 ? BRAND.rose : BRAND.steel}
            />
          </div>

          {/* Portfolio ranking */}
          <section className="rounded-card border border-border bg-[rgba(255,255,255,0.02)] p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3">
              <Compass size={13} style={{ color: BRAND.teal }} />
              <h2 className="text-[14px] font-semibold text-ink-1">Portfolio ranking</h2>
              <span className="text-[10px] text-ink-4 tracking-[0.06em]">
                Capital-allocation lens — weights Safety × Infra
              </span>
            </div>
            {rankedPortfolio.length === 0 ? (
              <div className="text-[11.5px] text-ink-4 italic">No zones on your watchlist yet.</div>
            ) : (
              <div className="space-y-2">
                {rankedPortfolio.map((z, i) => (
                  <PortfolioRow
                    key={z.id}
                    zone={z}
                    rank={i + 1}
                    investorScore={Math.round(investorScore(z))}
                    projects={projects}
                    onOpen={() => navigate(`/atlas?zone=${z.id}`)}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Top opportunities */}
          <section className="rounded-card border border-border bg-[rgba(255,255,255,0.02)] p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={13} style={{ color: BRAND.gold }} />
              <h2 className="text-[14px] font-semibold text-ink-1">Top opportunities</h2>
              <span className="text-[10px] text-ink-4 tracking-[0.06em]">
                {firm.tier === "basic" ? "Ranked by Vitality — safest positions"
                : firm.tier === "sovereign" ? "Ranked by quarter-over-quarter momentum"
                : "Ranked by capital-allocation lens — zones you don't yet watch"}
              </span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {opportunities.map((z) => (
                <OpportunityCard
                  key={z.id}
                  zone={z}
                  onOpen={() => navigate(`/atlas?zone=${z.id}`)}
                />
              ))}
            </div>
          </section>

          {/* Watchlist activity feed */}
          <section className="rounded-card border border-border bg-[rgba(255,255,255,0.02)] p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={13} style={{ color: BRAND.rose }} />
              <h2 className="text-[14px] font-semibold text-ink-1">Deal-relevant activity</h2>
              <span className="text-[10px] text-ink-4 tracking-[0.06em]">
                Alerts on watchlisted zones — sorted by severity
              </span>
            </div>
            {activeAlertsForFirm.length === 0 ? (
              <div className="text-[11.5px] text-ink-4 italic">No open alerts on your watchlist.</div>
            ) : (
              <ul className="space-y-1.5">
                {activeAlertsForFirm.slice(0, 6).map((a) => {
                  const z = zones.find((zone) => zone.id === a.zoneId);
                  const severityColor: Record<AlertItem["severity"], string> = {
                    high: BRAND.rose,
                    medium: BRAND.gold,
                    low: BRAND.steel,
                  };
                  return (
                    <li
                      key={a.id}
                      className="flex items-start gap-2 rounded-control border border-border bg-[rgba(255,255,255,0.02)] p-2.5"
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                        style={{ background: severityColor[a.severity] }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-[11.5px] font-medium text-ink-1">{a.title}</div>
                        <div className="text-[10px] text-ink-4 mt-0.5">
                          {z?.name ?? a.zoneId} · {a.impactLevel}
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/alerts?id=${a.id}`)}
                        aria-label="Open alert"
                        className="shrink-0 text-ink-4 hover:text-ink-2"
                      >
                        <ArrowRight size={12} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <DealPipelineBoard />

          <FirmThesisCard firm={firm} />
        </div>
      </div>
    </AppShell>
  );
}

function KpiTile({ label, value, suffix, accent, delta, deltaLabel }: {
  label: string;
  value: number;
  suffix?: string;
  accent: string;
  delta?: number;
  deltaLabel?: string;
}) {
  const trend = delta === undefined ? null : delta >= 0 ? "up" : "down";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springSettle}
      className="rounded-card border border-border bg-[rgba(255,255,255,0.03)] p-3.5"
    >
      <div className="text-[9.5px] font-medium text-ink-4 uppercase tracking-[0.1em]">
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className="text-[28px] font-semibold tabular-nums" style={{ color: accent }}>
          {value}
        </span>
        {suffix && <span className="text-[11px] text-ink-4">{suffix}</span>}
      </div>
      {trend && (
        <div className="mt-1.5 flex items-center gap-1 text-[10.5px]" style={{ color: delta! >= 0 ? BRAND.teal : BRAND.rose }}>
          {trend === "up" ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          <span className="font-semibold">
            {delta! >= 0 ? "+" : ""}{delta}
          </span>
          <span className="text-ink-4 ml-1">{deltaLabel}</span>
        </div>
      )}
    </motion.div>
  );
}

function PortfolioRow({
  zone, rank, investorScore, projects, onOpen,
}: {
  zone: Zone;
  rank: number;
  investorScore: number;
  projects: Project[];
  onOpen: () => void;
}) {
  const projectCount = projects.filter((p) => p.zoneId === zone.id).length;
  const activeProjects = projects.filter((p) => p.zoneId === zone.id && p.status === "active").length;
  return (
    <button
      onClick={onOpen}
      className="w-full flex items-center gap-2 sm:gap-3 rounded-control border border-border bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.05)] transition-colors px-2.5 sm:px-3 py-2.5 text-left"
    >
      <span className="w-6 h-6 rounded-full grid place-items-center text-[10.5px] font-semibold text-ink-1 bg-[rgba(255,255,255,0.06)] shrink-0">
        {rank}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[12.5px] font-semibold text-ink-1 truncate">{zone.name}</div>
        <div className="text-[9.5px] text-ink-4 tracking-[0.02em] truncate">
          {projectCount} projects · {activeProjects} active
        </div>
      </div>
      {/* Pillar quartet — hide on mobile to keep the row scannable */}
      <div className="hidden sm:flex gap-2 shrink-0">
        {PILLAR_KEYS.map((k) => (
          <div key={k} className="flex flex-col items-center">
            <span className="text-[11.5px] font-semibold tabular-nums" style={{ color: PILLAR_COLORS[k] }}>
              {zone.pillars[k]}
            </span>
            <span className="text-[8.5px] text-ink-4">{PILLAR_SHORT[k]}</span>
          </div>
        ))}
      </div>
      <div className="w-12 sm:w-14 text-right shrink-0">
        <div className="text-[15px] sm:text-[16px] font-semibold tabular-nums" style={{ color: scoreColor(zone.score) }}>
          {investorScore}
        </div>
        <div className="text-[8.5px] text-ink-4">lens</div>
      </div>
      <ArrowRight size={13} className="text-ink-4 shrink-0 hidden sm:block" />
    </button>
  );
}

function OpportunityCard({ zone, onOpen }: { zone: Zone; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="rounded-control border border-border bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.06)] transition-colors p-3 text-left group"
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-[10px] text-ink-4 uppercase tracking-[0.08em]">Opportunity</div>
          <div className="text-[13px] font-semibold text-ink-1 mt-0.5 truncate">{zone.name}</div>
        </div>
        <span
          className="text-[18px] font-semibold tabular-nums shrink-0"
          style={{ color: scoreColor(zone.score) }}
        >
          {zone.score}
        </span>
      </div>
      <div className="mt-2 grid grid-cols-4 gap-1">
        {PILLAR_KEYS.map((k) => (
          <div key={k} className="rounded-chip bg-[rgba(255,255,255,0.03)] p-1 text-center">
            <div className="text-[10px] font-semibold tabular-nums" style={{ color: PILLAR_COLORS[k] }}>
              {zone.pillars[k]}
            </div>
            <div className="text-[8px] text-ink-4">{PILLAR_SHORT[k]}</div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-1 text-[10px] text-ink-3 group-hover:text-ink-1 transition-colors">
        <Star size={10} /> Watch this zone <ArrowRight size={10} className="ml-auto" />
      </div>
    </button>
  );
}

function FirmThesisCard({ firm }: { firm: NonNullable<ReturnType<typeof useAuthStore.getState>["user"]>["firm"] }) {
  if (!firm) return null;
  return (
    <section className="rounded-card border border-border bg-[rgba(31,138,120,0.06)] p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-2">
        <Layers size={13} style={{ color: BRAND.teal }} />
        <h2 className="text-[13px] font-semibold text-ink-1">{firm.name} · Thesis</h2>
        <span
          className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-[0.06em]"
          style={{ background: `${BRAND.teal}22`, color: BRAND.teal }}
        >
          {firm.tier}
        </span>
      </div>
      <p className="text-[11.5px] text-ink-3 leading-relaxed">
        {firm.tier === "sovereign"
          ? "County-wide corridor programme — every ward is tracked. Portfolio ranking surfaces the ones moving fastest."
          : firm.tier === "deal"
          ? "Impact-first deal team. Portfolio balances high-Vitality zones against social-pillar-recoverable zones for blended-finance positions."
          : "Digital-first growth thesis. Portfolio favours connectivity + density signals over pure Vitality rank."}
      </p>
    </section>
  );
}
