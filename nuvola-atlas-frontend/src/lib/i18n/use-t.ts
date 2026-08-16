import { useCallback } from "react";
import { usePrefsStore } from "@/stores/prefs";
import { translate } from "./translate";
import type { MessageKey, TVars } from "./translate";

export type TFunction = (key: MessageKey, vars?: TVars) => string;

/**
 * The component-facing translator. Reads the active locale from the prefs
 * store and returns a stable `t(key, vars?)` that re-resolves when the
 * locale changes — so switching language in Settings re-renders every
 * subscribed string live.
 */
export function useT(): TFunction {
  const locale = usePrefsStore((s) => s.locale);
  return useCallback((key: MessageKey, vars?: TVars) => translate(locale, key, vars), [locale]);
}
