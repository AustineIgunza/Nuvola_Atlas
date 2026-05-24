import type {
  Zone,
  Project,
  AlertItem,
  Report,
  HistoryPoint,
  ActivityEntry,
  PillarDef,
} from "@/types";

export const ZONES: Zone[] = [
  { id: "westlands", name: "Westlands", score: 76, pillars: { social: 82, safety: 71, density: 64, infra: 80 }, deltas: { social: 3, safety: -1, density: 2, infra: 4 }, centroid: [36.8048, -1.2673], lastSyncMin: 4 },
  { id: "dagoretti-north", name: "Dagoretti North", score: 72, pillars: { social: 74, safety: 68, density: 70, infra: 66 }, deltas: { social: 2, safety: 1, density: -2, infra: 3 }, centroid: [36.7600, -1.2750], lastSyncMin: 7 },
  { id: "dagoretti-south", name: "Dagoretti South", score: 65, pillars: { social: 62, safety: 64, density: 60, infra: 68 }, deltas: { social: 1, safety: -3, density: 2, infra: 1 }, centroid: [36.7450, -1.3050], lastSyncMin: 12 },
  { id: "langata", name: "Langata", score: 70, pillars: { social: 72, safety: 74, density: 55, infra: 71 }, deltas: { social: -1, safety: 2, density: 1, infra: 3 }, centroid: [36.7350, -1.3600], lastSyncMin: 5 },
  { id: "kibra", name: "Kibra", score: 54, pillars: { social: 48, safety: 52, density: 58, infra: 56 }, deltas: { social: 2, safety: -2, density: 1, infra: 0 }, centroid: [36.7850, -1.3150], lastSyncMin: 18 },
  { id: "roysambu", name: "Roysambu", score: 68, pillars: { social: 70, safety: 65, density: 62, infra: 72 }, deltas: { social: 1, safety: 3, density: -1, infra: 2 }, centroid: [36.8750, -1.2200], lastSyncMin: 9 },
  { id: "kasarani", name: "Kasarani", score: 63, pillars: { social: 60, safety: 62, density: 58, infra: 68 }, deltas: { social: -1, safety: 2, density: 0, infra: 1 }, centroid: [36.9000, -1.2350], lastSyncMin: 6 },
  { id: "ruaraka", name: "Ruaraka", score: 66, pillars: { social: 68, safety: 64, density: 60, infra: 70 }, deltas: { social: 2, safety: 0, density: -1, infra: 3 }, centroid: [36.8800, -1.2500], lastSyncMin: 11 },
  { id: "embakasi-south", name: "Embakasi South", score: 58, pillars: { social: 55, safety: 56, density: 62, infra: 58 }, deltas: { social: 1, safety: -1, density: 2, infra: 0 }, centroid: [36.9100, -1.3300], lastSyncMin: 14 },
  { id: "embakasi-north", name: "Embakasi North", score: 62, pillars: { social: 60, safety: 64, density: 56, infra: 66 }, deltas: { social: 0, safety: 2, density: 1, infra: -1 }, centroid: [36.9050, -1.2800], lastSyncMin: 8 },
  { id: "embakasi-central", name: "Embakasi Central", score: 60, pillars: { social: 58, safety: 60, density: 54, infra: 64 }, deltas: { social: 1, safety: 1, density: -2, infra: 2 }, centroid: [36.8900, -1.3100], lastSyncMin: 10 },
  { id: "embakasi-east", name: "Embakasi East", score: 76, pillars: { social: 78, safety: 72, density: 70, infra: 82 }, deltas: { social: 4, safety: 2, density: 1, infra: 5 }, centroid: [36.9300, -1.2900], lastSyncMin: 3 },
  { id: "embakasi-west", name: "Embakasi West", score: 61, pillars: { social: 58, safety: 62, density: 56, infra: 66 }, deltas: { social: -1, safety: 1, density: 0, infra: 2 }, centroid: [36.8700, -1.3200], lastSyncMin: 15 },
  { id: "makadara", name: "Makadara", score: 64, pillars: { social: 62, safety: 66, density: 58, infra: 68 }, deltas: { social: 2, safety: -1, density: 1, infra: 3 }, centroid: [36.8600, -1.2950], lastSyncMin: 7 },
  { id: "kamukunji", name: "Kamukunji", score: 57, pillars: { social: 54, safety: 52, density: 60, infra: 58 }, deltas: { social: -2, safety: 1, density: 3, infra: 0 }, centroid: [36.8450, -1.2800], lastSyncMin: 20 },
  { id: "starehe", name: "Starehe", score: 69, pillars: { social: 66, safety: 68, density: 72, infra: 70 }, deltas: { social: 1, safety: 2, density: -1, infra: 2 }, centroid: [36.8250, -1.2850], lastSyncMin: 5 },
  { id: "mathare", name: "Mathare", score: 52, pillars: { social: 46, safety: 48, density: 56, infra: 54 }, deltas: { social: -1, safety: -2, density: 1, infra: 0 }, centroid: [36.8580, -1.2580], lastSyncMin: 22 },
];

