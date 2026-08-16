/**
 * Real Laravel Echo + Reverb subscription. Mirror-image of
 * `startMockPulse` — same signature, same channel-to-event mapping,
 * so useLiveData can pick between mock/real by env flag with a
 * one-line change.
 *
 * Env config (all `VITE_` prefixed for Vite exposure):
 *   VITE_REVERB_APP_KEY    (matches backend REVERB_APP_KEY)
 *   VITE_REVERB_HOST       (default: window.location.hostname)
 *   VITE_REVERB_PORT       (default: 8080)
 *   VITE_REVERB_SCHEME     ("http" | "https", default: http)
 */
import Echo from "laravel-echo";
import Pusher from "pusher-js";
import { BASE, authHeaders } from "@/api/client";
import { emit } from "@/lib/realtime";

// Pusher needs to be on window for laravel-echo v2 with the pusher broadcaster.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).Pusher = Pusher;

let instance: Echo<"reverb"> | null = null;

function makeEcho(): Echo<"reverb"> {
  if (instance) return instance;

  const host = import.meta.env.VITE_REVERB_HOST ?? window.location.hostname;
  const port = Number(import.meta.env.VITE_REVERB_PORT ?? 8080);
  const scheme = import.meta.env.VITE_REVERB_SCHEME ?? "http";

  instance = new Echo({
    broadcaster: "reverb",
    key: import.meta.env.VITE_REVERB_APP_KEY ?? "local",
    wsHost: host,
    wsPort: port,
    wssPort: port,
    forceTLS: scheme === "https",
    enabledTransports: ["ws", "wss"],
    // Private channels authorize against the Sanctum-guarded endpoint inside
    // the API prefix, not the framework default at /broadcasting/auth — that
    // one sits on the `web` session guard, which a bearer-token SPA can never
    // satisfy. Headers are built per request so a re-login is picked up
    // without tearing down the socket.
    authorizer: (channel: { name: string }) => ({
      authorize: (
        socketId: string,
        callback: (error: Error | null, data: { auth: string } | null) => void,
      ) => {
        fetch(`${BASE}/broadcasting/auth`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            ...authHeaders(),
          },
          body: JSON.stringify({ socket_id: socketId, channel_name: channel.name }),
        })
          .then((res) =>
            res.ok ? res.json() : Promise.reject(new Error(`Channel auth failed (${res.status})`)),
          )
          .then((data) => callback(null, data))
          .catch((err: Error) => callback(err, null));
      },
    }),
  });
  return instance;
}

/**
 * Subscribe to every zone's private channel + the alerts firehose. Returns a
 * stop() handle mirroring the mock pulse contract.
 */
export function startReverbSubscription(zoneIds: string[]): () => void {
  const echo = makeEcho();

  const channels = zoneIds.map((id) => {
    const channel = echo.private(`zones.${id}`);
    // A score change and a layer geometry change both invalidate the same
    // queries, so they collapse into one event on the client.
    channel.listen(".ZoneScoreUpdated", (payload: { id?: string }) => {
      emit({ channel: "zones", type: "updated", zoneId: payload?.id ?? id });
    });
    channel.listen(".ZoneLayerUpdated", () => {
      emit({ channel: "zones", type: "updated", zoneId: id });
    });
    return channel;
  });

  const alerts = echo.private("alerts");
  alerts.listen(".AlertCreated", () => {
    emit({ channel: "alerts", type: "created" });
  });
  channels.push(alerts);

  return () => {
    for (const c of channels) {
      echo.leaveChannel(c.name);
    }
  };
}

export function useReverbEnabled(): boolean {
  return (import.meta.env.VITE_USE_REVERB ?? "false").toString() === "true";
}
