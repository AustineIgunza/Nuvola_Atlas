# 0005 — Machine learning belongs in the data pipeline, not in the index

**Status:** accepted · **Date:** 2026-08 (recorded 2026-08-28)

## Context

The funded proposal commits to TensorFlow/PyTorch. The obvious reading — score
the Vitality Index with a learned model — is available, and would be a mistake.

## Decision

**ML makes data trustworthy. It does not make scores.**

No TensorFlow or PyTorch in the MVP. The Vitality Index stays a transparent
weighted mean over non-null indicators, computed by
`Domain/Scoring/ScoreCalculator`, with weights from `pillars.json`.

Where statistical method earns its place is the five-stage quality pipeline that
every reading passes through:

| Stage | What it does | Status |
|---|---|---|
| 1 · Structural | Schema, types, units, CRS, timestamps | built — `quality/clean.py` |
| 2 · Semantic | Per-indicator ranges, cross-indicator plausibility | not built |
| 3 · Statistical | Outliers against history and against neighbours | partial — `quality/outliers.py` (z-score; MAD and Local Moran's I planned) |
| 4 · Imputation | Estimate missing indicators from spatial neighbours | not built |
| 5 · Confidence | Per-zone measure of how far a score can be trusted | not built |

## Why not learn the index

**There is no training data.** 17 zones × a handful of indicators, at cadences
from weekly to yearly, is a few thousand observations after a full year. A
neural net on that is overfitting with extra steps.

**Interpretability is the product.** The methodology paper goes to peer review.
A county planner has to defend a score to a committee. A black-box index fails
both tests — reviewers reject what they cannot audit, and neither can a planner.

**The proposal already says the right thing.** §4.2 commits TF/PyTorch to
"anomaly detection and, in later phases, community-validation pipelines" — data
quality, not scoring. Building the quality layer well is both grant-compliant
and correct.

## The rule that protects the product

Spatial imputation is genuinely valuable and also the most dangerous feature in
the system, because it manufactures numbers. So:

**An imputed value is never presented as an observed one.** It carries
provenance end to end, renders with distinct visual treatment, and the scorecard
says what it was estimated from. A zone whose score leans on imputation past a
threshold is labelled as such.

The frontend already has the affordance: `PillarBar` renders three states —
absent, estimated, observed — and `EstimatedMark` is the wrapper for the middle
one.

## Where real ML earns its place, later

1. Satellite → built-up area and road extraction (CNN segmentation, Sentinel-2) — v2
2. Change detection over time — v2
3. Spatial imputation with uncertainty (Gaussian process / kriging) — v1.5
4. Ensemble anomaly detection (Isolation Forest alongside MAD) — v1.5
5. Score forecasting (ARIMA/Prophet, once ≥12 months of history exists) — v2
6. **Neural scoring of the index — never.** It kills interpretability and the paper.

Items 1 and 2 are where TF/PyTorch genuinely belong, and they are the strongest
version of the product's own pitch: extracting infrastructure change from
imagery is literally seeing what is being built. That is a v2 flagship, not MVP
work — attempting it before the data pipeline is trustworthy would produce an
impressive demo on an unsound base.

## Consequences

- `analysis/` for notebooks and experiments does not exist yet. It gets created
  when there is a first notebook, not before — empty scaffolding claims a
  practice the project does not have.
- `ZoneScoreForecaster` stays a deliberate v0 method with a stable output
  contract, documented as such in its own docblock. It is the model for how
  every placeholder here should announce its own replacement.
