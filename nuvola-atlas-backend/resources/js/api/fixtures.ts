import type { Zone } from "../types/zone";
import type { Project, AlertItem, Report, HistoryPoint, ActivityEntry, PillarDef } from "../types";

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
  { id: "p11", name: "Outering Road Interchange", zoneId: "embakasi-north", agency: "KeNHA", type: "road", status: "active", progress: 38, budget: "KES 2.1B", started: "2025-06-01", eta: "2027-03-31", milestones: [{ date: "2025-06-01", label: "Groundbreaking", done: true }, { date: "2025-10-15", label: "Foundation works", done: true }, { date: "2026-04-01", label: "Ramp construction", done: false }, { date: "2026-10-01", label: "Deck pouring", done: false }, { date: "2027-03-31", label: "Commissioning", done: false }], marker: [36.9000, -1.2750] },
  { id: "p12", name: "Ngong Road BRT Corridor", zoneId: "dagoretti-north", agency: "NaMATA", type: "road", status: "active", progress: 22, budget: "KES 4.5B", started: "2025-09-01", eta: "2027-12-31", milestones: [{ date: "2025-09-01", label: "Land acquisition", done: true }, { date: "2026-03-01", label: "Utility relocation", done: false }, { date: "2026-09-01", label: "Dedicated lane construction", done: false }, { date: "2027-06-01", label: "Station builds", done: false }, { date: "2027-12-31", label: "Revenue service", done: false }], marker: [36.7650, -1.2850] },
  { id: "p13", name: "Ruaraka 132kV Transmission Line", zoneId: "ruaraka", agency: "KETRACO", type: "grid", status: "active", progress: 51, budget: "KES 680M", started: "2025-04-15", eta: "2026-06-30", milestones: [{ date: "2025-04-15", label: "Wayleave clearance", done: true }, { date: "2025-08-01", label: "Tower erection", done: true }, { date: "2026-01-15", label: "Stringing", done: false }, { date: "2026-06-30", label: "Energization", done: false }], marker: [36.8750, -1.2450] },
  { id: "p14", name: "Dagoretti South Feeder Roads", zoneId: "dagoretti-south", agency: "KURA", type: "road", status: "planned", progress: 5, budget: "KES 210M", started: "2026-03-01", eta: "2027-02-28", milestones: [{ date: "2026-03-01", label: "Design review", done: true }, { date: "2026-06-01", label: "Tender award", done: false }, { date: "2026-10-01", label: "Drainage and grading", done: false }, { date: "2027-02-28", label: "Completion", done: false }], marker: [36.7500, -1.3100] },
  { id: "p15", name: "Embakasi Central EV Charging Network", zoneId: "embakasi-central", agency: "KPLC", type: "energy", status: "planned", progress: 12, budget: "KES 180M", started: "2026-02-01", eta: "2026-11-30", milestones: [{ date: "2026-02-01", label: "Site identification", done: true }, { date: "2026-05-01", label: "Grid capacity study", done: false }, { date: "2026-08-01", label: "Charger installation", done: false }, { date: "2026-11-30", label: "Public launch", done: false }], marker: [36.8850, -1.3050] },
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
  { id: "r1", title: "Nairobi Q1 2026 Vitality Report", zoneId: null, date: "2026-04-15", status: "published", author: "Ken N'ganga", sizeBytes: 2_450_000, format: "PDF", tags: ["quarterly", "vitality", "citywide"], sections: [
    { heading: "Executive Summary", body: "Overall Nairobi vitality score rose from 65 to 68 during Q1 2026, driven by infrastructure completions in Westlands and Embakasi East. Safety scores declined in Kibra and Mathare." },
    { heading: "Key Findings", body: "1. Infrastructure pillar improved across 12 of 17 sub-counties. 2. Social Wellbeing gains concentrated in higher-income zones. 3. Two projects (Inner Ring, Kibra Access Roads) fell behind schedule. 4. Energy data feed interruptions affected 3 zones." },
    { heading: "Recommendations", body: "Prioritize safety interventions in Kibra and Mathare. Escalate stalled road projects to KeNHA oversight. Establish redundant data feeds for energy layer reliability." },
    { heading: "Data Sources", body: "KNBS population estimates (2025), KPLC grid status API, KeNHA/KURA project trackers, NEMA ESIA registry, Social Progress Index 2025." },
  ] },
  { id: "r2", title: "Westlands Infrastructure Assessment", zoneId: "westlands", date: "2026-05-01", status: "published", author: "Devyan Jethwa", sizeBytes: 1_820_000, format: "PDF", tags: ["infrastructure", "westlands"], sections: [
    { heading: "Executive Summary", body: "Westlands maintains the joint-highest vitality score (76) with strong infrastructure and social pillars. Waiyaki Way Expansion is 72% complete and on track." },
    { heading: "Road Network Analysis", body: "3 active road projects covering 12.4 km of primary roads. Average road condition index: 7.2/10. Traffic flow improved 18% on Waiyaki Way completed segments." },
    { heading: "Energy & Grid Status", body: "Smart meter penetration at 34% (1,200 units). Grid uptime 99.4% over the past quarter. Solar potential mapped for 8 commercial rooftops." },
    { heading: "Recommendations", body: "Accelerate smart meter rollout to reach 50% by Q3. Commission traffic study for Museum Hill interchange bottleneck." },
  ] },
  { id: "r3", title: "Kibra Urban Density Analysis", zoneId: "kibra", date: "2026-05-10", status: "review", author: "Joy Nthei", sizeBytes: 980_000, format: "PDF", tags: ["density", "kibra", "urban-planning"], sections: [
    { heading: "Executive Summary", body: "Kibra has the highest population density in Nairobi at approximately 82,000 people per km2. Infrastructure capacity is severely strained." },
    { heading: "Density Metrics", body: "Optimal Density Ratio: 0.34 (critical). Urban Friction Index: 8.2/10 (high). Average commute time for heavy equipment: 4.2 hours." },
    { heading: "Risk Assessment", body: "Current density trajectory suggests infrastructure saturation within 18 months without intervention. Access road capacity at 89% utilization." },
  ] },
  { id: "r4", title: "Embakasi Substation Impact Study", zoneId: "embakasi-east", date: "2026-05-18", status: "review", author: "Khillon", sizeBytes: 1_540_000, format: "PDF", tags: ["esia", "energy", "embakasi"], sections: [
    { heading: "Executive Summary", body: "The KETRACO substation upgrade (88% complete) will increase Embakasi East grid capacity by 40MW, serving approximately 45,000 additional households." },
    { heading: "Environmental Impact", body: "ESIA approved by NEMA. Noise mitigation barriers installed. EMF levels within WHO guidelines at all residential boundaries." },
    { heading: "Community Benefits", body: "Projected 23% reduction in power outages. 180 construction jobs created. Local procurement at 62% of total contract value." },
  ] },
  { id: "r5", title: "Mathare Baseline Survey", zoneId: "mathare", date: "2026-05-20", status: "draft", author: "Austine Igunza", sizeBytes: 640_000, format: "PDF", tags: ["baseline", "mathare"], sections: [
    { heading: "Executive Summary", body: "Mathare records the lowest vitality score (52) in Nairobi. All four pillars score below the citywide average. This baseline informs targeted interventions." },
    { heading: "Current State", body: "Safety score: 48 (lowest in Nairobi). Social Wellbeing: 46. Only 1 active infrastructure project (Mathare Distribution Line, 8% progress). No ESIA documentation for 3 legacy installations." },
  ] },
  { id: "r6", title: "Nairobi Safety Corridor Mapping", zoneId: null, date: "2026-05-22", status: "draft", author: "Ken N'ganga", sizeBytes: 420_000, format: "PDF", tags: ["safety", "citywide", "corridors"], sections: [
    { heading: "Executive Summary", body: "Mapped 14 high-risk transit corridors across Nairobi using incident data, infrastructure vandalism reports, and night-time satellite imagery analysis." },
    { heading: "Methodology", body: "Combined NPSC crime statistics with KPLC outage data and OpenStreetMap infrastructure density. Each corridor scored 0-100 on physical security risk." },
  ] },
  { id: "r7", title: "Langata Road Dualling Progress", zoneId: "langata", date: "2026-04-28", status: "published", author: "Devyan Jethwa", sizeBytes: 1_230_000, format: "PDF", tags: ["infrastructure", "road", "langata"], sections: [
    { heading: "Executive Summary", body: "Langata Road Dualling is 61% complete and on schedule. Base course laid on 4.2 km of the 6.8 km corridor. Asphalt phase begins June 2026." },
    { heading: "Progress Detail", body: "Earthworks: 100%. Base course: 62%. Drainage structures: 85%. Pedestrian bridges: 2 of 3 complete. Traffic management plan operational." },
    { heading: "Budget Tracking", body: "KES 543M of KES 890M budget disbursed (61%). No cost overruns. Contingency reserve at 8% (KES 71M) untouched." },
  ] },
  { id: "r8", title: "Outering Road Interchange Feasibility", zoneId: "embakasi-north", date: "2026-05-24", status: "draft", author: "Khillon", sizeBytes: 890_000, format: "PDF", tags: ["feasibility", "road", "interchange"], sections: [
    { heading: "Executive Summary", body: "Traffic modelling shows the Outering Road interchange will reduce peak-hour delays by 34% for 120,000 daily commuters in the Embakasi North corridor." },
    { heading: "Cost-Benefit Analysis", body: "Estimated economic benefit of KES 4.8B over 20 years against KES 2.1B construction cost. NPV positive at year 7." },
  ] },
  { id: "r9", title: "Ngong Road BRT Environmental Assessment", zoneId: "dagoretti-north", date: "2026-05-25", status: "review", author: "Joy Nthei", sizeBytes: 1_680_000, format: "PDF", tags: ["esia", "brt", "transport"], sections: [
    { heading: "Executive Summary", body: "The proposed Ngong Road BRT corridor will serve 85,000 daily passengers. ESIA identifies tree removal (340 trees) and noise as primary concerns." },
    { heading: "Mitigation Measures", body: "1:3 tree replacement ratio (1,020 new trees). Noise barriers along 2.4 km of residential frontage. Construction restricted to 7am-7pm." },
    { heading: "Community Consultation", body: "Three public hearings held with 680 attendees. 72% approval rate. Key concern: temporary traffic disruption during 28-month construction." },
  ] },
  { id: "r10", title: "EV Charging Infrastructure Readiness", zoneId: "embakasi-central", date: "2026-05-26", status: "draft", author: "Devyan Jethwa", sizeBytes: 520_000, format: "PDF", tags: ["energy", "ev", "infrastructure"], sections: [
    { heading: "Executive Summary", body: "Embakasi Central grid can support 24 Level 2 chargers without upgrades. Level 3 DC fast chargers require a 2MW feeder extension estimated at KES 45M." },
    { heading: "Demand Forecast", body: "Kenya EV registrations growing at 180% YoY. Projected 1,200 EVs in Embakasi Central by 2028, requiring 40 public charging points." },
  ] },
];

