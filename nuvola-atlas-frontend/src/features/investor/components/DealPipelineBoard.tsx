import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ChevronDown, ChevronRight, Wallet } from "lucide-react";
import { useAuthStore } from "@/shared/stores/auth";
import {
  DEAL_STAGES,
  loadDeals,
  updateDealStage,
  type Deal,
  type DealStage,
} from "@/features/investor/dealPipeline.api";
import { ZONES } from "@/api/fixtures";
import { BRAND } from "@/shared/lib/scoreColor";

/**
 * Deal pipeline board for the investor's firm. Shows stages as columns
 * on desktop and as expandable groups on mobile so the board stays
 * usable on phones. Stage changes persist per-firm to localStorage.
 */
export default function DealPipelineBoard() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const firmId = user?.firm?.id;
  const [deals, setDeals] = useState<Deal[]>(() => (firmId ? loadDeals(firmId) : []));
  const [expandedStage, setExpandedStage] = useState<DealStage | null>("diligence");

  const grouped = useMemo(() => {
    const map: Record<DealStage, Deal[]> = {
      prospect: [],
      meeting: [],
      diligence: [],
      term_sheet: [],
      closed: [],
      passed: [],
    };
    deals.forEach((d) => map[d.stage].push(d));
    return map;
  }, [deals]);

  const totalPipelineValue = useMemo(() => {
    let n = 0;
    deals.forEach((d) => {
      const num = Number((d.amount || "").replace(/[^0-9.]/g, ""));
      if (Number.isFinite(num)) n += d.amount.includes("B") ? num * 1000 : num;
    });
    return n;
  }, [deals]);

  if (!firmId) return null;

  const promote = (deal: Deal) => {
    const idx = DEAL_STAGES.findIndex((s) => s.key === deal.stage);
    if (idx < 0 || idx >= DEAL_STAGES.length - 2) return; // don't auto-promote past closed
    const nextStage = DEAL_STAGES[idx + 1].key;
    const next = updateDealStage(firmId, deal.id, nextStage);
    setDeals(next);
  };

  return (
    <section className="rounded-card border border-border bg-[rgba(255,255,255,0.02)] p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Wallet size={13} style={{ color: BRAND.terracotta }} />
        <h2 className="text-[14px] font-semibold text-ink-1">Deal pipeline</h2>
        <span className="text-[10px] text-ink-4 tracking-[0.06em]">
          {deals.length} deals ·{" "}
          {totalPipelineValue >= 1000
            ? `KES ${(totalPipelineValue / 1000).toFixed(1)}B in pipeline`
            : `KES ${Math.round(totalPipelineValue)}M in pipeline`}
        </span>
      </div>

      {/* Desktop — column view */}
      <div
        className="hidden lg:grid gap-2"
        style={{ gridTemplateColumns: `repeat(${DEAL_STAGES.length}, minmax(0, 1fr))` }}
      >
        {DEAL_STAGES.map((stage) => (
          <div
            key={stage.key}
            className="rounded-control border border-border bg-[rgba(255,255,255,0.02)] p-2 min-h-[240px]"
          >
            <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-border">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: stage.color }} />
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-ink-2 flex-1">
                {stage.label}
              </span>
              <span className="text-[10px] text-ink-4 tabular-nums">
                {grouped[stage.key].length}
              </span>
            </div>
            <div className="space-y-2">
              {grouped[stage.key].length === 0 ? (
                <div className="text-[10px] text-ink-4 italic px-1 py-2">Empty</div>
              ) : (
                grouped[stage.key].map((d) => (
                  <DealCard
                    key={d.id}
                    deal={d}
                    onOpenZone={() => navigate(`/atlas?zone=${d.zoneId}`)}
                    onPromote={() => promote(d)}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Mobile — expandable groups */}
      <div className="lg:hidden space-y-2">
        {DEAL_STAGES.map((stage) => {
          const isOpen = expandedStage === stage.key;
          const count = grouped[stage.key].length;
          return (
            <div
              key={stage.key}
              className="rounded-control border border-border bg-[rgba(255,255,255,0.02)]"
            >
              <button
                onClick={() => setExpandedStage(isOpen ? null : stage.key)}
                className="w-full flex items-center gap-2 px-3 py-2 text-left"
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: stage.color }} />
                <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-1 flex-1">
                  {stage.label}
                </span>
                <span className="text-[10.5px] text-ink-4 tabular-nums">{count}</span>
                {isOpen ? (
                  <ChevronDown size={13} className="text-ink-4" />
                ) : (
                  <ChevronRight size={13} className="text-ink-4" />
                )}
              </button>
              {isOpen && (
                <div className="px-2 pb-2 space-y-2">
                  {count === 0 ? (
                    <div className="text-[10.5px] text-ink-4 italic px-1 py-2">Empty</div>
                  ) : (
                    grouped[stage.key].map((d) => (
                      <DealCard
                        key={d.id}
                        deal={d}
                        onOpenZone={() => navigate(`/atlas?zone=${d.zoneId}`)}
                        onPromote={() => promote(d)}
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function DealCard({
  deal,
  onOpenZone,
  onPromote,
}: {
  deal: Deal;
  onOpenZone: () => void;
  onPromote: () => void;
}) {
  const zone = ZONES.find((z) => z.id === deal.zoneId);
  return (
    <div className="rounded-control border border-border bg-[rgba(255,255,255,0.03)] p-2.5">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-[11.5px] font-semibold text-ink-1 leading-tight">{deal.title}</div>
          <button
            onClick={onOpenZone}
            className="text-[9.5px] text-ink-3 hover:text-ink-1 truncate transition-colors inline-flex items-center gap-1"
          >
            {zone?.name ?? deal.zoneId} <ArrowRight size={9} />
          </button>
        </div>
        <span
          className="text-[10.5px] font-semibold tabular-nums shrink-0"
          style={{ color: BRAND.gold }}
        >
          {deal.amount}
        </span>
      </div>
      <div className="mt-1.5 text-[9.5px] text-ink-3 leading-snug line-clamp-2">
        {deal.nextStep}
      </div>
      <div className="mt-2 flex items-center gap-2 text-[9px] text-ink-4">
        <span className="truncate">{deal.owner}</span>
        <span className="ml-auto shrink-0">
          {new Date(deal.nextStepAt).toLocaleDateString([], { month: "short", day: "numeric" })}
        </span>
      </div>
      {deal.stage !== "closed" && deal.stage !== "passed" && (
        <button
          onClick={onPromote}
          className="mt-2 w-full text-[9.5px] font-medium py-1 rounded-full bg-[rgba(31,138,120,0.14)] text-[color:var(--teal,#1F8A78)] hover:bg-[rgba(31,138,120,0.22)] transition-colors"
        >
          → Promote stage
        </button>
      )}
    </div>
  );
}
