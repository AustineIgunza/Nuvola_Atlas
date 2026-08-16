import { lazy, Suspense, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Eye, ExternalLink } from "lucide-react";
import { api } from "@/api";
import { useUIStore } from "@/stores/ui";
import { BRAND } from "@/lib/scoreColor";
import { Emblem, Wordmark } from "@/components/brand/Brand";
import ScorecardPanel from "@/components/scorecard/ScorecardPanel";

// Same lazy import the authenticated Atlas uses; keeps the bundle boundary
// aligned so the map chunk is shared between authed and public entry points.
const AtlasMap = lazy(() => import("@/components/map/AtlasMap"));

/**
 * Read-only partner gateway. No auth, no sidebar, no top bar chrome — a
 * single-screen view of the Atlas map + zone scorecards for county
 * planning offices and NGOs that just need to look up a locality's
 * indicators without signing in.
 *
 * The scorecard drill-ins are the same components as the authed app, so
 * partners see identical methodology, Daystar indicator ledger, and
 * activity-feed detail — they just can't export, comment, or edit.
 */
export default function PublicPortalPage() {
  const { data: zones, isLoading } = useQuery({
    queryKey: ["zones"],
    queryFn: api.getZones,
  });

  const selectedZoneId = useUIStore((s) => s.selectedZoneId);
  const setSelectedZone = useUIStore((s) => s.setSelectedZone);
  const closePanel = useUIStore((s) => s.closePanel);
  const selectedZone = zones?.find((z) => z.id === selectedZoneId);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const zoneParam = searchParams.get("zone");
    if (zoneParam) setSelectedZone(zoneParam);
    else {
      setSelectedZone(null);
      closePanel();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col h-[100dvh] w-full overflow-hidden bg-canvas">
      <PublicBanner />

      <div className="flex-1 relative min-w-0" style={{ minHeight: 0 }}>
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full"
            />
          </div>
        ) : zones ? (
          <div style={{ position: "absolute", inset: 0 }}>
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-full">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full"
                  />
                </div>
              }
            >
              <AtlasMap zones={zones} />
            </Suspense>
          </div>
        ) : null}

        <ScorecardPanel zone={selectedZone} />
      </div>
    </div>
  );
}

function PublicBanner() {
  return (
    <header
      className="shrink-0 flex items-center gap-3 px-4 py-2 border-b"
      style={{
        borderColor: `${BRAND.teal}33`,
        background: `linear-gradient(90deg, ${BRAND.navyDeep}, ${BRAND.navy})`,
      }}
    >
      <Link to="/public" className="flex items-center gap-2 shrink-0" aria-label="Navuuna home">
        <Emblem size={24} />
        <Wordmark />
      </Link>

      <span
        className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
        style={{ background: `${BRAND.teal}22`, color: BRAND.teal }}
      >
        <Eye size={11} />
        Public preview · Read-only
      </span>

      <span className="hidden md:block text-[11px] text-ink-3 leading-tight truncate">
        Open partner view. Tap any Nairobi sub-county to see its Vitality score and 12 Daystar
        indicators.
      </span>

      <Link
        to="/sign-in"
        className="ml-auto shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-control text-[11px] font-medium text-ink-2 bg-[rgba(255,255,255,0.06)] border border-border hover:bg-[rgba(255,255,255,0.1)] transition-colors"
      >
        Partner sign in
        <ExternalLink size={11} />
      </Link>
    </header>
  );
}
