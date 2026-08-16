# IP, Trademark and Entity Playbook

**Owner:** Ken N'ganga (Finance and Policy) · **Contributors:** all five founders
**Last updated:** 2026-08-16

> **Not legal advice.** This is an engineering-side companion that sequences the
> work and names the decisions. Every filing below should go through the
> Strathmore Legal Clinic or a Kenyan advocate before it is submitted. Fees,
> forms and class definitions change; verify current requirements with the
> registry rather than with this file.

[`COPYRIGHT.md`](../../COPYRIGHT.md) at the repo root is the **inventory** — what
we own, catalogued for the filing. This document is the **process** — how to
secure it, in what order, and what breaks if the order is wrong.

---

## 0. Read this first: the assumption we have not verified

`COPYRIGHT.md` §0 states:

> "Project is a student-led independent innovation. IP is **not** assigned to
> Strathmore; the founding team retains full ownership per the original grant
> proposal."

**The grant proposal cannot establish this, because we wrote the grant
proposal.** Ownership of student-created IP is governed by the university's own
IP policy and by whatever we signed on enrolment or on accepting grant funds —
not by our assertion about ourselves. Many university IP policies claim rights in
student work where the university contributed funding, supervision, facilities,
or equipment. We are seeking KES 1,000,000 of Strathmore-routed innovation
funding, which is exactly the trigger such policies tend to name.

This is the highest-consequence open question in this document. If Strathmore has
a claim and we discover it *after* signing a partner agreement or taking
investment, we will have warranted ownership we did not have.

**Action, before anything else in this file:**

- [ ] Obtain Strathmore's written IP policy (Research/Innovation office, or the
      Legal Clinic).
- [ ] Read what we signed at enrolment and in any grant acceptance paperwork.
- [ ] Get a **written** position from the university on this project
      specifically — assignment, licence-back, revenue share, or no claim.
- [ ] If the university does have a claim, negotiate it *now*, while we are the
      sympathetic student team with nothing to divide. It gets adversarial once
      there is revenue.
- [ ] Amend `COPYRIGHT.md` §0 to state the verified position, with the document
      it rests on.

Everything below assumes this resolves in the team's favour. If it does not, the
entity and assignment steps change shape and the Legal Clinic should re-sequence
them.

---

## 1. What is already protected, and what is not

A common and expensive misunderstanding: **copyright registration does not create
the copyright.** Kenya is a Berne Convention signatory, so copyright subsists
automatically in original work from the moment it is fixed — which for us means
from the first commit in May 2026. Every line of the codebase is already
protected.

What KECOBO registration buys is **evidence**: a dated, official record that makes
ownership straightforward to prove in a dispute, and that partners and funders
can be shown. Useful, worth doing, but not urgent in the way the next section is.

| Asset | Protection | Arises | Registration |
|---|---|---|---|
| Source code | Copyright (literary work) | Automatically, on writing | KECOBO — evidentiary |
| UI, cartography, brand artwork | Copyright (artistic work) | Automatically | KECOBO — evidentiary |
| Methodology **paper** | Copyright (literary work) | Automatically | KECOBO — evidentiary |
| Methodology **as an idea** | **Not protectable** | — | — |
| Database compilations | Copyright in selection/arrangement | Automatically | KECOBO — evidentiary |
| "Navuuna", "UE Vitality Index" | Trade mark | **Largely on registration** | **KIPI — do this early** |
| Credentials, unpublished tuning | Trade secret | Only while kept secret | — |

Two consequences fall out of that table.

**The idea/expression line.** Copyright protects the *expression* of the Vitality
Index — `ScoreCalculator.php`, `config/methodology.php`, the paper — not the
*idea* of scoring localities across four pillars with a null-exclusion rule.
Anyone may read the paper and build their own implementation. That is not a leak
to be plugged; the proposal (§6.2) explicitly wants the methodology replicable by
other research groups. Software patents are effectively unavailable here in any
case — the Industrial Property Act excludes computer programs as such.

So the coherent strategy is: **publish the method, trademark the name, license
the code.** Publication also establishes prior art, which stops anyone else
claiming the method later. Academic credit and defensive publication are the same
act.

**Trademarks are the genuinely urgent item.** Unlike copyright, trade mark rights
in Kenya come substantially from registration, and they are first-to-file in
practice. Nothing stops a third party registering "Navuuna" before we do and then
requiring us to rebrand — we have already rebranded once and know what that
costs. This is the one filing where delay carries real risk.

---

## 2. Order of operations

