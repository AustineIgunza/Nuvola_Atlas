import { create } from "zustand";
import { DEFAULT_LOCALE, getDirection, type LocaleCode } from "@/lib/i18n/locales";

/**
 * User preferences — locale, avatar colour, notification toggles, and the
 * editable display name override. All persisted to localStorage so a demo
 * doesn't lose settings on refresh.
 *
 * Note: theme lives in its own store (`theme.ts`) because it also touches
 * the document root synchronously on load. Don't merge them.
 */

const STORAGE_KEY = "nuvola_prefs_v1";

export interface NotificationPrefs {
  email: boolean;
  weeklyDigest: boolean;
  inApp: boolean;
}

export interface PrefsShape {
  locale: LocaleCode;
  avatarColor: string; // hex — background of the initials chip
  displayName: string | null; // null → fall back to authed user.name
  notifications: NotificationPrefs;
}

const DEFAULTS: PrefsShape = {
  locale: DEFAULT_LOCALE,
  avatarColor: "#1F8A78", // Navuuna teal
  displayName: null,
  notifications: { email: true, weeklyDigest: true, inApp: true },
};

// The presets shown in the Settings avatar colour picker. Curated to sit
// harmoniously against both light and dark themes.
export const AVATAR_COLOR_PRESETS: string[] = [
  "#1F8A78", // teal
  "#C0552B", // terracotta
  "#D9A441", // gold
  "#5C7C99", // steel
  "#8B5A2B", // umber
  "#7A3E9D", // amethyst
  "#B23A48", // rose
  "#2F4858", // navy
];

function loadStored(): PrefsShape {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<PrefsShape>;
    return {
      ...DEFAULTS,
      ...parsed,
      notifications: { ...DEFAULTS.notifications, ...(parsed.notifications ?? {}) },
    };
  } catch {
    return DEFAULTS;
  }
}

function applyLocaleToDocument(locale: LocaleCode) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = locale;
  document.documentElement.dir = getDirection(locale);
}

const initial = loadStored();
applyLocaleToDocument(initial.locale);

interface PrefsState extends PrefsShape {
  setLocale: (locale: LocaleCode) => void;
  setAvatarColor: (color: string) => void;
  setDisplayName: (name: string | null) => void;
  setNotification: (key: keyof NotificationPrefs, on: boolean) => void;
}

function persist(state: PrefsShape) {
  if (typeof window === "undefined") return;
  const { locale, avatarColor, displayName, notifications } = state;
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ locale, avatarColor, displayName, notifications }),
  );
}

export const usePrefsStore = create<PrefsState>((set, get) => ({
  ...initial,
  setLocale: (locale) => {
    applyLocaleToDocument(locale);
    set({ locale });
    persist(get());
  },
  setAvatarColor: (color) => {
    set({ avatarColor: color });
    persist(get());
  },
  setDisplayName: (name) => {
    const clean = name && name.trim().length > 0 ? name.trim() : null;
    set({ displayName: clean });
    persist(get());
  },
  setNotification: (key, on) => {
    set({ notifications: { ...get().notifications, [key]: on } });
    persist(get());
  },
}));