export const PROJECTS: Project[] = [
  { id: "p1", name: "Waiyaki Way Expansion", zoneId: "westlands", agency: "KeNHA", type: "road", status: "active", progress: 72, budget: "KES 1.2B", started: "2025-01-15", eta: "2026-06-30", milestones: [{ date: "2025-01-15", label: "Groundbreaking", done: true }, { date: "2025-06-01", label: "Phase 1 paving", done: true }, { date: "2025-12-01", label: "Interchange complete", done: true }, { date: "2026-03-15", label: "Lane markings", done: false }, { date: "2026-06-30", label: "Final inspection", done: false }], marker: [36.7950, -1.2650] },
  { id: "p2", name: "Thika Road Smart Lighting", zoneId: "kasarani", agency: "KPLC", type: "energy", status: "active", progress: 45, budget: "KES 340M", started: "2025-04-01", eta: "2026-02-28", milestones: [{ date: "2025-04-01", label: "Contract signed", done: true }, { date: "2025-08-15", label: "Pole installation", done: true }, { date: "2025-12-01", label: "Wiring phase", done: false }, { date: "2026-02-28", label: "Commissioning", done: false }], marker: [36.8950, -1.2200] },
  { id: "p3", name: "Inner Ring Resurfacing", zoneId: "starehe", agency: "KURA", type: "road", status: "stalled", progress: 34, budget: "KES 180M", started: "2025-02-10", eta: "2025-11-30", milestones: [{ date: "2025-02-10", label: "Mobilization", done: true }, { date: "2025-05-01", label: "Milling", done: true }, { date: "2025-08-01", label: "Overlay", done: false }, { date: "2025-11-30", label: "Completion", done: false }], marker: [36.8300, -1.2900] },
  { id: "p4", name: "Embakasi Substation Upgrade", zoneId: "embakasi-east", agency: "KETRACO", type: "grid", status: "active", progress: 88, budget: "KES 520M", started: "2024-09-01", eta: "2026-01-15", milestones: [{ date: "2024-09-01", label: "Design approval", done: true }, { date: "2025-01-15", label: "Transformer delivery", done: true }, { date: "2025-06-01", label: "Installation", done: true }, { date: "2025-10-01", label: "Testing", done: true }, { date: "2026-01-15", label: "Grid connection", done: false }], marker: [36.9250, -1.2850] },
  { id: "p5", name: "Langata Road Dualling", zoneId: "langata", agency: "KeNHA", type: "road", status: "active", progress: 61, budget: "KES 890M", started: "2025-03-01", eta: "2026-09-30", milestones: [{ date: "2025-03-01", label: "Groundbreaking", done: true }, { date: "2025-07-15", label: "Earthworks", done: true }, { date: "2025-12-01", label: "Base course", done: true }, { date: "2026-05-01", label: "Asphalt", done: false }, { date: "2026-09-30", label: "Handover", done: false }], marker: [36.7400, -1.3500] },
  { id: "p6", name: "Roysambu Solar Microgrid", zoneId: "roysambu", agency: "KPLC", type: "energy", status: "active", progress: 55, budget: "KES 240M", started: "2025-05-15", eta: "2026-04-30", milestones: [{ date: "2025-05-15", label: "Site survey", done: true }, { date: "2025-09-01", label: "Panel installation", done: true }, { date: "2026-01-15", label: "Battery storage", done: false }, { date: "2026-04-30", label: "Go-live", done: false }], marker: [36.8800, -1.2150] },
  { id: "p7", name: "Eastleigh Fibre Backbone", zoneId: "kamukunji", agency: "ICTA", type: "grid", status: "active", progress: 40, budget: "KES 160M", started: "2025-06-01", eta: "2026-05-31", milestones: [{ date: "2025-06-01", label: "Route survey", done: true }, { date: "2025-10-01", label: "Trenching", done: true }, { date: "2026-02-01", label: "Fibre laying", done: false }, { date: "2026-05-31", label: "Activation", done: false }], marker: [36.8500, -1.2750] },
  { id: "p8", name: "Kibra Access Roads", zoneId: "kibra", agency: "KURA", type: "road", status: "active", progress: 28, budget: "KES 95M", started: "2025-07-01", eta: "2026-06-30", milestones: [{ date: "2025-07-01", label: "Community engagement", done: true }, { date: "2025-11-01", label: "Drainage", done: false }, { date: "2026-03-01", label: "Paving", done: false }, { date: "2026-06-30", label: "Completion", done: false }], marker: [36.7900, -1.3100] },
  { id: "p9", name: "Mathare Distribution Line", zoneId: "mathare", agency: "KPLC", type: "energy", status: "planned", progress: 8, budget: "KES 120M", started: "2026-01-15", eta: "2026-12-31", milestones: [{ date: "2026-01-15", label: "Feasibility study", done: true }, { date: "2026-04-01", label: "Design phase", done: false }, { date: "2026-08-01", label: "Construction", done: false }, { date: "2026-12-31", label: "Energization", done: false }], marker: [36.8600, -1.2550] },
  { id: "p10", name: "Makadara Smart Grid Pilot", zoneId: "makadara", agency: "KETRACO", type: "grid", status: "active", progress: 67, budget: "KES 310M", started: "2025-02-01", eta: "2026-03-31", milestones: [{ date: "2025-02-01", label: "Meter procurement", done: true }, { date: "2025-06-15", label: "Installation phase 1", done: true }, { date: "2025-11-01", label: "Installation phase 2", done: true }, { date: "2026-03-31", label: "Full deployment", done: false }], marker: [36.8650, -1.2980] },
];

