/**
 * The interface languages Navuuna ships with. English is the always-complete
 * source of truth; every other locale is a partial that falls back to English
 * via `translate()`. Pattern mirrors Harun's AI-Analytics i18n so anyone
 * already familiar with it can drop in.
 *
 * Kiswahili is the natural second language for the Nairobi pilot — it's the
 * other official Kenyan language and it's what community-facing views need to
 * carry.
 */
export type LocaleCode = "en" | "sw";

export type Direction = "ltr" | "rtl";

export interface Locale {
  code: LocaleCode;
  name: string;
  flag: string;
  dir: Direction;
}

export const LOCALES: Locale[] = [
  { code: "en", name: "English", flag: "🇬🇧", dir: "ltr" },
  { code: "sw", name: "Kiswahili", flag: "🇰🇪", dir: "ltr" },
];

export const DEFAULT_LOCALE: LocaleCode = "en";

export function getDirection(code: string): Direction {
  return LOCALES.find((l) => l.code === code)?.dir ?? "ltr";
}
