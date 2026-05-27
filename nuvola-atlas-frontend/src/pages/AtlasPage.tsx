import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { api } from "@/api";
import { useUIStore } from "@/stores/ui";
import AppShell from "@/components/chrome/AppShell";
import AtlasMap from "@/components/map/AtlasMap";
import ScorecardPanel from "@/components/scorecard/ScorecardPanel";

export default function AtlasPage() {
  const { data: zones, isLoading } = useQuery({
    queryKey: ["zones"],
    queryFn: api.getZones,
  });

  const selectedZoneId = useUIStore((s) => s.selectedZoneId);
  const selectedZone = zones?.find((z) => z.id === selectedZoneId);

  return (
    <AppShell>
      <div
        className="flex overflow-hidden relative"
        style={{ height: "calc(100dvh - 3.5rem)" }}
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
              <AtlasMap zones={zones} />
            </div>
          ) : null}
        </div>

        {/* Scorecard */}
        <ScorecardPanel zone={selectedZone} />
      </div>
    </AppShell>
  );
}
