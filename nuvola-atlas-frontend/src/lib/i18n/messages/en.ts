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

  // ── Pillar labels (short + long) ─────────────────────────────────────────
  "pillar.social.short": "Social",
  "pillar.safety.short": "Safety",
  "pillar.density.short": "Density",
  "pillar.infra.short": "Infra",
  "pillar.social.long": "Social Wellbeing & Human Capital",
  "pillar.safety.long": "Safety & Security",
  "pillar.density.long": "Density & Scaling Dynamics",
  "pillar.infra.long": "Infrastructure & Environmental Safeguards",

  // ── Map layer labels ────────────────────────────────────────────────────
  "layer.vitality": "Vitality Zones",
  "layer.roads": "Road Progress",
  "layer.energy": "Smart Grid Status",
  "layer.density": "Density",
  "layer.water": "Water & Sanitation",
  "layer.momentum": "Project Momentum",
  "layer.safety": "Safety & Security",

  // ── Vitality bands + scorecard chrome ───────────────────────────────────
  "band.strong": "Strong",
  "band.moderate": "Moderate",
  "band.atRisk": "At Risk",
  "band.strong.note": "Ready to absorb new projects",
  "band.moderate.note": "Ready with targeted safeguards",
  "band.atRisk.note": "Readiness gaps need closing first",
  "scorecard.overview": "Overview",
  "scorecard.pillars": "Pillars — tap to expand",
  "scorecard.projects": "Infrastructure",
  "scorecard.alerts": "Active alerts",
  "scorecard.trend": "Score history",
  "scorecard.dataSources": "Data Sources",
  "scorecard.askAbout": "Ask about {zone}",
  "scorecard.reopenTab": "Re-open scorecard",
  "scorecard.lastSync": "Last sync {min} min ago",

  // ── Compare page ────────────────────────────────────────────────────────
  "compare.kicker": "Compare",
  "compare.title": "Side-by-side zone comparison",
  "compare.subtitle": "Pick up to {max} Nairobi sub-counties to compare their Vitality Score, pillar breakdown, and score history side by side.",
  "compare.pick": "Pick a zone above to start.",
  "compare.newButton": "New comparison",
  "compare.newButton.short": "New",
  "compare.add": "Add zone{plural} to compare",
  "compare.range.day": "Day",
  "compare.range.week": "Week",
  "compare.range.month": "Month",
  "compare.pillarBreakdown": "Pillar breakdown",
  "compare.deltas": "Quarter-over-quarter change",
  "compare.water": "Water & Sanitation · SDG 6",
  "compare.infra": "Infrastructure projects",
  "compare.alerts": "Active alerts",
  "compare.history": "Score history",
  "compare.assistant.header": "Assistant",
  "compare.assistant.hint": "Ask about the compared zones",

  // ── Atlas map + legend ──────────────────────────────────────────────────
  "atlas.legend.title": "Vitality Score",
  "atlas.legend.strong": "70–100 Strong",
  "atlas.legend.moderate": "55–69 Moderate",
  "atlas.legend.atRisk": "0–54 At Risk",
  "atlas.resetView": "Reset view to Nairobi",
  "atlas.viewMode.map": "Map",
  "atlas.viewMode.satellite": "Satellite",
  "atlas.viewMode.terrain": "Terrain",
  "atlas.liveFeed": "Live",

  // ── Public portal ───────────────────────────────────────────────────────
  "public.title": "Nairobi County — Public Atlas",
  "public.subtitle": "A read-only community view of infrastructure delivery in your ward.",
  "public.signIn": "Sign in for full access",
  "public.methodology": "About the methodology",
  "public.footer": "Built by the Navuuna student team at Strathmore University.",

  // ── Reports page ────────────────────────────────────────────────────────
  "reports.title": "Reports",
  "reports.subtitle": "Published research and periodic summaries by zone and pillar.",
  "reports.new": "New report",
  "reports.empty": "No reports match your filter.",
  "reports.status.published": "Published",
  "reports.status.review": "In review",
  "reports.status.draft": "Draft",
  "reports.download.pdf": "Download PDF",
  "reports.download.docx": "Download DOCX",
  "reports.download.txt": "Download TXT",

  // ── Alerts page ─────────────────────────────────────────────────────────
  "alerts.title": "Alerts",
  "alerts.subtitle": "Active issues surfaced by monitoring feeds across Nairobi.",
  "alerts.markAllRead": "Mark all read",
  "alerts.severity.high": "High",
  "alerts.severity.medium": "Medium",
  "alerts.severity.low": "Low",
  "alerts.filter.all": "All",
  "alerts.filter.unread": "Unread only",
  "alerts.empty": "No alerts to show.",

  // ── Vitality methodology page ───────────────────────────────────────────
  "vitality.title": "The UE Vitality Index",
  "vitality.subtitle": "How Navuuna scores every sub-county from 0 to 100 across four pillars.",
  "vitality.pillars.title": "The four pillars",
  "vitality.compose.title": "How the composite is built",
  "vitality.compose.body": "Each pillar averages its non-null indicators. The composite averages the four pillars — a fully-missing pillar is skipped, never zero-biased.",
  "vitality.rules.title": "Rules",
  "vitality.rules.item1": "Every indicator is a 0–100 normalized value or NULL (\"Awaiting data\").",
  "vitality.rules.item2": "Pillar score = simple average of the pillar's non-null indicators.",
  "vitality.rules.item3": "Composite = simple average of pillars that have at least one non-null indicator.",
  "vitality.rules.item4": "Missing indicators are excluded from the average — never treated as zero.",

  // ── Investor dashboard ──────────────────────────────────────────────────
  "investor.title": "Investor Dashboard",
  "investor.subtitle": "Your firm's Nairobi portfolio at a glance. Watchlisted zones roll up here.",
  "investor.download": "Download brief",
  "investor.kpi.portfolio": "Portfolio avg",
  "investor.kpi.watchlisted": "Watchlisted",
  "investor.kpi.projects": "Active projects",
  "investor.kpi.alerts": "Alerts",
  "investor.kpi.vsCounty": "vs. county",
  "investor.portfolio.title": "Portfolio ranking",
  "investor.portfolio.hint": "Capital-allocation lens — weights Safety × Infra",
  "investor.portfolio.empty": "No zones on your watchlist yet.",
  "investor.opps.title": "Top opportunities",
  "investor.opps.hint.basic": "Ranked by Vitality — safest positions",
  "investor.opps.hint.sovereign": "Ranked by quarter-over-quarter momentum",
  "investor.opps.hint.deal": "Ranked by capital-allocation lens — zones you don't yet watch",
  "investor.opps.watch": "Watch this zone",
  "investor.opps.opportunity": "Opportunity",
  "investor.activity.title": "Deal-relevant activity",
  "investor.activity.hint": "Alerts on watchlisted zones — sorted by severity",
  "investor.activity.empty": "No open alerts on your watchlist.",
  "investor.thesis": "Thesis",

  // ── Watchlist chip ──────────────────────────────────────────────────────
  "watchlist.add": "Add to watchlist",
  "watchlist.remove": "Remove from watchlist",
  "watchlist.watching": "Watching",

  // ── Announcements ───────────────────────────────────────────────────────
  "announce.dismiss": "Dismiss",

  // ── Assistant answers boilerplate (frequent phrases) ────────────────────
  "assistant.county.avg": "county average",
  "assistant.rank": "rank",
  "assistant.strongest": "Strongest",
  "assistant.weakest": "Weakest",
} as const;

export type MessageKey = keyof typeof en;
