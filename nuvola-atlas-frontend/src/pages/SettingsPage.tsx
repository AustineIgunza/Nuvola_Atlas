import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Loader2, Save } from "lucide-react";
import AppShell from "@/components/chrome/AppShell";
import { useAuthStore } from "@/stores/auth";
import { useThemeStore } from "@/stores/theme";
import { usePrefsStore, AVATAR_COLOR_PRESETS, type NotificationPrefs } from "@/stores/prefs";
import { LOCALES, type LocaleCode } from "@/lib/i18n/locales";
import { useT } from "@/lib/i18n/use-t";
import { api } from "@/api";
import { springSettle } from "@/lib/motion";
import { cn } from "@/lib/cn";

export default function SettingsPage() {
  const t = useT();
  const user = useAuthStore((s) => s.user);
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const {
    locale,
    setLocale,
    avatarColor,
    setAvatarColor,
    displayName,
    setDisplayName,
    notifications,
    setNotification,
  } = usePrefsStore();

  return (
    <AppShell>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[860px] mx-auto p-4 sm:p-6 space-y-4">
          <header>
            <div className="text-[10px] font-medium text-ink-4 uppercase tracking-[0.12em]">
              {t("nav.settings")}
            </div>
            <h1 className="text-[22px] font-semibold text-ink-1 leading-tight">
              {t("settings.title")}
            </h1>
            <p className="mt-1.5 text-[12px] text-ink-3 max-w-[68ch]">{t("settings.subtitle")}</p>
          </header>

          <ProfileSection
            t={t}
            user={user}
            displayName={displayName}
            setDisplayName={setDisplayName}
            avatarColor={avatarColor}
            setAvatarColor={setAvatarColor}
          />

          <PasswordSection t={t} />

          <AppearanceSection t={t} theme={theme} setTheme={setTheme} />

          <LanguageSection t={t} locale={locale} setLocale={setLocale} />

          <NotificationsSection
            t={t}
            notifications={notifications}
            setNotification={setNotification}
          />
        </div>
      </div>
    </AppShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Profile
// ─────────────────────────────────────────────────────────────────────────────

function ProfileSection({
  t,
  user,
  displayName,
  setDisplayName,
  avatarColor,
  setAvatarColor,
}: {
  t: ReturnType<typeof useT>;
  user: ReturnType<typeof useAuthStore.getState>["user"];
  displayName: string | null;
  setDisplayName: (name: string | null) => void;
  avatarColor: string;
  setAvatarColor: (c: string) => void;
}) {
  const [draftName, setDraftName] = useState<string>(displayName ?? user?.name ?? "");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setDraftName(displayName ?? user?.name ?? "");
  }, [displayName, user?.name]);

  const initials = getInitials(draftName || user?.name || user?.email || "?");
  const emailReadOnly = user?.email ?? "—";
  const role = user?.role ?? "viewer";

  const handleSave = () => {
    setDisplayName(draftName);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  return (
    <Section title={t("settings.profile.title")} description={t("settings.profile.description")}>
      <div className="flex items-start gap-4 mb-4">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-[20px] font-bold text-white shrink-0"
          style={{ background: avatarColor }}
          aria-label="Avatar preview"
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="text-[13px] font-semibold text-ink-1 truncate">
            {draftName || t("settings.profile.name")}
          </div>
          <div className="text-[11px] text-ink-3 truncate">{emailReadOnly}</div>
          <div className="text-[10px] text-ink-4 uppercase tracking-[0.08em]">
            {t("settings.profile.role")}: {role}
          </div>
        </div>
      </div>

      <Field label={t("settings.profile.name")}>
        <input
          type="text"
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          placeholder={t("settings.profile.namePlaceholder")}
          className="w-full rounded-control bg-[rgba(255,255,255,0.04)] border border-border px-3 py-2 text-[12.5px] text-ink-1 placeholder-ink-4 focus:outline-none focus:border-[rgba(255,255,255,0.16)]"
        />
      </Field>

      <Field label={t("settings.profile.email")} hint={t("settings.profile.emailHint")}>
        <input
          type="email"
          value={emailReadOnly}
          readOnly
          className="w-full rounded-control bg-[rgba(255,255,255,0.02)] border border-border px-3 py-2 text-[12.5px] text-ink-3 cursor-not-allowed"
        />
      </Field>

      <Field label={t("settings.profile.avatarColor")} hint={t("settings.profile.avatarHint")}>
        <div className="flex flex-wrap gap-2">
          {AVATAR_COLOR_PRESETS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setAvatarColor(c)}
              aria-label={c}
              aria-pressed={c === avatarColor}
              className={cn(
                "w-8 h-8 rounded-full transition-transform btn-press relative",
                c === avatarColor &&
                  "ring-2 ring-offset-2 ring-offset-[var(--bg-1,#0b2235)] ring-white/70",
              )}
              style={{ background: c }}
            >
              {c === avatarColor && (
                <Check size={14} className="text-white absolute inset-0 m-auto drop-shadow" />
              )}
            </button>
          ))}
        </div>
      </Field>

      <div className="flex items-center gap-2 mt-1">
        <motion.button
          onClick={handleSave}
          whileTap={{ scale: 0.97 }}
          transition={springSettle}
          className="inline-flex items-center gap-1.5 rounded-control bg-accent text-white px-3 py-1.5 text-[12px] font-semibold hover:brightness-110 btn-press"
        >
          <Save size={13} /> {t("settings.profile.save")}
        </motion.button>
        {saved && (
          <span className="text-[11px] text-[color:var(--teal,#1F8A78)] inline-flex items-center gap-1">
            <Check size={12} /> {t("settings.profile.saved")}
          </span>
        )}
      </div>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Password
