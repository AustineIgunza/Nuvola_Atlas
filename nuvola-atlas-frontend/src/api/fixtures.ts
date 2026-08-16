import type {
  Zone,
  Project,
  AlertItem,
  Report,
  HistoryPoint,
  ActivityEntry,
  PillarDef,
  ZoneHistory,
  ZoneHistoryPoint,
  HistoryRange,
} from "@/types";

export const ZONES: Zone[] = [
  {
    id: "westlands",
    name: "Westlands",
    score: 76,
    pillars: { social: 82, safety: 71, density: 64, infra: 80 },
    deltas: { social: 3, safety: -1, density: 2, infra: 4 },
    centroid: [36.8048, -1.2673],
    lastSyncMin: 4,
  },
  {
    id: "dagoretti-north",
    name: "Dagoretti North",
    score: 72,
    pillars: { social: 74, safety: 68, density: 70, infra: 66 },
    deltas: { social: 2, safety: 1, density: -2, infra: 3 },
    centroid: [36.76, -1.275],
    lastSyncMin: 7,
  },
  {
    id: "dagoretti-south",
    name: "Dagoretti South",
    score: 65,
    pillars: { social: 62, safety: 64, density: 60, infra: 68 },
    deltas: { social: 1, safety: -3, density: 2, infra: 1 },
    centroid: [36.745, -1.305],
    lastSyncMin: 12,
  },
  {
    id: "langata",
    name: "Langata",
    score: 70,
    pillars: { social: 72, safety: 74, density: 55, infra: 71 },
    deltas: { social: -1, safety: 2, density: 1, infra: 3 },
    centroid: [36.735, -1.36],
    lastSyncMin: 5,
  },
  {
    id: "kibra",
    name: "Kibra",
    score: 54,
    pillars: { social: 48, safety: 52, density: 58, infra: 56 },
    deltas: { social: 2, safety: -2, density: 1, infra: 0 },
    centroid: [36.785, -1.315],
    lastSyncMin: 18,
  },
  {
    id: "roysambu",
    name: "Roysambu",
    score: 68,
    pillars: { social: 70, safety: 65, density: 62, infra: 72 },
    deltas: { social: 1, safety: 3, density: -1, infra: 2 },
    centroid: [36.875, -1.22],
    lastSyncMin: 9,
  },
  {
    id: "kasarani",
    name: "Kasarani",
    score: 63,
    pillars: { social: 60, safety: 62, density: 58, infra: 68 },
    deltas: { social: -1, safety: 2, density: 0, infra: 1 },
    centroid: [36.9, -1.235],
    lastSyncMin: 6,
  },
  {
    id: "ruaraka",
    name: "Ruaraka",
    score: 66,
    pillars: { social: 68, safety: 64, density: 60, infra: 70 },
    deltas: { social: 2, safety: 0, density: -1, infra: 3 },
    centroid: [36.88, -1.25],
    lastSyncMin: 11,
  },
  {
    id: "embakasi-south",
    name: "Embakasi South",
    score: 58,
    pillars: { social: 55, safety: 56, density: 62, infra: 58 },
    deltas: { social: 1, safety: -1, density: 2, infra: 0 },
    centroid: [36.91, -1.33],
    lastSyncMin: 14,
  },
  {
    id: "embakasi-north",
    name: "Embakasi North",
    score: 62,
    pillars: { social: 60, safety: 64, density: 56, infra: 66 },
    deltas: { social: 0, safety: 2, density: 1, infra: -1 },
    centroid: [36.905, -1.28],
    lastSyncMin: 8,
  },
  {
    id: "embakasi-central",
    name: "Embakasi Central",
    score: 60,
    pillars: { social: 58, safety: 60, density: 54, infra: 64 },
    deltas: { social: 1, safety: 1, density: -2, infra: 2 },
    centroid: [36.89, -1.31],
    lastSyncMin: 10,
  },
  {
    id: "embakasi-east",
    name: "Embakasi East",
    score: 76,
    pillars: { social: 78, safety: 72, density: 70, infra: 82 },
    deltas: { social: 4, safety: 2, density: 1, infra: 5 },
    centroid: [36.93, -1.29],
    lastSyncMin: 3,
  },
  {
    id: "embakasi-west",
    name: "Embakasi West",
    score: 61,
    pillars: { social: 58, safety: 62, density: 56, infra: 66 },
    deltas: { social: -1, safety: 1, density: 0, infra: 2 },
    centroid: [36.87, -1.32],
    lastSyncMin: 15,
  },
  {
    id: "makadara",
    name: "Makadara",
    score: 64,
    pillars: { social: 62, safety: 66, density: 58, infra: 68 },
    deltas: { social: 2, safety: -1, density: 1, infra: 3 },
    centroid: [36.86, -1.295],
    lastSyncMin: 7,
  },
  {
    id: "kamukunji",
    name: "Kamukunji",
    score: 57,
    pillars: { social: 54, safety: 52, density: 60, infra: 58 },
    deltas: { social: -2, safety: 1, density: 3, infra: 0 },
    centroid: [36.845, -1.28],
    lastSyncMin: 20,
  },
  {
    id: "starehe",
    name: "Starehe",
    score: 69,
    pillars: { social: 66, safety: 68, density: 72, infra: 70 },
    deltas: { social: 1, safety: 2, density: -1, infra: 2 },
    centroid: [36.825, -1.285],
    lastSyncMin: 5,
  },
  {
    id: "mathare",
    name: "Mathare",
    score: 52,
    pillars: { social: 46, safety: 48, density: 56, infra: 54 },
    deltas: { social: -1, safety: -2, density: 1, infra: 0 },
    centroid: [36.858, -1.258],
    lastSyncMin: 22,
  },
];

export const PROJECTS: Project[] = [
  {
    id: "p1",
    name: "Waiyaki Way Expansion",
    zoneId: "westlands",
    agency: "KeNHA",
    type: "road",
    status: "active",
    progress: 72,
    budget: "KES 1.2B",
    started: "2025-01-15",
    eta: "2026-06-30",
    milestones: [
      { date: "2025-01-15", label: "Groundbreaking", done: true },
      { date: "2025-06-01", label: "Phase 1 paving", done: true },
      { date: "2025-12-01", label: "Interchange complete", done: true },
      { date: "2026-03-15", label: "Lane markings", done: false },
      { date: "2026-06-30", label: "Final inspection", done: false },
    ],
    marker: [36.795, -1.265],
  },
  {
    id: "p2",
    name: "Thika Road Smart Lighting",
    zoneId: "kasarani",
    agency: "KPLC",
    type: "energy",
    status: "active",
    progress: 45,
    budget: "KES 340M",
    started: "2025-04-01",
    eta: "2026-02-28",
    milestones: [
      { date: "2025-04-01", label: "Contract signed", done: true },
      { date: "2025-08-15", label: "Pole installation", done: true },
      { date: "2025-12-01", label: "Wiring phase", done: false },
      { date: "2026-02-28", label: "Commissioning", done: false },
    ],
    marker: [36.895, -1.22],
  },
  {
    id: "p3",
    name: "Inner Ring Resurfacing",
    zoneId: "starehe",
    agency: "KURA",
    type: "road",
    status: "stalled",
    progress: 34,
    budget: "KES 180M",
    started: "2025-02-10",
    eta: "2025-11-30",
    milestones: [
      { date: "2025-02-10", label: "Mobilization", done: true },
      { date: "2025-05-01", label: "Milling", done: true },
      { date: "2025-08-01", label: "Overlay", done: false },
      { date: "2025-11-30", label: "Completion", done: false },
    ],
    marker: [36.83, -1.29],
  },
  {
    id: "p4",
    name: "Embakasi Substation Upgrade",
    zoneId: "embakasi-east",
    agency: "KETRACO",
    type: "grid",
    status: "active",
    progress: 88,
    budget: "KES 520M",
    started: "2024-09-01",
    eta: "2026-01-15",
    milestones: [
      { date: "2024-09-01", label: "Design approval", done: true },
      { date: "2025-01-15", label: "Transformer delivery", done: true },
      { date: "2025-06-01", label: "Installation", done: true },
      { date: "2025-10-01", label: "Testing", done: true },
      { date: "2026-01-15", label: "Grid connection", done: false },
    ],
    marker: [36.925, -1.285],
  },
  {
    id: "p5",
    name: "Langata Road Dualling",
    zoneId: "langata",
    agency: "KeNHA",
    type: "road",
    status: "active",
    progress: 61,
    budget: "KES 890M",
    started: "2025-03-01",
    eta: "2026-09-30",
    milestones: [
      { date: "2025-03-01", label: "Groundbreaking", done: true },
      { date: "2025-07-15", label: "Earthworks", done: true },
      { date: "2025-12-01", label: "Base course", done: true },
      { date: "2026-05-01", label: "Asphalt", done: false },
      { date: "2026-09-30", label: "Handover", done: false },
    ],
    marker: [36.74, -1.35],
  },
  {
    id: "p6",
    name: "Roysambu Solar Microgrid",
    zoneId: "roysambu",
    agency: "KPLC",
    type: "energy",
    status: "active",
    progress: 55,
    budget: "KES 240M",
    started: "2025-05-15",
    eta: "2026-04-30",
    milestones: [
      { date: "2025-05-15", label: "Site survey", done: true },
      { date: "2025-09-01", label: "Panel installation", done: true },
      { date: "2026-01-15", label: "Battery storage", done: false },
      { date: "2026-04-30", label: "Go-live", done: false },
    ],
    marker: [36.88, -1.215],
  },
  {
    id: "p7",
    name: "Eastleigh Fibre Backbone",
    zoneId: "kamukunji",
    agency: "ICTA",
    type: "grid",
    status: "active",
    progress: 40,
    budget: "KES 160M",
    started: "2025-06-01",
    eta: "2026-05-31",
    milestones: [
      { date: "2025-06-01", label: "Route survey", done: true },
      { date: "2025-10-01", label: "Trenching", done: true },
      { date: "2026-02-01", label: "Fibre laying", done: false },
      { date: "2026-05-31", label: "Activation", done: false },
    ],
    marker: [36.85, -1.275],
  },
  {
    id: "p8",
    name: "Kibra Access Roads",
    zoneId: "kibra",
    agency: "KURA",
    type: "road",
    status: "active",
    progress: 28,
    budget: "KES 95M",
    started: "2025-07-01",
    eta: "2026-06-30",
    milestones: [
      { date: "2025-07-01", label: "Community engagement", done: true },
      { date: "2025-11-01", label: "Drainage", done: false },
      { date: "2026-03-01", label: "Paving", done: false },
      { date: "2026-06-30", label: "Completion", done: false },
    ],
    marker: [36.79, -1.31],
  },
  {
    id: "p9",
    name: "Mathare Distribution Line",
    zoneId: "mathare",
    agency: "KPLC",
    type: "energy",
    status: "planned",
    progress: 8,
    budget: "KES 120M",
    started: "2026-01-15",
    eta: "2026-12-31",
    milestones: [
      { date: "2026-01-15", label: "Feasibility study", done: true },
      { date: "2026-04-01", label: "Design phase", done: false },
      { date: "2026-08-01", label: "Construction", done: false },
      { date: "2026-12-31", label: "Energization", done: false },
    ],
    marker: [36.86, -1.255],
  },
  {
    id: "p10",
    name: "Makadara Smart Grid Pilot",
    zoneId: "makadara",
    agency: "KETRACO",
    type: "grid",
    status: "active",
    progress: 67,
    budget: "KES 310M",
    started: "2025-02-01",
    eta: "2026-03-31",
    milestones: [
      { date: "2025-02-01", label: "Meter procurement", done: true },
      { date: "2025-06-15", label: "Installation phase 1", done: true },
      { date: "2025-11-01", label: "Installation phase 2", done: true },
      { date: "2026-03-31", label: "Full deployment", done: false },
    ],
    marker: [36.865, -1.298],
  },
  {
    id: "p11",
    name: "Kibra Communal Water Kiosks",
    zoneId: "kibra",
    agency: "NCWSC",
    type: "water",
    status: "active",
    progress: 42,
    budget: "KES 85M",
    started: "2025-06-01",
    eta: "2026-08-31",
    milestones: [
      { date: "2025-06-01", label: "Community water-point mapping", done: true },
      { date: "2025-09-15", label: "Borehole drilling & yield test", done: true },
      { date: "2026-01-15", label: "Kiosk construction (14 sites)", done: false },
      { date: "2026-05-01", label: "Metered distribution network", done: false },
      { date: "2026-08-31", label: "Commissioning & tariff setup", done: false },
    ],
    marker: [36.782, -1.318],
  },
  {
    id: "p12",
    name: "Mathare DEWATS Sanitation Block",
    zoneId: "mathare",
    agency: "Athi Water Works",
    type: "water",
    status: "active",
    progress: 35,
    budget: "KES 68M",
    started: "2025-08-01",
    eta: "2026-10-31",
    milestones: [
      { date: "2025-08-01", label: "Site survey & flood-line study", done: true },
      { date: "2025-11-01", label: "Community engagement & siting", done: true },
      { date: "2026-03-01", label: "Ablution block construction", done: false },
      { date: "2026-07-01", label: "Biodigester & DEWATS install", done: false },
      { date: "2026-10-31", label: "Handover to sanitation SACCO", done: false },
    ],
    marker: [36.855, -1.26],
  },
  {
    id: "p13",
    name: "Dagoretti South Water Main Extension",
    zoneId: "dagoretti-south",
    agency: "NCWSC",
    type: "water",
    status: "active",
    progress: 58,
    budget: "KES 140M",
    started: "2025-04-15",
    eta: "2026-05-31",
    milestones: [
      { date: "2025-04-15", label: "Route survey & wayleave", done: true },
      { date: "2025-08-01", label: "Trenching (6.2 km)", done: true },
      { date: "2025-12-15", label: "DN300 pipe laying", done: false },
      { date: "2026-03-15", label: "Pressure testing", done: false },
      { date: "2026-05-31", label: "Zonal connection & flush", done: false },
    ],
    marker: [36.748, -1.302],
  },
  {
    id: "p14",
    name: "Embakasi Faecal Sludge Treatment Plant",
    zoneId: "embakasi-south",
    agency: "Athi Water Works",
    type: "water",
    status: "planned",
    progress: 12,
    budget: "KES 310M",
    started: "2026-02-01",
    eta: "2027-03-31",
    milestones: [
      { date: "2026-02-01", label: "Feasibility & catchment study", done: true },
      { date: "2026-05-01", label: "ESIA & NEMA licensing", done: false },
      { date: "2026-09-01", label: "Land acquisition (4 ha)", done: false },
      { date: "2027-01-15", label: "Plant construction", done: false },
      { date: "2027-03-31", label: "Commissioning (400 m³/day)", done: false },
    ],
    marker: [36.913, -1.327],
  },
  {
    id: "p15",
    name: "Ruaraka Bypass Rehabilitation",
    zoneId: "ruaraka",
    agency: "KURA",
    type: "road",
    status: "active",
    progress: 53,
    budget: "KES 420M",
    started: "2025-05-01",
    eta: "2026-07-31",
    milestones: [
      { date: "2025-05-01", label: "Mobilization", done: true },
      { date: "2025-09-01", label: "Culvert & drainage works", done: true },
      { date: "2026-01-15", label: "Base & binder course", done: false },
      { date: "2026-05-01", label: "Asphalt overlay", done: false },
      { date: "2026-07-31", label: "Road marking & handover", done: false },
    ],
    marker: [36.883, -1.247],
  },
  {
    id: "p16",
    name: "Dagoretti North Fibre Ring",
    zoneId: "dagoretti-north",
    agency: "ICTA",
    type: "grid",
    status: "active",
    progress: 47,
    budget: "KES 130M",
    started: "2025-06-15",
    eta: "2026-06-30",
    milestones: [
      { date: "2025-06-15", label: "Route survey", done: true },
      { date: "2025-10-01", label: "Duct & manhole works", done: true },
      { date: "2026-02-01", label: "Fibre blowing", done: false },
      { date: "2026-06-30", label: "Node activation", done: false },
    ],
    marker: [36.763, -1.272],
  },
  {
    id: "p17",
    name: "Embakasi North Feeder Line",
    zoneId: "embakasi-north",
    agency: "KPLC",
    type: "energy",
    status: "active",
    progress: 64,
    budget: "KES 280M",
    started: "2025-03-15",
    eta: "2026-04-30",
    milestones: [
      { date: "2025-03-15", label: "Design & wayleave", done: true },
      { date: "2025-07-01", label: "Pole & conductor stringing", done: true },
      { date: "2025-12-01", label: "Transformer bays", done: true },
      { date: "2026-04-30", label: "Energization", done: false },
    ],
    marker: [36.908, -1.277],
  },
  {
    id: "p18",
    name: "Jogoo Road Corridor Upgrade",
    zoneId: "embakasi-central",
    agency: "KURA",
    type: "road",
    status: "stalled",
    progress: 31,
    budget: "KES 360M",
    started: "2025-02-20",
    eta: "2026-03-31",
    milestones: [
      { date: "2025-02-20", label: "Mobilization", done: true },
      { date: "2025-06-01", label: "Utility relocation", done: true },
      { date: "2025-10-01", label: "Carriageway widening", done: false },
      { date: "2026-03-31", label: "Non-motorized transport lanes", done: false },
    ],
    marker: [36.893, -1.307],
  },
  {
    id: "p19",
    name: "Embakasi West Solar Streetlights",
    zoneId: "embakasi-west",
    agency: "KPLC",
    type: "energy",
    status: "active",
    progress: 49,
    budget: "KES 190M",
    started: "2025-07-01",
    eta: "2026-05-31",
    milestones: [
      { date: "2025-07-01", label: "Site audit & spacing plan", done: true },
      { date: "2025-11-15", label: "Foundation & pole erection", done: true },
      { date: "2026-02-15", label: "Solar head & battery mount", done: false },
      { date: "2026-05-31", label: "Network commissioning", done: false },
    ],
    marker: [36.873, -1.317],
  },
];

