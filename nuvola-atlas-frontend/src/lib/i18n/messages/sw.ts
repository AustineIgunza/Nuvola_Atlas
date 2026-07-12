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
};