export const HISTORY: HistoryPoint[] = [
  { month: "Jun '25", overallAvg: 61 }, { month: "Jul '25", overallAvg: 61.5 },
  { month: "Aug '25", overallAvg: 62 }, { month: "Sep '25", overallAvg: 62.8 },
  { month: "Oct '25", overallAvg: 63.5 }, { month: "Nov '25", overallAvg: 64 },
  { month: "Dec '25", overallAvg: 65 }, { month: "Jan '26", overallAvg: 65.8 },
  { month: "Feb '26", overallAvg: 66.5 }, { month: "Mar '26", overallAvg: 67.2 },
  { month: "Apr '26", overallAvg: 68 }, { month: "May '26", overallAvg: 69 },
];

export const ACTIVITIES: Record<string, ActivityEntry[]> = {
  westlands: [
    { id: "act1", zoneId: "westlands", kind: "road", text: "Waiyaki Way Phase 2 paving completed ahead of schedule", source: "KeNHA", createdAt: "2026-05-22T08:00:00Z" },
    { id: "act2", zoneId: "westlands", kind: "grid", text: "Smart meter rollout reached 1,200 units in Parklands", source: "KPLC", createdAt: "2026-05-20T14:30:00Z" },
    { id: "act3", zoneId: "westlands", kind: "esia", text: "Updated ESIA for Westlands commercial zone published", source: "NEMA", createdAt: "2026-05-18T10:00:00Z" },
  ],
  starehe: [
    { id: "act5", zoneId: "starehe", kind: "road", text: "Inner Ring contractor issued show-cause notice", source: "KURA", createdAt: "2026-05-20T09:30:00Z" },
  ],
  "embakasi-east": [
    { id: "act7", zoneId: "embakasi-east", kind: "grid", text: "Substation transformer testing completed successfully", source: "KETRACO", createdAt: "2026-05-21T15:00:00Z" },
  ],
};

