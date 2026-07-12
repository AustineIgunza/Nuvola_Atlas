import type { MessageKey } from "./en";

/**
 * Kiswahili translations for the most visible interface strings. Keys not
 * present here fall back to English via `translate()`. Long editorial copy
 * stays English-fallback until a native reviewer touches it.
 *
 * Translated by hand rather than machine — corrections welcome from any
 * fluent teammate. Priority is the surfaces a Nairobi partner or community
 * user is most likely to read: navigation, settings, assistant, and common
 * button labels.
 */
export const sw: Partial<Record<MessageKey, string>> = {
  // Common
  "common.loading": "Inapakia…",
  "common.save": "Hifadhi",
  "common.saved": "Imehifadhiwa",
  "common.cancel": "Ghairi",
  "common.close": "Funga",
  "common.delete": "Futa",
  "common.new": "Mpya",
  "common.rename": "Badilisha jina",
  "common.change": "Badilisha",
  "common.retry": "Jaribu tena",
  "common.done": "Imekamilika",
  "common.optional": "Si lazima",
  "common.required": "Lazima",
  "common.copied": "Imenakiliwa",
  "common.exportCsv": "Hamisha CSV",
  "common.export": "Hamisha",
  "common.more": "Zaidi",

  // Navigation
  "nav.investor": "Kikundi",
  "nav.atlas": "Ramani",
  "nav.vitality": "Uhai",
  "nav.compare": "Linganisha",
  "nav.infrastructure": "Miundombinu",
  "nav.reports": "Ripoti",
  "nav.alerts": "Arifa",
  "nav.assistant": "Msaidizi",
  "nav.admin": "Msimamizi",
  "nav.settings": "Mipangilio",
  "nav.signOut": "Toka",

  // Sidebar
  "sidebar.subcounties": "Wilaya ndogo",
  "sidebar.dataLayers": "Asase · Tabaka za Data",
  "sidebar.howComputed": "Alama inavyokokotolewa",

  // Topbar
  "topbar.openSearch": "Tafuta",
  "topbar.notifications": "Arifa",
  "topbar.settings": "Mipangilio",
  "topbar.assistant": "Msaidizi",
  "topbar.appearance": "Mwonekano",
  "topbar.preferences": "Mapendeleo",
  "topbar.language": "Lugha",
  "topbar.reducedMotion": "Punguza mwendo",
  "topbar.autoRefresh": "Sasisha kiotomatiki",
  "topbar.openFullSettings": "Fungua mipangilio kamili",

  // Theme
  "theme.light": "Nuru",
  "theme.dark": "Giza",

  // Settings page
  "settings.title": "Mipangilio",
  "settings.subtitle": "Wasifu wako, mwonekano, lugha, na arifa.",
  "settings.profile.title": "Wasifu",
  "settings.profile.description": "Jinsi unavyoonekana kwenye Navuuna.",
  "settings.profile.name": "Jina la kuonyesha",
  "settings.profile.namePlaceholder": "Jinsi jina lako linavyoonekana kwenye upande na ripoti zinazoshirikiwa",
  "settings.profile.email": "Barua pepe",
  "settings.profile.emailHint": "Barua pepe unayoingia nayo — badilisha kutoka kwa mtoaji wa akaunti yako.",
  "settings.profile.role": "Jukumu",
  "settings.profile.avatarColor": "Rangi ya wasifu",
  "settings.profile.avatarHint": "Rangi ya herufi zako za mwanzo.",
  "settings.profile.save": "Hifadhi wasifu",
  "settings.profile.saved": "Wasifu umehifadhiwa.",

  "settings.password.title": "Badilisha nywila",
  "settings.password.description": "Zungusha nywila yako ya kuingia. Utabaki umeingia kwenye kifaa hiki.",
  "settings.password.current": "Nywila ya sasa",
  "settings.password.new": "Nywila mpya",
  "settings.password.confirm": "Thibitisha nywila mpya",
  "settings.password.submit": "Sasisha nywila",
  "settings.password.updated": "Nywila imesasishwa.",
  "settings.password.mismatch": "Nywila mpya hazifanani.",
  "settings.password.tooShort": "Tumia angalau herufi 8.",
  "settings.password.wrongCurrent": "Nywila ya sasa si sahihi.",

  "settings.appearance.title": "Mwonekano",
  "settings.appearance.description": "Mandhari na mwendo.",
  "settings.appearance.theme": "Mandhari",
  "settings.appearance.reducedMotion": "Punguza mwendo",
  "settings.appearance.reducedMotionHint": "Kufifia badala ya kutembea — husaidia hisia za usawa.",

  "settings.language.title": "Lugha",
  "settings.language.description": "Lugha ya kiolesura cha Navuuna Atlas.",
  "settings.language.picker": "Chagua lugha",
  "settings.language.fallbackNote": "Maandishi yoyote ambayo bado hayajatafsiriwa yanarudi kwa Kiingereza ili kuhakikisha hakuna kinachoharibika.",

  "settings.notifications.title": "Arifa",
  "settings.notifications.description": "Kile Navuuna anaruhusiwa kukutumia.",
  "settings.notifications.email": "Arifa za barua pepe",
  "settings.notifications.emailHint": "Arifa za kiwango cha juu na matukio ya miundombinu.",
  "settings.notifications.weekly": "Muhtasari wa kila wiki",
  "settings.notifications.weeklyHint": "Muhtasari wa Jumatatu asubuhi wa yale yaliyosogea katika maeneo yako.",
  "settings.notifications.inApp": "Mabango ya ndani ya programu",
  "settings.notifications.inAppHint": "Aikoni ya kengele juu. Ikizima ni kimya.",

  // Assistant page
  "assistant.title": "Msaidizi",
  "assistant.subtitle": "Uliza maswali kuhusu maeneo ya Nairobi. Kila swali linadhibitiwa na kusoma tu.",
  "assistant.newChat": "Mazungumzo mapya",
  "assistant.history": "Historia",
  "assistant.historyEmpty": "Mazungumzo yako ya awali yataonekana hapa.",
  "assistant.placeholder": "Uliza kuhusu eneo au nguzo yoyote…",
  "assistant.send": "Tuma",
  "assistant.thinking": "Inafikiri…",
  "assistant.readonlyNote": "⌘/Ctrl + Enter kutuma. Maswali ya kusoma tu.",
  "assistant.pickConversation": "Chagua mazungumzo au anzisha mapya.",
  "assistant.starterHint": "Jaribu moja ya haya ili kuanza:",
  "assistant.starter.leaders": "Ni maeneo gani yanaongoza kwa Uhai?",
  "assistant.starter.explainPillars": "Eleza nguzo nne za Uhai",
  "assistant.starter.weakSafety": "Nguzo ya Usalama ni dhaifu wapi?",

  // Auth
  "auth.signIn": "Ingia",
  "auth.signOut": "Toka",

  // Pillar labels
  "pillar.social.short": "Jamii",
  "pillar.safety.short": "Usalama",
  "pillar.density.short": "Msongamano",
  "pillar.infra.short": "Miundo",
  "pillar.social.long": "Ustawi wa Jamii na Mtaji wa Binadamu",
  "pillar.safety.long": "Usalama na Ulinzi",
  "pillar.density.long": "Msongamano na Mienendo ya Ukuaji",
  "pillar.infra.long": "Miundombinu na Ulinzi wa Mazingira",

  // Map layer labels
  "layer.vitality": "Maeneo ya Uhai",
  "layer.roads": "Maendeleo ya Barabara",
  "layer.energy": "Hali ya Umeme",
  "layer.density": "Msongamano",
  "layer.water": "Maji na Usafi",
  "layer.momentum": "Kasi ya Miradi",
  "layer.safety": "Usalama na Ulinzi",

  // Vitality bands + scorecard chrome
  "band.strong": "Imara",
  "band.moderate": "Wastani",
  "band.atRisk": "Hatarini",
  "band.strong.note": "Iko tayari kupokea miradi mipya",
  "band.moderate.note": "Iko tayari na ulinzi maalum",
  "band.atRisk.note": "Mapengo yanahitaji kuzibwa kwanza",
  "scorecard.overview": "Muhtasari",
  "scorecard.pillars": "Nguzo — bofya kupanua",
  "scorecard.projects": "Miundombinu",
  "scorecard.alerts": "Arifa hai",
  "scorecard.trend": "Historia ya alama",
  "scorecard.dataSources": "Vyanzo vya Data",
  "scorecard.askAbout": "Uliza kuhusu {zone}",
  "scorecard.reopenTab": "Fungua kadi tena",
  "scorecard.lastSync": "Ilisasishwa dakika {min} zilizopita",

  // Compare page
  "compare.kicker": "Linganisha",
  "compare.title": "Ulinganisho wa maeneo bega kwa bega",
  "compare.subtitle": "Chagua hadi maeneo {max} ya Nairobi ili kulinganisha Alama ya Uhai, uchambuzi wa nguzo na historia ya alama pamoja.",
  "compare.pick": "Chagua eneo hapo juu kuanza.",
  "compare.newButton": "Ulinganisho mpya",
  "compare.newButton.short": "Mpya",
  "compare.add": "Ongeza eneo{plural} ili kulinganisha",
  "compare.range.day": "Siku",
  "compare.range.week": "Wiki",
  "compare.range.month": "Mwezi",
  "compare.pillarBreakdown": "Uchambuzi wa nguzo",
  "compare.deltas": "Mabadiliko ya robo hii",
  "compare.water": "Maji na Usafi · SDG 6",
  "compare.infra": "Miradi ya miundombinu",
  "compare.alerts": "Arifa hai",
  "compare.history": "Historia ya alama",
  "compare.assistant.header": "Msaidizi",
  "compare.assistant.hint": "Uliza kuhusu maeneo yanayolinganishwa",

  // Atlas map + legend
  "atlas.legend.title": "Alama ya Uhai",
  "atlas.legend.strong": "70–100 Imara",
  "atlas.legend.moderate": "55–69 Wastani",
  "atlas.legend.atRisk": "0–54 Hatarini",
  "atlas.resetView": "Rudisha mwonekano hadi Nairobi",
  "atlas.viewMode.map": "Ramani",
  "atlas.viewMode.satellite": "Setilaiti",
  "atlas.viewMode.terrain": "Ardhi",
  "atlas.liveFeed": "Moja kwa Moja",

  // Project status
  "project.status.active": "Inaendelea",
  "project.status.stalled": "Imesimama",
  "project.status.planned": "Imepangwa",
  "project.progress": "% imekamilika",
  "project.eta": "ETA",
  "project.budget": "Bajeti",
  "project.agency": "Wakala",
  "project.milestones": "Hatua muhimu",

  // Layer hint
  "layerHint.active": "Tabaka la {label} liko kwenye ramani",
  "layerHint.show": "Onyesha tabaka la {label} kwenye Ramani",

  // Explainer views
  "explain.rank": "Nafasi #{rank} kati ya wilaya {total} za Nairobi",
  "explain.compositeReadiness": "Utayari wa jumla",
  "explain.whatIndex": "Kile kielelezo kinapima",
  "explain.howComputed": "Inavyokokotolewa — bofya nguzo",
  "explain.bands": "Vipimo vya alama",
  "explain.dataPipeline": "Bomba la data",
  "explain.dataFreshness": "Uchakachuaji wa vyanzo",
  "explain.subMetrics": "Vipimo vidogo — bofya kupanua",
  "explain.relatedAlerts": "Arifa zinazohusiana",
  "explain.relatedProjects": "Miradi inayohusiana",

  // Alert explainer
  "alert.affectedInfra": "Miundombinu iliyoathirika",
  "alert.recommendedActions": "Hatua zinazopendekezwa",
  "alert.impact": "Kiwango cha athari",
  "alert.severity": "Uzito",

  // Investor personal notes
  "notes.title": "Maandishi yako kuhusu {zone}",
  "notes.placeholder": "Nia ya kibinafsi, maelezo ya mikutano, ufuatiliaji. Yanaonekana kwako pekee.",
  "notes.saved": "Imehifadhiwa hapa.",
  "notes.private": "Andiko la kibinafsi",
  "notes.empty": "Bado hakuna maandishi — anza kuandika.",

  // Impersonation
  "impersonate.button": "Ingia kama mtumiaji",
  "impersonate.title": "Iga {name}",
  "impersonate.reason": "Sababu (lazima — imeandikwa kwenye kumbukumbu)",
  "impersonate.start": "Anza kikao",
  "impersonate.active": "Unaiga {name}",
  "impersonate.end": "Maliza kuiga",
  "impersonate.subtitle": "Kila kitendo katika kikao hiki kinakumbukwa na kitambulisho chako cha msimamizi na sababu hii.",

  // Content CMS
  "cms.title": "Usimamizi wa Maudhui",
  "cms.subtitle": "Maandishi ya uhariri yanayoonyeshwa kwenye kurasa za umma na mbinu. Kila kuhifadhi hutengeneza toleo.",
  "cms.pick": "Chagua kizuizi cha kuhariri",
  "cms.blocks.methodology": "Mbinu · Muhtasari",
  "cms.blocks.social": "Nguzo · Ustawi wa Jamii",
  "cms.blocks.safety": "Nguzo · Usalama",
  "cms.blocks.density": "Nguzo · Msongamano",
  "cms.blocks.infra": "Nguzo · Miundombinu",
  "cms.blocks.public": "Ukurasa wa Umma · Utangulizi",
  "cms.editorLabel": "Mwili (Markdown)",
  "cms.publish": "Chapisha",
  "cms.savedRevision": "Toleo limehifadhiwa.",
  "cms.revisions": "Historia ya matoleo ({count})",

  // Public portal
  "public.title": "Kaunti ya Nairobi — Ramani ya Umma",
  "public.subtitle": "Mwonekano wa jamii wa utoaji wa miundombinu katika kata yako.",
  "public.signIn": "Ingia kwa ufikiaji kamili",
  "public.methodology": "Kuhusu mbinu",
  "public.footer": "Imejengwa na timu ya wanafunzi wa Navuuna katika Chuo Kikuu cha Strathmore.",

  // Reports page
  "reports.title": "Ripoti",
  "reports.subtitle": "Utafiti uliochapishwa na muhtasari wa mara kwa mara kwa eneo na nguzo.",
  "reports.new": "Ripoti mpya",
  "reports.empty": "Hakuna ripoti zinazoonana na kichujio chako.",
  "reports.status.published": "Imechapishwa",
  "reports.status.review": "Inakaguliwa",
  "reports.status.draft": "Rasimu",
  "reports.download.pdf": "Pakua PDF",
  "reports.download.docx": "Pakua DOCX",
  "reports.download.txt": "Pakua TXT",

  // Alerts page
  "alerts.title": "Arifa",
  "alerts.subtitle": "Masuala ya sasa yanayoibuliwa na huduma za ufuatiliaji kote Nairobi.",
  "alerts.markAllRead": "Weka zote zilisomwa",
  "alerts.severity.high": "Juu",
  "alerts.severity.medium": "Kati",
  "alerts.severity.low": "Chini",
  "alerts.filter.all": "Zote",
  "alerts.filter.unread": "Zisizosomwa pekee",
  "alerts.empty": "Hakuna arifa za kuonyesha.",
  "alerts.systemWide": "Mfumo mzima",
  "alerts.loadFailed": "Imeshindwa kupakia arifa",

  // Vitality methodology page
  "vitality.title": "Kielelezo cha Uhai cha UE",
  "vitality.subtitle": "Jinsi Navuuna inavyopima kila wilaya ndogo kutoka 0 hadi 100 katika nguzo nne.",
  "vitality.pillars.title": "Nguzo nne",
  "vitality.compose.title": "Jinsi jumla inavyoundwa",
  "vitality.compose.body": "Kila nguzo hupata wastani wa viashirio vyake visivyo tupu. Jumla ni wastani wa nguzo nne — nguzo iliyo tupu kabisa hurukwa, hairuhusiwi kuwa sifuri.",
  "vitality.rules.title": "Sheria",
  "vitality.rules.item1": "Kila kiashiria ni thamani ya 0–100 iliyorekebishwa au TUPU (\"Inasubiri data\").",
  "vitality.rules.item2": "Alama ya nguzo = wastani wa viashirio visivyo tupu vya nguzo.",
  "vitality.rules.item3": "Jumla = wastani wa nguzo zenye kiashiria kimoja au zaidi kisichokuwa tupu.",
  "vitality.rules.item4": "Viashirio vinavyokosekana huondolewa kutoka kwenye wastani — havichukuliwi kama sifuri.",
  "vitality.leaderboard": "Ubao wa Uongozi wa Uhai",
  "vitality.overall": "Jumla",
  "vitality.subCounty": "Wilaya ndogo",
  "vitality.trend": "Mwelekeo",
  "vitality.filterByName": "Chuja kwa jina...",

  // Investor dashboard
  "investor.title": "Dashibodi ya Mwekezaji",
  "investor.subtitle": "Kikundi cha kampuni yako Nairobi kwa muhtasari. Maeneo yaliyoorodheshwa yanakusanywa hapa.",
  "investor.download": "Pakua muhtasari",
  "investor.kpi.portfolio": "Wastani wa kikundi",
  "investor.kpi.watchlisted": "Yameorodheshwa",
  "investor.kpi.projects": "Miradi hai",
  "investor.kpi.alerts": "Arifa",
  "investor.kpi.vsCounty": "dhidi ya kaunti",
  "investor.portfolio.title": "Nafasi za kikundi",
  "investor.portfolio.hint": "Lensi ya mgao wa mtaji — inapima Usalama × Miundombinu",
  "investor.portfolio.empty": "Bado hakuna maeneo kwenye orodha yako.",
  "investor.opps.title": "Fursa bora",
  "investor.opps.hint.basic": "Zimepangwa kwa Uhai — nafasi salama zaidi",
  "investor.opps.hint.sovereign": "Zimepangwa kwa mabadiliko ya robo baada ya robo",
  "investor.opps.hint.deal": "Zimepangwa kwa lensi ya mgao wa mtaji — maeneo usiyokuwa unayafuatilia",
  "investor.opps.watch": "Fuatilia eneo hili",
  "investor.opps.opportunity": "Fursa",
  "investor.activity.title": "Shughuli inayohusu deal",
  "investor.activity.hint": "Arifa kwenye maeneo yaliyoorodheshwa — zimepangwa kwa uzito",
  "investor.activity.empty": "Hakuna arifa hai kwenye orodha yako.",
  "investor.thesis": "Nia",

  // Watchlist chip
  "watchlist.add": "Ongeza kwenye orodha",
  "watchlist.remove": "Ondoa kutoka orodha",
  "watchlist.watching": "Inafuatiliwa",

  // Announcements
  "announce.dismiss": "Ondoa",

  // Assistant boilerplate
  "assistant.county.avg": "wastani wa kaunti",
  "assistant.rank": "nafasi",
  "assistant.strongest": "Imara zaidi",
  "assistant.weakest": "Dhaifu zaidi",
};
