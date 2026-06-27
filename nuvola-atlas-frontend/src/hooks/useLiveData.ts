import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import { useChromeStore } from "@/stores/chrome";
import { subscribe, startMockPulse, type LiveEvent } from "@/lib/realtime";

/**
 * Single source of truth for live data invalidation across the app. Mount
 * once at the top of the tree. When the auto-refresh toggle is off this
 * is a no-op, so users on slow connections can pause updates.
 *
 * When 3.3 lands (real Reverb), swap `startMockPulse` for the Echo
 * subscription — listener shape and channel names already match.
 */
export function useLiveData(): void {
  const queryClient = useQueryClient();
  const autoRefresh = useChromeStore((s) => s.autoRefresh);

  useEffect(() => {
    if (!autoRefresh) return;

    const handle = (event: LiveEvent) => {
      switch (event.channel) {
        case "zones":
          queryClient.invalidateQueries({ queryKey: ["zones"] });
          if (event.zoneId) {
            queryClient.invalidateQueries({ queryKey: ["history", event.zoneId] });
          }
          break;
        case "alerts":
          queryClient.invalidateQueries({ queryKey: ["alerts"] });
          break;
        case "activity":
          queryClient.invalidateQueries({ queryKey: ["activity", event.zoneId] });
          break;
      }
    };

    const unsubscribe = subscribe(handle);

    let stopPulse: (() => void) | null = null;
    // Seed the pulse with the current zone IDs so mock events name real ones.
    api.getZones().then((zones) => {
      stopPulse = startMockPulse(zones.map((z) => z.id));
    }).catch(() => { /* zones fetch will retry via TanStack */ });

    return () => {
      unsubscribe();
      stopPulse?.();
    };
  }, [autoRefresh, queryClient]);
}