export const ALERTS: AlertItem[] = [
  {
    id: "a1",
    severity: "high",
    kind: "infra",
    title: "Inner Ring Resurfacing stalled",
    body: "Contractor has not mobilized equipment for 45 days. KURA issued a show-cause notice on May 10. Project timeline at risk.",
    zoneId: "starehe",
    createdAt: "2026-05-20T09:30:00Z",
    read: false,
    affectedInfra: ["Inner Ring Road", "CBD access routes", "Public transit corridors"],
    recommendedActions: [
      "Issue formal notice to contractor within 48 hours",
      "Activate penalty clause (Section 12.3 of contract)",
      "Prepare alternative contractor shortlist",
      "Notify affected commuters via county channels",
    ],
    impactLevel: "critical",
    relatedProjectIds: ["p3"],
  },
  {
    id: "a2",
    severity: "medium",
    kind: "vitality",
    title: "Kibra safety score dropped 4 pts",
    body: "Safety & Security pillar for Kibra fell from 56 to 52 following two reported infrastructure vandalism incidents in April.",
    zoneId: "kibra",
    createdAt: "2026-05-18T14:00:00Z",
    read: false,
    affectedInfra: ["Kibra Access Roads", "Street lighting network", "Community water points"],
    recommendedActions: [
      "Deploy community surveillance patrols at vandalism hotspots",
      "Fast-track solar-powered lighting installation along access roads",
      "Coordinate with National Police Service for increased presence",
      "Engage community leaders through ward-level forums",
    ],
    impactLevel: "major",
    relatedProjectIds: ["p8"],
  },
  {
    id: "a3",
    severity: "low",
    kind: "esia",
    title: "ESIA published for Mathare Distribution Line",
    body: "Environmental and Social Impact Assessment for the Mathare Distribution Line project is now publicly available on the NEMA portal.",
    zoneId: "mathare",
    createdAt: "2026-05-15T11:00:00Z",
    read: false,
    affectedInfra: [
      "Mathare Distribution Line",
      "Existing 11kV overhead lines",
      "Juja Road transformer station",
    ],
    recommendedActions: [
      "Review ESIA findings and flag any community resettlement requirements",
      "Verify compliance with NEMA conditions of approval",
      "Schedule public participation session within 30 days",
    ],
    impactLevel: "minor",
    relatedProjectIds: ["p9"],
  },
  {
    id: "a4",
    severity: "high",
    kind: "system",
    title: "KPLC data feed interrupted",
    body: "The automated feed from Kenya Power has not delivered updates in 72 hours. Energy layer data may be stale for affected zones.",
    zoneId: null,
    createdAt: "2026-05-22T07:15:00Z",
    read: false,
    affectedInfra: [
      "Thika Road Smart Lighting",
      "Roysambu Solar Microgrid",
      "Makadara Smart Grid Pilot",
      "Mathare Distribution Line",
    ],
    recommendedActions: [
      "Contact KPLC data liaison to diagnose feed failure",
      "Switch to backup manual data-entry pipeline for critical zones",
      "Flag all energy-layer scores as provisional until feed restores",
      "Notify downstream report consumers of potential data staleness",
      "Escalate to KPLC regional manager if unresolved within 24 hours",
    ],
    impactLevel: "major",
    relatedProjectIds: ["p2", "p6", "p9", "p10"],
  },
  {
    id: "a5",
    severity: "medium",
    kind: "partner",
    title: "Nairobi County GIS unit MOU signed",
    body: "Letter of intent signed with Nairobi County GIS unit for pilot data sharing. Integration timeline TBD.",
    zoneId: null,
    createdAt: "2026-05-12T16:30:00Z",
    read: true,
    affectedInfra: ["County GIS data pipeline", "Zoning boundary datasets", "Land-use registry"],
    recommendedActions: [
      "Schedule technical integration workshop with county GIS team",
      "Define data format and API specifications for shared feeds",
      "Establish data-sharing governance protocol aligned with KDPA",
      "Set quarterly review milestones for data quality assessment",
    ],
    impactLevel: "moderate",
    relatedProjectIds: [],
  },
  {
    id: "a6",
    severity: "low",
    kind: "vitality",
    title: "Embakasi East tops leaderboard",
    body: "Embakasi East has overtaken Westlands for the highest overall Vitality score (76) following infrastructure upgrades at the KETRACO substation.",
    zoneId: "embakasi-east",
    createdAt: "2026-05-10T10:00:00Z",
    read: true,
    affectedInfra: [
      "Embakasi Substation",
      "KETRACO 132kV transmission line",
      "Local distribution network",
    ],
    recommendedActions: [
      "Document Embakasi East as a case study for replication in other zones",
      "Share success metrics with KETRACO for joint communications",
      "Assess whether substation model can be adapted for Embakasi West",
    ],
    impactLevel: "minor",
    relatedProjectIds: ["p4"],
  },
  {
    id: "a7",
    severity: "high",
    kind: "infra",
    title: "Kibra water kiosk borehole yield below projection",
    body: "Yield testing on the Kibra Communal Water Kiosks borehole returned 8.4 m³/hr against a design assumption of 14 m³/hr. At current yield the 14-kiosk network cannot meet peak demand for the 185,000 residents, and average wait times would stay above the 15-minute target.",
    zoneId: "kibra",
    createdAt: "2026-05-23T08:45:00Z",
    read: false,
    affectedInfra: [
      "Kibra Communal Water Kiosks",
      "Shared water points (62% of households)",
      "Metered distribution network",
    ],
    recommendedActions: [
      "Commission a second borehole or bulk-water connection from the Ngong trunk main",
      "Right-size the kiosk network to the verified yield before construction proceeds",
      "Introduce off-peak storage tanks to buffer demand and cut wait times",
      "Re-run the demand model with NCWSC using verified yield figures",
    ],
    impactLevel: "major",
    relatedProjectIds: ["p11"],
  },
  {
    id: "a8",
    severity: "medium",
    kind: "esia",
    title: "Embakasi FSTP public participation opens",
    body: "The Environmental & Social Impact Assessment for the Embakasi Faecal Sludge Treatment Plant is open for public comment on the NEMA portal until June 20. The plant would give informal settlements a decentralized alternative to conventional sewerage, which is not viable at Embakasi's density and cost.",
    zoneId: "embakasi-south",
    createdAt: "2026-05-21T12:00:00Z",
    read: false,
    affectedInfra: [
      "Embakasi Faecal Sludge Treatment Plant",
      "Exhauster-truck disposal routes",
      "Nairobi River discharge points",
    ],
    recommendedActions: [
      "Mobilize community input during the public participation window",
      "Verify buffer distances from the nearest residential cluster (4 ha site)",
      "Confirm faecal-sludge feedstock volumes with licensed exhauster operators",
      "Align the treatment standard with the Kenya effluent discharge regulations",
    ],
    impactLevel: "moderate",
    relatedProjectIds: ["p14"],
  },
  {
    id: "a9",
    severity: "high",
    kind: "vitality",
    title: "Mathare sanitation coverage critically low",
    body: "Baseline survey confirms only 11% of Mathare households have access to a safely managed sanitation facility. With the valley's flood risk and informal layout, conventional sewered toilets are not deliverable — the DEWATS sanitation block is the primary intervention but is only 35% complete.",
    zoneId: "mathare",
    createdAt: "2026-05-19T09:15:00Z",
    read: false,
    affectedInfra: [
      "Mathare DEWATS Sanitation Block",
      "Riverine pit latrines",
      "Mathare River water quality",
    ],
    recommendedActions: [
      "Accelerate the DEWATS ablution-block construction phase",
      "Deploy interim container-based sanitation units during the long rains",
      "Establish a community sanitation SACCO to run the block after handover",
      "Test Mathare River downstream for faecal contamination as a baseline",
    ],
    impactLevel: "critical",
    relatedProjectIds: ["p12"],
  },
  {
    id: "a10",
    severity: "medium",
    kind: "infra",
    title: "Dagoretti South water main trench flooding",
    body: "Long-rains flooding has submerged 1.8 km of open trench on the Dagoretti South Water Main Extension, halting DN300 pipe laying. The project remains at 58% and the May 31 zonal-connection milestone is now at risk.",
    zoneId: "dagoretti-south",
    createdAt: "2026-05-17T15:30:00Z",
    read: false,
    affectedInfra: [
      "Dagoretti South Water Main Extension",
      "Open trench (1.8 km)",
      "Ngong Road service reservoir",
    ],
    recommendedActions: [
      "Deploy dewatering pumps and shore up trench walls before resuming",
      "Re-sequence pipe laying to elevated dry sections first",
      "Revise the connection milestone to account for weather delay",
      "Add temporary drainage to protect the remaining open trench",
    ],
    impactLevel: "moderate",
    relatedProjectIds: ["p13"],
  },
  {
    id: "a11",
    severity: "low",
    kind: "partner",
    title: "Athi Water co-financing agreement signed",
    body: "Athi Water Works Development Agency has signed a co-financing agreement covering the Mathare DEWATS block and the Embakasi Faecal Sludge Treatment Plant, unlocking KES 210M in matched sanitation funding under the SDG-6 acceleration window.",
    zoneId: null,
    createdAt: "2026-05-14T11:30:00Z",
    read: true,
    affectedInfra: [
      "Mathare DEWATS Sanitation Block",
      "Embakasi Faecal Sludge Treatment Plant",
      "County sanitation budget line",
    ],
    recommendedActions: [
      "Formalize disbursement milestones tied to construction progress",
      "Map both projects into the county SDG-6 monitoring framework",
      "Schedule a joint quarterly review with Athi Water and NCWSC",
    ],
    impactLevel: "minor",
    relatedProjectIds: ["p12", "p14"],
  },
  {
    id: "a12",
    severity: "high",
    kind: "infra",
    title: "Jogoo Road corridor upgrade stalled",
    body: "The Jogoo Road Corridor Upgrade has been stalled at 31% for over a month after a utility-relocation dispute with a fibre operator. Non-motorized transport lanes and carriageway widening are both on hold, and Embakasi Central's density pillar is exposed.",
    zoneId: "embakasi-central",
    createdAt: "2026-05-16T10:20:00Z",
    read: false,
    affectedInfra: [
      "Jogoo Road Corridor Upgrade",
      "Buried fibre & water reticulation",
      "Non-motorized transport lanes",
    ],
    recommendedActions: [
      "Convene KURA, the fibre operator, and NCWSC to resolve the wayleave clash",
      "Escalate the utility-relocation dispute to the county infrastructure committee",
      "Publish a revised programme once relocation responsibility is agreed",
      "Secure the idle site to prevent equipment and material loss",
    ],
    impactLevel: "major",
    relatedProjectIds: ["p18"],
  },
  {
    id: "a13",
    severity: "medium",
    kind: "infra",
    title: "Roysambu microgrid battery bank delivery slipped",
    body: "The 420 kWh battery bank for the Roysambu Solar Microgrid has slipped from January to August delivery on the manufacturer's schedule. Panel array installation is complete; site remains ready for the bank on arrival.",
    zoneId: "roysambu",
    createdAt: "2026-05-11T09:00:00Z",
    read: false,
    affectedInfra: [
      "Roysambu Solar Microgrid",
      "Ward-scale islanding capability",
      "Backup for essential services",
    ],
    recommendedActions: [
      "Confirm the revised August delivery date in writing with the supplier",
      "Re-baseline the go-live milestone from April to Q3 2026",
      "Schedule storage-integration commissioning window against the new delivery",
      "Update the Atlas Infrastructure layer with the revised timeline",
    ],
    impactLevel: "moderate",
    relatedProjectIds: ["p6"],
  },
  {
    id: "a14",
    severity: "high",
    kind: "infra",
    title: "Thika Road copper-wiring theft cluster",
    body: "14 reported incidents of copper-wiring theft along the Thika Road Smart Lighting corridor between February and May 2026 have driven a 12% material wastage rate. Wiring speed is now gated by overnight security, not by crew availability.",
    zoneId: "kasarani",
    createdAt: "2026-05-16T13:15:00Z",
    read: false,
    affectedInfra: [
      "Thika Road Smart Lighting",
      "Un-energized poles (620 units)",
      "Corridor 5 in the safety-corridor mapping",
    ],
    recommendedActions: [
      "Sequence wiring and energization on the same night wherever possible",
      "Deploy anti-theft locking clamps at every pole base before wiring resumes",
      "Coordinate with NPS for nightly patrols along the corridor",
      "Update the corridor risk overlay once field data confirms the new pattern",
    ],
    impactLevel: "major",
    relatedProjectIds: ["p2"],
  },
  {
    id: "a15",
    severity: "low",
    kind: "infra",
    title: "Makadara AMI phase 2 closed out",
    body: "Makadara Smart Grid Pilot phase 2 installation closed out on schedule with 4,650 meters live across the ward. Non-technical loss detection has improved 34% versus baseline in the phase-1 zones — the pilot is now the reference deployment for county-wide smart-grid extension.",
    zoneId: "makadara",
    createdAt: "2026-05-08T10:30:00Z",
    read: true,
    affectedInfra: [
      "Makadara Smart Grid Pilot",
      "AMI meter fleet (4,650 units)",
      "Feeder head-end telemetry",
    ],
    recommendedActions: [
      "Document the phase 2 rollout as the reference methodology for Embakasi and Kasarani",
      "Schedule a methodology hand-off session for Q3 2026",
      "Begin phase 3 procurement to close the final 150 meters",
    ],
    impactLevel: "minor",
    relatedProjectIds: ["p10"],
  },
  {
    id: "a16",
    severity: "medium",
    kind: "infra",
    title: "Eastleigh fibre nightwork incident",
    body: "A fibre-blowing crew reported a tool-theft incident and one case of harassment during nightwork on the Eastleigh Fibre Backbone. Delivery pace along the corridor has dropped to roughly 60% of plan.",
    zoneId: "kamukunji",
    createdAt: "2026-05-15T22:40:00Z",
    read: false,
    affectedInfra: [
      "Eastleigh Fibre Backbone",
      "Corridor 3 in the safety-corridor mapping",
      "Fibre-blowing crew safety",
    ],
    recommendedActions: [
      "Escort night crews with NPS presence during the fibre-blowing phase",
      "Prioritize node activation in already-installed lower-risk sections first",
      "Pair the ICTA rollout with a 2 km solar-lighting scope along the trench path",
      "Coordinate with community leadership through the Kamukunji ward forum",
    ],
    impactLevel: "moderate",
    relatedProjectIds: ["p7"],
  },
  {
    id: "a17",
    severity: "low",
    kind: "infra",
    title: "Ruaraka Bypass base course ahead of plan",
    body: "Base and binder course works on the Ruaraka Bypass Rehabilitation are running two weeks ahead of the January schedule. Asphalt overlay is on track for May 2026 and the July handover window looks solid.",
    zoneId: "ruaraka",
    createdAt: "2026-05-06T08:30:00Z",
    read: true,
    affectedInfra: ["Ruaraka Bypass Rehabilitation", "Thika Road relief route", "Baba Dogo access"],
    recommendedActions: [
      "Confirm the asphalt-plant slot for May 2026 delivery",
      "Notify Baba Dogo residential clusters of asphalt phase working hours",
      "Update the Atlas Infrastructure layer projection for Ruaraka",
    ],
    impactLevel: "minor",
    relatedProjectIds: ["p15"],
  },
  {
    id: "a18",
    severity: "low",
    kind: "infra",
    title: "Dagoretti North fibre blowing commenced",
    body: "Fibre-blowing phase on the Dagoretti North Fibre Ring commenced on schedule. Six independent nodes with dual-path redundancy remain on track for June 2026 activation.",
    zoneId: "dagoretti-north",
    createdAt: "2026-05-05T09:15:00Z",
    read: true,
    affectedInfra: [
      "Dagoretti North Fibre Ring",
      "Six-node dual-path backbone",
      "Digital Sovereignty sub-metric",
    ],
    recommendedActions: [
      "Prepare node-activation acceptance testing procedure",
      "Coordinate with the CBD backhaul team for the redundancy hand-off",
      "Update the Atlas Infrastructure layer with the milestone",
    ],
    impactLevel: "minor",
    relatedProjectIds: ["p16"],
  },
  {
    id: "a19",
    severity: "medium",
    kind: "infra",
    title: "Embakasi North feeder energization gated by substation",
    body: "Feeder line poles, conductor stringing, and transformer bays are all complete. Energization cannot proceed until the Embakasi Substation grid-connection completes on the KPLC side — that milestone has slipped to July, pushing feeder energization to approximately August 2026.",
    zoneId: "embakasi-north",
    createdAt: "2026-05-12T14:00:00Z",
    read: false,
    affectedInfra: [
      "Embakasi North Feeder Line",
      "Embakasi Substation grid-connection",
      "Embakasi Central load redistribution",
    ],
    recommendedActions: [
      "Obtain a firm KPLC feeder-works date for the substation grid connection",
      "Re-baseline the energization milestone to August 2026 in the Atlas",
      "Coordinate the Roysambu microgrid backfeed test window with the new date",
    ],
    impactLevel: "moderate",
    relatedProjectIds: ["p17", "p4"],
  },
  {
    id: "a20",
    severity: "low",
    kind: "infra",
    title: "Embakasi West solar streetlight heads arrived",
    body: "The KEBS-certified solar streetlight heads and battery mounts for the Embakasi West rollout have arrived on site. Installation begins the first week of June, keeping the May 2026 commissioning window intact.",
    zoneId: "embakasi-west",
    createdAt: "2026-05-05T10:00:00Z",
    read: true,
    affectedInfra: [
      "Embakasi West Solar Streetlights",
      "480-pole solar array",
      "Ward street lighting coverage",
    ],
    recommendedActions: [
      "Sequence installation to complete high-risk corridors first",
      "Schedule commissioning acceptance testing for the last week of May",
      "Update Atlas Safety layer projection at commissioning",
    ],
    impactLevel: "minor",
    relatedProjectIds: ["p19"],
  },
];

