import type { Zone } from "@/types";

/** True when `hydrateZone` substituted this field for a null from the API. */
export function isEstimated(zone: Pick<Zone, "_hydrated">, path: string): boolean {
  return zone._hydrated?.includes(path) ?? false;
}

/** True when any field on the zone was substituted. */
export function hasEstimates(zone: Pick<Zone, "_hydrated">): boolean {
  return (zone._hydrated?.length ?? 0) > 0;
}
