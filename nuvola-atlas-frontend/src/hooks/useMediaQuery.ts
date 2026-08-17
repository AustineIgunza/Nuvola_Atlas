import { useCallback, useSyncExternalStore } from "react";

/**
 * `useSyncExternalStore` rather than useState + useEffect: matchMedia is an
 * external store, and subscribing to it that way means the first render
 * already has the right answer instead of correcting itself one commit later.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}