export const REPORTS: Report[] = [
  {
    id: "r1",
    title: "Nairobi Q1 2026 Vitality Report",
    zoneId: null,
    date: "2026-04-15",
    status: "published",
    author: "Ken N'ganga",
    sizeBytes: 2_450_000,
    format: "PDF",
    type: "vitality",
    priority: "high",
    tags: ["quarterly", "county-wide", "vitality-index", "baseline"],
    pillarFocus: ["social", "safety", "density", "infra"],
    dateRange: { from: "2026-01-01", to: "2026-03-31" },
    executiveSummary:
      "Comprehensive quarterly assessment of Nairobi County's readiness across all 17 sub-county zones. The county-wide Vitality Index rose from 61.0 to 65.8 over Q1, driven primarily by infrastructure upgrades in Embakasi East and Westlands. Kibra and Mathare remain below the 60-point threshold, requiring targeted interventions in safety and social wellbeing pillars.",
    sections: [
      {
        heading: "Methodology",
        content:
          "Scores computed using the UE Vitality Index v1.2 framework across four pillars: Social Wellbeing & Human Capital, Safety & Security, Density & Scaling Dynamics, and Infrastructure & Environmental Safeguards. Data sourced from KNBS, KURA, KPLC, KETRACO, and NEMA feeds aggregated between January 1 and March 31, 2026.",
      },
      {
        heading: "County-Wide Trends",
        content:
          "The overall county average climbed 4.8 points to 65.8 — the strongest quarterly gain since tracking began. Embakasi East led all zones with a 6-point jump following the KETRACO substation upgrade reaching 88% completion.\nWestlands maintained its position as the highest-scoring zone (76), though its growth rate slowed as major road works on Waiyaki Way entered the lane-marking phase.\nThe bottom quartile (Kibra 54, Mathare 52, Kamukunji 57) showed mixed movement — Kibra's safety score dropped 4 points after two vandalism incidents.",
      },
      {
        heading: "Pillar Breakdown",
        content:
          "Social Wellbeing (county avg 62.4): Marginal gains in workforce mobility offset by stagnant healthcare access in informal settlements.\nSafety & Security (county avg 63.1): Rule-of-law indicators stable; physical security degraded in Kibra and Mathare.\nDensity & Scaling (county avg 60.8): Urban friction worsened along Thika Road corridor due to ongoing construction.\nInfra & Environmental (county avg 67.2): Strongest pillar — driven by ESIA transparency improvements and the Embakasi substation nearing completion.",
      },
      {
        heading: "Risk Flags",
        content:
          "Inner Ring Resurfacing (Starehe) has stalled for 45+ days — KURA issued a show-cause notice. If unresolved, Starehe's infra pillar could drop 5-8 points next quarter.\nKPLC data feed interrupted for 72 hours in late May — energy layer scores should be treated as provisional until feed restores.",
      },
      {
        heading: "Recommendations",
        content:
          "1. Prioritize safety interventions in Kibra: solar lighting along access roads, community surveillance patrols.\n2. Escalate Inner Ring contractor situation — activate penalty clause if no mobilization within 2 weeks.\n3. Establish redundant data pipeline for KPLC feed to prevent future outages.\n4. Commission detailed density study for Thika Road corridor ahead of smart lighting completion.",
      },
    ],
  },
  {
    id: "r2",
    title: "Westlands Infrastructure Assessment",
    zoneId: "westlands",
    date: "2026-05-01",
    status: "published",
    author: "Devyan Jethwa",
    sizeBytes: 1_820_000,
    format: "PDF",
    type: "infrastructure",
    priority: "medium",
    tags: ["infrastructure", "road-progress", "smart-grid", "westlands"],
    pillarFocus: ["infra"],
    dateRange: { from: "2026-01-01", to: "2026-04-30" },
    executiveSummary:
      "Westlands maintains the highest Vitality score in Nairobi (76) supported by strong infrastructure delivery. The Waiyaki Way Expansion is 72% complete with Phase 2 paving ahead of schedule. Smart meter rollout has reached 1,200 units in Parklands. Key risk: lane-marking phase requires full weekend road closures that may impact the Urban Friction Index.",
    sections: [
      {
        heading: "Active Projects Summary",
        content:
          "Waiyaki Way Expansion (KeNHA): 72% complete, KES 1.2B budget. Groundbreaking, Phase 1 paving, and interchange completed on schedule. Lane markings and final inspection remain.\nSmart Meter Rollout (KPLC): 1,200 units deployed in Parklands sub-area. Coverage target is 3,500 units by end of 2026.",
      },
      {
        heading: "Infrastructure Pillar Deep Dive",
        content:
          "ESIA Transparency: Updated assessment for Westlands commercial zone published May 18 via NEMA portal. Full compliance with KDPA requirements.\nResource Sovereignty: Water rights stable; no contestation on current grid expansion permits.\nCircular Economy: Two construction firms operating in the zone now use 30% recycled aggregate — a first for Nairobi.",
      },
      {
        heading: "Density Impact",
        content:
          "Population density survey (KNBS, Q1 2026) shows a 2.1% increase in Westlands — primarily commercial daytime population. The Optimal Density Ratio remains healthy at 1.12, but weekend road closures for lane-marking could push the Urban Friction Index above threshold temporarily.",
      },
      {
        heading: "Outlook",
        content:
          "Westlands is on track to exceed a Vitality score of 78 by Q3 if current project timelines hold. The primary downside risk is construction-related traffic disruption during the Waiyaki Way lane-marking phase scheduled for June-July.",
      },
    ],
  },
  {
    id: "r3",
    title: "Kibra Urban Density Analysis",
    zoneId: "kibra",
    date: "2026-05-10",
    status: "review",
    author: "Joy Nthei",
    sizeBytes: 980_000,
    format: "PDF",
    type: "density",
    priority: "high",
    tags: ["density", "informal-settlement", "kibra", "urban-planning"],
    pillarFocus: ["density", "social"],
    dateRange: { from: "2025-10-01", to: "2026-04-30" },
    executiveSummary:
      "Kibra's Optimal Density Ratio stands at 0.68 — well below the healthy threshold of 1.0. Infrastructure capacity has not kept pace with population growth, creating compounding pressure on access roads, water points, and the electrical distribution network. The Kibra Access Roads project (28% complete) is the single largest intervention, but its current pace will not close the gap before density pressures trigger service failures.",
    sections: [
      {
        heading: "Population & Density Metrics",
        content:
          "Estimated population: 185,000 (KNBS Q1 2026 projection). Area: 2.35 km². Density: 78,723 persons/km² — highest in Nairobi County.\nThe Optimal Density Ratio (Infrastructure Capacity / Population Density) fell from 0.72 to 0.68 over the past two quarters, indicating infrastructure is losing ground relative to population.",
      },
      {
        heading: "Infrastructure Capacity Assessment",
        content:
          "Roads: Only 34% of internal roads are paved. The Kibra Access Roads project (KURA, KES 95M) is at 28% completion — community engagement done, drainage phase not yet started.\nWater: 62% of households rely on shared water points. Average wait time increased from 22 to 31 minutes in Q1.\nElectricity: Informal connections account for an estimated 40% of supply. KPLC has no scheduled upgrade for the area.",
      },
      {
        heading: "Social Wellbeing Intersection",
        content:
          "High density with low infrastructure drives down the Social Wellbeing pillar (48). Access to amenities, healthcare facilities, and green space are all below county averages. Mental Health & Livability sub-metric is the lowest in Nairobi at 38.",
      },
      {
        heading: "Recommendations",
        content:
          "1. Accelerate Kibra Access Roads drainage phase — current 28% pace risks missing the 2026 completion target.\n2. Pilot a decentralized water kiosk network to reduce wait times below 15 minutes.\n3. Coordinate with KPLC on a dedicated distribution line for Kibra — the current informal connection rate is a safety hazard.\n4. Designate at least two community green spaces as part of the access roads project scope.",
      },
    ],
  },
  {
    id: "r4",
    title: "Embakasi Substation Impact Study",
    zoneId: "embakasi-east",
    date: "2026-05-18",
    status: "review",
    author: "Khillon",
    sizeBytes: 1_540_000,
    format: "PDF",
    type: "infrastructure",
    priority: "critical",
    tags: ["energy", "substation", "KETRACO", "embakasi-east", "grid"],
    pillarFocus: ["infra", "safety"],
    dateRange: { from: "2024-09-01", to: "2026-05-15" },
    executiveSummary:
      "The Embakasi Substation Upgrade (KETRACO, KES 520M) is 88% complete — transformer testing finished successfully on May 21. Grid connection is the final milestone. This project has been the primary driver of Embakasi East's rise to joint-highest Vitality score (76). The study assesses downstream impacts on surrounding zones and identifies risks associated with the final connection phase.",
    sections: [
      {
        heading: "Project Timeline & Status",
        content:
          "Design approval (Sep 2024): Complete\nTransformer delivery (Jan 2025): Complete\nInstallation (Jun 2025): Complete\nTesting (Oct 2025): Complete — all load tests passed within tolerance\nGrid connection (Jan 2026 target): Pending — delayed to estimated July 2026 due to KPLC coordination issues",
      },
      {
        heading: "Vitality Impact Analysis",
        content:
          "Embakasi East's Infrastructure & Environmental Safeguards pillar rose from 64 to 82 since project inception — the largest single-project pillar gain recorded in the Atlas.\nSafety & Security pillar also improved (+8 points) as the substation's physical security perimeter displaced informal dumping and reduced crime in the immediate area.\nThe zone overtook Westlands as joint-highest scorer (76) in May 2026.",
      },
      {
        heading: "Downstream Effects",
        content:
          "Embakasi North: Expected 3-5 point infra pillar gain once grid connection enables load redistribution.\nEmbakasi Central: May see reduced outage frequency — currently averaging 4.2 unplanned outages/month.\nEmbakasi West: Minimal direct benefit; the 66kV feeder does not extend to the western boundary.",
      },
      {
        heading: "Risk Assessment",
        content:
          "Grid connection delay: KPLC coordination has pushed the final milestone back ~6 months. If the 72-hour data feed interruption (Alert a4) is symptomatic of deeper KPLC integration issues, further delays are possible.\nSovereign Immunity: KETRACO operates under government indemnity — any contract breach claims during connection would face sovereign immunity barriers.\nEnvironmental: ESIA conditions met; NEMA clearance on file. No outstanding compliance issues.",
      },
    ],
  },
  {
    id: "r5",
    title: "Mathare Baseline Survey",
    zoneId: "mathare",
    date: "2026-05-20",
    status: "draft",
    author: "Austine Igunza",
    sizeBytes: 640_000,
    format: "PDF",
    type: "vitality",
    priority: "medium",
    tags: ["baseline", "mathare", "informal-settlement", "survey"],
    pillarFocus: ["social", "safety"],
    dateRange: { from: "2026-03-01", to: "2026-05-15" },
    executiveSummary:
      "Mathare records the lowest Vitality score in Nairobi County (52). This baseline survey establishes ground-truth metrics across all four pillars to serve as a benchmark for future interventions. The Mathare Distribution Line (KPLC, planned) is the only major project in the pipeline. Without additional investment, scores are projected to decline further as population pressure intensifies.",
    sections: [
      {
        heading: "Zone Profile",
        content:
          "Population: ~210,000 (KNBS estimate). Area: 0.95 km². Density: 221,053 persons/km² — second highest in Nairobi after Kibra on a per-area basis, highest in absolute terms.\nThe zone spans the Mathare River valley with significant flood-risk areas. Infrastructure is predominantly informal.",
      },
      {
        heading: "Pillar Scores & Analysis",
        content:
          "Social Wellbeing (46): Lowest in the county. Healthcare access limited to two community clinics. Workforce mobility constrained by poor road network.\nSafety & Security (48): Two homicide incidents in Q1. Street lighting covers only 12% of pathways. Digital sovereignty score N/A — internet penetration below measurement threshold.\nDensity & Scaling (56): Optimal Density Ratio at 0.52 — critical. Every infrastructure metric is saturated.\nInfra & Environmental (54): No active ESIA on file. The Distribution Line ESIA was published May 15 but covers only the transmission corridor, not the broader zone.",
      },
      {
        heading: "Data Gaps",
        content:
          "Workforce Mobility Score: No reliable commute-time data — most residents walk. Proxy metric used (distance to nearest matatu stage).\nDigital Sovereignty: Internet penetration below 15% — sub-metric excluded from score calculation.\nWaste & Lifecycle: No formal waste collection. EPR laws do not apply to informal waste streams.",
      },
      {
        heading: "Projected Trajectory",
        content:
          "Without intervention: score projected to drop to 48-49 by Q4 2026 as density pressure continues.\nWith Distribution Line completion (best case, Dec 2026): infra pillar could gain 8-12 points, lifting overall score to 58-60.\nFull recovery to county average (65) would require coordinated investment across all four pillars — estimated KES 800M+ over 3 years.",
      },
    ],
  },
  {
    id: "r6",
    title: "Nairobi Safety Corridor Mapping",
    zoneId: null,
    date: "2026-05-22",
    status: "draft",
    author: "Ken N'ganga",
    sizeBytes: 420_000,
    format: "PDF",
    type: "safety",
    priority: "high",
    tags: ["safety", "county-wide", "corridors", "crime-mapping", "rule-of-law"],
    pillarFocus: ["safety"],
    executiveSummary:
      "Preliminary mapping of safety corridors across Nairobi County, cross-referencing the Safety & Security pillar with physical infrastructure routes. Identifies six high-risk transit corridors where infrastructure projects intersect with elevated crime or instability zones. Intended to inform route-level risk scoring for the Atlas layer.",
    sections: [
      {
        heading: "Scope & Method",
        content:
          "Analysis covers the 17 mapped sub-county zones. Safety data sourced from National Police Service quarterly reports (Q4 2025, Q1 2026) and the Atlas Safety & Security pillar sub-metrics. Infrastructure routes from KURA and KeNHA GIS feeds.\nCorridors defined as 500m buffer zones along major roads with active or planned infrastructure projects.",
      },
      {
        heading: "High-Risk Corridors Identified",
        content:
          "1. Kibra Access Road corridor — 3 reported vandalism incidents in 6 months. Equipment theft risk rated HIGH.\n2. Mathare River Road — 2 homicides in Q1. No street lighting. Construction crews require security escort.\n3. Eastleigh (Kamukunji) Fibre Backbone route — petty crime rate 2.4x county average along trenching path.\n4. Inner Ring Road (Starehe) — contractor abandonment zone. Unsecured equipment on-site for 45+ days.\n5. Thika Road (Kasarani) — smart lighting installation exposed to nighttime theft of copper wiring.\n6. Dandora-Pipeline corridor (Embakasi North) — informal settlement encroachment on planned grid route.",
      },
      {
        heading: "Risk Scoring Framework",
        content:
          "Each corridor scored on three axes: crime frequency (NPS data), infrastructure exposure (value of unprotected assets), and lighting coverage (% of corridor with functional street lights).\nProposed integration: overlay corridor risk scores on the Atlas map as a toggleable 'Safety Corridor' sub-layer under the existing Safety & Security pillar.",
      },
      {
        heading: "Next Steps",
        content:
          "This draft requires field verification of corridors 1, 2, and 4 before publication. Coordination with NPS for updated Q2 2026 crime data is pending. Target publication: June 2026.",
      },
    ],
  },
  {
    id: "r7",
    title: "Langata Road Dualling Progress",
    zoneId: "langata",
    date: "2026-04-28",
    status: "published",
    author: "Devyan Jethwa",
    sizeBytes: 1_230_000,
    format: "PDF",
    type: "infrastructure",
    priority: "medium",
    tags: ["road-progress", "langata", "KeNHA", "dualling"],
    pillarFocus: ["infra", "density"],
    dateRange: { from: "2025-03-01", to: "2026-04-28" },
    executiveSummary:
      "The Langata Road Dualling project (KeNHA, KES 890M) is 61% complete with earthworks and base course finished. The asphalt phase is scheduled for May 2026. Langata's Vitality score (70) is directly supported by this project — the infra pillar gained 3 points this quarter. Key risk: the asphalt phase coincides with the long rains, which historically delays road projects in the area by 3-6 weeks.",
    sections: [
      {
        heading: "Milestone Status",
        content:
          "Groundbreaking (Mar 2025): Complete\nEarthworks (Jul 2025): Complete\nBase course (Dec 2025): Complete\nAsphalt (May 2026): Scheduled — materials procurement confirmed\nHandover (Sep 2026): On track, contingent on weather",
      },
      {
        heading: "Budget & Procurement",
        content:
          "Total budget: KES 890M. Expenditure to date: KES 548M (61.6%). Remaining committed: KES 342M.\nAsphalt procurement locked at KES 186M through KeNHA framework contract. No cost overrun anticipated unless weather delays exceed 6 weeks.",
      },
      {
        heading: "Traffic & Density Impact",
        content:
          "Current traffic diversion adds 12 minutes average to the Langata-CBD commute. The Urban Friction Index for Langata rose 0.3 points this quarter as a result.\nPost-completion projection: commute time reduction of 8-10 minutes. Density & Scaling pillar expected to gain 4-6 points once dualling is operational.",
      },
      {
        heading: "Environmental Compliance",
        content:
          "ESIA filed and approved (NEMA, Feb 2025). Quarterly monitoring reports submitted on schedule.\nDust suppression measures in place during base course phase. Noise complaints from adjacent residential areas addressed through restricted working hours (7am-6pm).\nNo outstanding compliance issues.",
      },
    ],
  },
  {
    id: "r8",
    title: "Nairobi Water & Sanitation Access Review",
    zoneId: null,
    date: "2026-05-24",
    status: "published",
    author: "Devyan Jethwa",
    sizeBytes: 2_180_000,
    format: "PDF",
    type: "environmental",
    priority: "critical",
    tags: ["sdg-6", "water", "sanitation", "county-wide", "clean-water", "informal-settlements"],
    pillarFocus: ["infra", "social"],
    dateRange: { from: "2026-01-01", to: "2026-05-15" },
    executiveSummary:
      "A county-wide read on Clean Water & Sanitation (SDG 6) across all 17 Nairobi zones. Safely-managed water access averages 71% county-wide but collapses to 38-46% in the informal settlements of Kibra and Mathare, where conventional sewered sanitation is neither affordable nor physically deliverable. The review argues for a decentralized sanitation strategy — DEWATS blocks, faecal-sludge treatment, and metered communal kiosks — as the context-specific path to closing the gap, and tracks the four active water projects now in delivery.",
    sections: [
      {
        heading: "Why Conventional Sewerage Falls Short",
        content:
          "Nairobi's trunk sewer network reaches roughly 48% of the county population and almost none of the high-density informal settlements. Extending gravity sewers into Kibra and Mathare would require gradients, land corridors, and household connection costs that the settlements' density and tenure simply do not allow.\nThe evidence points to a decentralized model: on-site and cluster-scale treatment (DEWATS), scheduled faecal-sludge emptying to dedicated treatment plants, and metered water kiosks — each sized to the settlement rather than the citywide grid.",
      },
      {
        heading: "Access Metrics by Zone Band",
        content:
          "Established zones (Westlands, Langata, Embakasi East): 78-91% safely-managed water; sewered or septic sanitation adequate.\nPeri-urban zones (Dagoretti South, Kasarani, Ruaraka): 60-72% water access; sanitation mixed, septic-dominant, water-main extensions the key lever.\nInformal settlements (Kibra 44%, Mathare 38%): shared water points serve 62% of Kibra households at a 31-minute average wait; only 11% of Mathare households have safely-managed sanitation. These two zones anchor the county's SDG-6 gap.",
      },
      {
        heading: "Active Interventions",
        content:
          "Kibra Communal Water Kiosks (NCWSC, KES 85M, 42%): 14 metered kiosks targeting sub-15-minute wait times — borehole yield now a live risk (see Alert a7).\nMathare DEWATS Sanitation Block (Athi Water, KES 68M, 35%): decentralized ablution + biodigester block sited above the flood line.\nDagoretti South Water Main Extension (NCWSC, KES 140M, 58%): 6.2 km DN300 main bringing reticulated supply to peri-urban households.\nEmbakasi Faecal Sludge Treatment Plant (Athi Water, KES 310M, planned): 400 m³/day plant giving exhauster operators a licensed disposal point in place of river discharge.",
      },
      {
        heading: "Sanitation Strategy Recommendations",
        content:
          "1. Formalize decentralized sanitation (DEWATS + faecal-sludge management) as the default for informal settlements rather than deferring to sewer extension.\n2. Ring-fence the Athi Water co-financing (KES 210M) to the Mathare and Embakasi sanitation projects.\n3. Pair every water-access project with a sanitation counterpart — kiosks without safe disposal shift the problem downstream.\n4. Stand up a county faecal-sludge management chain: scheduled emptying, licensed transport, and the Embakasi treatment endpoint.\n5. Add downstream Nairobi River water-quality monitoring as the outcome metric for the sanitation programme.",
      },
      {
        heading: "SDG-6 Outlook",
        content:
          "If the four active projects complete on their current envelopes, county safely-managed water access rises an estimated 6-8 points and the two informal-settlement zones gain their first metered supply and decentralized sanitation infrastructure. The binding constraints are borehole yield in Kibra, the long-rains schedule slip in Dagoretti South, and land acquisition for the Embakasi plant.",
      },
    ],
  },
  {
    id: "r9",
    title: "Kibra Decentralized Sanitation Feasibility",
    zoneId: "kibra",
    date: "2026-05-19",
    status: "review",
    author: "Joy Nthei",
    sizeBytes: 1_120_000,
    format: "PDF",
    type: "environmental",
    priority: "high",
    tags: ["sdg-6", "sanitation", "kibra", "dewats", "informal-settlement", "feasibility"],
    pillarFocus: ["infra", "social"],
    dateRange: { from: "2026-02-01", to: "2026-05-15" },
    executiveSummary:
      "A feasibility assessment for extending decentralized sanitation into Kibra alongside the communal water kiosk programme. With 78,723 persons/km² and no viable sewer corridor, Kibra requires cluster-scale DEWATS and container-based sanitation rather than conventional connections. The study models three delivery options and recommends a phased DEWATS-plus-kiosk pairing anchored to the existing NCWSC water project.",
    sections: [
      {
        heading: "The Sanitation Gap",
        content:
          "Only an estimated 18% of Kibra households have access to a safely-managed toilet. The remainder rely on shared pit latrines, 'flying toilets', or informal connections that discharge into open drains and ultimately the Ngong River.\nThe combination of extreme density, insecure land tenure, and a high water table rules out both household sewer connections and conventional septic tanks at scale.",
      },
      {
        heading: "Delivery Options Modelled",
        content:
          "Option A — Sewer extension: Rejected. Requires household connection costs and land corridors incompatible with the settlement layout; cost per capita 3-4x alternatives.\nOption B — Container-based sanitation (CBS): Low capital, fast to deploy, but depends on a reliable collection logistics chain and ongoing operating subsidy.\nOption C — Cluster DEWATS blocks: Moderate capital, treats waste on-site, pairs naturally with the water-kiosk footprint. Recommended as the primary model, with CBS as an interim and hard-to-reach-cluster supplement.",
      },
      {
        heading: "Water-Sanitation Pairing",
        content:
          "Each of the 14 planned water kiosks anchors a natural service cluster. Siting a DEWATS ablution block at 6-8 of these clusters would give roughly 55% of the settlement a safely-managed option within a 5-minute walk.\nMetered water revenue can cross-subsidize sanitation-block operating costs through a single community SACCO, improving the odds of post-handover sustainability.",
      },
      {
        heading: "Recommendations",
        content:
          "1. Adopt cluster DEWATS as Kibra's primary sanitation model; do not wait on sewer extension.\n2. Co-locate sanitation blocks with the NCWSC water kiosks and operate both under one SACCO.\n3. Pilot container-based sanitation in the two highest-density clusters where even DEWATS siting is constrained.\n4. Resolve the borehole-yield risk first — sanitation blocks need assured water to function.\n5. Sequence Phase 1 (4 blocks) against the kiosk construction milestone to share mobilization costs.",
      },
    ],
  },
  {
    id: "r10",
    title: "Embakasi East Grid Connection Q2 Update",
    zoneId: "embakasi-east",
    date: "2026-05-23",
    status: "published",
    author: "Khillon",
    sizeBytes: 890_000,
    format: "PDF",
    type: "infrastructure",
    priority: "medium",
    tags: ["energy", "grid", "embakasi-east", "KETRACO", "quarterly"],
    pillarFocus: ["infra"],
    dateRange: { from: "2026-04-01", to: "2026-05-23" },
    executiveSummary:
      "A short-cycle update on the final grid-connection milestone for the Embakasi Substation Upgrade. Testing is complete and the substation is energized on the KETRACO side; the outstanding dependency is KPLC's downstream feeder coordination, currently the pacing item and linked to the wider KPLC data-feed interruption flagged in Alert a4. Connection is now estimated for July 2026.",
    sections: [
      {
        heading: "Status Since Q1",
        content:
          "Transformer load testing closed out on May 21 with all results within tolerance. The substation is live on the transmission side. The only remaining milestone — grid connection — is gated by KPLC feeder works at Embakasi North, not by KETRACO scope.",
      },
      {
        heading: "KPLC Coordination Risk",
        content:
          "The 72-hour KPLC data-feed interruption (Alert a4) coincided with the feeder-coordination delay. While the two may be unrelated, both point to integration friction on the KPLC side. The connection estimate has moved from January to July 2026.",
      },
      {
        heading: "Downstream Readiness",
        content:
          "Once connected, load redistribution should reduce Embakasi Central's unplanned outage rate (currently ~4.2/month) and give Embakasi North's feeder-line project (p17) headroom to energize. Embakasi West sees minimal direct benefit.",
      },
      {
        heading: "Next Actions",
        content:
          "1. Obtain a firm feeder-works date from KPLC regional coordination.\n2. Treat energy-layer scores for the Embakasi cluster as provisional until the KPLC feed stabilizes.\n3. Re-baseline the connection milestone in the Atlas to July 2026.",
      },
    ],
  },
  {
    id: "r11",
    title: "Dagoretti North Fibre Ring Progress",
    zoneId: "dagoretti-north",
    date: "2026-05-14",
    status: "published",
    author: "Devyan Jethwa",
    sizeBytes: 780_000,
    format: "PDF",
    type: "infrastructure",
    priority: "medium",
    tags: ["fibre", "grid", "dagoretti-north", "ICTA", "digital-sovereignty"],
    pillarFocus: ["infra", "safety"],
    dateRange: { from: "2025-06-15", to: "2026-05-14" },
    executiveSummary:
      "Dagoretti North holds a healthy Vitality score of 72, anchored by strong infrastructure delivery and an emerging digital backbone. The Dagoretti North Fibre Ring (ICTA, KES 130M) is 47% complete, with duct and manhole works closed out and fibre blowing scheduled for early 2026. The ring is the county's first ward-scale digital-sovereignty asset outside the CBD and materially lifts the Safety pillar's Digital Sovereignty sub-metric.",
    sections: [
      {
        heading: "Project Milestone Status",
        content:
          "Route survey (Jun 2025): Complete\nDuct & manhole works (Oct 2025): Complete on schedule\nFibre blowing (Feb 2026): In progress\nNode activation (Jun 2026): On track",
      },
      {
        heading: "Digital Sovereignty Impact",
        content:
          "Once activated, the ring gives Dagoretti North six independent fibre nodes with dual-path redundancy. Projected uplift on the Digital Sovereignty sub-metric: +11 points. The ring also creates a physical alternative to the single CBD backhaul route, reducing systemic county-wide outage exposure.",
      },
      {
        heading: "Coordination Notes",
        content:
          "Wayleave clashes with NCWSC water reticulation on the Ngong Road boundary have been resolved. No outstanding regulatory issues. ESIA on file with NEMA (approved Feb 2025).",
      },
      {
        heading: "Outlook",
        content:
          "Node activation remains on schedule for June 2026. Post-activation, Dagoretti North's Infrastructure pillar is projected to climb to 70+ by end of Q3, keeping the zone in the upper quartile.",
      },
    ],
  },
  {
    id: "r12",
    title: "Dagoretti South Water Main & Flood-Risk Review",
    zoneId: "dagoretti-south",
    date: "2026-05-19",
    status: "review",
    author: "Joy Nthei",
    sizeBytes: 1_060_000,
    format: "PDF",
    type: "environmental",
    priority: "high",
    tags: ["sdg-6", "water", "dagoretti-south", "NCWSC", "flood-risk", "long-rains"],
    pillarFocus: ["infra", "social"],
    dateRange: { from: "2025-04-15", to: "2026-05-19" },
    executiveSummary:
      "The Dagoretti South Water Main Extension (NCWSC, KES 140M) is 58% complete but the DN300 pipe-laying phase is suspended after long-rains flooding submerged 1.8 km of open trench (Alert a10). The May 31 zonal-connection milestone will slip. This review reframes the schedule against a probabilistic weather envelope and proposes a re-sequenced construction plan.",
    sections: [
      {
        heading: "Current Status",
        content:
          "Route survey & wayleave (Apr 2025): Complete\nTrenching, 6.2 km (Aug 2025): Complete\nDN300 pipe laying (Dec 2025): Halted — 1.8 km of open trench inundated\nPressure testing (Mar 2026): Blocked\nZonal connection (May 2026): Now targeting Aug 2026",
      },
      {
        heading: "Weather-Envelope Risk",
        content:
          "Historical long-rains data (KMD 2015-2025) shows May-June trenchwork in this catchment carries a 42% probability of at least one 5-day inundation event. The original schedule did not budget for this. Re-sequencing to elevated dry sections first would preserve momentum without extending the total programme.",
      },
      {
        heading: "Recommended Re-Sequence",
        content:
          "1. Deploy dewatering pumps and shore the trench walls before resumption.\n2. Reprioritize pipe-laying to the 2.4 km of confirmed dry-elevation sections.\n3. Add temporary drainage to protect the remaining open trench through the long rains.\n4. Formally re-baseline the zonal-connection milestone to Aug 15, 2026.",
      },
      {
        heading: "Vitality Impact",
        content:
          "Delay costs the Infrastructure pillar an estimated 2 points in Q2. If the re-sequenced schedule holds, full recovery by Q3 with a projected +3 pillar gain at zonal-connection cutover.",
      },
    ],
  },
  {
    id: "r13",
    title: "Roysambu Solar Microgrid Case Study",
    zoneId: "roysambu",
    date: "2026-05-11",
    status: "published",
    author: "Khillon",
    sizeBytes: 1_180_000,
    format: "PDF",
    type: "infrastructure",
    priority: "medium",
    tags: ["energy", "solar", "microgrid", "roysambu", "KPLC", "resilience"],
    pillarFocus: ["infra"],
    dateRange: { from: "2025-05-15", to: "2026-05-10" },
    executiveSummary:
      "The Roysambu Solar Microgrid (KPLC, KES 240M) is 55% complete and on track for April 2026 go-live. The project is Nairobi's first ward-scale islanded microgrid — a proof-point for solar-plus-storage resilience in peri-urban zones. Roysambu's Infrastructure pillar rose 4 points this quarter on the strength of installation progress.",
    sections: [
      {
        heading: "Delivery Snapshot",
        content:
          "Site survey (May 2025): Complete\n180 kW panel array installation (Sep 2025): Complete\n420 kWh battery storage (Jan 2026): In procurement, delivery scheduled for August\nGo-live (Apr 2026): On track pending battery arrival",
      },
      {
        heading: "Resilience Value",
        content:
          "The microgrid is sized to island Roysambu's essential services (health post, community water pump, streetlights) for 8-10 hours during unplanned KPLC outages. Given Nairobi's average 3.1 outages/month, this materially reduces expected downtime for services the community depends on.",
      },
      {
        heading: "Cost & Financing",
        content:
          "Total budget: KES 240M. Expenditure to date: KES 132M (55%). Remaining committed: KES 108M, dominated by the battery bank at KES 84M. No cost overrun anticipated.",
      },
      {
        heading: "Replication Potential",
        content:
          "The microgrid design is intended as a replicable template. Kasarani and Embakasi West have been shortlisted as second-wave candidates. A brief methodology hand-off is planned once Roysambu is commissioned.",
      },
    ],
  },
  {
    id: "r14",
    title: "Kasarani Smart Lighting Corridor Study",
    zoneId: "kasarani",
    date: "2026-05-16",
    status: "review",
    author: "Ken N'ganga",
    sizeBytes: 890_000,
    format: "PDF",
    type: "safety",
    priority: "high",
    tags: ["safety", "smart-lighting", "kasarani", "thika-road", "KPLC", "corridor"],
    pillarFocus: ["safety", "infra"],
    dateRange: { from: "2025-04-01", to: "2026-05-15" },
    executiveSummary:
      "Thika Road Smart Lighting (KPLC, KES 340M) is 45% complete but the installation corridor is flagged as high-risk in the county safety corridor mapping (Report r6, corridor 5). Copper theft from installed but un-energized poles has driven a 12% wastage rate. This study proposes accelerated commissioning and physical-security measures to protect the remaining installation phases.",
    sections: [
      {
        heading: "Project Status",
        content:
          "Contract signed (Apr 2025): Complete\nPole installation (Aug 2025): Complete — 620 poles erected\nWiring phase (Dec 2025): In progress, 45% overall\nCommissioning (Feb 2026): Sequential energization as wiring completes",
      },
      {
        heading: "Safety Corridor Interaction",
        content:
          "The Thika Road corridor is corridor 5 in the county safety-corridor mapping. Between February and May 2026 there were 14 reported copper-wiring theft incidents along the un-energized poles, resulting in KES 8.4M of material replacement. Overnight security is now the pacing constraint on wiring speed.",
      },
      {
        heading: "Recommendations",
        content:
          "1. Sequence wiring + energization on the same night wherever possible — energized cabling is a lower-value theft target.\n2. Deploy anti-theft locking clamps at every pole base before wiring resumes.\n3. Coordinate with NPS for nightly patrols along the corridor during the wiring phase.\n4. Publish updated corridor-risk overlay in the Atlas Safety layer once field data confirms.",
      },
      {
        heading: "Outlook",
        content:
          "If security controls hold, project remains on track for Feb 2026 commissioning window. Kasarani's Safety pillar is expected to gain 3-4 points post-commissioning as the corridor lights come on.",
      },
    ],
  },
  {
    id: "r15",
    title: "Ruaraka Bypass Rehabilitation Impact Review",
    zoneId: "ruaraka",
    date: "2026-05-13",
    status: "published",
    author: "Devyan Jethwa",
    sizeBytes: 1_010_000,
    format: "PDF",
    type: "infrastructure",
    priority: "medium",
    tags: ["road-progress", "ruaraka", "KURA", "bypass", "density"],
    pillarFocus: ["infra", "density"],
    dateRange: { from: "2025-05-01", to: "2026-05-13" },
    executiveSummary:
      "The Ruaraka Bypass Rehabilitation (KURA, KES 420M) is 53% complete with drainage works closed out. The bypass is the main relief route for Thika Road congestion and its rehabilitation is one of the largest single density interventions Ruaraka has seen. The Density & Scaling pillar is projected to gain 5-7 points at handover.",
    sections: [
      {
        heading: "Milestone Status",
        content:
          "Mobilization (May 2025): Complete\nCulvert & drainage works (Sep 2025): Complete\nBase & binder course (Jan 2026): In progress\nAsphalt overlay (May 2026): Scheduled\nHandover (Jul 2026): On track",
      },
      {
        heading: "Density & Friction Impact",
        content:
          "The bypass currently carries 22,000 vehicles/day. Post-rehabilitation projection is 34,000/day at improved average speeds, offloading Thika Road by an estimated 18% during peak hours. Ruaraka's Urban Friction Index is expected to drop from 42 to 34 at handover.",
      },
      {
        heading: "Compliance",
        content:
          "ESIA on file with NEMA. Dust and noise controls in place; complaints from Baba Dogo residential clusters addressed via restricted working-hours agreement. No outstanding compliance issues.",
      },
      {
        heading: "Outlook",
        content:
          "Handover remains on track for July 2026. Ruaraka's Vitality score (currently 66) is projected to climb to 70+ once the bypass is operational and Thika Road congestion eases.",
      },
    ],
  },
  {
    id: "r16",
    title: "Embakasi South FSTP Feasibility Assessment",
    zoneId: "embakasi-south",
    date: "2026-05-21",
    status: "review",
    author: "Joy Nthei",
    sizeBytes: 1_340_000,
    format: "PDF",
    type: "environmental",
    priority: "high",
    tags: ["sdg-6", "sanitation", "embakasi-south", "athi-water", "FSTP", "informal-settlement"],
    pillarFocus: ["infra", "social"],
    dateRange: { from: "2026-02-01", to: "2026-05-21" },
    executiveSummary:
      "The Embakasi Faecal Sludge Treatment Plant (Athi Water, KES 310M) is at feasibility & ESIA stage (12% overall). ESIA public participation opened on May 21 (Alert a8) and closes June 20. The 400 m³/day plant would give the informal settlements of Embakasi South a licensed alternative to river discharge for exhauster-truck operators. This assessment reviews site fit, catchment volumes, and community input readiness.",
    sections: [
      {
        heading: "Why Embakasi South",
        content:
          "Embakasi South's Vitality score (58) is depressed by the Infrastructure pillar. Sewered coverage is under 22% of households, and unlicensed exhauster discharge to the Nairobi River is a persistent water-quality driver. The zone is the natural terminus for a decentralized sanitation chain serving the greater eastern informal cluster.",
      },
      {
        heading: "Catchment & Feedstock",
        content:
          "Modelled feedstock: ~370 m³/day of faecal sludge from Kibra, Mathare, Kamukunji, Embakasi North/South/Central at design capacity — comfortably within the 400 m³/day headline. Truck-turnaround modelling confirms the site is reachable within a 45-minute round-trip from all major settlements.",
      },
      {
        heading: "Public Participation Readiness",
        content:
          "ESIA now open on the NEMA portal until June 20. Community organizations in the 4-hectare buffer have been briefed. Two feedback sessions scheduled for the first two weekends of June. Expected concerns centre on odour management and truck traffic; both are addressed in the treatment-technology selection (covered anaerobic + settling ponds).",
      },
      {
        heading: "Recommendations",
        content:
          "1. Mobilize community input during the ESIA public participation window.\n2. Ring-fence the Athi Water co-financing tranche (KES 210M, Alert a11) to this project alongside Mathare DEWATS.\n3. Formalize a county exhauster-licensing framework so the treatment endpoint has assured feedstock.\n4. Add downstream Nairobi River water-quality monitoring as the outcome metric.",
      },
    ],
  },
  {
    id: "r17",
    title: "Embakasi North Feeder Line Q2 Update",
    zoneId: "embakasi-north",
    date: "2026-05-12",
    status: "published",
    author: "Khillon",
    sizeBytes: 720_000,
    format: "PDF",
    type: "infrastructure",
    priority: "medium",
    tags: ["energy", "grid", "embakasi-north", "KPLC", "feeder-line"],
    pillarFocus: ["infra"],
    dateRange: { from: "2025-03-15", to: "2026-05-12" },
    executiveSummary:
      "The Embakasi North Feeder Line (KPLC, KES 280M) is 64% complete with poles, conductor stringing, and transformer bays closed out. Energization is scheduled for April 2026 but is contingent on the Embakasi Substation grid-connection milestone (Report r10). Both projects are now paired in the county infrastructure programme.",
    sections: [
      {
        heading: "Milestone Status",
        content:
          "Design & wayleave (Mar 2025): Complete\nPole & conductor stringing (Jul 2025): Complete\nTransformer bays (Dec 2025): Complete\nEnergization (Apr 2026): Gated by Embakasi substation KPLC connection",
      },
      {
        heading: "Substation Dependency",
        content:
          "The feeder cannot energize until the Embakasi substation grid-connection completes on the KPLC side. That milestone has slipped to July 2026 (Report r10), pushing feeder energization to approximately August 2026.",
      },
      {
        heading: "Load Redistribution",
        content:
          "Once energized, the feeder is expected to reduce Embakasi Central's ~4.2 unplanned outages/month by roughly half via redundant load paths. It also creates headroom for the Roysambu Solar Microgrid to backfeed at low load hours.",
      },
      {
        heading: "Outlook",
        content:
          "Embakasi North's Infrastructure pillar is projected to gain 4-6 points at energization. Vitality score (currently 62) is expected to climb into the mid-60s by end of Q3 2026.",
      },
    ],
  },
  {
    id: "r18",
    title: "Embakasi Central Jogoo Road Crisis Note",
    zoneId: "embakasi-central",
    date: "2026-05-22",
    status: "draft",
    author: "Ken N'ganga",
    sizeBytes: 490_000,
    format: "PDF",
    type: "infrastructure",
    priority: "critical",
    tags: ["road-progress", "embakasi-central", "KURA", "jogoo-road", "stalled", "wayleave"],
    pillarFocus: ["infra", "density"],
    dateRange: { from: "2025-02-20", to: "2026-05-22" },
    executiveSummary:
      "The Jogoo Road Corridor Upgrade (KURA, KES 360M) has been stalled at 31% for over a month over a utility-relocation dispute with a fibre operator (Alert a12). Non-motorized transport lanes and carriageway widening are both on hold. Without resolution in the next 30 days, Embakasi Central's density pillar is exposed and the county infrastructure committee should convene.",
    sections: [
      {
        heading: "What Stalled",
        content:
          "In April 2026 the contractor exposed a buried fibre run that was not disclosed in the pre-construction wayleave dossier. The fibre operator refuses to move the run at its own cost. KURA maintains the wayleave dossier is authoritative. The site has been idle since April 18.",
      },
      {
        heading: "Exposure",
        content:
          "Site material and equipment sit unsecured on the corridor. Embakasi Central's Density pillar (currently 54) is projected to lose 3-5 points if the corridor remains disrupted through Q3. The stall also blocks the connection to Ruaraka Bypass rehabilitation as an eastern relief route.",
      },
      {
        heading: "Recommended Actions",
        content:
          "1. Convene KURA, the fibre operator, and NCWSC within 14 days to resolve the wayleave dispute.\n2. Escalate to the county infrastructure committee if not resolved by June 15.\n3. Secure the idle site to prevent equipment and material loss.\n4. Publish a revised programme once responsibility for the fibre relocation is agreed.",
      },
      {
        heading: "Outlook",
        content:
          "If resolution comes within the next 30 days, the March 2026 target slips 4-5 months to Q3 completion. Beyond that horizon, the project moves into a re-scoping conversation and Embakasi Central's Infrastructure pillar carries a sustained drag.",
      },
    ],
  },
  {
    id: "r19",
    title: "Embakasi West Solar Streetlights Delivery",
    zoneId: "embakasi-west",
    date: "2026-05-15",
    status: "published",
    author: "Austine Igunza",
    sizeBytes: 660_000,
    format: "PDF",
    type: "infrastructure",
    priority: "medium",
    tags: ["energy", "solar", "streetlights", "embakasi-west", "KPLC", "safety"],
    pillarFocus: ["infra", "safety"],
    dateRange: { from: "2025-07-01", to: "2026-05-15" },
    executiveSummary:
      "Embakasi West Solar Streetlights (KPLC, KES 190M) is 49% complete with foundations and poles installed. Solar heads and battery mounts follow in the next quarter. The project targets 480 solar streetlight units across the ward and is expected to lift Safety pillar sub-metrics on street lighting coverage.",
    sections: [
      {
        heading: "Milestone Status",
        content:
          "Site audit & spacing plan (Jul 2025): Complete\nFoundation & pole erection (Nov 2025): Complete — 480 poles\nSolar head & battery mount (Feb 2026): In progress\nNetwork commissioning (May 2026): On track",
      },
      {
        heading: "Safety Impact",
        content:
          "Embakasi West's Safety pillar (currently 62) is projected to gain 3-5 points at commissioning as street lighting coverage moves from 24% to roughly 71% of the ward road network. Nighttime patrol reach is expected to widen correspondingly.",
      },
      {
        heading: "Cost & Quality",
        content:
          "Total budget: KES 190M. Solar heads sourced from a KEBS-certified supplier. Battery warranty: 5 years with an on-site replacement stock of 24 units for early-life failure cover.",
      },
      {
        heading: "Outlook",
        content:
          "Commissioning remains on schedule for May 2026. Once online, Embakasi West is expected to be the first Nairobi ward with majority solar-lit street coverage.",
      },
    ],
  },
  {
    id: "r20",
    title: "Makadara Smart Grid Pilot Assessment",
    zoneId: "makadara",
    date: "2026-05-08",
    status: "published",
    author: "Devyan Jethwa",
    sizeBytes: 940_000,
    format: "PDF",
    type: "infrastructure",
    priority: "medium",
    tags: ["energy", "smart-grid", "makadara", "KETRACO", "pilot", "meters"],
    pillarFocus: ["infra"],
    dateRange: { from: "2025-02-01", to: "2026-05-08" },
    executiveSummary:
      "The Makadara Smart Grid Pilot (KETRACO, KES 310M) is 67% complete. Meter procurement and installation phases 1 and 2 are closed out; full deployment is scheduled for March 2026. The pilot is the county's largest AMI rollout to date and is intended as the template for county-wide smart-grid extension.",
    sections: [
      {
        heading: "Meter Rollout Progress",
        content:
          "Meter procurement (Feb 2025): Complete — 4,800 units\nInstallation phase 1 (Jun 2025): Complete — 2,100 units live\nInstallation phase 2 (Nov 2025): Complete — 4,650 units total\nFull deployment (Mar 2026): On track for a 4,800-unit closeout",
      },
      {
        heading: "Operational Learnings",
        content:
          "Non-technical loss detection has improved 34% in the phase-1 zones (vs. baseline). Two firmware update cycles delivered without service interruption. Meter reading intervals reduced from 30 days to 15 minutes at feeder head-ends.",
      },
      {
        heading: "Replication Notes",
        content:
          "This deployment is the reference for the Embakasi and Kasarani smart-grid extensions in the 2026-2028 pipeline. A methodology hand-off is planned for Q3 2026 once the Makadara deployment closes out.",
      },
      {
        heading: "Outlook",
        content:
          "Makadara's Infrastructure pillar (currently 68) is projected to gain 4-6 points at full deployment. County-wide smart-grid coverage crosses the 10% threshold once Makadara closes, up from 3% at the start of the pilot.",
      },
    ],
  },
  {
    id: "r21",
    title: "Kamukunji Fibre Backbone & Safety Corridor Read",
    zoneId: "kamukunji",
    date: "2026-05-17",
    status: "review",
    author: "Joy Nthei",
    sizeBytes: 830_000,
    format: "PDF",
    type: "safety",
    priority: "high",
    tags: ["safety", "fibre", "kamukunji", "eastleigh", "ICTA", "corridor"],
    pillarFocus: ["safety", "infra"],
    dateRange: { from: "2025-06-01", to: "2026-05-17" },
    executiveSummary:
      "Kamukunji has the county's second-lowest Vitality score (57), pulled down primarily by the Safety pillar (52). The Eastleigh Fibre Backbone (ICTA, KES 160M, 40% complete) runs through corridor 3 in the county safety-corridor mapping — petty crime rate along the trenching path is 2.4x the county average. This report reads the delivery risk against the corridor exposure and proposes joint safety-plus-infrastructure interventions.",
    sections: [
      {
        heading: "Project Status",
        content:
          "Route survey (Jun 2025): Complete\nTrenching (Oct 2025): Complete\nFibre laying (Feb 2026): In progress along the Eastleigh section\nActivation (May 2026): Contingent on completed physical security",
      },
      {
        heading: "Corridor Exposure",
        content:
          "The Eastleigh section overlaps with a documented petty-crime corridor. Fibre-blowing crews have reported four incidents of tool theft and one of harassment during nightwork. Delivery pace has dropped to roughly 60% of plan along the corridor.",
      },
      {
        heading: "Joint Safety-Infrastructure Recommendations",
        content:
          "1. Escort night crews with NPS presence during the fibre-blowing phase.\n2. Prioritize activating already-installed nodes in the lower-risk sections first — activation deters vandalism.\n3. Pair the ICTA rollout with a small solar-lighting scope along the trenching path (2 km).\n4. Coordinate with community leadership through the Kamukunji ward-level forum.",
      },
      {
        heading: "Outlook",
        content:
          "If crew-security controls hold, activation slips to July 2026 (from May). Kamukunji's Safety pillar is projected to gain 4 points once the corridor is lit and the fibre nodes are live.",
      },
    ],
  },
  {
    id: "r22",
    title: "Starehe Inner Ring Contractor Escalation",
    zoneId: "starehe",
    date: "2026-05-24",
    status: "draft",
    author: "Ken N'ganga",
    sizeBytes: 520_000,
    format: "PDF",
    type: "infrastructure",
    priority: "critical",
    tags: ["road-progress", "starehe", "KURA", "inner-ring", "stalled", "contractor"],
    pillarFocus: ["infra"],
    dateRange: { from: "2025-02-10", to: "2026-05-24" },
    executiveSummary:
      "The Inner Ring Resurfacing (KURA, KES 180M) has been stalled at 34% for 45+ days. KURA issued a show-cause notice on May 10 (Alert a1) and the contractor has not remobilized. This escalation note recommends activating the penalty clause and starting the replacement-contractor process to preserve the November 2025 handover window — already slipped to Q2 2026 in practice.",
    sections: [
      {
        heading: "What Happened",
        content:
          "The contractor completed milling in May 2025 and demobilized without notice. Site plant has sat idle since. Overlay works — the largest remaining scope — have not begun. KURA's show-cause notice expired on May 20 with no substantive response.",
      },
      {
        heading: "Contractual Position",
        content:
          "Section 12.3 of the contract permits penalty activation after 30 days of un-notified stoppage. That threshold was crossed on April 25. Section 14 permits termination-for-default after 60 days — that threshold is late June 2026. A replacement contractor shortlist should be pre-qualified before then.",
      },
      {
        heading: "Recommended Actions",
        content:
          "1. Activate Section 12.3 penalty clause immediately.\n2. Pre-qualify three replacement contractors within 21 days.\n3. Notify affected CBD-access commuters via county channels of extended disruption.\n4. Secure the idle site to prevent plant and material loss.\n5. Flag Starehe's Infrastructure pillar as at-risk in the Q2 report cycle.",
      },
      {
        heading: "Vitality Exposure",
        content:
          "Starehe's Infrastructure pillar is exposed to a 5-8 point drop in Q3 if the site remains idle through the long rains. Vitality score (currently 69) is projected to fall to the mid-60s without intervention. Under a replacement-contractor scenario, recovery is possible by Q4 2026.",
      },
    ],
  },
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

// Deterministic per-zone PRNG (mulberry32) so the generated history is
// stable across renders — a Zone card that opens twice shouldn't jitter.
function seededRandom(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashZoneId(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n));
}

