import { en } from "./messages/en";
import { sw } from "./messages/sw";
import type { LocaleCode } from "./locales";
import type { MessageKey } from "./messages/en";

export type { MessageKey };
export type TVars = Record<string, string | number>;

/**
 * One table per locale. `en` is complete; any other locale is a partial
 * that falls back to English if a key is missing, so `translate` always
 * returns a real string.
 */
const TABLES: Record<LocaleCode, Partial<Record<MessageKey, string>>> = {
  en,
  sw,
};

/** Replace `{token}` with vars[token]; unknown tokens are left verbatim. */
function interpolate(template: string, vars: TVars): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    key in vars ? String(vars[key]) : `{${key}}`,
  );
}

/** Resolve a key for a locale, falling back to English, then interpolating. */
export function translate(locale: LocaleCode, key: MessageKey, vars?: TVars): string {
  const raw = TABLES[locale]?.[key] ?? en[key];
  return vars ? interpolate(raw, vars) : raw;
}