// ─────────────────────────────────────────────────────────────────────────────

function PasswordSection({ t }: { t: ReturnType<typeof useT> }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "ok" | "err">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!current) {
      setErrorMessage(t("settings.password.wrongCurrent"));
      setStatus("err");
      return;
    }
    if (next.length < 8) {
      setErrorMessage(t("settings.password.tooShort"));
      setStatus("err");
      return;
    }
    if (next !== confirm) {
      setErrorMessage(t("settings.password.mismatch"));
      setStatus("err");
      return;
    }
    setStatus("saving");
    try {
      await api.changePassword(current, next);
      setStatus("ok");
      setCurrent("");
      setNext("");
      setConfirm("");
      window.setTimeout(() => setStatus("idle"), 2000);
    } catch (err) {
      setStatus("err");
      setErrorMessage(err instanceof Error ? err.message : t("common.retry"));
    }
  };

  return (
    <Section title={t("settings.password.title")} description={t("settings.password.description")}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Field label={t("settings.password.current")}>
          <input
            type="password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            autoComplete="current-password"
            className="w-full rounded-control bg-[rgba(255,255,255,0.04)] border border-border px-3 py-2 text-[12.5px] text-ink-1"
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t("settings.password.new")}>
            <input
              type="password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              autoComplete="new-password"
              className="w-full rounded-control bg-[rgba(255,255,255,0.04)] border border-border px-3 py-2 text-[12.5px] text-ink-1"
            />
          </Field>
          <Field label={t("settings.password.confirm")}>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              className="w-full rounded-control bg-[rgba(255,255,255,0.04)] border border-border px-3 py-2 text-[12.5px] text-ink-1"
            />
          </Field>
        </div>

        <div className="flex items-center gap-2 mt-1">
          <button
            type="submit"
            disabled={status === "saving"}
            className="inline-flex items-center gap-1.5 rounded-control bg-accent text-white px-3 py-1.5 text-[12px] font-semibold hover:brightness-110 disabled:opacity-50 btn-press"
          >
            {status === "saving" ? (
              <>
                <Loader2 size={13} className="animate-spin" /> {t("common.loading")}
              </>
            ) : (
              <>
                <Save size={13} /> {t("settings.password.submit")}
              </>
            )}
          </button>
          {status === "ok" && (
            <span className="text-[11px] text-[color:var(--teal,#1F8A78)] inline-flex items-center gap-1">
              <Check size={12} /> {t("settings.password.updated")}
            </span>
          )}
          {status === "err" && errorMessage && (
            <span className="text-[11px] text-danger">{errorMessage}</span>
          )}
        </div>
      </form>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Appearance
// ─────────────────────────────────────────────────────────────────────────────

