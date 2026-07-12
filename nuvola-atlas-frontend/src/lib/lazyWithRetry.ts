import { lazy } from "react";

/**
 * Vite + Vercel + React lazy() has a well-known failure mode: when a new
 * deploy ships, chunk file hashes change, and any tab still running the
 * previous index.html will try to import a chunk that no longer exists.
 * Vercel's SPA rewrite then returns index.html for the missing file,
 * which the browser tries to parse as JS and blows up with:
 *   "Failed to fetch dynamically imported module"
 *   "Failed to load module script: Expected a JavaScript-or-Wasm module
 *    script but the server responded with a MIME type of 'text/html'"
 *
 * This wrapper retries the import once (in case the failure was
 * transient), then if the chunk truly is gone, does a hard reload so
 * the tab pulls the current index.html and its matching chunk hashes.
 *
 * We guard the reload behind a session-storage key so we never end up
 * in a reload loop if the server itself is broken.
 *
 * Drop-in replacement for React's `lazy`:
 *
 *   const AtlasPage = lazyWithRetry(() => import("@/pages/AtlasPage"));
 */

const RELOAD_KEY = "nuvola:chunk-reload-attempted";

function isChunkLoadError(err: unknown): boolean {
  if (!err) return false;
  const message = err instanceof Error ? err.message : String(err);
  return (
    /Failed to fetch dynamically imported module/i.test(message) ||
    /Failed to load module script/i.test(message) ||
    /Loading chunk .* failed/i.test(message) ||
    /Loading CSS chunk .* failed/i.test(message) ||
    /error loading dynamically imported module/i.test(message)
  );
}

export function lazyWithRetry<T extends { default: React.ComponentType<any> }>(
  factory: () => Promise<T>,
): React.LazyExoticComponent<T["default"]> {
  return lazy(async () => {
    try {
      return await factory();
    } catch (err) {
      if (!isChunkLoadError(err)) throw err;

      // One in-place retry — covers a genuinely flaky network fetch.
      try {
        return await factory();
      } catch (retryErr) {
        if (!isChunkLoadError(retryErr)) throw retryErr;

        // Chunk is truly gone. Hard-reload once so the browser picks up
        // the new index.html and its matching chunk hashes.
        if (typeof window !== "undefined" && !sessionStorage.getItem(RELOAD_KEY)) {
          sessionStorage.setItem(RELOAD_KEY, "1");
          window.location.reload();
        }
        // If we already reloaded once this session, rethrow — the
        // ErrorBoundary will surface a real message instead of looping.
        throw retryErr;
      }
    }
  });
}

/**
 * Should be called once after the app renders successfully so a
 * subsequent stale-chunk hit is allowed to reload again. Keeps the
 * anti-loop guard from blocking recoveries across sessions.
 */
export function markAppLoaded(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(RELOAD_KEY);
}