export const ALERTS: AlertItem[] = [
  { id: "a1", severity: "high", kind: "infra", title: "Inner Ring Resurfacing stalled", body: "Contractor has not mobilized equipment for 45 days. KURA issued a show-cause notice on May 10. Project timeline at risk.", zoneId: "starehe", createdAt: "2026-05-20T09:30:00Z", read: false },
  { id: "a2", severity: "medium", kind: "vitality", title: "Kibra safety score dropped 4 pts", body: "Safety & Security pillar for Kibra fell from 56 to 52 following two reported infrastructure vandalism incidents in April.", zoneId: "kibra", createdAt: "2026-05-18T14:00:00Z", read: false },
  { id: "a3", severity: "low", kind: "esia", title: "ESIA published for Mathare Distribution Line", body: "Environmental and Social Impact Assessment for the Mathare Distribution Line project is now publicly available on the NEMA portal.", zoneId: "mathare", createdAt: "2026-05-15T11:00:00Z", read: false },
  { id: "a4", severity: "high", kind: "system", title: "KPLC data feed interrupted", body: "The automated feed from Kenya Power has not delivered updates in 72 hours. Energy layer data may be stale for affected zones.", zoneId: null, createdAt: "2026-05-22T07:15:00Z", read: false },
  { id: "a5", severity: "medium", kind: "partner", title: "Nairobi County GIS unit MOU signed", body: "Letter of intent signed with Nairobi County GIS unit for pilot data sharing. Integration timeline TBD.", zoneId: null, createdAt: "2026-05-12T16:30:00Z", read: true },
  { id: "a6", severity: "low", kind: "vitality", title: "Embakasi East tops leaderboard", body: "Embakasi East has overtaken Westlands for the highest overall Vitality score (76) following infrastructure upgrades at the KETRACO substation.", zoneId: "embakasi-east", createdAt: "2026-05-10T10:00:00Z", read: true },
];

export const REPORTS: Report[] = [
  { id: "r1", title: "Nairobi Q1 2026 Vitality Report", zoneId: null, date: "2026-04-15", status: "published", author: "Ken N'ganga", sizeBytes: 2_450_000, format: "PDF" },
  { id: "r2", title: "Westlands Infrastructure Assessment", zoneId: "westlands", date: "2026-05-01", status: "published", author: "Devyan Jethwa", sizeBytes: 1_820_000, format: "PDF" },
  { id: "r3", title: "Kibra Urban Density Analysis", zoneId: "kibra", date: "2026-05-10", status: "review", author: "Joy Nthei", sizeBytes: 980_000, format: "PDF" },
  { id: "r4", title: "Embakasi Substation Impact Study", zoneId: "embakasi-east", date: "2026-05-18", status: "review", author: "Khillon", sizeBytes: 1_540_000, format: "PDF" },
  { id: "r5", title: "Mathare Baseline Survey", zoneId: "mathare", date: "2026-05-20", status: "draft", author: "Austine Igunza", sizeBytes: 640_000, format: "PDF" },
  { id: "r6", title: "Nairobi Safety Corridor Mapping", zoneId: null, date: "2026-05-22", status: "draft", author: "Ken N'ganga", sizeBytes: 420_000, format: "PDF" },
  { id: "r7", title: "Langata Road Dualling Progress", zoneId: "langata", date: "2026-04-28", status: "published", author: "Devyan Jethwa", sizeBytes: 1_230_000, format: "PDF" },
];

