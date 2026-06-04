# STRATHMORE UNIVERSITY
## Student-Led Innovation Proposal

# NUVOLA ATLAS
## A Spatial Intelligence Network for African Industrial Development
### Concept Note for Innovation Grant Funding

**Project Title:** Nuvola Atlas: A Spatial Intelligence Network for African Industrial Development

**Project Type:** Student-led independent innovation (full IP ownership by the team)

**Project Team:**
- Joy Nthei: Operations Lead and Human Resources
- Ken N'ganga: Finance and Policy
- Khillon: Lead Programmer
- Austine Igunza: Programmer
- Devyan Jethwa: Chief Technology, Infrastructure and Product Strategy Officer (CTIPSO), Programmer

**Geographic Focus (Pilot):** Nairobi County, Kenya

**Project Duration:** 12 months

**Funding Requested:** KES 1,000,000

**Submission Date:** May 2026

---

## 1. Executive Summary

### The Hook
Kenya is building, but the world cannot see what is being built. Investors, urban planners, and county governments work from satellite snapshots and quarterly reports that are out of date the moment they are published. The result is capital that gets parked in the wrong projects, ambition that goes unfunded because it is undocumented, and a planning environment where decisions made in Nairobi rest on data that nobody has verified on the ground.

### Project Description
Nuvola Atlas is a spatial intelligence platform that turns Kenya's physical infrastructure into a live, queryable digital map. On top of that map sits the UE Vitality Index, a scoring system that converts the data into a single 0 to 100 readiness score for any locality based on four pillars: social wellbeing, safety, density dynamics, and environmental safeguards. The pilot covers Nairobi County, and the platform is designed from day one for replication across the other 46 counties.

The project is independently owned by a team of five Strathmore University students. The team is currently exploring formal registration of an entity to hold the intellectual property and to receive future commercial revenue.

### Target Audience and Beneficiaries
- **Primary users:** county government planning offices, urban planning NGOs, and infrastructure-focused research groups that need verifiable spatial data on Nairobi at sub-county resolution.
- **Secondary beneficiaries:** communities in mapped areas, who gain a public-facing record of infrastructure delivery in their wards that they can use to track promises and timelines.
- **Tertiary beneficiaries:** the wider East African development data ecosystem, which currently lacks a Kenyan-built platform that fuses real-time infrastructure tracking with social-readiness scoring.

### Expected Outcomes
- A working Atlas map of Nairobi covering at least three live data classes: road construction, energy infrastructure, and urban density.
- A functional Vitality Scorecard dashboard producing 0 to 100 scores across the four pillars for at least five Nairobi sub-county zones.
- A methodology paper on the Vitality Index, prepared for submission to a peer-reviewed venue in urban studies or ICT for development.
- At least two signed letters of intent or memoranda with prospective end users (a county office, an NGO, or a research partner).
- A documented technical stack and codebase that the team can carry forward into follow-on funding and pilot deployments.

### Funding Request
KES 1,000,000 over 12 months. The team has built the budget around what is genuinely needed to ship the Nairobi pilot. After month 12, the platform is positioned to attract follow-on grant capital and early pilot revenue rather than to be financially self-sustaining on its own from day one.

---

## 2. Statement of Need

### 2.1 Problem Definition
Three problems sit on top of each other in the way Kenya is currently mapped for investment and planning.

The first is **timeliness**. Most spatial data used by planners and investors is months or years old. A road that was approved in March is treated as if it does not exist until it appears on a satellite image six months later. A smart grid extension that quietly stalled for a year continues to show up in plans as if it were on track. The gap between what is documented and what is actually on the ground is wide enough to misroute capital.

The second is **fusion**. Infrastructure data and social data live in different silos. A planner can find road statistics in one place, energy data in another, crime data in a third, and ESIA reports in a fourth, but cannot pull them together to ask whether a given ward is actually ready to absorb a new project. Investors with ESG mandates run into the same wall.

The third is **access**. Most of the relevant data is technically public, but it is buried in PDFs, county reports, and access-controlled portals. Communities living in the areas being planned for cannot easily see what has been promised for their wards, and that opacity is part of why infrastructure delivery so often goes unaccounted for.