const RANGE_CONFIG: Record<HistoryRange, { points: number; stepMs: number }> = {
  day: { points: 24, stepMs: 60 * 60 * 1000 },
  week: { points: 7, stepMs: 24 * 60 * 60 * 1000 },
  month: { points: 30, stepMs: 24 * 60 * 60 * 1000 },
};

export function generateZoneHistory(zoneId: string, range: HistoryRange): ZoneHistory {
  const zone = ZONES.find((z) => z.id === zoneId);
  if (!zone) return { range, points: [] };

  const { points: n, stepMs } = RANGE_CONFIG[range];
  const rand = seededRandom(hashZoneId(zoneId));
  const now = Date.now();

  let social = zone.pillars.social;
  let safety = zone.pillars.safety;
  let density = zone.pillars.density;
  let infra = zone.pillars.infra;

  const points: ZoneHistoryPoint[] = [];
  for (let i = n - 1; i >= 0; i--) {
    social = clamp(social + Math.round((rand() - 0.5) * 4));
    safety = clamp(safety + Math.round((rand() - 0.5) * 4));
    density = clamp(density + Math.round((rand() - 0.5) * 4));
    infra = clamp(infra + Math.round((rand() - 0.5) * 4));

    const score = Math.round((social + safety + density + infra) / 4);
    points.push({
      t: new Date(now - i * stepMs).toISOString(),
      score,
      pillars: { social, safety, density, infra },
    });
  }

  return { range, points };
}