export const HISTORY: HistoryPoint[] = [
  { month: "Jun '25", overallAvg: 61 },
  { month: "Jul '25", overallAvg: 61.5 },
  { month: "Aug '25", overallAvg: 62 },
  { month: "Sep '25", overallAvg: 62.8 },
  { month: "Oct '25", overallAvg: 63.5 },
  { month: "Nov '25", overallAvg: 64 },
  { month: "Dec '25", overallAvg: 65 },
  { month: "Jan '26", overallAvg: 65.8 },
  { month: "Feb '26", overallAvg: 66.5 },
  { month: "Mar '26", overallAvg: 67.2 },
  { month: "Apr '26", overallAvg: 68 },
  { month: "May '26", overallAvg: 69 },
];

export const ACTIVITIES: Record<string, ActivityEntry[]> = {
  westlands: [
    { id: "act1", zoneId: "westlands", kind: "road", text: "Waiyaki Way Phase 2 paving completed ahead of schedule", source: "KeNHA", createdAt: "2026-05-22T08:00:00Z" },
    { id: "act2", zoneId: "westlands", kind: "grid", text: "Smart meter rollout reached 1,200 units in Parklands", source: "KPLC", createdAt: "2026-05-20T14:30:00Z" },
    { id: "act3", zoneId: "westlands", kind: "esia", text: "Updated ESIA for Westlands commercial zone published", source: "NEMA", createdAt: "2026-05-18T10:00:00Z" },
    { id: "act4", zoneId: "westlands", kind: "density", text: "Population density survey updated for Q1 2026", source: "KNBS", createdAt: "2026-05-15T09:00:00Z" },
  ],
  starehe: [
    { id: "act5", zoneId: "starehe", kind: "road", text: "Inner Ring contractor issued show-cause notice", source: "KURA", createdAt: "2026-05-20T09:30:00Z" },
    { id: "act6", zoneId: "starehe", kind: "grid", text: "Fibre backbone extended to CBD junction", source: "ICTA", createdAt: "2026-05-16T11:00:00Z" },
  ],
  "embakasi-east": [
    { id: "act7", zoneId: "embakasi-east", kind: "grid", text: "Substation transformer testing completed successfully", source: "KETRACO", createdAt: "2026-05-21T15:00:00Z" },
    { id: "act8", zoneId: "embakasi-east", kind: "road", text: "Access road to substation graded", source: "KURA", createdAt: "2026-05-19T10:00:00Z" },
  ],
};

export const METHODOLOGY: PillarDef[] = [
  {
    key: "social",
    name: "Social Wellbeing & Human Capital",
    description: "Whether the local population is thriving. A low score predicts future labour issues or shortage of skilled operators.",
    subMetrics: [
      { key: "spi", label: "Social Progress Index", description: "Basic medical care, access to amenities, and inclusiveness" },
      { key: "workforce", label: "Workforce Mobility Score", description: "How easily labour and specialized roles can move in and out" },
      { key: "livability", label: "Mental Health & Livability", description: "Access to green space, air quality, projected burnout" },
    ],
  },
  {
    key: "safety",
    name: "Safety & Security",
    description: "Freedom from physical, legal, and digital threats that could disrupt projects.",
    subMetrics: [
      { key: "ruleOfLaw", label: "Rule of Law Stability", description: "Probability of contract expropriation, five-year judicial independence trend" },
      { key: "physSecurity", label: "Infrastructure Physical Security", description: "Conflict heatmap, proximity to unrest or high-crime corridors" },
      { key: "digitalSov", label: "Digital Sovereignty & Cybersecurity", description: "Internet Freedom Score, network outage frequency" },
    ],
  },
  {
    key: "density",
    name: "Density & Scaling Dynamics",
    description: "Whether the region's density supports growth or constrains it.",
    subMetrics: [
      { key: "optDensity", label: "Optimal Density Ratio", description: "Infrastructure Capacity / Population Density. Low ratio flags over-saturation" },
      { key: "urbanFriction", label: "Urban Friction Index", description: "Average transit times for heavy equipment, zoning complexity" },
    ],
  },
  {
    key: "infra",
    name: "Infrastructure & Environmental Safeguards",
    description: "Whether documentation and legal architecture exist to back up large projects.",
    subMetrics: [
      { key: "esia", label: "ESIA Transparency", description: "Are Environmental and Social Impact Assessments publicly available" },
      { key: "sovImmunity", label: "Sovereign Immunity Risk", description: "Government accountability for breaches of infrastructure contracts" },
      { key: "resourceSov", label: "Resource Sovereignty", description: "Legal protections on water and energy rights" },
      { key: "waste", label: "Waste & Lifecycle Mandates", description: "Extended Producer Responsibility laws, decommissioning liabilities" },
      { key: "circular", label: "Circular Economy Freedom", description: "Whether laws permit reuse of greywater and recycled construction materials" },
    ],
  },
];
