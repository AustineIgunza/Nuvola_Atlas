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
  "settings.profile.namePlaceholder":
    "Jinsi jina lako linavyoonekana kwenye upande na ripoti zinazoshirikiwa",
  "settings.profile.email": "Barua pepe",
  "settings.profile.emailHint":
    "Barua pepe unayoingia nayo — badilisha kutoka kwa mtoaji wa akaunti yako.",
  "settings.profile.role": "Jukumu",
  "settings.profile.avatarColor": "Rangi ya wasifu",
  "settings.profile.avatarHint": "Rangi ya herufi zako za mwanzo.",
  "settings.profile.save": "Hifadhi wasifu",
  "settings.profile.saved": "Wasifu umehifadhiwa.",

  "settings.password.title": "Badilisha nywila",
  "settings.password.description":
    "Zungusha nywila yako ya kuingia. Utabaki umeingia kwenye kifaa hiki.",
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
  "settings.language.fallbackNote":
    "Maandishi yoyote ambayo bado hayajatafsiriwa yanarudi kwa Kiingereza ili kuhakikisha hakuna kinachoharibika.",

  "settings.notifications.title": "Arifa",
  "settings.notifications.description": "Kile Navuuna anaruhusiwa kukutumia.",
  "settings.notifications.email": "Arifa za barua pepe",
  "settings.notifications.emailHint": "Arifa za kiwango cha juu na matukio ya miundombinu.",
  "settings.notifications.weekly": "Muhtasari wa kila wiki",
  "settings.notifications.weeklyHint":
    "Muhtasari wa Jumatatu asubuhi wa yale yaliyosogea katika maeneo yako.",
  "settings.notifications.inApp": "Mabango ya ndani ya programu",
  "settings.notifications.inAppHint": "Aikoni ya kengele juu. Ikizima ni kimya.",

  // Assistant page
  "assistant.title": "Msaidizi",
  "assistant.subtitle":
    "Uliza maswali kuhusu maeneo ya Nairobi. Kila swali linadhibitiwa na kusoma tu.",
  "assistant.newChat": "Mazungumzo mapya",
  "assistant.history": "Historia",
  "assistant.historyEmpty": "Mazungumzo yako ya awali yataonekana hapa.",
  "assistant.placeholder": "Uliza kuhusu eneo au nguzo yoyote…",
  "assistant.send": "Tuma",
  "assistant.thinking": "Inafikiri…",
  "assistant.readonlyNote": "⌘/Ctrl + Enter kutuma. Maswali ya kusoma tu.",
  "assistant.pickConversation": "Chagua mazungumzo au anzisha mapya.",
  "assistant.starterHint": "Jaribu moja ya haya ili kuanza:",
  "assistant.starter.leaders": "Ni kata gani zenye alama za juu zaidi?",
  "assistant.starter.explainPillars": "Eleza nguzo zinazounda alama",
  "assistant.starter.weakWater": "Maji na usafi wa mazingira ni dhaifu wapi?",

  // Auth
  "auth.signIn": "Ingia",
  "auth.signOut": "Toka",

  // Pillar labels
  "pillar.water_sanitation.short": "Maji",
  "pillar.road_density.short": "Barabara",
  "pillar.transit_access.short": "Usafiri",
  "pillar.electricity_access.short": "Umeme",
  "pillar.water_sanitation.long": "Maji na Usafi wa Mazingira",
  "pillar.road_density.long": "Msongamano wa Barabara",
  "pillar.transit_access.long": "Upatikanaji wa Usafiri",
  "pillar.electricity_access.long": "Upatikanaji wa Umeme",

  // Map layer labels
  "layer.vitality": "Utendaji wa Huduma",
  "layer.roads": "Msongamano wa Barabara",
  "layer.energy": "Upatikanaji wa Umeme",
  "layer.water": "Maji na Usafi",

  // Vitality bands + scorecard chrome
  "band.strong": "Imara",
  "band.moderate": "Wastani",
  "band.atRisk": "Hatarini",
  "band.strong.note": "Iko tayari kupokea miradi mipya",
  "band.moderate.note": "Iko tayari na ulinzi maalum",
  "band.atRisk.note": "Mapengo yanahitaji kuzibwa kwanza",
  "band.noData": "Hakuna data ya kutosha",
  "band.noData.note": "Hakuna viashiria vilivyorekodiwa kwa eneo hili bado",
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
  "compare.subtitle":
    "Chagua hadi maeneo {max} ya Nairobi ili kulinganisha Alama ya Uhai, uchambuzi wa nguzo na historia ya alama pamoja.",
  "compare.pick": "Chagua eneo hapo juu kuanza.",
  "compare.newButton": "Ulinganisho mpya",
  "compare.newButton.short": "Mpya",
  "compare.add": "Ongeza eneo{plural} ili kulinganisha",
  "compare.range.day": "Siku",
  "compare.range.week": "Wiki",
  "compare.range.month": "Mwezi",
  "compare.pillarBreakdown": "Uchambuzi wa nguzo",
  "compare.deltas": "Mabadiliko katika kipindi kilichopimwa",
  "compare.deltasNone": "Historia haitoshi",
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
  "notes.placeholder":
    "Nia ya kibinafsi, maelezo ya mikutano, ufuatiliaji. Yanaonekana kwako pekee.",
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
  "impersonate.subtitle":
    "Kila kitendo katika kikao hiki kinakumbukwa na kitambulisho chako cha msimamizi na sababu hii.",

  // Content CMS
  "cms.title": "Usimamizi wa Maudhui",
  "cms.subtitle":
    "Maandishi ya uhariri yanayoonyeshwa kwenye kurasa za umma na mbinu. Kila kuhifadhi hutengeneza toleo.",
  "cms.pick": "Chagua kizuizi cha kuhariri",
  "cms.blocks.methodology": "Mbinu · Muhtasari",
  "cms.blocks.water_sanitation": "Nguzo · Maji na Usafi wa Mazingira",
  "cms.blocks.road_density": "Nguzo · Msongamano wa Barabara",
  "cms.blocks.transit_access": "Nguzo · Ufikiaji wa Usafiri",
  "cms.blocks.electricity_access": "Nguzo · Ufikiaji wa Umeme",
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
  "vitality.subtitle":
    "Jinsi Navuuna inavyopima kila wilaya ndogo kutoka 0 hadi 100 katika nguzo nne.",
  "vitality.pillars.title": "Nguzo nne",
  "vitality.compose.title": "Jinsi jumla inavyoundwa",
  "vitality.compose.body":
    "Kila nguzo hupata wastani wa viashirio vyake visivyo tupu. Jumla ni wastani wa nguzo nne — nguzo iliyo tupu kabisa hurukwa, hairuhusiwi kuwa sifuri.",
  "vitality.rules.title": "Sheria",
  "vitality.rules.item1":
    'Kila kiashiria ni thamani ya 0–100 iliyorekebishwa au TUPU ("Inasubiri data").',
  "vitality.rules.item2": "Alama ya nguzo = wastani wa viashirio visivyo tupu vya nguzo.",
  "vitality.rules.item3":
    "Jumla = wastani wa nguzo zenye kiashiria kimoja au zaidi kisichokuwa tupu.",
  "vitality.rules.item4":
    "Viashirio vinavyokosekana huondolewa kutoka kwenye wastani — havichukuliwi kama sifuri.",
  "vitality.leaderboard": "Ubao wa Uongozi wa Uhai",
  "vitality.overall": "Jumla",
  "vitality.subCounty": "Wilaya ndogo",
  "vitality.trend": "Mwelekeo",
  "vitality.filterByName": "Chuja kwa jina...",

  // Investor dashboard
  "investor.title": "Dashibodi ya Mwekezaji",
  "investor.subtitle":
    "Kikundi cha kampuni yako Nairobi kwa muhtasari. Maeneo yaliyoorodheshwa yanakusanywa hapa.",
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
  "investor.opps.hint.deal":
    "Zimepangwa kwa lensi ya mgao wa mtaji — maeneo usiyokuwa unayafuatilia",
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

  // ESG lens
  "esgLens.on": "Lenzi ya ESG · imewashwa",
  "esgLens.off": "Lenzi ya ESG",
  "esgLens.turnOn": "Washa lenzi ya ESG",
  "esgLens.turnOff": "Zima lenzi ya ESG",
  "reports.investorFilter.badge": "Orodha tu",
  "reports.investorFilter.showAll": "Onyesha ripoti zote",
  "reports.investorFilter.showWatchlist": "Onyesha za orodha pekee",

  // Announcements
  "announce.dismiss": "Ondoa",

  // Assistant boilerplate
  "assistant.county.avg": "wastani wa kaunti",
  "assistant.rank": "nafasi",
  "assistant.strongest": "Imara zaidi",
  "assistant.weakest": "Dhaifu zaidi",

  // Alert kinds / impact
  "alert.kind.infra": "Miundombinu",
  "alert.kind.vitality": "Kielelezo cha Uhai",
  "alert.kind.esia": "ESIA / Mazingira",
  "alert.kind.system": "Mfumo",
  "alert.kind.partner": "Ushirikiano",
  "alert.impact.critical": "Athari Kubwa Sana",
  "alert.impact.major": "Athari Kubwa",
  "alert.impact.moderate": "Athari ya Wastani",
  "alert.impact.minor": "Athari Ndogo",
  "alert.impact.short.critical": "Kubwa sana",
  "alert.impact.short.major": "Kubwa",
  "alert.impact.short.moderate": "Wastani",
  "alert.impact.short.minor": "Ndogo",
  "alert.linked.impactSuffix": "athari {level} · {relative}",
  "alert.detailLabel": "Maelezo ya arifa",
  "alert.relatedProjects": "Miradi Inayohusiana",

  // Infrastructure
  "infra.filter.all": "Zote",
  "infra.filter.road": "Barabara",
  "infra.filter.energy": "Nishati",
  "infra.filter.grid": "Gridi",
  "infra.filter.water": "Maji",
  "infra.status.active": "Inaendelea",
  "infra.status.stalled": "Imesimama",
  "infra.status.planned": "Imepangwa",
  "infra.card.etaLine": "{progress}% · ETA {eta}",
  "infra.detail.progress": "Maendeleo",
  "infra.detail.deliveryAnalysis": "Uchambuzi wa utoaji",
  "infra.detail.scheduleElapsed": "Muda uliopita",
  "infra.detail.workDelivered": "Kazi iliyokamilika",
  "infra.detail.linkedAlerts": "Arifa zinazohusiana",
  "infra.detail.milestones": "Hatua muhimu",
  "infra.detail.startedLine": "{zone} · ilianza {date}",
  "infra.detail.daysToEta": "Siku {days} hadi ETA ya {eta}.",
  "infra.detail.overdueBy": "Imechelewa kwa siku {days} dhidi ya ETA ya {eta}.",
  "infra.detail.nextMilestone": "Hatua ijayo: {label}, inatakiwa {date}",
  "infra.detail.overdueTag": " · imechelewa",
  "infra.detail.allMilestonesDone": "Hatua zote {count} zimethibitishwa kukamilika.",
  "infra.detail.stalledWarning":
    "Utoaji umewekwa alama kuwa umesimama — uhakiki wa uwandani unaendelea. Hatua zilizo hapa chini zinaonyesha hali ya mwisho iliyothibitishwa uwandani.",
  "infra.detail.viewOnAtlas": "Tazama {zone} kwenye Ramani",
  "infra.detail.detailsLabel": "Maelezo ya mradi",
  "infra.detail.detailsAria": "Maelezo ya {name}",
  "infra.kv.budget": "Bajeti",
  "infra.kv.progress": "Maendeleo",
  "infra.kv.eta": "ETA",
  "infra.kv.milestones": "Hatua muhimu",
  "infra.milestones.of": "{done} kati ya {total}",
  "infra.verdict.stalled": "Imesimama — utoaji uko nyuma ya ratiba kwa pointi {gap}.",
  "infra.verdict.onTrack": "Iko kwenye ratiba.",
  "infra.verdict.ahead": "Iko mbele ya ratiba kwa pointi {gap}.",
  "infra.verdict.slipping": "Inateleza — iko nyuma ya ratiba kwa pointi {gap}.",
  "infra.verdict.critical": "Iko nyuma sana — iko chini ya ratiba kwa pointi {gap}.",

  // Leaderboard
  "leaderboard.subCountyNairobi": "Wilaya ndogo · Nairobi",
  "leaderboard.indexTitle": "Kielelezo cha Uhai cha UE",
  "leaderboard.updatedAgo": "Ilisasishwa dakika {min} zilizopita",
  "leaderboard.openAtlas": "Fungua kwenye Ramani",
  "leaderboard.previewAria": "Kadi ya awali ya {zone}",

  // Chat / Assistant
  "chat.followup.whichDriving": "Ni nguzo ipi inayosababisha pengo hilo?",
  "chat.followup.qoqMoves": "Kata hizi zimesogeaje robo hii dhidi ya iliyopita?",
  "chat.followup.whichInfra": "Ni miradi gani ya miundombinu iliyopo nyuma ya nambari hizi?",
  "chat.followup.whichLeads": "Ni kata gani za Nairobi zenye alama za juu zaidi?",
  "chat.followup.explainPillars": "Eleza nguzo zinazounda alama",
  "chat.followup.waterWeakest": "Maji na usafi wa mazingira ni dhaifu wapi kote kaunti?",
  "chat.followup.whyPillarStronger": "Kwa nini nguzo ya {pillar} ya {zone} iko imara zaidi?",
  "chat.followup.activeProjectsIn": "Ni miradi gani ya miundombinu iko hai {zone}?",
  "chat.followup.gapMovedThisQuarter": "Pengo kati ya {top} na {bottom} limesogeaje robo hii?",
  "chat.followup.whyWeakPoint": "Kwa nini {pillar} ni sehemu dhaifu {zone}?",
  "chat.followup.compareCountyAvg": "Linganisha {zone} na wastani wa kaunti",
  "chat.followup.projectsBehindScore":
    "Ni miradi gani ya miundombinu iko nyuma ya alama ya {zone}?",
  "chat.followup.trend30d": "Nionyeshe mwelekeo wa {zone} wa siku 30 zilizopita",
  "chat.followup.bottomFive": "Vipi kuhusu tano za chini?",
  "chat.followup.pillarDriving": "Ni nguzo gani inayoongoza alama ya {zone}?",
  "chat.followup.top5Change": "Tano bora zimebadilikaje robo iliyopita?",
  "chat.followup.pillarMoving": "Ni nguzo gani inayosogea ndani ya {zone}?",
  "chat.followup.compareToAnother": "Linganisha mwelekeo wa {zone} na eneo lingine",
  "chat.followup.activeAlerts": "Ni arifa gani hai kwa {zone}?",
  "chat.followup.tellMeAbout": "Nieleze kuhusu {zone}",
  "chat.followup.pillarMostContrib": "Ni nguzo gani inachangia zaidi kwenye alama ya jumla?",
  "chat.followup.pillarsDisagree": "Nionyeshe eneo ambapo nguzo hazikubaliani",
  "chat.followup.dataOrigin": "Data ya msingi inatoka wapi?",
  "chat.compare.needSecond":
    "Chagua kata ya pili kwenye kichaguzi hapo juu, nami nitakupitia nguzo bega kwa bega — {pillars}.",
  "chat.compare.opener": "{top} inaongoza kwa jumla kwa alama {topScore}, {gaps}.",
  "chat.compare.gap": "pointi {gap} mbele ya {name}",
  "chat.compare.pillarLine": "• {pillar}: {values} — mtawanyiko wa pointi {spread}.",
  "chat.compare.closing":
    "{pillar} ni pale kata hizi zinapotofautiana zaidi (mtawanyiko wa pointi {spread}), kwa hivyo ikiwa unapanga vipaumbele, hiyo ndiyo nguzo ya kuchunguza kwanza.",
  "chat.composition.needZone":
    "Chagua kata au taja moja kwa jina nami nitachanganua nguzo zake — {pillars}.",
  "chat.composition.opener":
    "**{zone}** inapata alama **{score}/100** kwa jumla — hii ni {delta} dhidi ya wastani wa Nairobi ({avg}) na inaiweka katika nafasi ya #{rank} kati ya wilaya ndogo 17. Kiwango cha utayari: **{band}**.",
  "chat.composition.pillarLine": "• **{pillar}** — {value}/100 {arrow} ({delta})",
  "chat.composition.deltaFlat": "haijabadilika",
  "chat.composition.deltaOverDays": "{sign}{value} kwa siku {days}",
  "chat.composition.deltaUnknown": "hakuna mwelekeo bado",
  "chat.composition.strongLabel": "**Imara zaidi — {pillar}.**",
  "chat.composition.weakLabel": "**Dhaifu zaidi — {pillar}.**",
  "chat.composition.unscored":
    "**{zone}** haina alama ya jumla bado — hakuna nguzo yenye usomaji wowote, kwa hivyo siwezi kufafanua kile kisichokuwepo. Viashiria vitakapofika kwa kata hiyo, ninaweza kutunga alama na nguzo zake kutoka kwa usomaji huo.",
  "chat.strong.water_sanitation":
    "Maji safi yanafika kaya nyingi za {zone}, na mchanganyiko wa usafi wa mazingira hautawaliwi na vyoo vya kushirikiana au vya wazi. Hii ndiyo nguzo ambayo rekodi nzima imejengwa juu yake, kwa hivyo usomaji imara hapa una uzito mkubwa zaidi.",
  "chat.strong.road_density":
    "{zone} ina mtandao mnene wa barabara zilizoramaniwa kwa eneo lake — sharti la kawaida ili ukusanyaji taka, ufikiaji wa dharura na usafirishaji wa mwisho vifanye kazi kabisa.",
  "chat.strong.transit_access":
    "Wakazi wengi wa {zone} wanaishi umbali wa kutembea kutoka kituo cha matatu, kwa hivyo kufika kazini na kwenye huduma hakutegemei kumiliki gari.",
  "chat.strong.electricity_access":
    "Umeme wa taa wa kaya ulikuwa umeenea {zone} wakati wa sensa ya 2019. Hiyo ndiyo takwimu mpya zaidi ya kata iliyopo — isome kama kiwango cha chini, si cha leo.",
  "chat.weak.water_sanitation":
    "Hii ndiyo nguzo ya kufadhili kwanza {zone}. Pale mfumo mkuu wa maji taka hauwezekani, njia halisi ni usafi wa mazingira unaolingana na mazingira badala ya kusubiri bomba lisilo na tarehe ya ufadhili.",
  "chat.weak.road_density":
    "{zone} ina barabara chache zilizoramaniwa kwa kila km². Hilo linabana kila kitu kinachofuata — njia za ukusanyaji, muda wa ambulensi, na gharama ya kusafirisha chochote.",
  "chat.weak.transit_access":
    "Sehemu kubwa ya {zone} iko nje ya umbali wa kutembea kutoka kituo cha matatu. Hiyo inaweka gharama ya kila siku kwa wakazi ambayo haionekani katika nguzo nyingine yoyote.",
  "chat.weak.electricity_access":
    "Usomaji ni dhaifu, lakini chanzo chake pekee ni sensa ya 2019. Thibitisha dhidi ya chanzo cha sasa kabla ya kuchukua hatua.",
  "chat.distribution":
    "{top1} na {top2} zinashirikiana uongozi kwa alama {score1}/{score2}. {top3} inafuata kwa {score3}, kisha {top4} ({score4}) na {top5} ({score5}). Tano bora ziko ndani ya pointi {spread} — wilaya ndogo imara zaidi za Nairobi zimekusanyika badala ya kutenganishwa na kiongozi mmoja anayeongoza sana.",
  "chat.distribution.needMore":
    "Kwa sasa maeneo {count} tu yana alama ya jumla — ninahitaji angalau matano ili kutaja waongozi kwa uaminifu. Kadiri maeneo mengi yanavyoanza kupokea viashiria, orodha ya tano bora inakuwa na maana.",
  "chat.trend":
    "{zone} imekaa kati ya {low} na {high} katika siku 30 zilizopita. Mwelekeo ni imara. Hakuna mabadiliko ya ghafla ya kutaja.",
  "chat.trend.unscored":
    "**{zone}** haina alama ya jumla ya kufuatilia mwelekeo bado — mkondo wa siku 30 unahitaji nambari ya kuanzia, na haipo. Baada ya kata hiyo kupata picha yake ya kwanza yenye alama, chati ya mwelekeo itapatikana.",
  "chat.methodology":
    "Alama inachanganya nguzo — {pillars} — kila moja kwa kipimo cha 0–100. Uzito unaishi katika rejista moja yenye toleo badala ya kuwekwa popote ndani ya msimbo, nguzo isiyo na usomaji inaondolewa kwenye hesabu na kigawanyiko vyote viwili badala ya kuhesabiwa sufuri, na kila ingizo limehifadhiwa katika jedwali la picha, kwa hivyo alama yoyote unayoiona inafuatiliwa hadi kwenye usomaji ulioizalisha.",
  "chat.summary.needZone":
    "Chagua kata moja au mbili kutoka kwenye kichaguzi cha kulinganisha nami nitakupitia nguzo zao. Bila kata maalum, ninaweza tu kuzungumza kuhusu wastani wa kaunti.",
  "chat.summary.single":
    "{zone} iko kwa {score}/100 kwa jumla. {pillars}. Uliza kuhusu nguzo yoyote na naweza kuingia ndani zaidi.",
  "chat.summary.multi":
    'Unalinganisha {names}. Alama zao za jumla ni wastani wa {avg}. Uliza "linganisha katika nguzo zote" kwa uchambuzi kamili, au bana kwa nguzo moja kwa mtazamo wa kina zaidi.',
  "chat.summary.multi.unscored":
    "Unalinganisha {names}. Hakuna hata moja yenye alama ya jumla bado, kwa hivyo hakuna wastani wa kuripoti — lakini naweza kupitia usomaji wa nguzo ambao kila moja inao.",
  "chat.diagnostic.stable":
    "Kila eneo la Nairobi lina utulivu wa kadiri robo hii — mabadiliko madogo yako ndani ya kelele. Uliza kuhusu nguzo maalum ili kuingia ndani zaidi.",
  "chat.diagnostic.noMovement":
    "Hakuna historia ya kutosha kwa **{zone}** bado kusema ni nguzo ipi iliyosogea — kupima mwelekeo kunahitaji angalau picha mbili za alama. Ninachoweza kusema ni kwamba **{weakestPillar}** kwa {weakestValue}/100 ndiyo nguzo yake dhaifu zaidi leo.",
  "chat.diagnostic.drop":
    "**{zone}** — nguzo maalum ya kuangalia ni **{worstPillar}**, iliyosogea {worstDelta} katika siku {days} zilizopita. Msogezaji bora alikuwa {bestPillar} kwa {bestDelta}, kwa hivyo Alama ya Uhai ya {score} imeathirika kidogo tu. \n\n**Sababu inayowezekana.** {cause} Mkondo wa arifa wa {zone} kwa kawaida hutaja mradi au tukio kamili nyuma ya mabadiliko ya ukubwa huu — inafaa kuangalia kabla ya kuamini utambuzi.\n\nUpande wa udhaifu unaosimama, **{weakestPillar}** kwa {weakestValue}/100 ni nguzo inayoshikilia {zone} kimuundo, bila kujali mabadiliko ya hivi karibuni.",
  "chat.diagnostic.growth":
    "**{zone}** haikushuka katika nguzo yoyote iliyopimwa katika siku {days} zilizopita — mabadiliko madogo zaidi yalikuwa {worstPillar} kwa {worstDelta}, na yaliyo imara zaidi yalikuwa {bestPillar} kwa {bestDelta}. Ukuaji ni wa msingi mpana, si unaosukumwa na nguzo moja. \n\nUpande wa udhaifu unaosimama, **{weakestPillar}** kwa {weakestValue}/100 ni nguzo inayozuia jumla isipande zaidi — {weakExplain}",
  "chat.cause.water_sanitation":
    "Mabadiliko hapa hufuata ama marekebisho ya utendaji wa huduma unaoripotiwa na mtoa huduma, au mabadiliko ya mchanganyiko wa usafi wa kaya. Ripoti ya IMPACT ya WASREB ndipo takwimu ya mtoa huduma huchapishwa; upande wa kaya unatoka kwenye sensa.",
  "chat.cause.road_density":
    "Msongamano wa barabara hupimwa kutoka kwenye data ya OSM, si ardhini. Kampeni ya uramani inaweza kuongeza kilomita zilizokuwepo tayari, kwa hivyo angalia tarehe ya data karibu na {zone} kabla ya kusoma mabadiliko kama ujenzi.",
  "chat.cause.transit_access":
    "Upatikanaji wa usafiri hufuata masasisho ya GTFS — njia zilizoongezwa, zilizoondolewa, au zilizopimwa upya na Digital Matatus. Kuondolewa kwa njia hujitokeza hapa kabla ya mahali pengine popote.",
  "chat.cause.electricity_access":
    "Upatikanaji wa umeme una chanzo kimoja na kipindi kimoja, sensa ya 2019. Mabadiliko yoyote hapa ni hesabu upya, si mabadiliko halisi ardhini {zone}.",
  "chat.errorGeneric": "Samahani — ombi hilo halikuweza kutumwa.",
  "chat.errorEnded": "Mkondo wa mazungumzo uliisha ghafla.",

  // Scorecard drill-in
  "scorecard.header.overviewKicker": "Wilaya ndogo · Kadi ya Uhai",
  "scorecard.header.indexTitle": "Kielelezo cha Uhai cha UE",
  "scorecard.header.pillarKicker": "{zone} · Nguzo",
  "scorecard.header.waterKicker": "{zone} · SDG 6",
  "scorecard.header.waterTitle": "Maji na Usafi",
  "scorecard.header.projectKicker": "{zone}",
  "scorecard.header.projectTitle": "Maelezo ya mradi",
  "scorecard.header.alertKicker": "{zone}",
  "scorecard.header.alertTitle": "Maelezo ya arifa",
  "scorecard.close": "Funga kadi",
  "scorecard.back": "Rudi",
  "scorecard.askShort": "Uliza kuhusu {zone}",
  "scorecard.askAria": "Uliza msaidizi kuhusu {zone}",
  "scorecard.askPrompt":
    "Nieleze kuhusu {zone} — ni nini kinachoongoza alama ya Uhai na ni wapi kuna mapengo makubwa katika nguzo nne?",
  "scorecard.deltaOverDays": "{arrow} pointi {value} kwa siku {days}",
  "scorecard.deltaUnknown": "Mwelekeo bado haujapimika",
  "scorecard.lastSyncShort": "Ilisasishwa dakika {min} zilizopita",
  "scorecard.howComputed": "Jinsi alama hii inavyokokotolewa",

  "estimated.tooltip": "Kadirio — hakuna data iliyopimwa kwa kiashiria hiki",
  "estimated.zoneBadge": "Ina thamani zilizokadiriwa",
  "scorecard.water.unmetNeed": "Hitaji ambalo halijatimizwa",
  "scorecard.water.opportunity": "Fursa ya usafi wa kujitegemea",
  "scorecard.water.sewerage": "Mifereji ya taka inaweza kufanya kazi hapa",
  "scorecard.infra.title": "Miundombinu · {noun} {count}",
  "scorecard.infra.noun.one": "mradi",
  "scorecard.infra.noun.many": "miradi",
  "scorecard.infra.empty":
    "Bado hakuna miradi ya miundombinu inayofuatiliwa {zone} — kazi mpya za KURA / KPLC / KeNHA zitaonekana hapa zinapoingizwa.",
  "scorecard.alerts.title": "Arifa hai · {count}",
  "scorecard.alerts.empty": "Hakuna arifa hai za eneo hili — vyanzo vya ufuatiliaji viko kimya.",
  "scorecard.viewAll": "Tazama zote →",
  "scorecard.openFullReport": "Fungua ripoti kamili",
  "scorecard.export": "Hamisha",
  "scorecard.exporting": "Inahamisha…",
  "scorecard.export.pdf": "PDF",
  "scorecard.export.docx": "Word (DOCX)",
  "scorecard.export.txt": "Maandishi rahisi",

  // Sidebar layer meta
  "sidebar.featuresCount": "vipengele {count}",
  "sidebar.syncAge.justNow": "sasa hivi",
  "sidebar.syncAge.minutes": "dakika {n} zilizopita",
  "sidebar.syncAge.hours": "saa {n} zilizopita",
  "sidebar.syncAge.days": "siku {n} zilizopita",
  "sidebar.syncAge.months": "miezi {n} iliyopita",
  "sidebar.toggleLayer": "Washa/Zima tabaka la {label}",
  "sidebar.expandSidebar": "Panua upau",
  "sidebar.collapseSidebar": "Kunja upau",
  "sidebar.openMenu": "Fungua menyu",
  "sidebar.closeMenu": "Funga menyu",
  "sidebar.role.viewer": "Mtazamaji",
  "sidebar.role.investor": "Mwekezaji",
  "sidebar.role.admin": "Msimamizi",

  // Layer descriptions
  "layerDesc.vitality": "Ramani ya rangi ya alama za utendaji wa huduma kwa kila kata.",
  "layerDesc.roads": "Kilomita za barabara zilizoramaniwa kwa kila km² — HOT OSM.",
  "layerDesc.energy": "Kaya zinazotumia umeme kwa mwanga — sensa ya KNBS 2019.",
  "layerDesc.water": "Ufikiaji wa maji na wasifu wa suluhisho la usafi — SDG 6.",

  // TopBar chrome
  "topbar.live": "Moja kwa Moja",
  "topbar.openAssistant": "Fungua msaidizi wa Navuuna",
  "topbar.closeAssistant": "Funga msaidizi wa Navuuna",
  "topbar.searchAria": "Tafuta (Cmd+K)",
  "topbar.notificationsAria": "Arifa",
  "topbar.notificationsWithCount": "Arifa ({count} zisizosomwa)",
};
