import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { api } from "@/api";
import { useUIStore } from "@/stores/ui";
import { springSettle } from "@/lib/motion";
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
      <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden relative">
        {/* Map area */}
        <div className="flex-1 relative min-w-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full"
              />
            </div>
          ) : zones ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="w-full h-full"
            >
              <AtlasMap zones={zones} />
            </motion.div>
          ) : null}
        </div>

        {/* Scorecard - no overlap, sits beside map on desktop */}
        <ScorecardPanel zone={selectedZone} />
      </div>
    </AppShell>
  );
}
