/**
 * English source of truth. Every key that ships in the app exists here.
 * Other locales are `Partial<Record<MessageKey, string>>` scaffolds that
 * fall back to these values, so `translate()` always returns a real string.
 *
 * Keep `{name}`-style tokens intact in every locale — they're interpolated
 * at render time. Product names ("Navuuna"), SDG codes, and pillar codes
 * are NOT localized and never get keys here.
 */
export const en = {
  // ── Common ───────────────────────────────────────────────────────────────
  "common.loading": "Loading…",
  "common.save": "Save",
  "common.saved": "Saved",
  "common.cancel": "Cancel",
  "common.close": "Close",
  "common.delete": "Delete",
  "common.new": "New",
  "common.rename": "Rename",
  "common.change": "Change",
  "common.retry": "Try again",
  "common.done": "Done",
  "common.optional": "Optional",
  "common.required": "Required",
  "common.copied": "Copied",

  // ── Navigation ───────────────────────────────────────────────────────────
  "nav.investor": "Portfolio",
  "nav.atlas": "Atlas",
  "nav.vitality": "Vitality",
  "nav.compare": "Compare",
  "nav.infrastructure": "Infrastructure",
  "nav.reports": "Reports",
  "nav.alerts": "Alerts",
  "nav.assistant": "Assistant",
  "nav.admin": "Admin",
  "nav.settings": "Settings",
  "nav.signOut": "Sign out",

  // ── Sidebar ──────────────────────────────────────────────────────────────
  "sidebar.subcounties": "Sub-counties",
  "sidebar.dataLayers": "Asase · Data Layers",
  "sidebar.howComputed": "How the score is computed",

  // ── Topbar ───────────────────────────────────────────────────────────────
  "topbar.openSearch": "Search",
  "topbar.notifications": "Notifications",
  "topbar.settings": "Settings",
  "topbar.assistant": "Assistant",
  "topbar.appearance": "Appearance",
  "topbar.preferences": "Preferences",
  "topbar.language": "Language",
  "topbar.reducedMotion": "Reduced motion",
  "topbar.autoRefresh": "Auto-refresh",
  "topbar.openFullSettings": "Open full settings",

  // ── Theme ────────────────────────────────────────────────────────────────
  "theme.light": "Light",
  "theme.dark": "Dark",

  // ── Settings page ────────────────────────────────────────────────────────
  "settings.title": "Settings",
  "settings.subtitle": "Your profile, appearance, language, and notifications.",
  "settings.profile.title": "Profile",
  "settings.profile.description": "How you show up across Navuuna.",
  "settings.profile.name": "Display name",
  "settings.profile.namePlaceholder": "How your name appears in the sidebar and shared reports",
  "settings.profile.email": "Email",
  "settings.profile.emailHint": "Your sign-in email — change it from your account provider.",
  "settings.profile.role": "Role",
  "settings.profile.avatarColor": "Avatar colour",
  "settings.profile.avatarHint": "The colour of your initials chip.",
  "settings.profile.save": "Save profile",
  "settings.profile.saved": "Profile saved.",

  "settings.password.title": "Change password",
  "settings.password.description": "Rotate your sign-in password. You'll stay signed in on this device.",
  "settings.password.current": "Current password",
  "settings.password.new": "New password",
  "settings.password.confirm": "Confirm new password",
  "settings.password.submit": "Update password",
  "settings.password.updated": "Password updated.",
  "settings.password.mismatch": "New passwords do not match.",
  "settings.password.tooShort": "Use at least 8 characters.",
  "settings.password.wrongCurrent": "Current password is incorrect.",

  "settings.appearance.title": "Appearance",
  "settings.appearance.description": "Theme and motion.",
  "settings.appearance.theme": "Theme",
  "settings.appearance.reducedMotion": "Reduced motion",
  "settings.appearance.reducedMotionHint": "Fade in place of movement — helps with vestibular sensitivity.",

  "settings.language.title": "Language",
  "settings.language.description": "The interface language for Navuuna Atlas.",
  "settings.language.picker": "Choose language",
  "settings.language.fallbackNote": "Any string we haven't translated yet falls back to English so nothing breaks.",

  "settings.notifications.title": "Notifications",
  "settings.notifications.description": "What Navuuna is allowed to send you.",
  "settings.notifications.email": "Email alerts",
  "settings.notifications.emailHint": "High-severity alerts and infrastructure incidents.",
  "settings.notifications.weekly": "Weekly digest",
  "settings.notifications.weeklyHint": "A Monday-morning summary of what moved across your zones.",
  "settings.notifications.inApp": "In-app banners",
  "settings.notifications.inAppHint": "The bell icon in the top bar. Off means silent.",

  // ── Assistant page ───────────────────────────────────────────────────────
  "assistant.title": "Assistant",
  "assistant.subtitle": "Ask questions about Nairobi zones. Every query is bounded and read-only.",
  "assistant.newChat": "New chat",
  "assistant.history": "History",
  "assistant.historyEmpty": "Your past conversations show up here.",
  "assistant.placeholder": "Ask about any zone or pillar…",
  "assistant.send": "Send",
  "assistant.thinking": "Thinking…",
  "assistant.readonlyNote": "⌘/Ctrl + Enter to send. Read-only queries only.",
  "assistant.pickConversation": "Pick a conversation or start a new one.",
  "assistant.starterHint": "Try one of these to get started:",
  "assistant.starter.leaders": "Which zones lead on Vitality?",
  "assistant.starter.explainPillars": "Explain the four Vitality pillars",
  "assistant.starter.weakSafety": "Where is the Safety pillar weakest?",

  // ── Sign-in / auth ───────────────────────────────────────────────────────
  "auth.signIn": "Sign in",
  "auth.signOut": "Sign out",
} as const;

export type MessageKey = keyof typeof en;
