/**
 * Investor deal-pipeline mock. Board of prospects a firm is actively
 * working, keyed by zone. Persisted per-firm to localStorage so drag
 * / status changes survive refresh. When Phase F backend lands this
 * swaps for /investor/deals endpoints with the same shape.
 */

const STORAGE_PREFIX = "nuvola_deals_v1_";

export type DealStage = "prospect" | "meeting" | "diligence" | "term_sheet" | "closed" | "passed";

export const DEAL_STAGES: { key: DealStage; label: string; color: string }[] = [
  { key: "prospect", label: "Prospect", color: "#5C7C99" },
  { key: "meeting", label: "Meeting", color: "#3E6E93" },
  { key: "diligence", label: "Diligence", color: "#E0A82E" },
  { key: "term_sheet", label: "Term Sheet", color: "#C0552B" },
  { key: "closed", label: "Closed", color: "#1F8A78" },
  { key: "passed", label: "Passed", color: "#8A8A8A" },
];

export interface Deal {
  id: string;
  zoneId: string;
  title: string;
  stage: DealStage;
  amount: string; // "KES 45M"
  owner: string;
  nextStep: string;
  nextStepAt: string; // ISO
  thesis: string;
  createdAt: string;
  updatedAt: string;
}

const SEED_BY_FIRM: Record<string, Deal[]> = {
  "firm-acumen": [
    {
      id: "deal-acumen-01",
      zoneId: "westlands",
      title: "Waiyaki Way Corridor Access",
      stage: "diligence",
      amount: "KES 320M",
      owner: "Njoki Wanjiru",
      nextStep: "Environmental & Social IA review",
      nextStepAt: "2026-07-25T09:00:00Z",
      thesis:
        "High infrastructure pillar. Corridor densification lifts three adjacent sub-counties.",
      createdAt: "2026-06-04T10:00:00Z",
      updatedAt: "2026-07-11T14:30:00Z",
    },
    {
      id: "deal-acumen-02",
      zoneId: "kibra",
      title: "Community Water Kiosks",
      stage: "term_sheet",
      amount: "KES 48M",
      owner: "Peter Kamau",
      nextStep: "County co-signature on term sheet",
      nextStepAt: "2026-07-18T14:00:00Z",
      thesis: "Water & sanitation deficit. Public-private with NCWSC. High Development impact.",
      createdAt: "2026-05-28T08:15:00Z",
      updatedAt: "2026-07-10T16:45:00Z",
    },
    {
      id: "deal-acumen-03",
      zoneId: "mathare",
      title: "Mathare Sanitation Retrofit",
      stage: "meeting",
      amount: "KES 82M",
      owner: "Njoki Wanjiru",
      nextStep: "Site visit with ward development committee",
      nextStepAt: "2026-07-22T10:30:00Z",
      thesis: "Density pressure + zero baseline. Highest impact-per-shilling in current pipeline.",
      createdAt: "2026-07-01T09:00:00Z",
      updatedAt: "2026-07-09T11:20:00Z",
    },
    {
      id: "deal-acumen-04",
      zoneId: "kasarani",
      title: "Kasarani Youth Skills Hub",
      stage: "prospect",
      amount: "KES 155M",
      owner: "Peter Kamau",
      nextStep: "Model expected ROI on employment uplift",
      nextStepAt: "2026-07-30T11:00:00Z",
      thesis: "Rising Social pillar. Aligns with our Impact-First fund II mandate.",
      createdAt: "2026-07-08T16:20:00Z",
      updatedAt: "2026-07-08T16:20:00Z",
    },
  ],
  "firm-andela": [
    {
      id: "deal-andela-01",
      zoneId: "kasarani",
      title: "Thika Road Fiber Roll-out",
      stage: "diligence",
      amount: "KES 210M",
      owner: "Peter Ochieng",
      nextStep: "ICTA co-investment sign-off",
      nextStepAt: "2026-07-20T15:00:00Z",
      thesis: "Digital connectivity indicator projected +8pts over 12 months.",
      createdAt: "2026-06-12T12:00:00Z",
      updatedAt: "2026-07-11T09:15:00Z",
    },
    {
      id: "deal-andela-02",
      zoneId: "embakasi-east",
      title: "Embakasi Data Center Partnership",
      stage: "prospect",
      amount: "KES 610M",
      owner: "Wanjiku Njuguna",
      nextStep: "Cross-firm syndicate feelers with GCF",
      nextStepAt: "2026-08-05T10:00:00Z",
      thesis: "Growth-corridor thesis. Highest infra pillar in East Nairobi.",
      createdAt: "2026-07-05T14:00:00Z",
      updatedAt: "2026-07-05T14:00:00Z",
    },
    {
      id: "deal-andela-03",
      zoneId: "roysambu",
      title: "Roysambu Solar Microgrid",
      stage: "closed",
      amount: "KES 95M",
      owner: "Peter Ochieng",
      nextStep: "Milestone tracking — quarterly reporting",
      nextStepAt: "2026-10-01T09:00:00Z",
      thesis: "Closed Q2 · projected 22% IRR · monitored via Vitality Score",
      createdAt: "2026-03-14T09:00:00Z",
      updatedAt: "2026-06-30T17:00:00Z",
    },
  ],
  "firm-gcf": [
    {
      id: "deal-gcf-01",
      zoneId: "starehe",
      title: "CBD Green Building Retrofit",
      stage: "term_sheet",
      amount: "KES 1.2B",
      owner: "Fatma Mohammed",
      nextStep: "Concessional financing approval",
      nextStepAt: "2026-07-19T13:00:00Z",
      thesis: "Sovereign carbon mandate. County-wide baseline established.",
      createdAt: "2026-05-01T08:00:00Z",
      updatedAt: "2026-07-11T10:00:00Z",
    },
    {
      id: "deal-gcf-02",
      zoneId: "langata",
      title: "Nairobi National Park Buffer",
      stage: "diligence",
      amount: "KES 480M",
      owner: "Fatma Mohammed",
      nextStep: "KWS co-management agreement",
      nextStepAt: "2026-07-26T11:00:00Z",
      thesis: "Density & scaling mandate for peri-urban wildlife corridors.",
      createdAt: "2026-06-08T14:00:00Z",
      updatedAt: "2026-07-08T16:30:00Z",
    },
    {
      id: "deal-gcf-03",
      zoneId: "dagoretti-south",
      title: "Dagoretti South Green Bond Tranche",
      stage: "meeting",
      amount: "KES 720M",
      owner: "James Mwangi",
      nextStep: "Second meeting with county Treasury",
      nextStepAt: "2026-07-23T09:30:00Z",
      thesis: "Green-bond umbrella. High infra + safety pillar.",
      createdAt: "2026-06-25T09:00:00Z",
      updatedAt: "2026-07-07T12:00:00Z",
    },
    {
      id: "deal-gcf-04",
      zoneId: "kamukunji",
      title: "Kamukunji Retrofitting Fund",
      stage: "passed",
      amount: "KES 210M",
      owner: "James Mwangi",
      nextStep: "Passed — safety pillar below sovereign threshold",
      nextStepAt: "2026-06-15T00:00:00Z",
      thesis: "Passed after safety pillar dropped in Q2. Revisit if trend reverses.",
      createdAt: "2026-04-20T10:00:00Z",
      updatedAt: "2026-06-15T14:00:00Z",
    },
  ],
};

function key(firmId: string): string {
  return STORAGE_PREFIX + firmId;
}

export function loadDeals(firmId: string): Deal[] {
  if (typeof window === "undefined") return SEED_BY_FIRM[firmId] ?? [];
  try {
    const raw = window.localStorage.getItem(key(firmId));
    if (raw) return JSON.parse(raw) as Deal[];
    return SEED_BY_FIRM[firmId] ?? [];
  } catch {
    return SEED_BY_FIRM[firmId] ?? [];
  }
}

export function saveDeals(firmId: string, deals: Deal[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key(firmId), JSON.stringify(deals));
}

export function updateDealStage(firmId: string, dealId: string, stage: DealStage): Deal[] {
  const list = loadDeals(firmId).map((d) =>
    d.id === dealId ? { ...d, stage, updatedAt: new Date().toISOString() } : d,
  );
  saveDeals(firmId, list);
  return list;
}
