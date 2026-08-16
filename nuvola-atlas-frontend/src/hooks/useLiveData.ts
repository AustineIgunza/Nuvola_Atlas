import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import { useChromeStore } from "@/stores/chrome";
import { subscribe, startMockPulse, type LiveEvent } from "@/lib/realtime";
import { startReverbSubscription, useReverbEnabled } from "@/lib/reverb";

/**
 * Single source of truth for live data invalidation across the app. Mount
 * once at the top of the tree. When the auto-refresh toggle is off this
 * is a no-op, so users on slow connections can pause updates.
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
            queryClient.invalidateQueries({ queryKey: ["zoneHistory", event.zoneId] });
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
    // The zone list arrives async, so the effect can be torn down before the
    // subscription exists. Without this flag a fast unmount/remount (toggling
    // auto-refresh, or StrictMode) leaves an orphaned socket behind.
    let cancelled = false;

    // Real Reverb takes over when VITE_USE_REVERB=true and the backend is
    // reachable; falls back to the mock pulse for offline / no-server dev.
    api
      .getZones()
      .then((zones) => {
        if (cancelled) return;
        const zoneIds = zones.map((z) => z.id);
        stopPulse = useReverbEnabled() ? startReverbSubscription(zoneIds) : startMockPulse(zoneIds);
      })
      .catch(() => {
        /* zones fetch will retry via TanStack */
      });

    return () => {
      cancelled = true;
      unsubscribe();
      stopPulse?.();
    };
  }, [autoRefresh, queryClient]);
}
