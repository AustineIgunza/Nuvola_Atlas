import { lazy, Suspense, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { api } from "@/api";
import { useUIStore } from "@/stores/ui";
import AppShell from "@/components/chrome/AppShell";
import ScorecardConstellation from "@/components/scorecard/constellation/ScorecardConstellation";

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
        style={{ height: "calc(100dvh - 3.5rem - var(--mobile-nav-h))" }}
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

          {/* Scorecard constellation — four corner cards overlaying the map */}
          <ScorecardConstellation zone={selectedZone} />
        </div>
      </div>
    </AppShell>
  );
}