export const ACTIVITIES: Record<string, ActivityEntry[]> = {
  westlands: [
    {
      id: "act1",
      zoneId: "westlands",
      kind: "road",
      text: "Waiyaki Way Phase 2 paving completed ahead of schedule",
      source: "KeNHA",
      createdAt: "2026-05-22T08:00:00Z",
    },
    {
      id: "act2",
      zoneId: "westlands",
      kind: "grid",
      text: "Smart meter rollout reached 1,200 units in Parklands",
      source: "KPLC",
      createdAt: "2026-05-20T14:30:00Z",
    },
    {
      id: "act3",
      zoneId: "westlands",
      kind: "esia",
      text: "Updated ESIA for Westlands commercial zone published",
      source: "NEMA",
      createdAt: "2026-05-18T10:00:00Z",
    },
    {
      id: "act4",
      zoneId: "westlands",
      kind: "density",
      text: "Population density survey updated for Q1 2026",
      source: "KNBS",
      createdAt: "2026-05-15T09:00:00Z",
    },
  ],
  starehe: [
    {
      id: "act5",
      zoneId: "starehe",
      kind: "road",
      text: "Inner Ring contractor issued show-cause notice",
      source: "KURA",
      createdAt: "2026-05-20T09:30:00Z",
    },
    {
      id: "act6",
      zoneId: "starehe",
      kind: "grid",
      text: "Fibre backbone extended to CBD junction",
      source: "ICTA",
      createdAt: "2026-05-16T11:00:00Z",
    },
  ],
  "embakasi-east": [
    {
      id: "act7",
      zoneId: "embakasi-east",
      kind: "grid",
      text: "Substation transformer testing completed successfully",
      source: "KETRACO",
      createdAt: "2026-05-21T15:00:00Z",
    },
    {
      id: "act8",
      zoneId: "embakasi-east",
      kind: "road",
      text: "Access road to substation graded",
      source: "KURA",
      createdAt: "2026-05-19T10:00:00Z",
    },
  ],
  kibra: [
    {
      id: "act9",
      zoneId: "kibra",
      kind: "water",
      text: "Communal water-kiosk borehole yield test returned 8.4 m³/hr — below projection",
      source: "NCWSC",
      createdAt: "2026-05-23T08:45:00Z",
    },
    {
      id: "act10",
      zoneId: "kibra",
      kind: "water",
      text: "Decentralized sanitation feasibility study entered review",
      source: "Athi Water Works",
      createdAt: "2026-05-19T13:00:00Z",
    },
    {
      id: "act11",
      zoneId: "kibra",
      kind: "road",
      text: "Kibra Access Roads community engagement phase signed off",
      source: "KURA",
      createdAt: "2026-05-14T09:30:00Z",
    },
  ],
  mathare: [
    {
      id: "act12",
      zoneId: "mathare",
      kind: "water",
      text: "DEWATS sanitation block siting confirmed above the flood line",
      source: "Athi Water Works",
      createdAt: "2026-05-20T11:15:00Z",
    },
    {
      id: "act13",
      zoneId: "mathare",
      kind: "water",
      text: "Baseline survey: 11% of households have safely-managed sanitation",
      source: "NCWSC",
      createdAt: "2026-05-18T10:00:00Z",
    },
    {
      id: "act14",
      zoneId: "mathare",
      kind: "esia",
      text: "Distribution Line ESIA published on the NEMA portal",
      source: "NEMA",
      createdAt: "2026-05-15T11:00:00Z",
    },
  ],
  "dagoretti-south": [
    {
      id: "act15",
      zoneId: "dagoretti-south",
      kind: "water",
      text: "Water-main trench flooding halted DN300 pipe laying at 58%",
      source: "NCWSC",
      createdAt: "2026-05-17T15:30:00Z",
    },
    {
      id: "act16",
      zoneId: "dagoretti-south",
      kind: "water",
      text: "Trenching completed across 6.2 km of the extension route",
      source: "NCWSC",
      createdAt: "2026-05-06T09:00:00Z",
    },
  ],
  "embakasi-south": [
    {
      id: "act17",
      zoneId: "embakasi-south",
      kind: "esia",
      text: "Faecal Sludge Treatment Plant ESIA opened for public participation",
      source: "NEMA",
      createdAt: "2026-05-21T12:00:00Z",
    },
    {
      id: "act18",
      zoneId: "embakasi-south",
      kind: "water",
      text: "Athi Water co-financing agreement unlocked KES 210M for sanitation",
      source: "Athi Water Works",
      createdAt: "2026-05-14T11:30:00Z",
    },
  ],
  ruaraka: [
    {
      id: "act19",
      zoneId: "ruaraka",
      kind: "road",
      text: "Bypass rehabilitation culvert and drainage works completed",
      source: "KURA",
      createdAt: "2026-05-13T14:00:00Z",
    },
    {
      id: "act29",
      zoneId: "ruaraka",
      kind: "road",
      text: "Bypass base and binder course works two weeks ahead of plan",
      source: "KURA",
      createdAt: "2026-05-06T08:30:00Z",
    },
    {
      id: "act30",
      zoneId: "ruaraka",
      kind: "road",
      text: "Baba Dogo residential noise-complaint agreement extended",
      source: "KURA",
      createdAt: "2026-04-25T11:00:00Z",
    },
  ],
  "dagoretti-north": [
    {
      id: "act20",
      zoneId: "dagoretti-north",
      kind: "grid",
      text: "Fibre-ring duct and manhole works completed on schedule",
      source: "ICTA",
      createdAt: "2026-05-11T10:30:00Z",
    },
    {
      id: "act21",
      zoneId: "dagoretti-north",
      kind: "grid",
      text: "Fibre-blowing phase commenced on the six-node backbone",
      source: "ICTA",
      createdAt: "2026-05-05T09:15:00Z",
    },
    {
      id: "act22",
      zoneId: "dagoretti-north",
      kind: "density",
      text: "Ngong Road boundary wayleave clash with NCWSC resolved",
      source: "KURA",
      createdAt: "2026-04-28T14:00:00Z",
    },
  ],
  roysambu: [
    {
      id: "act23",
      zoneId: "roysambu",
      kind: "grid",
      text: "180 kW solar panel array installation completed",
      source: "KPLC",
      createdAt: "2026-05-11T10:00:00Z",
    },
    {
      id: "act24",
      zoneId: "roysambu",
      kind: "grid",
      text: "Battery bank delivery slipped from January to August",
      source: "KPLC",
      createdAt: "2026-05-11T09:00:00Z",
    },
    {
      id: "act25",
      zoneId: "roysambu",
      kind: "esia",
      text: "Microgrid ESIA quarterly monitoring report filed with NEMA",
      source: "NEMA",
      createdAt: "2026-04-30T15:00:00Z",
    },
  ],
  kasarani: [
    {
      id: "act26",
      zoneId: "kasarani",
      kind: "grid",
      text: "620 poles erected across the Thika Road corridor",
      source: "KPLC",
      createdAt: "2026-05-16T11:30:00Z",
    },
    {
      id: "act27",
      zoneId: "kasarani",
      kind: "grid",
      text: "Copper-wiring theft cluster reached 14 incidents since February",
      source: "KPLC",
      createdAt: "2026-05-16T13:15:00Z",
    },
    {
      id: "act28",
      zoneId: "kasarani",
      kind: "grid",
      text: "Anti-theft locking clamps ordered for pole bases",
      source: "KPLC",
      createdAt: "2026-05-14T09:00:00Z",
    },
  ],
  langata: [
    {
      id: "act31",
      zoneId: "langata",
      kind: "road",
      text: "Langata Road base course phase closed out",
      source: "KeNHA",
      createdAt: "2026-05-02T10:00:00Z",
    },
    {
      id: "act32",
      zoneId: "langata",
      kind: "road",
      text: "Asphalt procurement locked at KES 186M via framework contract",
      source: "KeNHA",
      createdAt: "2026-04-22T14:30:00Z",
    },
    {
      id: "act33",
      zoneId: "langata",
      kind: "esia",
      text: "Quarterly ESIA monitoring report submitted to NEMA",
      source: "NEMA",
      createdAt: "2026-04-10T09:30:00Z",
    },
  ],
  makadara: [
    {
      id: "act34",
      zoneId: "makadara",
      kind: "grid",
      text: "AMI phase 2 installation closed out at 4,650 meters live",
      source: "KETRACO",
      createdAt: "2026-05-08T10:30:00Z",
    },
    {
      id: "act35",
      zoneId: "makadara",
      kind: "grid",
      text: "Non-technical loss detection improved 34% in phase-1 zones",
      source: "KETRACO",
      createdAt: "2026-05-02T11:00:00Z",
    },
    {
      id: "act36",
      zoneId: "makadara",
      kind: "grid",
      text: "Feeder head-end telemetry now reporting at 15-minute intervals",
      source: "KETRACO",
      createdAt: "2026-04-20T09:00:00Z",
    },
  ],
  kamukunji: [
    {
      id: "act37",
      zoneId: "kamukunji",
      kind: "grid",
      text: "Fibre-blowing phase started on the Eastleigh section",
      source: "ICTA",
      createdAt: "2026-05-15T09:00:00Z",
    },
    {
      id: "act38",
      zoneId: "kamukunji",
      kind: "grid",
      text: "Tool-theft incident reported on the Eastleigh trench nightwork",
      source: "ICTA",
      createdAt: "2026-05-15T22:40:00Z",
    },
    {
      id: "act39",
      zoneId: "kamukunji",
      kind: "grid",
      text: "NPS coordination request filed for corridor 3 night patrols",
      source: "ICTA",
      createdAt: "2026-05-16T10:15:00Z",
    },
  ],
  "embakasi-north": [
    {
      id: "act40",
      zoneId: "embakasi-north",
      kind: "grid",
      text: "Transformer bays completed on the feeder line",
      source: "KPLC",
      createdAt: "2026-05-10T12:00:00Z",
    },
    {
      id: "act41",
      zoneId: "embakasi-north",
      kind: "grid",
      text: "Energization gated by the Embakasi substation KPLC connection",
      source: "KPLC",
      createdAt: "2026-05-12T14:00:00Z",
    },
  ],
  "embakasi-central": [
    {
      id: "act42",
      zoneId: "embakasi-central",
      kind: "road",
      text: "Jogoo Road corridor idle at 31% for over a month",
      source: "KURA",
      createdAt: "2026-05-22T09:00:00Z",
    },
    {
      id: "act43",
      zoneId: "embakasi-central",
      kind: "road",
      text: "Fibre-operator wayleave dispute unresolved after 30 days",
      source: "KURA",
      createdAt: "2026-05-16T10:20:00Z",
    },
    {
      id: "act44",
      zoneId: "embakasi-central",
      kind: "road",
      text: "Idle-site security patrols escalated to daily",
      source: "KURA",
      createdAt: "2026-05-10T15:30:00Z",
    },
  ],
  "embakasi-west": [
    {
      id: "act45",
      zoneId: "embakasi-west",
      kind: "grid",
      text: "Solar heads and battery mounts delivered to site",
      source: "KPLC",
      createdAt: "2026-05-05T10:00:00Z",
    },
    {
      id: "act46",
      zoneId: "embakasi-west",
      kind: "grid",
      text: "480-pole foundation and erection phase closed out",
      source: "KPLC",
      createdAt: "2026-04-28T09:30:00Z",
    },
  ],
};

