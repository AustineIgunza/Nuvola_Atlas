import { lazy, Suspense, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { api } from "@/api";
import { useUIStore } from "@/shared/stores/ui";
import AppShell from "@/shared/chrome/AppShell";
import ScorecardPanel from "@/components/scorecard/ScorecardPanel";
import ChatPanel from "@/components/chat/ChatPanel";
import CountyBanner from "@/components/vitality/CountyBanner";

// mapbox-gl is ~1.8 MB; defer it so the Atlas shell paints first.
const AtlasMap = lazy(() => import("@/components/map/AtlasMap"));

export default function AtlasPage() {
  const { data: zones, isLoading } = useQuery({
    queryKey: ["zones"],
    queryFn: api.getZones,
  });

  const selectedZoneId = useUIStore((s) => s.selectedZoneId);
  const setSelectedZone = useUIStore((s) => s.setSelectedZone);
  const closePanel = useUIStore((s) => s.closePanel);
  const selectedZone = zones?.find((z) => z.id === selectedZoneId);
  const [searchParams] = useSearchParams();

  // On initial mount, honor ?zone= deeplink only; otherwise start unselected.
  useEffect(() => {
    const zoneParam = searchParams.get("zone");
    if (zoneParam) {
      setSelectedZone(zoneParam);
    } else {
      setSelectedZone(null);
      closePanel();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AppShell>
      <div
        className="flex overflow-hidden relative"
        style={{ height: "calc(100dvh - var(--mobile-nav-h))" }}
      >
        {/* Map area — explicit dimensions */}
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

          {/* County-wide readings banner — utility/county figures that
              would misrepresent the truth if painted on a sub-county bubble
              (WASREB, KNBS county rollups). Fetches independently of the
              zone data so a slow banner never gates the map. */}
          <CountyBanner />

          {/* Vitality Scorecard — floating drill-in panel over the map's right edge */}
          <ScorecardPanel zone={selectedZone} />

          {/* Ask Navuuna — RAG chat panel, mirror of scorecard on the left */}
          <ChatPanel />
        </div>
      </div>
    </AppShell>
  );
}