### 2.2 Evidence and Baseline Data
- Global market analysts estimate the infrastructure data gap at roughly USD 15 trillion by 2040: capital that markets want to deploy into emerging-market infrastructure but cannot, because the underlying spatial data is not verifiable.
- Approximately 85% of the world's cultural heritage remains undigitized, and historical and cultural sites in the developing world remain undigitized. The same documentation gap applies, in slightly different form, to active infrastructure.
- Kenya Vision 2030 and African Union Agenda 2063 both list spatial data infrastructure as a foundational gap for industrial planning. No Kenyan-built platform currently combines live infrastructure tracking with a social-readiness score.
- Daily commuting time, energy reliability, and access to amenities are tracked piecemeal by different agencies in Nairobi. A single locality-level readiness score does not exist.

### 2.3 Target Population and Context
The pilot focuses on Nairobi County. Nairobi has the densest overlap of active infrastructure projects, smart grid pilots, and urban-density pressure points in Kenya, which makes it the best place to test whether a spatial intelligence platform can actually deliver useful answers. Once the architecture is proven in Nairobi, the same approach extends to any of the 46 other counties with little more than new data ingestion. The pilot focuses on planning offices, NGOs working in urban infrastructure, and research groups that already produce or consume Nairobi-level data.

### 2.4 Why Existing Solutions Fall Short
- Mainstream GIS platforms (Mapbox, ESRI base layers) handle visualization well, but do not track live infrastructure progress and do not produce a social-readiness score.
- Country-level risk indices (S&P, Moody's, Freedom House) work at the wrong resolution. A national score tells an investor nothing useful about whether a specific Nairobi ward is ready for a specific project.
- Heritage and cultural documentation initiatives are usually run separately from infrastructure mapping. Treating culture and infrastructure as separate domains is part of why neither gets a complete picture.

Nuvola Atlas combines these into one platform, with the Vitality Index doing the analytical work of turning fused data into a single comparable score.

---

## 3. Project Goals and Objectives

### 3.1 Project Goal
To build a working spatial intelligence platform for Kenya that turns live infrastructure and social data into a single readiness score useful to investors, planners, and communities. The project contributes directly to United Nations Sustainable Development Goals 9 (Industry, Innovation and Infrastructure), 11 (Sustainable Cities and Communities), and 16 (Peace, Justice and Strong Institutions), and to African Union Agenda 2063 aspirations on prosperity and good governance.

### 3.2 SMART Objectives

**Objective 1: Atlas Mapping Layer**
Within six months, build a working Atlas layer covering Nairobi County across at least three live data classes (road construction status, energy infrastructure, urban density), hosted on a PostgreSQL and PostGIS backend with a Mapbox-based interactive frontend.

**Objective 2: Vitality Scorecard**
Within nine months, deliver a functional UE Vitality Scorecard producing a 0 to 100 score for at least five Nairobi sub-county zones, computed across the four pillars: Social Wellbeing and Human Capital, Safety and Security, Density and Scaling Dynamics, and Infrastructure and Environmental Safeguards.

**Objective 3: Validation and Early Partnerships**
Within eleven months, secure at least two signed letters of intent or memoranda from prospective users (county planning office, NGO, research partner) committing to a pilot evaluation of the platform.

**Objective 4: Research Output**
Within twelve months, submit a methodology paper on the Vitality Index for peer review at a venue in urban studies, development economics, or ICT for development.

**Objective 5: Team Capacity and Continuity**
Throughout the project, maintain documented role definitions and a written technical knowledge base so the platform can be handed over, extended or transferred to a registered entity without losing institutional memory.

---

## 4. Methodology and Project Design

### 4.1 Conceptual Framework
The platform draws its analytical framing from Amartya Sen's Development as Freedom, which treats development as the expansion of substantive freedoms (economic opportunity, political participation, social wellbeing, environmental security) rather than GDP growth alone. The Vitality Index is the computational version of that idea: a way to express a locality's readiness in terms that capture more than economic indicators.

The platform is built in two layers within the grant year, with a third layer planned for later phases.
- **Layer 1, Atlas (in scope):** live mapping of road, energy, and density data for Nairobi.
- **Layer 2, Vitality Index (in scope):** a four-pillar dashboard that scores localities from 0 to 100.
- **Layer 3, Nuvola (future phase):** 3D cultural heritage digitization. This is mentioned for context, but is not in scope or budget for this grant.

### 4.2 Technical Stack
The team chose a deliberately mainstream stack so the codebase remains maintainable, transferable, and free of obscure dependencies that would be hard to hand over later.

- **Backend:** Laravel 11 (PHP 8.3+) for server logic, authentication, dashboard administration, and the API gateway.
- **Database:** PostgreSQL with the PostGIS extension. PostGIS handles geospatial queries, distance calculations, construction-progress tracking, and density analysis.
- **Real-time updates:** Laravel Reverb pushes live updates to the dashboard when new data arrives.
- **Mapping frontend:** Mapbox GL JS for interactive 2D mapping. CesiumJS is reserved for the future 3D layer and is not in scope for this grant.
- **Data ingestion:** Python with FastAPI runs as a microservice that cleans and processes incoming data feeds before passing them to Laravel.
- **Analytics and verification:** TensorFlow and PyTorch are used selectively for anomaly detection and, in later phases, community-validation pipelines.

### 4.3 The UE Vitality Index
The Vitality Index is the part of the platform that actually answers an investor's or planner's question. It takes the Atlas data and external feeds and produces a single 0 to 100 score per locality, built from four pillars. Each pillar combines several sub-metrics.

**Pillar 1: Social Wellbeing and Human Capital**
Whether the local population is thriving. A low score predicts future labour strikes, civil unrest, or a shortage of skilled people to operate infrastructure after it is built.
- Social Progress Index feed: basic medical care, access to amenities, and inclusiveness.
- Workforce Mobility Score: how easily labour and specialized roles can move in and out of the region.
- Mental Health and Livability: access to green space, air quality, and projected burnout in long-term projects.

**Pillar 2: Safety and Security**
Freedom from physical, legal, and digital threats.
- Rule of Law Stability: probability of contract expropriation, measured by a five-year trend in judicial independence.
- Infrastructure Physical Security: conflict heatmap integration, proximity to unrest or high-crime transit corridors.
- Digital Sovereignty and Cybersecurity: Internet Freedom Score, frequency of network outages, evidence of state-mandated backdoors.

**Pillar 3: Density and Scaling Dynamics**
Whether the region's density supports growth or strangles it.
- Optimal Density Ratio: Infrastructure Capacity divided by Population Density. A low ratio flags over-saturation, high land costs and regulatory gridlock.
- Urban Friction Index: average transit times for heavy equipment, complexity of local zoning processes.

**Pillar 4: Infrastructure and Environmental Safeguards**
Whether the documentation and legal architecture exist to back up large projects.
- ESIA Transparency: Are Environmental and Social Impact Assessments publicly available and accessible to local stakeholders.
- Sovereign Immunity Risk: Can the government be held accountable for breaches of environmental or infrastructure contracts.
- Resource Sovereignty: Clear legal protections on water and energy rights, or risk of nationalization during a crisis.
- Waste and Lifecycle Mandates: Existence of Extended Producer Responsibility laws, decommissioning liabilities.
- Circular Economy Freedom: Whether laws permit the reuse of greywater and recycled construction materials.

### 4.4 Key Activities and Implementation Plan

| Quarter | Phase | Activities and Deliverables |
|---------|-------|-----------------------------|
| Q1 (M1-M3) | Foundation | Build a high-resolution PostGIS base map of Nairobi County. Source and clean datasets: road construction (KURA, KeNHA), energy (KPLC, KETRACO), density (KNBS). Stand up a Laravel backend, PostgreSQL with PostGIS, and FastAPI ingestion microservice. Set up Vitality Index database schema and Pillar 1 ingestion (Social Wellbeing). Begin outreach to prospective pilot partners. |
| Q2 (M4-M6) | Atlas Activation | Develop Atlas overlay logic for toggleable layers (Road Progress, Smart Grid Status, Density). Build an energy infrastructure tracking module. Connect Mapbox GL JS frontend to live Reverb feeds. Atlas Layer MVP demo (Objective 1 complete). |
| Q3 (M7-M9) | Vitality Scorecard | Implement Pillars 2 through 4 ingestion and scoring. Build the Vitality Scorecard dashboard interface. Pilot Vitality Score computation across 5 Nairobi sub-county zones (Objective 2 complete). First internal draft of the methodology paper. |
| Q4 (M10-M12) | Validation and Handover | Pilot deployment with at least 2 partner organizations (Objective 3 complete). Performance optimization and security hardening. Submit methodology paper for peer review (Objective 4 complete). Soft launch of the partner data portal. Finalize entity registration and IP arrangements. Apply for at least 2 follow-on funding opportunities. |

### 4.5 Personnel and Governance
The project is run by a five-person student team with clearly separated responsibilities. Roles were assigned based on expertise and commitment, and each role is tied to specific deliverables.

- **Joy Nthei, Operations Lead and HR:** project coordination, scheduling, partner outreach logistics, internal documentation, and team welfare. Joy is the operational owner of milestone tracking.
- **Ken N'ganga, Finance and Policy:** budget management, grant reporting, regulatory compliance research (including Kenya Data Protection Act alignment), and the policy framing of the methodology paper.
- **Khillon, Lead Programmer:** technical lead. Owns the Laravel backend, the PostgreSQL and PostGIS schema, and overall code quality. Lead reviewer on pull requests.
- **Austine Igunza, Programmer:** Mapbox GL JS frontend, dashboard interface, and the user-facing components of the Vitality Scorecard.
- **Devyan Jethwa, CTIPSO and Programmer:** technical architecture, infrastructure strategy, product roadmap, and security. Owns the integration between the Atlas data layer and the Vitality Scorecard analytics.

Governance is by team consensus on technical and product decisions, with finance and reporting decisions sitting with Ken, and operational coordination sitting with Joy. The team will draft a brief written governance memo at project start covering decision-making, IP, and dispute resolution.

The team is currently in active discussion regarding the registration of a formal entity to hold the platform's intellectual property and to receive future commercial revenue. The structure being explored is described further in Section 6. Specific entity details will be finalized during the grant year.

### 4.6 Compliance and Data Handling
- **Kenya Data Protection Act (2019):** all locality-level data handling follows KDPA-aligned principles, with anonymization of any community-sourced telemetry before it leaves the device.
- **GDPR awareness:** the platform is built with global users in mind, so any voluntary upload (relevant to the future Nuvola layer) will use explicit, recorded consent.
- **Encryption:** AES-256 encryption is applied to data at rest and in transit. Access keys are managed in a shared credential vault under the CTIPSO's oversight.
- **Open data preference:** the Atlas layer prioritizes publicly licensed Kenyan government datasets to avoid licensing disputes and to keep the platform replicable across counties.

---

## 5. Monitoring, Evaluation, and Learning

### 5.1 Key Performance Indicators

| Indicator Type | Output (what we produce) | Outcome (change that results) |
|----------------|--------------------------|-------------------------------|
| Technical | Atlas MVP deployed; Vitality Scorecard live; uptime above 95% | At least 5 sub-county Vitality Scores published and accessible to partners |
| Partnership | At least 2 signed letters of intent or MOUs with prospective users | At least 1 partner committed to a follow-on paid pilot after the grant year |
| Research | 1 peer-reviewed methodology paper submitted | Vitality Index methodology referenced and replicable by other research groups |
| Team | 5 documented roles with quarterly self-reviews | Team continuity maintained; knowledge base captured for any future handover |
| Sustainability | Partner portal soft-launched; 2+ follow-on grant applications submitted | At least 1 follow-on funding source secured or in active negotiation by month 12 |

### 5.2 Data Collection Methods
- Automated system telemetry: uptime, API call volume, dashboard usage, and ingestion job success rates.
- Quarterly partner feedback: short structured surveys with prospective pilot partners on data quality and usefulness.
- Internal team retrospectives: end-of-quarter reviews covering velocity, blockers, and adjustments.
- External peer review: methodology paper sent to at least one independent reviewer before journal submission.
- Data audits: Vitality Score outputs cross-checked against published Kenyan baseline data each quarter.

### 5.3 Risk Management and Mitigation

| Identified Risk | Risk Level | Mitigation Strategy |
|-----------------|------------|---------------------|
| Government data sources are incomplete or out of date | Medium | Triangulate across multiple sources; disclose data gaps transparently in the Atlas; build relationships with KNBS and county GIS units early. |
| Pilot partners slow to commit | Medium | Start outreach in Q1; maintain a pipeline of at least 5 prospects; offer pilots at no cost during the grant year to lower the friction. |
| Team member departure or competing commitments | Medium | Document architecture thoroughly; cross-train across roles; write a governance memo that includes a handover protocol. |
| Methodology challenged on academic grounds | Low | Ground the work in established literature (Sen 1999, the Social Progress Index, Internet Freedom Score); publish the method openly so it can be tested. |
| Data privacy or KDPA compliance failure | Low | Anonymization by default; AES-256 encryption; legal review of the data-handling protocol before any partner deployment. |
| Follow-on funding does not materialize by month 12 | Medium | Submit applications to at least 4 funders during the grant year; pursue small paid pilots in parallel; the codebase and partner relationships remain assets regardless of funding outcome. |
| Cloud or infrastructure costs overrun | Low | Budget locked at provider tier; monthly cost reviews; the heavy 3D processing work is deliberately deferred to a future phase. |

---

## 6. Project Sustainability and Scalability

### 6.1 What Happens After the Grant Year
A KES 1,000,000 grant is enough to ship a working Nairobi pilot. It is not enough to build a self-sustaining business by month 12, and any proposal that claimed otherwise would be misleading. The team's plan is a hybrid path. Follow-on funding bridges the gap between the end of the grant year and the point where the platform can support itself on partner revenue.

**Phase A: Months 0-12 (Grant Year)**
Build the Nairobi pilot. Sign 2 or more pilot partners. Submit the methodology paper. Apply for at least 2 follow-on funding opportunities. No revenue is expected during this phase.

**Phase B: Months 12-24 (Bridge)**
Use the working MVP and the pilot partnerships as the basis for follow-on grant applications. Target funders include AfriLabs, the Mozilla Technology Fund, GIZ Make-IT Africa, Hewlett Foundation's governance programmes, the Konza Technopolis innovation grants, and Kenyan government innovation pots like the Ajira Digital and NRF research grants. The team will also explore corporate innovation pilots with KPLC, KURA, and county governments. The goal in this phase is to convert at least one pilot partnership into a small paid contract.

**Phase C: Months 24+ (Revenue Activation)**
Once the platform has a proven track record and a registered entity behind it, the four revenue streams from the original concept become realistic.
- **B2B data licensing:** recurring subscriptions for urban planners, NGOs, and county governments accessing the Atlas and the Vitality Scorecard.
- **Spatial due diligence reports:** premium reports for investors evaluating specific Kenyan infrastructure projects.
- **API access fees:** tiered access for developers and global institutions wanting to integrate Atlas and Vitality data into their own applications.
- **Transaction fees:** a 1 to 3 percent platform fee on capital channeled through a future heritage and infrastructure crowdfunding portal, once the Nuvola layer is added.

### 6.2 Institutional and Community Ownership
The team is in active discussion about the formal structure that will hold the platform after the grant year. The leading option is a registered company with intellectual property assigned to the entity rather than to any individual founder. Specific entity details will be finalized in the first quarter of the grant year and reflected in the project governance memo.

On the community side, the platform is built to be useful to the wards it maps, not just to the investors looking at them. Atlas data on infrastructure delivery in each ward will be publicly accessible, which gives local stakeholders a verifiable record they can use to track delivery against promises.

### 6.3 Scalability
- **Geographic:** the architecture is county-agnostic. Once the Nairobi pilot is proven, replicating it to another Kenyan county requires data ingestion and partner outreach, not architectural rework.
- **Regional:** the data schema is designed to extend to the wider East African Community corridor (Tanzania, Uganda, Rwanda, Ethiopia).
- **Vertical:** the deferred Nuvola layer (3D cultural heritage) extends the platform into a separate market segment without re-engineering the core stack.
- **Methodological:** the Vitality Index, once published and replicable, can be applied by other research groups and platforms regardless of who builds the underlying map.

---

## 7. Budget Narrative and Justification

### 7.1 Budget Summary
Total requested: KES 1,000,000 over 12 months.

| Line Item | Amount (KES) | % of Budget | Category |
|-----------|-------------|-------------|----------|
| Team stipends: 5 members x 12 months x KES 5,000/month | 300,000 | 30.0% | Personnel |
| Cloud infrastructure: hosting, PostgreSQL/PostGIS, Laravel backend, Mapbox API tier (12 months) | 210,000 | 21.0% | Equipment and Software |
| Data sourcing and licensing: specialty GIS datasets, paid tiers for selected feeds | 110,000 | 11.0% | Equipment and Software |
| Fieldwork and ground-truthing: site visits, county office meetings, transport within Nairobi | 90,000 | 9.0% | Travel and Fieldwork |
| Stakeholder workshops and partner meetings: 2 events for pilot partners | 60,000 | 6.0% | Travel and Fieldwork |
| Publication and dissemination: journal submission fees, conference registration | 60,000 | 6.0% | Dissemination |
| Legal and compliance: entity registration costs, KDPA legal review, basic IP filings | 70,000 | 7.0% | Admin |
| Development tools and services: version control, CI/CD, monitoring, design tools | 40,000 | 4.0% | Equipment and Software |
| Security and encryption tooling: certificates, secrets management, basic audit | 30,000 | 3.0% | Equipment and Software |
| Contingency reserve: unexpected costs, currency or pricing changes | 30,000 | 3.0% | Admin |
| **TOTAL** | **1,000,000** | **100%** | |

### 7.2 Budget Justification
- **Stipends (30%):** Each team member receives KES 5,000 a month. This is below standard Nairobi internship rates and is intentionally modest. The team treats the stipend as a signal of commitment and as cover for transport, data, and basic incidentals rather than as compensation. The platform itself is the long-term return.
- **Cloud infrastructure (21%):** The Laravel and PostgreSQL/PostGIS stack needs reliable hosting for 12 months. Mapbox GL JS in particular charges by API call volume; the allocation covers a development and pilot tier with headroom for partner-facing demos.
- **Data sourcing (11%):** Most of the Atlas can be built from publicly licensed Kenyan government data, but certain specialty datasets and selected real-time feeds require paid access.
- **Fieldwork and workshops (15% combined):** Ground-truthing is non-negotiable; a spatial intelligence platform that has not verified its own data on the ground fails its core promise. Workshops cover two formal partner meetings during the grant year.
- **Publication (6%):** Submission fees for the methodology paper and conference registration for at least one venue.
- **Legal and compliance (7%):** Entity registration, KDPA legal review, and basic IP filings. Skipping this would make the platform unsafe to deploy with partners and would leave the team's ownership of the work informal.
- **Tools, security, and contingency (10% combined):** Development services, security tooling, and a small reserve for unexpected costs. Contingency is held deliberately tight at 3% because the team has clear control of the largest cost drivers.

---

## 8. Appendices and Supporting Documents

### Appendix A: Letters of Support and Commitment
- Letters of intent from prospective pilot partners (county planning office, NGO, or research partner) were solicited during the first quarter of the grant year.
- Endorsement letters from advisors who have reviewed the technical concept (to be attached at the full proposal stage).

### Appendix B: Team Profiles
- Brief professional profile of Joy Nthei (Operations and HR).
- Brief professional profile of Ken N'ganga (Finance and Policy).
- Brief professional profile of Khillon (Lead Programmer).
- Brief professional profile of Austine Igunza (Programmer).
- Brief professional profile of Devyan Jethwa (CTIPSO and Programmer).

### Appendix C: Technical Documentation
- System architecture diagram of the Atlas and Vitality Scorecard.
- Database schema overview for the PostgreSQL and PostGIS layer.
- Vitality Index pillar weightings and computational outline (annex to the methodology paper).

### Appendix D: Methodology Paper Outline
- Working title, target journal or conference, intended authorship, and current status of the in-development paper on the Vitality Index.

### Appendix E: Governance and IP Memo
- Draft team governance document covering decision-making, IP assignment to the registered entity, and dispute resolution. To be finalized in Quarter 1.

---

## References

- African Union Commission. (2015). *Agenda 2063: The Africa we want.* African Union Commission.
- European Parliament and Council of the European Union. (2016). Regulation (EU) 2016/679 (General Data Protection Regulation). *Official Journal of the European Union*, L119, 1-88.
- Freedom House. (n.d.). *Freedom on the net.* Retrieved May 19, 2026.
- Future Market Insights. (2026). *Cultural tourism market: Global industry analysis, 2026-2036.*
- Grand View Research. (2025). *Heritage tourism market size, share & trends analysis report, 2025-2030.*
- International Finance Corporation. (2012). *IFC performance standards on environmental and social sustainability.* World Bank Group.
- Lee, J. (2020). A digital future for cultural heritage. *Arts Management and Technology Lab*, Carnegie Mellon University.
- Lindhqvist, T. (1992). Extended producer responsibility as a strategy to promote cleaner products. Lund University.
- McKinsey Global Institute. (2016). *Bridging global infrastructure gaps.* McKinsey & Company.
- McKinsey Global Institute. (2017). *Bridging infrastructure gaps: Has the world made progress?* McKinsey & Company.
- Mordor Intelligence. (2026). *Heritage tourism market size, share & 2031 trends report.*
- National Institute of Standards and Technology. (2001). *Advanced encryption standard (AES)* (FIPS Publication 197).
- Organisation for Economic Co-operation and Development. (2016). *Extended producer responsibility: Updated guidance for efficient waste management.* OECD Publishing.
- Republic of Kenya. (2007). *Kenya Vision 2030.* Government of the Republic of Kenya.
- Republic of Kenya. (2019). *Data Protection Act, No. 24 of 2019.* National Council for Law Reporting.
- Sen, A. (1999). *Development as freedom.* Oxford University Press.
- Social Progress Imperative. (n.d.). *Social Progress Index.* Retrieved May 19, 2026.
- United Nations. (2015). *Transforming our world: The 2030 agenda for sustainable development* (Resolution A/RES/70/1).
- World Bank. (2017). *Environmental and social framework.* World Bank Group.
- World Economic Forum. (2019). The world is facing a $15 trillion infrastructure gap by 2040.

---

# Frontend Build Instructions

## Who I am
I'm Austine Igunza on the Nuvola Atlas student team (Strathmore University).
My formal scope per the proposal is the frontend ("Mapbox GL JS frontend,
dashboard interface, and the user-facing components of the Vitality
Scorecard"), but **for the current working sessions backend work is
explicitly authorized** — I am temporarily covering Khillon's Laravel
backend (and may also touch Devyan's FastAPI ingestion / scoring code where
needed) to unblock the pilot. Treat backend tasks as in-scope unless I say
otherwise. Still STOP and ASK on ambiguous architectural decisions rather
than guessing.

> Reverting this: when the team is back to strict role separation, restore
> this section to the original "I do NOT build the backend ... STOP and tell
> me rather than guessing" language.

## Design north star — READ THIS FIRST
There is a working prototype in this repo: `NuvolaAtlasPrototype.jsx`.
Open and study it before writing anything. It is the approved design spec:
the palette, type, spacing, the "settle" easing curve
(cubic-bezier(0.22,1,0.36,1)), the score ring, the pillar bars, the layer
toggles, the zone-select interaction, and the mock Zone data shape are all
the agreed direction. Your job is to rebuild it as production code with the
real stack below. Match its look and feel closely; do not redesign it.

## How we work — PHASES, with checkpoints
Build in the discrete phases listed at the end. After EACH phase:
  1. Summarize what you built + key files.
  2. Tell me how to run/see it.
  3. STOP and wait for my approval before the next phase.
Never skip ahead or scaffold a later phase early. If a design or scope
decision is unclear, ASK — do not invent features beyond the spec.

## Routine systems check — do this after EVERY meaningful slice
Before marking a slice "done" or moving to the next task, run a full
systems check so regressions surface inside the same session, not after
the next push:

  1. Frontend types:  `cd nuvola-atlas-frontend && npx tsc --noEmit`
  2. Frontend build:  `cd nuvola-atlas-frontend && npx vite build`
  3. Backend routes:  `cd nuvola-atlas-backend && php artisan route:list --path=api`
  4. Backend tests:   `cd nuvola-atlas-backend && php vendor/phpunit/phpunit/phpunit --no-coverage`
     (Requires `docker compose up -d postgres` from the backend dir —
     phpunit.xml force-overrides to a local docker postgres+postgis on
     127.0.0.1:5434. Without docker the tests hang on TCP timeout.)

If any check fails, fix it before continuing — don't paper over it.
Treat green-across-all-four as the baseline for "system functions
work." Push commits after the slice goes green, not at the end of the
session — keep the remote close to my local state so nothing's lost
between sessions.

## Stack — from the proposal section 4.2, do not deviate
- Framework: React via Inertia.js inside a Laravel 11 app. Assume the Laravel
  app already exists; build only the Inertia frontend layer (pages,
  components, hooks, assets). Do not touch backend routes/controllers beyond
  the minimal Inertia page render, and flag it when you need one.
- Mapping: Mapbox GL JS (real map — I will provide a MAPBOX_ACCESS_TOKEN via
  env; read it from import.meta.env, never hardcode it).
- Styling: Tailwind CSS. Animation: Framer Motion (real springs, replacing the
  prototype's hand-rolled easing). Respect prefers-reduced-motion.
- Real-time: Laravel Reverb via Laravel Echo — STUBBED for now (see Phase 2).
- Keep dependencies mainstream and minimal; the codebase must stay
  maintainable and transferable.

## SCOPE — build ONLY this
ATLAS MAP:
- Mapbox map centered on Nairobi County.
- Exactly three toggleable layers: "Road Progress", "Smart Grid Status",
  "Density". Layers fade in/out smoothly (never hard-cut).
- 5 selectable Nairobi sub-county zones (Westlands, Starehe, Dagoretti,
  Kasarani, Embakasi). Selecting a zone eases the map to it and opens its
  scorecard.

VITALITY SCORECARD:
- One 0-100 readiness score per selected zone (animated ring, count-up).
- EXACTLY four pillars, exact names, do not rename or add:
    1. Social Wellbeing and Human Capital
    2. Safety and Security
    3. Density and Scaling Dynamics
    4. Infrastructure and Environmental Safeguards
- Each pillar shows its own 0-100 sub-score, bars filling with a stagger on
  every zone change.
- Side panel on desktop, bottom sheet on mobile.

## DATA CONTRACT — single source of truth: resources/js/mock/zones.ts
Build everything against this exact shape so the backend can mirror it:
```ts
type Zone = {
  id: string; name: string; lat: number; lng: number;
  vitalityScore: number;                       // 0-100
  pillars: {
    socialWellbeing: number; safetySecurity: number;
    densityScaling: number; infraEnvironmental: number;   // each 0-100
  };
  layers: {
    roadProgress: GeoJSON.FeatureCollection;
    smartGrid: GeoJSON.FeatureCollection;
    density: GeoJSON.FeatureCollection;
  };
};
```
Seed the 5 zones with plausible Nairobi coordinates and the same scores used
in the prototype.

## THE PHASES
PHASE 0 — Plan & tokens (NO feature code)
  - Propose the Inertia frontend file/folder structure.
  - Extract design tokens FROM THE PROTOTYPE (colors, type scale, spacing,
    radii, shadows) into Tailwind config + a Framer Motion spring preset that
    reproduces the prototype's settle easing.
  - List components and data flow. STOP for my approval.

PHASE 1 — App shell & design system
  - Inertia page scaffold, Tailwind config with approved tokens, global
    layout, font stack, base primitives. Static empty state, no map. STOP.

PHASE 2 — Mock data + live-data hook
  - resources/js/mock/zones.ts with the 5 zones (GeoJSON layers).
  - useLiveData() hook returning mock data now, shaped to swap for a real
    Laravel Echo/Reverb subscription with ZERO UI changes. STOP.

PHASE 3 — Atlas map (Mapbox)
  - <AtlasMap> (Mapbox GL JS, Nairobi), <LayerToggle> with smooth fades,
    zone select that eases the camera. STOP.

PHASE 4 — Vitality Scorecard
  - <ZoneScorecard> (side panel / bottom sheet), <VitalityRing> count-up,
    <PillarBar> x4 staggered, wired to zone selection. STOP.

PHASE 5 — Polish & handover
  - Refine transitions, reduced-motion, responsive pass.
  - README: how to run locally + exactly how to swap useLiveData's mock for
    the real Reverb channel. STOP.

Begin with PHASE 0 only. Show me the plan, structure, and tokens, then wait.