export const METHODOLOGY: PillarDef[] = [
  { key: "social", name: "Social Wellbeing & Human Capital", description: "Whether the local population is thriving. A low score predicts future labour issues or shortage of skilled operators.", subMetrics: [{ key: "spi", label: "Social Progress Index", description: "Basic medical care, access to amenities, and inclusiveness" }, { key: "workforce", label: "Workforce Mobility Score", description: "How easily labour and specialized roles can move in and out" }, { key: "livability", label: "Mental Health & Livability", description: "Access to green space, air quality, projected burnout" }] },
  { key: "safety", name: "Safety & Security", description: "Freedom from physical, legal, and digital threats that could disrupt projects.", subMetrics: [{ key: "ruleOfLaw", label: "Rule of Law Stability", description: "Probability of contract expropriation, five-year judicial independence trend" }, { key: "physSecurity", label: "Infrastructure Physical Security", description: "Conflict heatmap, proximity to unrest or high-crime corridors" }, { key: "digitalSov", label: "Digital Sovereignty & Cybersecurity", description: "Internet Freedom Score, network outage frequency" }] },
  { key: "density", name: "Density & Scaling Dynamics", description: "Whether the region's density supports growth or constrains it.", subMetrics: [{ key: "optDensity", label: "Optimal Density Ratio", description: "Infrastructure Capacity / Population Density. Low ratio flags over-saturation" }, { key: "urbanFriction", label: "Urban Friction Index", description: "Average transit times for heavy equipment, zoning complexity" }] },
  { key: "infra", name: "Infrastructure & Environmental Safeguards", description: "Whether documentation and legal architecture exist to back up large projects.", subMetrics: [{ key: "esia", label: "ESIA Transparency", description: "Are Environmental and Social Impact Assessments publicly available" }, { key: "sovImmunity", label: "Sovereign Immunity Risk", description: "Government accountability for breaches of infrastructure contracts" }, { key: "resourceSov", label: "Resource Sovereignty", description: "Legal protections on water and energy rights" }, { key: "waste", label: "Waste & Lifecycle Mandates", description: "Extended Producer Responsibility laws, decommissioning liabilities" }, { key: "circular", label: "Circular Economy Freedom", description: "Whether laws permit reuse of greywater and recycled construction materials" }] },
];
