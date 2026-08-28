import { useAtlasStore } from "./atlas";
import { useChromeStore } from "./chrome";

export { useAtlasStore } from "./atlas";
export { useChromeStore } from "./chrome";

export function useUIStore<T>(selector: (state: ReturnType<typeof getCombined>) => T): T {
  const atlas = useAtlasStore((s) => s);
  const chrome = useChromeStore((s) => s);
  return selector({ ...atlas, ...chrome });
}

function getCombined() {
  return {
    ...useAtlasStore.getState(),
    ...useChromeStore.getState(),
  };
}

useUIStore.getState = getCombined;