Sequence matters more than speed. Each step below is cheaper and cleaner if the
one above it is done first.

```
1. Verify the Strathmore IP position          ← §0, blocks everything
2. Sign the intra-team assignment memo        ← §3, blocks the entity being useful
3. KIPI trade mark search + application       ← §5, run in parallel from step 1
4. Register the entity                        ← §4
5. Assign IP from the five founders → entity  ← §3.3
6. KECOBO copyright registration in the       ← §6
   entity's name
7. ODPC data-controller registration           ← §7, before any partner deployment
```

Steps 3 and 4 can run concurrently. Do not invert 4 and 5 — an entity that does
not own the IP is a shell, and every day it operates without the assignment is a
day of ambiguity about who owns work done in its name.

**Why not file copyright first?** Filing before the entity exists means
registering in five individual names, then recording an assignment to the entity
afterwards — two processes instead of one. The exception is if a partner or
funder demands proof of ownership on a timeline shorter than incorporation, in
which case file individually and re-record later.

---

## 3. The assignment chain

This is the part student teams skip and later regret. It is also the cheapest
item in this document.

### 3.1 Why joint authorship is a problem to be solved

`COPYRIGHT.md` §0 records the five of us as **joint authors**. Without a written
agreement, joint authorship generally means each author holds an interest, and
commercially exploiting or exclusively licensing the work needs all of them to
agree. Concretely:

- Any one founder can withhold consent from a licensing deal.
- A founder who leaves — graduation, a job, a falling-out — takes their interest
  with them and remains a required signature indefinitely.
- A funder or acquirer doing diligence will find a five-way unwritten claim and
  will stop there.

Five students, one of whom is covering another's role this month, is precisely
the situation where this goes wrong.

### 3.2 Intra-team assignment memo — do this now

Signed by all five, before incorporation. Should cover:

- [ ] Assignment of all copyright and related rights in work created for the
      project, to the entity on formation — with a present assignment of future
      rights so it does not need re-signing.
- [ ] Moral rights: in Kenya these are generally not assignable, so handle by
      waiver/consent to the extent permitted, and agree an attribution convention.
- [ ] **Departure clause.** What happens to a leaver's interest. Without this,
      the answer is "nothing changes and they keep a veto."
- [ ] Confidentiality over credentials, unpublished methodology tuning, and
      partner data.
- [ ] Scope boundary: what counts as project work versus a founder's unrelated
      personal work. Devyan's and Khillon's other projects should be explicitly
      outside.
- [ ] Contribution record. `COPYRIGHT.md` Exhibit G already calls for per-author
      declarations cross-referenced against `git blame` — the commit history is
      genuinely good evidence here, because every commit is under an identifiable
      name with no `Co-Authored-By` noise.

### 3.3 Founder-to-entity assignment

Executed once the entity exists. A short deed assigning everything from step 3.2
into the company. Ask the Legal Clinic whether it needs stamping.

### 3.4 Contributor discipline going forward

- Anyone who commits and is not one of the five signs a contributor assignment
  **before** their first merge. This includes interns, Info Sec Club members who
  contribute fixes after the pen test, and any hired contractor.
- Keep authorship legible. The existing no-`Co-Authored-By` rule and Conventional
  Commits discipline is the evidence base — do not let it drift.

---

## 4. The entity

### 4.1 The choice

The proposal (§6.2) names a private limited company as the leading option. That
fits the revenue plan — B2B licensing, API fees, due-diligence reports — which is
straightforwardly commercial and awkward inside a not-for-profit.

| Form | Fits | Against |
|---|---|---|
| **Private company limited by shares** (Companies Act 2015) | The §6.1 revenue plan; can take investment; clean cap table | Some grant funders restrict eligibility to non-profits |
| **Company limited by guarantee** | Grant eligibility; mission framing | No shares, so no equity for founders and no investment path |
| **Both** | Grants into the CLG, commercial into the Ltd | Two sets of filings and accounts for a five-person student team — almost certainly premature |

Recommendation to Ken: default to the limited company, and check the eligibility
rules of the specific follow-on funders in `tasks/todo.md` Track E before
committing. If a target funder requires non-profit status, that is a real input
and should be found now rather than at application time.

### 4.2 Registration mechanics

Kenyan company registration runs through the Business Registration Service on
eCitizen. Broadly: name search and reservation, then incorporation with the
memorandum and articles, directors, shareholders and registered office. Then KRA
PIN, and a bank account.

- [ ] Name search — confirm the company name is available **and** consistent with
      the trade mark search in §5. Do these together; a company name and a trade
      mark are different registers and clearing one does not clear the other.
