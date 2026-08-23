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
  "common.exportCsv": "Export CSV",
  "common.export": "Export",
  "common.more": "More",

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
  "settings.password.description":
    "Rotate your sign-in password. You'll stay signed in on this device.",
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
  "settings.appearance.reducedMotionHint":
    "Fade in place of movement — helps with vestibular sensitivity.",

  "settings.language.title": "Language",
  "settings.language.description": "The interface language for Navuuna Atlas.",
  "settings.language.picker": "Choose language",
  "settings.language.fallbackNote":
    "Any string we haven't translated yet falls back to English so nothing breaks.",

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
  "assistant.starter.leaders": "Which sub-counties score highest?",
  "assistant.starter.explainPillars": "Explain the pillars behind the score",
  "assistant.starter.weakWater": "Where is water and sanitation weakest?",

  // ── Sign-in / auth ───────────────────────────────────────────────────────
  "auth.signIn": "Sign in",
  "auth.signOut": "Sign out",

  // ── Pillar labels (short + long) ─────────────────────────────────────────
  "pillar.water_sanitation.short": "Water",
  "pillar.road_density.short": "Roads",
  "pillar.transit_access.short": "Transit",
  "pillar.electricity_access.short": "Power",
  "pillar.water_sanitation.long": "Water & Sanitation",
  "pillar.road_density.long": "Road Density",
  "pillar.transit_access.long": "Transit Access",
  "pillar.electricity_access.long": "Electricity Access",

  // ── Map layer labels ────────────────────────────────────────────────────
  "layer.vitality": "Service Performance",
  "layer.roads": "Road Density",
  "layer.energy": "Electricity Access",
  "layer.water": "Water & Sanitation",

  // ── Vitality bands + scorecard chrome ───────────────────────────────────
  "band.strong": "Strong",
  "band.moderate": "Moderate",
  "band.atRisk": "At Risk",
  "band.strong.note": "Ready to absorb new projects",
  "band.moderate.note": "Ready with targeted safeguards",
  "band.atRisk.note": "Readiness gaps need closing first",
  "band.noData": "Insufficient data",
  "band.noData.note": "No indicators recorded for this zone yet",
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
  "compare.subtitle":
    "Pick up to {max} Nairobi sub-counties to compare their Vitality Score, pillar breakdown, and score history side by side.",
  "compare.pick": "Pick a zone above to start.",
  "compare.newButton": "New comparison",
  "compare.newButton.short": "New",
  "compare.add": "Add zone{plural} to compare",
  "compare.range.day": "Day",
  "compare.range.week": "Week",
  "compare.range.month": "Month",
  "compare.pillarBreakdown": "Pillar breakdown",
  "compare.deltas": "Change over the measured window",
  "compare.deltasNone": "Not enough history",
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

  // ── Project status ──────────────────────────────────────────────────────
  "project.status.active": "Active",
  "project.status.stalled": "Stalled",
  "project.status.planned": "Planned",
  "project.progress": "% complete",
  "project.eta": "ETA",
  "project.budget": "Budget",
  "project.agency": "Agency",
  "project.milestones": "Milestones",

  // ── Layer hint ──────────────────────────────────────────────────────────
  "layerHint.active": "{label} layer is on the map",
  "layerHint.show": "Show {label} layer on the Atlas",

  // ── Explainer views ─────────────────────────────────────────────────────
  "explain.rank": "Ranked #{rank} of {total} Nairobi sub-counties",
  "explain.compositeReadiness": "Composite readiness",
  "explain.whatIndex": "What the index measures",
  "explain.howComputed": "How it's computed — tap a pillar",
  "explain.bands": "Score bands",
  "explain.dataPipeline": "Data pipeline",
  "explain.dataFreshness": "Data source freshness",
  "explain.subMetrics": "Sub-metrics — tap to expand",
  "explain.relatedAlerts": "Related alerts",
  "explain.relatedProjects": "Related projects",

  // ── Alert explainer ─────────────────────────────────────────────────────
  "alert.affectedInfra": "Affected infrastructure",
  "alert.recommendedActions": "Recommended actions",
  "alert.impact": "Impact level",
  "alert.severity": "Severity",

  // ── Investor personal notes ─────────────────────────────────────────────
  "notes.title": "Your notes on {zone}",
  "notes.placeholder": "Private thesis, meeting notes, follow-ups. Visible only to you.",
  "notes.saved": "Saved locally.",
  "notes.private": "Private note",
  "notes.empty": "No notes yet — start typing.",

  // ── Impersonation ───────────────────────────────────────────────────────
  "impersonate.button": "View as user",
  "impersonate.title": "Impersonate {name}",
  "impersonate.reason": "Reason (required — logged to audit trail)",
  "impersonate.start": "Start session",
  "impersonate.active": "Impersonating {name}",
  "impersonate.end": "End impersonation",
  "impersonate.subtitle":
    "Every action taken during this session is recorded to the audit trail with your admin ID and this reason.",

  // ── Content CMS ─────────────────────────────────────────────────────────
  "cms.title": "Content Management",
  "cms.subtitle":
    "Editorial copy shown on public + methodology surfaces. Every save creates a revision.",
  "cms.pick": "Pick a block to edit",
  "cms.blocks.methodology": "Methodology · Overview",
  "cms.blocks.water_sanitation": "Pillar · Water & Sanitation",
  "cms.blocks.road_density": "Pillar · Road Density",
  "cms.blocks.transit_access": "Pillar · Transit Access",
  "cms.blocks.electricity_access": "Pillar · Electricity Access",
  "cms.blocks.public": "Public Portal · Intro",
  "cms.editorLabel": "Body (Markdown)",
  "cms.publish": "Publish",
  "cms.savedRevision": "Revision saved.",
  "cms.revisions": "Revision history ({count})",

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
  "alerts.systemWide": "System-wide",
  "alerts.loadFailed": "Failed to load alerts",

  // ── Vitality methodology page ───────────────────────────────────────────
  "vitality.title": "The UE Vitality Index",
  "vitality.subtitle": "How Navuuna scores every sub-county from 0 to 100 across four pillars.",
  "vitality.pillars.title": "The four pillars",
  "vitality.compose.title": "How the composite is built",
  "vitality.compose.body":
    "Each pillar averages its non-null indicators. The composite averages the four pillars — a fully-missing pillar is skipped, never zero-biased.",
  "vitality.rules.title": "Rules",
  "vitality.rules.item1": 'Every indicator is a 0–100 normalized value or NULL ("Awaiting data").',
  "vitality.rules.item2": "Pillar score = simple average of the pillar's non-null indicators.",
  "vitality.rules.item3":
    "Composite = simple average of pillars that have at least one non-null indicator.",
  "vitality.rules.item4":
    "Missing indicators are excluded from the average — never treated as zero.",
  "vitality.leaderboard": "Vitality Leaderboard",
  "vitality.overall": "Overall",
  "vitality.subCounty": "Sub-county",
  "vitality.trend": "Trend",
  "vitality.filterByName": "Filter by name...",

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

  // ── ESG lens (investor-only, additive framing chip) ─────────────────────
  "esgLens.on": "ESG lens · on",
  "esgLens.off": "ESG lens",
  "esgLens.turnOn": "Turn ESG lens on",
  "esgLens.turnOff": "Turn ESG lens off",
  "reports.investorFilter.badge": "Watchlist only",
  "reports.investorFilter.showAll": "Show all reports",
  "reports.investorFilter.showWatchlist": "Show only watchlist",

  // ── Announcements ───────────────────────────────────────────────────────
  "announce.dismiss": "Dismiss",

  // ── Assistant answers boilerplate (frequent phrases) ────────────────────
  "assistant.county.avg": "county average",
  "assistant.rank": "rank",
  "assistant.strongest": "Strongest",
  "assistant.weakest": "Weakest",

  // ── Alert kinds / impact labels ─────────────────────────────────────────
  "alert.kind.infra": "Infrastructure",
  "alert.kind.vitality": "Vitality Index",
  "alert.kind.esia": "ESIA / Environmental",
  "alert.kind.system": "System",
  "alert.kind.partner": "Partnership",
  "alert.impact.critical": "Critical Impact",
  "alert.impact.major": "Major Impact",
  "alert.impact.moderate": "Moderate Impact",
  "alert.impact.minor": "Minor Impact",
  "alert.impact.short.critical": "Critical",
  "alert.impact.short.major": "Major",
  "alert.impact.short.moderate": "Moderate",
  "alert.impact.short.minor": "Minor",
  "alert.linked.impactSuffix": "{level} impact · {relative}",
  "alert.detailLabel": "Alert details",
  "alert.relatedProjects": "Related Projects",

  // ── Infrastructure surface ──────────────────────────────────────────────
  "infra.filter.all": "All",
  "infra.filter.road": "Road",
  "infra.filter.energy": "Energy",
  "infra.filter.grid": "Grid",
  "infra.filter.water": "Water",
  "infra.status.active": "Active",
  "infra.status.stalled": "Stalled",
  "infra.status.planned": "Planned",
  "infra.card.etaLine": "{progress}% · ETA {eta}",
  "infra.detail.progress": "Progress",
  "infra.detail.deliveryAnalysis": "Delivery analysis",
  "infra.detail.scheduleElapsed": "Schedule elapsed",
  "infra.detail.workDelivered": "Work delivered",
  "infra.detail.linkedAlerts": "Linked alerts",
  "infra.detail.milestones": "Milestones",
  "infra.detail.startedLine": "{zone} · started {date}",
  "infra.detail.daysToEta": "{days} days to the {eta} ETA.",
  "infra.detail.overdueBy": "Overdue by {days} days against the {eta} ETA.",
  "infra.detail.nextMilestone": "Next milestone: {label}, due {date}",
  "infra.detail.overdueTag": " · overdue",
  "infra.detail.allMilestonesDone": "All {count} milestones are confirmed complete.",
  "infra.detail.stalledWarning":
    "Delivery is flagged as stalled — field verification is pending. The milestones below reflect the last confirmed on-the-ground status.",
  "infra.detail.viewOnAtlas": "View {zone} on the Atlas",
  "infra.detail.detailsLabel": "Project details",
  "infra.detail.detailsAria": "{name} details",
  "infra.kv.budget": "Budget",
  "infra.kv.progress": "Progress",
  "infra.kv.eta": "ETA",
  "infra.kv.milestones": "Milestones",
  "infra.milestones.of": "{done} of {total}",
  "infra.verdict.stalled": "Stalled — delivery is {gap} pts behind the schedule curve.",
  "infra.verdict.onTrack": "On the schedule curve.",
  "infra.verdict.ahead": "Tracking {gap} pts ahead of schedule.",
  "infra.verdict.slipping": "Slipping — {gap} pts behind the schedule curve.",
  "infra.verdict.critical": "Critically behind — {gap} pts under the schedule curve.",

  // ── Leaderboard (Vitality page) ─────────────────────────────────────────
  "leaderboard.subCountyNairobi": "Sub-county · Nairobi",
  "leaderboard.indexTitle": "UE Vitality Index",
  "leaderboard.updatedAgo": "Updated {min} min ago",
  "leaderboard.openAtlas": "Open on Atlas map",
  "leaderboard.previewAria": "{zone} scorecard preview",

  // ── Chat / Assistant answer templates ──────────────────────────────────
  "chat.followup.whichDriving": "Which pillar is driving that gap?",
  "chat.followup.qoqMoves": "How have these sub-counties moved quarter-over-quarter?",
  "chat.followup.whichInfra": "Which infrastructure projects are behind these numbers?",
  "chat.followup.whichLeads": "Which Nairobi sub-counties score highest?",
  "chat.followup.explainPillars": "Explain the pillars behind the score",
  "chat.followup.waterWeakest": "Where is water and sanitation weakest across the county?",
  "chat.followup.whyPillarStronger": "Why is {zone}'s {pillar} pillar stronger?",
  "chat.followup.activeProjectsIn": "Which infrastructure projects are active in {zone}?",
  "chat.followup.gapMovedThisQuarter":
    "How has the gap between {top} and {bottom} moved this quarter?",
  "chat.followup.whyWeakPoint": "Why is {pillar} the weak point in {zone}?",
  "chat.followup.compareCountyAvg": "Compare {zone} to the county average",
  "chat.followup.projectsBehindScore": "Which infrastructure projects are behind {zone}'s score?",
  "chat.followup.trend30d": "Show me {zone}'s trend over the last 30 days",
  "chat.followup.bottomFive": "What about the bottom five?",
  "chat.followup.pillarDriving": "Which pillar is driving {zone}'s score?",
  "chat.followup.top5Change": "How has the top five changed over the last quarter?",
  "chat.followup.pillarMoving": "Which pillar is moving inside {zone}?",
  "chat.followup.compareToAnother": "Compare {zone}'s trend to another zone",
  "chat.followup.activeAlerts": "What alerts are active for {zone}?",
  "chat.followup.tellMeAbout": "Tell me about {zone}",
  "chat.followup.pillarMostContrib": "Which pillar contributes most to the overall score?",
  "chat.followup.pillarsDisagree": "Show me a zone where the pillars disagree",
  "chat.followup.dataOrigin": "Where does the underlying data come from?",
  "chat.compare.needSecond":
    "Pick a second sub-county in the picker above and I'll walk through the pillars side by side — {pillars}.",
  "chat.compare.opener": "{top} leads overall at {topScore}, {gaps}.",
  "chat.compare.gap": "{gap} pt{plural} ahead of {name}",
  "chat.compare.pillarLine": "• {pillar}: {values} — spread of {spread} pt{plural}.",
  "chat.compare.closing":
    "{pillar} is where these sub-counties diverge most ({spread} pt spread), so if you're prioritising, that's the pillar to interrogate first.",
  "chat.composition.needZone":
    "Pick a sub-county or mention one by name and I'll break down its pillars — {pillars}.",
  "chat.composition.opener":
    "**{zone}** scores **{score}/100** overall — that's {delta} vs. the Nairobi average ({avg}) and puts it at rank #{rank} of the 17 sub-counties. Readiness band: **{band}**.",
  "chat.composition.pillarLine": "• **{pillar}** — {value}/100 {arrow} ({delta})",
  "chat.composition.deltaFlat": "flat",
  "chat.composition.deltaOverDays": "{sign}{value} over {days}d",
  "chat.composition.deltaUnknown": "no trend yet",
  "chat.composition.strongLabel": "**Strongest — {pillar}.**",
  "chat.composition.weakLabel": "**Weakest — {pillar}.**",
  "chat.composition.unscored":
    "**{zone}** has no composite score yet — none of its pillars has a reading behind it, so I can't break down what does not exist. Once indicators start landing for the sub-county, I can compose the score and its pillars from those readings.",
  "chat.strong.water_sanitation":
    "Improved water supply reaches most households in {zone}, and the sanitation mix is not dominated by shared or open facilities. This is the pillar the whole record is built around, so a strong reading here carries the most weight.",
  "chat.strong.road_density":
    "{zone} has a dense mapped road network for its area — the usual precondition for waste collection, emergency access and last-mile delivery working at all.",
  "chat.strong.transit_access":
    "Most residents of {zone} live within walking distance of a matatu stop, so reaching work and services is not gated on owning a vehicle.",
  "chat.strong.electricity_access":
    "Household electricity for lighting was widespread in {zone} at the 2019 census. That is the newest sub-county figure that exists — read it as a floor, not as today.",
  "chat.weak.water_sanitation":
    "This is the pillar to fund first in {zone}. Where trunk sewerage is not viable, the realistic path is context-specific sanitation rather than waiting on a main with no funded date.",
  "chat.weak.road_density":
    "{zone} has little mapped road per square kilometre. That constrains everything downstream — collection routes, ambulance times, and the cost of delivering anything at all.",
  "chat.weak.transit_access":
    "A large share of {zone} sits outside walking distance of a matatu stop. That puts a daily cost on residents which shows up in no other pillar.",
  "chat.weak.electricity_access":
    "The reading is weak, but its only source is the 2019 census. Verify against something current before acting on it.",
  "chat.distribution":
    "{top1} and {top2} share the lead at {score1}/{score2}. {top3} follows at {score3}, then {top4} ({score4}) and {top5} ({score5}). The top five sit within {spread} points — Nairobi's strongest sub-counties are clustered rather than pulled apart by any single runaway leader.",
  "chat.distribution.needMore":
    "Only {count} zone(s) have a composite score right now — I need at least five to name the leaders honestly. As more zones start receiving indicators, the top-five ranking becomes meaningful.",
  "chat.trend":
    "{zone} has held between {low} and {high} over the last 30 days. The trajectory is best described as stable. No sudden movements to flag.",
  "chat.trend.unscored":
    "**{zone}** has no composite score to trend against yet — a 30-day trajectory needs a starting number, and there isn't one. Once the sub-county has its first scored snapshot, the trend chart becomes available.",
  "chat.methodology":
    "The score blends the pillars — {pillars} — each on a 0–100 scale. Weights live in one versioned registry rather than inline anywhere, a pillar with no reading is dropped from both the numerator and the divisor instead of counting as a zero, and every input is versioned in a snapshot table, so any score you see traces back to the reading that produced it.",
  "chat.summary.needZone":
    "Pick a sub-county or two from the compare picker and I'll walk through their pillars. Without a specific sub-county in view, I can only speak to county averages.",
  "chat.summary.single":
    "{zone} sits at {score}/100 overall. {pillars}. Ask about any pillar and I can go deeper.",
  "chat.summary.multi":
    'You\'re comparing {names}. Their overall scores average {avg}. Ask "compare across all pillars" for the full breakdown, or narrow to a single pillar for a deeper look.',
  "chat.summary.multi.unscored":
    "You're comparing {names}. None of them has a composite score yet, so there's no average to report — but I can still walk through whichever pillar readings each does have.",
  "chat.diagnostic.stable":
    "Every zone in Nairobi is roughly stable this quarter — the softest moves are inside noise. Ask about a specific pillar to go deeper.",
  "chat.diagnostic.noMovement":
    "There isn't enough history for **{zone}** yet to say which pillar moved — measuring a direction of travel needs at least two score snapshots. What I can say is that **{weakestPillar}** at {weakestValue}/100 is its weakest pillar today.",
  "chat.diagnostic.drop":
    "**{zone}** — the specific pillar to look at is **{worstPillar}**, which moved {worstDelta} over the last {days} days. The best mover was {bestPillar} at {bestDelta}, so the net Vitality Score of {score} is only mildly affected by the drop. \n\n**Likely cause.** {cause} The alerts feed for {zone} usually names the exact project or incident behind a move this size — worth checking before you commit to a diagnosis.\n\nOn the standing weak side, **{weakestPillar}** at {weakestValue}/100 is the pillar that structurally holds {zone} back, regardless of recent movement.",
  "chat.diagnostic.growth":
    "**{zone}** did not drop on any measured pillar over the last {days} days — the softest move was {worstPillar} at {worstDelta}, and the strongest was {bestPillar} at {bestDelta}. Growth is broad-based, not driven by a single pillar. \n\nOn the standing weak side, **{weakestPillar}** at {weakestValue}/100 is the pillar that keeps the composite from climbing further — {weakExplain}",
  "chat.cause.water_sanitation":
    "A move here tracks either a revision to the utility's reported service performance or a change in the household sanitation mix. WASREB's IMPACT report is where the utility-side figure is published; the household side comes from the census.",
  "chat.cause.road_density":
    "Road density is measured off the OSM extract, not the ground. A mapping campaign can add kilometres that were always there, so check the extract date around {zone} before reading a move as construction.",
  "chat.cause.transit_access":
    "Transit access follows the GTFS refresh — routes added, retired, or re-surveyed by Digital Matatus. A route withdrawal lands here before it lands anywhere else.",
  "chat.cause.electricity_access":
    "Electricity access has one source and one vintage, the 2019 census. Any movement here is a recalculation, not a change on the ground in {zone}.",
  "chat.errorGeneric": "Sorry — that request could not be sent.",
  "chat.errorEnded": "The chat stream ended unexpectedly.",

  // ── Scorecard drill-in ──────────────────────────────────────────────────
  "scorecard.header.overviewKicker": "Sub-county · Vitality Scorecard",
  "scorecard.header.indexTitle": "UE Vitality Index",
  "scorecard.header.pillarKicker": "{zone} · Pillar",
  "scorecard.header.waterKicker": "{zone} · SDG 6",
  "scorecard.header.waterTitle": "Water & Sanitation",
  "scorecard.header.projectKicker": "{zone}",
  "scorecard.header.projectTitle": "Project detail",
  "scorecard.header.alertKicker": "{zone}",
  "scorecard.header.alertTitle": "Alert detail",
  "scorecard.close": "Close scorecard",
  "scorecard.back": "Back",
  "scorecard.askShort": "Ask about {zone}",
  "scorecard.askAria": "Ask assistant about {zone}",
  "scorecard.askPrompt":
    "Tell me about {zone} — what's driving the Vitality score and where are the biggest gaps across the four pillars?",
  "scorecard.deltaOverDays": "{arrow} {value} pts over {days}d",
  "scorecard.deltaUnknown": "Trend not yet measurable",
  "scorecard.lastSyncShort": "Last sync {min} min ago",
  "scorecard.howComputed": "How this score is computed",

  // Shown wherever the API returned null and the client filled the gap.
  "estimated.tooltip": "Estimated — no measured data for this indicator",
  "estimated.zoneBadge": "Contains estimated values",
  "scorecard.water.unmetNeed": "Unmet need",
  "scorecard.water.opportunity": "Decentralized sanitation opportunity",
  "scorecard.water.sewerage": "Sewerage viable here",
  "scorecard.infra.title": "Infrastructure · {count} {noun}",
  "scorecard.infra.noun.one": "project",
  "scorecard.infra.noun.many": "projects",
  "scorecard.infra.empty":
    "No tracked infrastructure projects in {zone} yet — new KURA / KPLC / KeNHA works will appear here as they are ingested.",
  "scorecard.alerts.title": "Active alerts · {count}",
  "scorecard.alerts.empty": "No active alerts for this zone — monitoring feeds are quiet.",
  "scorecard.viewAll": "View all →",
  "scorecard.openFullReport": "Open full report",
  "scorecard.export": "Export",
  "scorecard.exporting": "Exporting…",
  "scorecard.export.pdf": "PDF",
  "scorecard.export.docx": "Word (DOCX)",
  "scorecard.export.txt": "Plain text",

  // ── Sidebar layer meta ──────────────────────────────────────────────────
  "sidebar.featuresCount": "{count} features",
  "sidebar.syncAge.justNow": "just now",
  "sidebar.syncAge.minutes": "{n}m ago",
  "sidebar.syncAge.hours": "{n}h ago",
  "sidebar.syncAge.days": "{n}d ago",
  "sidebar.syncAge.months": "{n}mo ago",
  "sidebar.toggleLayer": "Toggle {label} layer",
  "sidebar.expandSidebar": "Expand sidebar",
  "sidebar.collapseSidebar": "Collapse sidebar",
  "sidebar.openMenu": "Open menu",
  "sidebar.closeMenu": "Close menu",
  "sidebar.role.viewer": "Viewer",
  "sidebar.role.investor": "Investor",
  "sidebar.role.admin": "Administrator",

  // ── Layer descriptions ──────────────────────────────────────────────────
  "layerDesc.vitality": "Choropleth of the service-performance score per sub-county.",
  "layerDesc.roads": "Kilometres of mapped road per km² — HOT OSM.",
  "layerDesc.energy": "Households using electricity for lighting — KNBS 2019 census.",
  "layerDesc.water": "Water access and sanitation solution profile — SDG 6.",

  // ── TopBar chrome ───────────────────────────────────────────────────────
  "topbar.live": "Live",
  "topbar.openAssistant": "Open Navuuna assistant",
  "topbar.closeAssistant": "Close Navuuna assistant",
  "topbar.searchAria": "Search (Cmd+K)",
  "topbar.notificationsAria": "Notifications",
  "topbar.notificationsWithCount": "Notifications ({count} unread)",
} as const;

export type MessageKey = keyof typeof en;
