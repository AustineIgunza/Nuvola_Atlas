/**
 * Realtime event contract for live data updates.
 *
 * Today this is a mock pulse driven by setInterval so the dashboard
 * shows "fresh" data without a backend. The real Laravel Echo + Reverb
 * subscription will publish the same events to the same channels — the
 * useLiveData hook below is the one place that needs to flip when
 * Reverb is wired up.
 *
 * Reverb channels (to mirror when wiring 3.3):
 *   - `zones`           → zone score / metric updates
 *   - `alerts`          → new alert published
 *   - `activity.{zone}` → ground-truth activity entries
 */
export type LiveEvent =
  | { channel: "zones"; type: "updated"; zoneId?: string }
  | { channel: "alerts"; type: "created" | "updated" }
  | { channel: "activity"; type: "created"; zoneId: string };

type Listener = (event: LiveEvent) => void;

const listeners = new Set<Listener>();

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function emit(event: LiveEvent): void {
  listeners.forEach((fn) => {
    try { fn(event); } catch { /* swallow listener errors */ }
  });
}

/**
 * Start the mock event pulse. Cycles through the three channels so every
 * surface gets a refresh hint within a couple of minutes — slow enough to
 * stay realistic, fast enough to be visible during a demo.
 *
 * Returns a stop() handle so the caller can tear down on unmount.
 */
export function startMockPulse(zoneIds: string[]): () => void {
  if (zoneIds.length === 0) return () => {};
  const channels: Array<LiveEvent["channel"]> = ["zones", "alerts", "activity"];
  let i = 0;
  const id = window.setInterval(() => {
    const channel = channels[i % channels.length];
    const zoneId = zoneIds[i % zoneIds.length];
    if (channel === "zones") emit({ channel, type: "updated", zoneId });
    else if (channel === "alerts") emit({ channel, type: "updated" });
    else emit({ channel, type: "created", zoneId });
    i += 1;
  }, 45_000);
  return () => window.clearInterval(id);
}