- [ ] Decide directors and the registered office.
- [ ] KRA PIN and tax registration.
- [ ] Corporate bank account (needed before any grant disbursement or revenue).

### 4.3 The shareholders' agreement — the item that actually matters

More important than the incorporation itself, and the thing most likely to be
skipped. Five student co-founders with unequal time commitments need this written
down while everyone is still friendly.

- [ ] **Equity split.** Contributions are already visibly unequal — the git
      history shows it. Decide deliberately rather than defaulting to five equal
      slices out of politeness.
- [ ] **Vesting.** Multi-year vesting with a cliff. This is the specific mechanism
      that stops a founder who leaves in month three from holding a fifth of the
      company forever.
- [ ] **Leaver provisions**, good and bad.
- [ ] **Decision-making.** The proposal says governance is by consensus; write
      down what happens when consensus fails, because it will.
- [ ] **IP warranty** from each founder that they own what they are assigning and
      that it does not infringe.
- [ ] **Dispute resolution.**

---

## 5. Trade marks (KIPI)

The urgent filing. Kenyan trade marks are administered by the Kenya Industrial
Property Institute.

### 5.1 Search before you file

- [ ] KIPI search for **"Navuuna"** across the intended classes. Also search
      near-identical and phonetically similar marks — a confusingly similar prior
      mark blocks registration just as an identical one does.
- [ ] Search **"Nuvola Atlas"**. Note that "Nuvola" is Italian for "cloud", which
      makes it weaker and more likely to collide in software classes. The rebrand
      to a coined word was, incidentally, the right move for trade mark strength.
- [ ] Search **"UE Vitality Index"**. Be realistic: "Vitality Index" is
      descriptive of what it does, and descriptive marks are hard to register and
      hard to enforce. The distinctive element is "UE" and the composite. Ask the
      Clinic whether to file the composite mark or rely on the Navuuna house mark.
- [ ] Company-name search at BRS in the same pass (§4.2).

### 5.2 Classes

`COPYRIGHT.md` §1 proposes Nice classes 9, 35, 42 and 45.

- **Class 9** — downloadable software. Yes.
- **Class 42** — SaaS, platform-as-a-service, software development. Yes; for a
  hosted platform this is the core class.
- **Class 35** — data compilation and business information services. Yes, given
  the due-diligence-report line.
- **Class 45** — legal services. **Question this.** We do not provide legal
  services; the methodology informs policy, which is not the same thing. Each
  class costs money and each must be genuinely used or the registration is
  vulnerable to non-use cancellation. Recommend dropping unless the Clinic
  identifies a specific need.

File the wordmark first. A logo mark can follow — but note the logo is still
moving (`docs/brand/` holds the rebrand explorations), and filing a device mark
that then changes wastes the filing.

### 5.3 Beyond Kenya

The proposal targets EAC expansion (Tanzania, Uganda, Rwanda, Ethiopia) and
positions the platform for the wider continent. Trade marks are territorial — a
Kenyan registration protects nothing in Tanzania.

- **ARIPO** (Banjul Protocol) — one application designating multiple African
  member states. Worth pricing before committing to per-country filings.
- **Madrid Protocol** — international registration built on the Kenyan base
  application, extendable to member states as expansion actually happens.

Do not file broadly on day one. File Kenya now; keep the Kenyan application as
the base for a Madrid filing when there is a real reason to expand.

### 5.4 After registration

- [ ] Use ™ before registration, ® only after it grants. Using ® prematurely is
      an offence in some jurisdictions and is a bad look everywhere.
- [ ] Diarise the renewal.
- [ ] Keep evidence of use — screenshots, dated deployments, partner
      correspondence. Non-use is a cancellation ground.

---

## 6. Copyright registration (KECOBO)

`COPYRIGHT.md` §12 already specifies the exhibit package (A through H). That work
is done; this section only covers the process around it.

- [ ] File **in the entity's name**, after the §3.3 assignment. Filing in five
      individual names then re-recording is avoidable duplication.
- [ ] Deposit a **tagged, dated snapshot** — a git tag such as
      `filing-2026-Qn` — so the deposit is reproducible and the exact state
      claimed is unambiguous.
- [ ] Exclude `vendor/` and `node_modules/` from the deposit, per Exhibit A.
      Depositing third-party dependencies muddies the boundary the filing is
      trying to draw.
- [ ] File the methodology paper as a **separate work** from the software. They
      are different claims with different strategies — the paper is meant to be
      openly cited, the software is not.