function AppearanceSection({
  t,
  theme,
  setTheme,
}: {
  t: ReturnType<typeof useT>;
  theme: "light" | "dark";
  setTheme: (t: "light" | "dark") => void;
}) {
  const [reducedMotion, setReducedMotion] = useState<boolean>(
    typeof document !== "undefined" && document.documentElement.classList.contains("reduce-motion"),
  );

  const toggleReduced = () => {
    setReducedMotion((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("reduce-motion", next);
      return next;
    });
  };

  return (
    <Section
      title={t("settings.appearance.title")}
      description={t("settings.appearance.description")}
    >
      <Field label={t("settings.appearance.theme")}>
        <div className="inline-flex items-center gap-1 p-0.5 rounded-control bg-[rgba(255,255,255,0.04)]">
          {(["light", "dark"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setTheme(mode)}
              className={cn(
                "min-w-[90px] h-8 px-3 rounded-chip text-[12px] font-medium transition-colors",
                theme === mode
                  ? "bg-[rgba(255,255,255,0.12)] text-ink-1"
                  : "text-ink-4 hover:text-ink-2",
              )}
              aria-pressed={theme === mode}
            >
              {mode === "light" ? t("theme.light") : t("theme.dark")}
            </button>
          ))}
        </div>
      </Field>

      <Toggle
        label={t("settings.appearance.reducedMotion")}
        hint={t("settings.appearance.reducedMotionHint")}
        checked={reducedMotion}
        onChange={toggleReduced}
      />
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Language
// ─────────────────────────────────────────────────────────────────────────────

function LanguageSection({
  t,
  locale,
  setLocale,
}: {
  t: ReturnType<typeof useT>;
  locale: LocaleCode;
  setLocale: (locale: LocaleCode) => void;
}) {
  return (
    <Section title={t("settings.language.title")} description={t("settings.language.description")}>
      <Field label={t("settings.language.picker")}>
        <div className="grid gap-2 sm:grid-cols-2">
          {LOCALES.map((l) => {
            const active = l.code === locale;
            return (
              <button
                key={l.code}
                onClick={() => setLocale(l.code)}
                aria-pressed={active}
                className={cn(
                  "flex items-center gap-3 rounded-control border px-3 py-2.5 text-left transition-colors",
                  active
                    ? "bg-[rgba(31,138,120,0.14)] border-[rgba(31,138,120,0.35)]"
                    : "bg-[rgba(255,255,255,0.02)] border-border hover:bg-[rgba(255,255,255,0.05)]",
                )}
              >
                <span className="text-[18px]" aria-hidden>
                  {l.flag}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[12.5px] font-semibold text-ink-1">{l.name}</span>
                  <span className="block text-[10px] text-ink-4 uppercase tracking-[0.08em]">
                    {l.code.toUpperCase()}
                  </span>
                </span>
                {active && <Check size={14} className="text-[color:var(--teal,#1F8A78)]" />}
              </button>
            );
          })}
        </div>
      </Field>
      <p className="text-[10.5px] text-ink-4 mt-1">{t("settings.language.fallbackNote")}</p>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Notifications
// ─────────────────────────────────────────────────────────────────────────────

function NotificationsSection({
  t,
  notifications,
  setNotification,
}: {
  t: ReturnType<typeof useT>;
  notifications: NotificationPrefs;
  setNotification: (key: keyof NotificationPrefs, on: boolean) => void;
}) {
  return (
    <Section
      title={t("settings.notifications.title")}
      description={t("settings.notifications.description")}
    >
      <Toggle
        label={t("settings.notifications.email")}
        hint={t("settings.notifications.emailHint")}
        checked={notifications.email}
        onChange={() => setNotification("email", !notifications.email)}
      />
      <Toggle
        label={t("settings.notifications.weekly")}
        hint={t("settings.notifications.weeklyHint")}
        checked={notifications.weeklyDigest}
        onChange={() => setNotification("weeklyDigest", !notifications.weeklyDigest)}
      />
      <Toggle
        label={t("settings.notifications.inApp")}
        hint={t("settings.notifications.inAppHint")}
        checked={notifications.inApp}
        onChange={() => setNotification("inApp", !notifications.inApp)}
      />
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Primitives
// ─────────────────────────────────────────────────────────────────────────────

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-card border border-border bg-[rgba(255,255,255,0.02)] p-4 sm:p-5 space-y-3">
      <header>
        <h2 className="text-[15px] font-semibold text-ink-1">{title}</h2>
        {description && <p className="text-[11.5px] text-ink-3 mt-0.5">{description}</p>}
      </header>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="block text-[10.5px] font-medium text-ink-4 uppercase tracking-[0.08em]">
        {label}
      </span>
      {children}
      {hint && <span className="block text-[10.5px] text-ink-4">{hint}</span>}
    </label>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-1">
      <div className="min-w-0 flex-1">
        <div className="text-[12.5px] text-ink-1">{label}</div>
        {hint && <div className="text-[10.5px] text-ink-4 mt-0.5">{hint}</div>}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={cn(
          "shrink-0 w-10 h-5 rounded-full p-0.5 transition-colors",
          checked ? "bg-[color:var(--teal,#1F8A78)]" : "bg-[rgba(255,255,255,0.14)]",
        )}
      >
        <span
          className={cn(
            "block w-4 h-4 rounded-full bg-white transition-transform",
            checked ? "translate-x-5" : "translate-x-0",
          )}
        />
      </button>
    </div>
  );
}

function getInitials(source: string): string {
  const parts = source.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
