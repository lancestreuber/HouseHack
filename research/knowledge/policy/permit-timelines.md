# Permit timelines

**Type:** policy
**One line:** How long Pittsburgh zoning and building reviews actually take, computed by us from OneStopPGH workflow dates, alongside the City-reported figures.
**Why we care:** A time estimate is the most legible output of an "ease" score. The by-right path is now fast; residential new construction is not, and the slow part is revision cycles.
**Last checked:** 2026-09-26

## Method `[read]`, computed by the approval-pathway sweep

- **Data:** the OneStopPGH backing layer `OSPI_H/FeatureServer/0` (330,166 records overall). The sweep pulled **30,775 records**, fully paginated: all "Zoning Development Review Application" (ZDR) and Building/Development Application (BDA) records.
- **No usable top-level application date.** `create_date` and `submitted_date` are empty, and ZDR records have no `issue_date`.
- **Workaround:** the `workflows` JSON carries dated steps (Application Submitted, Completeness Check, Perform Review with "Revisions Required" outcomes, Issue Permit). **Start = earliest workflow date; end = Issue Permit.** Revision cycles = count of "Revisions Required" outcomes.
- Records have a `parc_num` field, so timelines join to parcels.
- The sweep's scripts and pulled JSON lived in a scratch directory and are not in the repo (see Open questions).

## Results

**Legacy Zoning Development Review, 2019–mid-2024 (n = 17,129)**

| p25 | median | p75 | p90 |
|---|---|---|---|
| 9 d | 25 d | 68 d | 168 d |

- The median was stable at 22–28 days every year.
- The ZDR series is effectively dead after mid-2024. That zoning review now happens inside the BDA is an **inference**, not something a source states.
- ZDR workflow steps expose only completeness check and review. **No ZBA or variance step is exposed**; a keyword search of `work_desc`/`process_summary_data` found only 49 "variance" and 11 "ZBA" hits `[read]` ([r1 zoning sweep](../../sweeps/r1-zoning-data-code-and-reforms.md)).

**BDA, 2024–26, start to issue**

| Group | n issued | median | p75 | p90 | median revision cycles |
|---|---|---|---|---|---|
| Residential alteration | 6,872 | 8 d | 34 d | 95 d | 0 |
| **Residential new construction** | 74 of 210 | **153 d** | 246 d | 340 d | **5** |
| Commercial new construction | 157 | 104 d | 245 d | not reported | not reported |

**All BDAs by start year:** median 25 d (2024), 21 d (2025), 9 d (2026).

## ⚠ Censoring caveat

- **Residential new construction is right-censored.** Only 74 of 210 records have been issued; **78 are sitting in "Applicant Revisions"**. Medians computed on issued records only are biased short, so **the true median is longer than 153 days**.
- The 2026 by-year median (9 d) is also biased down: recent applications that are slow have not finished yet.
- The residential new-construction work descriptions are mostly single-family (78), then three-unit (21) and two-family (5). Small multi-unit projects are a thin sample.
- A survival-analysis estimate (e.g. Kaplan–Meier over open records) would correct for this; it has not been done.

## City-reported figures `[read]`

From PublicSource, 2026-09-23 ([link](https://www.publicsource.org/pittsburgh-building-permits-faster-under-oconnor/)):

- BDA permits: **27 days (July 2025) → 11 days (July 2026)**.
- Single-family permits: median **11 → 5 days**.
- EZ Permits now covers 15 permit types (one business day; not new housing; see [approval pathway](approval-pathway.md)).
- Remaining obstacles named: zoning restrictions, variances, and building-code conflicts (e.g. dual-exit rules for office-to-residential conversions).

Our all-BDA medians (25 → 21 → 9 days by start year) are directionally consistent with the City's 27 → 11.

**Contradiction (dating):** the alternative-framings sweep states "a building permit took a typical 11 days in July 2025, down from 27". The permit and stakeholder sweeps, citing the same PublicSource article, give 27 days in July 2025 and 11 days in July 2026. We believe the latter: two sweeps agree and it matches the direction of our computed series. The framings sweep appears to have mis-dated it.

## What this says (inference)

- The by-right review for small residential work is fast and getting faster.
- Residential new construction takes months, driven by **revision cycles** (median 5), not queue time. One architect's complaint about resubmission was "screaming into the void" `[read]` ([r3 alternative-framings sweep](../../sweeps/r3-alternative-framings.md)).
- The discretionary steps (ZBA, Planning Commission, RCO meetings) are not measured in these data. The long waits appear to sit there, but **no hard numbers on ZBA wait times** were found.

## Open questions

- Re-run the pull and commit the script so the numbers are reproducible from the repo.
- Kaplan–Meier or similar to handle censoring for residential new construction.
- Measure ZBA end-to-end time by joining decision PDFs (BDA number) to OSPI.
- Compute DOMI curb-cut durations (1,606 records) and floodplain permit durations (494 records).
- Commercial new construction p90 and revision cycles were not reported.

## Connects to

- [Approval pathway](approval-pathway.md): which steps these timelines cover and which they don't
- [Permits and outcomes data](../data/permits-and-outcomes.md): the OSPI_H and PLI datasets
- [ZBA decisions data](../data/zba-decisions.md): the missing discretionary-step durations
- [Backtest and calibration](../methods/backtest-and-calibration.md): using these as outcome labels
- [Uncertainty and explainability](../methods/uncertainty-and-explainability.md): reporting censored estimates honestly
- [City of Pittsburgh](../stakeholders/city-of-pittsburgh.md): the permitting-reform claims these check

## Sources

- [OneStopPGH OSPI_H FeatureServer](https://pghbridgis.pittsburghpa.gov/hosting/rest/services/Hosted/OSPI_H/FeatureServer/0) `[read]` *(accessed 2026-09-26)*: queried and paginated; all computed figures above
- [PublicSource, 2026-09-23, "Pittsburgh building permits faster under O'Connor"](https://www.publicsource.org/pittsburgh-building-permits-faster-under-oconnor/) `[read]` *(accessed 2026-09-26)*: City-reported 27 → 11 days, 11 → 5 days, EZ Permits, remaining obstacles
- [OneStopPGH Insights dashboard](https://experience.arcgis.com/experience/89d500285ecd4804ae9945d93d424569) `[skimmed]` *(accessed 2026-09-26)*: City's own permitting dashboard, not used for these numbers
- Sweep: [../../sweeps/r2-approval-pathway-and-timelines.md](../../sweeps/r2-approval-pathway-and-timelines.md)
- Sweep: [../../sweeps/r1-zoning-data-code-and-reforms.md](../../sweeps/r1-zoning-data-code-and-reforms.md)
- Sweep: [../../sweeps/r3-alternative-framings.md](../../sweeps/r3-alternative-framings.md)
- Sweep: [../../sweeps/r3-stakeholder-needs.md](../../sweeps/r3-stakeholder-needs.md)
