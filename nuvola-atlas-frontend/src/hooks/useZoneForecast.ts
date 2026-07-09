import { useQuery } from "@tanstack/react-query";
import { api } from "@/api";
import type { ZoneForecast } from "@/types";

/**
 * 14-day (default) score forecast + confidence band. Only fetched when
 * the user toggles the forecast overlay on the trend chart, so we don't
 * pay the LLM/DB call for every scorecard open.
 */
export function useZoneForecast(zoneId: string | null, horizon = 14, enabled = true) {
  return useQuery<ZoneForecast>({
    queryKey: ["zoneForecast", zoneId, horizon],
    queryFn: () => api.getZoneForecast(zoneId as string, horizon),
    enabled: Boolean(zoneId) && enabled,
    staleTime: 5 * 60_000,
  });
}