export const METHODOLOGY: PillarDef[] = [
  {
    key: "social",
    name: "Social Wellbeing & Human Capital",
    description:
      "Whether the local population is thriving. A low score predicts future labour issues or shortage of skilled operators.",
    subMetrics: [
      {
        key: "spi",
        label: "Social Progress Index",
        description: "Basic medical care, access to amenities, and inclusiveness",
      },
      {
        key: "workforce",
        label: "Workforce Mobility Score",
        description: "How easily labour and specialized roles can move in and out",
      },
      {
        key: "livability",
        label: "Mental Health & Livability",
        description: "Access to green space, air quality, projected burnout",
      },
    ],
  },
  {
    key: "safety",
    name: "Safety & Security",
    description: "Freedom from physical, legal, and digital threats that could disrupt projects.",
    subMetrics: [
      {
        key: "ruleOfLaw",
        label: "Rule of Law Stability",
        description: "Probability of contract expropriation, five-year judicial independence trend",
      },
      {
        key: "physSecurity",
        label: "Infrastructure Physical Security",
        description: "Conflict heatmap, proximity to unrest or high-crime corridors",
      },
      {
        key: "digitalSov",
        label: "Digital Sovereignty & Cybersecurity",
        description: "Internet Freedom Score, network outage frequency",
      },
    ],
  },
  {
    key: "density",
    name: "Density & Scaling Dynamics",
    description: "Whether the region's density supports growth or constrains it.",
    subMetrics: [
      {
        key: "optDensity",
        label: "Optimal Density Ratio",
        description:
          "Infrastructure Capacity / Population Density. Low ratio flags over-saturation",
      },
      {
        key: "urbanFriction",
        label: "Urban Friction Index",
        description: "Average transit times for heavy equipment, zoning complexity",
      },
    ],
  },
  {
    key: "infra",
    name: "Infrastructure & Environmental Safeguards",
    description: "Whether documentation and legal architecture exist to back up large projects.",
    subMetrics: [
      {
        key: "esia",
        label: "ESIA Transparency",
        description: "Are Environmental and Social Impact Assessments publicly available",
      },
      {
        key: "sovImmunity",
        label: "Sovereign Immunity Risk",
        description: "Government accountability for breaches of infrastructure contracts",
      },
      {
        key: "resourceSov",
        label: "Resource Sovereignty",
        description: "Legal protections on water and energy rights",
      },
      {
        key: "waste",
        label: "Waste & Lifecycle Mandates",
        description: "Extended Producer Responsibility laws, decommissioning liabilities",
      },
      {
        key: "circular",
        label: "Circular Economy Freedom",
        description: "Whether laws permit reuse of greywater and recycled construction materials",
      },
    ],
  },
];
