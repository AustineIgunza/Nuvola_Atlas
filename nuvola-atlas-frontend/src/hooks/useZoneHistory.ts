import { useQuery } from "@tanstack/react-query";
import { api } from "@/api";
import type { HistoryRange, ZoneHistory } from "@/types";

/**
 * Per-zone vitality time series. Range switches between hourly (day),
 * daily-avg (week), and daily-avg (month). Invalidated by useLiveData
 * when a `zones` event fires for the same zoneId, so the chart trails
 * the score ring in real time once Reverb is live.
 */
export function useZoneHistory(
  zoneId: string | null,
  range: HistoryRange = "week",
  enabled = true,
) {
  return useQuery<ZoneHistory>({
    queryKey: ["zoneHistory", zoneId, range],
    queryFn: () => api.getZoneHistory(zoneId as string, range),
    enabled: Boolean(zoneId) && enabled,
    staleTime: 60_000,
  });
}