- [ ] Re-file or supplement after materially new work. A 2026 registration says
      nothing about 2027 code.

Berne membership means the Kenyan copyright is recognised in other member states
without separate registration — one reason not to over-invest in international
copyright filings.

---

## 7. Data protection (KDPA 2019)

Not IP, but the same owner and the same blocking relationship to partner
deployment.

The Data Protection Act 2019 is administered by the Office of the Data Protection
Commissioner. Registration as a data controller or processor is required above
certain thresholds, and processing personal data without it where required is an
offence.

- [ ] Determine whether we are a controller, a processor, or both, and whether
      registration thresholds are met. We hold user accounts, audit logs with IP
      addresses and user agents, impersonation records, and partner contacts —
      this is personal data, so the answer is unlikely to be "neither".
- [ ] Register with the ODPC if required. **Before** any partner deployment.
- [ ] Complete the KDPA data-handling SOP already tracked in `tasks/todo.md`
      Track E: lawful basis, anonymisation, retention, access control, breach
      notification.
- [ ] Privacy policy and consent banner, once the entity name is final.
- [ ] Confirm the retention story is real. `data_ingestion_logs` payloads purge
      after 30 days via `nuvola:prune-ingestion-payloads`; `audit_logs` are
      append-only and retained indefinitely, which is defensible for an audit
      trail but should be a stated, justified policy rather than an accident of
      implementation.
- [ ] Cross-border transfers. Supabase, Vercel, Sentry and the AI Gateway may all
      process data outside Kenya. The KDPA constrains this; the Clinic should
      confirm the basis.

---

## 8. Third-party rights — the exposures we are already carrying

`COPYRIGHT.md` §9.5 is candid about two live risks. Flagging them here because
they are commitments that need closing, not just carve-outs to note.

- **KPLC** — recorded as "pending MOU; scraper access is used under fair-dealing
  pending signature." Fair dealing is narrow, and it does not comfortably cover
  commercial use. Close the MOU before the platform is commercially licensed, or
  drop the source.
- **ACLED** — "pending Strathmore academic-use registration." Academic-use terms
  generally do **not** permit commercial use. If ACLED data reaches a paying
  partner under an academic registration, that is a breach. Either obtain
  commercial terms or exclude ACLED from commercial deployments.
- **Mapbox** — proprietary SaaS with specific terms on caching and derived data.
  Worth confirming our tile handling complies before a partner deployment scales
  usage.
- **Open-source attribution.** The MIT/BSD/Apache dependencies carry attribution
  obligations. Generate and ship a `THIRD-PARTY-NOTICES` file from the lockfiles
  rather than maintaining the §9 list by hand — it is the same drift problem the
  docs consolidation just fixed everywhere else.
- **Government data.** KNBS, KURA, NEMA terms should be confirmed as permitting
  commercial redistribution, not merely public access. "Public" and "reusable
  commercially" are different things.

Each of these is fine for a student pilot and becomes a real liability the moment
money changes hands. The trigger to resolve them is the first paid contract, not
the first partner conversation.

---

## 9. What to do in the next two weeks

Ordered, and small enough to actually finish.

- [ ] **Ken:** request Strathmore's IP policy in writing (§0). Nothing else here
      is safe to finalise until this lands.
- [ ] **Ken:** book the Strathmore Legal Clinic. Bring `COPYRIGHT.md`, this file,
      and the grant proposal.
- [ ] **Ken:** run the KIPI search on "Navuuna" (§5.1). This is the one item
      where waiting has a real cost.
- [ ] **All five:** agree the equity split and vesting in principle (§4.3), before
      lawyers are involved and before there is anything to argue about.
- [ ] **All five:** sign the intra-team assignment memo (§3.2).
- [ ] **Austine:** tag a filing snapshot when the exhibit package is called for,
      and generate `THIRD-PARTY-NOTICES` from the lockfiles (§8).
- [ ] **Ken:** confirm follow-on funder eligibility rules before fixing the entity
      form (§4.1).

---

## Related

- [`COPYRIGHT.md`](../../COPYRIGHT.md) — the proprietary-elements inventory and
  the KECOBO exhibit package
- [`SECURITY.md`](../../SECURITY.md) — responsible disclosure
- [`tasks/todo.md`](../../tasks/todo.md) — Track E carries the non-engineering
  items this document expands
- [`docs/ops/secret-rotation.md`](../ops/secret-rotation.md) — credential
  handling, which the confidentiality obligations in §3.2 depend on
