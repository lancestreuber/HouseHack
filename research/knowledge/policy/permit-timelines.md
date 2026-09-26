# Permit timelines

**Type:** policy
**One line:** How long Pittsburgh zoning and building reviews actually take, computed by us from OneStopPGH workflow dates, alongside the City-reported figures.
**Why we care:** A time estimate is the most legible output of an "ease" score. The by-right path is now fast; residential new construction is not. ⚠ Its elapsed time includes applicant response time, and our "revision cycle" count is reviewer flags, not resubmission rounds *(corrected 2026-09-26 per docs/04-critique.md rows 2–3)*.
**Last checked:** 2026-09-26

## Method `[read]`, computed by the approval-pathway sweep

- **Data:** the OneStopPGH backing layer `OSPI_H/FeatureServer/0` (330,166 records overall). The sweep pulled **30,775 records**, fully paginated: all "Zoning Development Review Application" (ZDR) and Building/Development Application (BDA) records.
- **No usable top-level application date.** `create_date` and `submitted_date` are empty, and ZDR records have no `issue_date`.
- **Workaround:** the `workflows` JSON carries dated steps (Application Submitted, Completeness Check, Perform Review with "Revisions Required" outcomes, Issue Permit). **Start = earliest workflow date; end = Issue Permit.** Revision cycles = count of "Revisions Required" outcomes.
- ⚠ **Two method artifacts** *(corrected 2026-09-26 per docs/04-critique.md row 2)*. (1) Several `Perform Review` steps share one `SCHEDULEDSTARTDATE`: they are **parallel discipline reviews within one round**. The critic's live samples had 3 and 10 "Revisions Required" flags, the 3 inside a single round. So the count is **reviewer-level flags, not resubmission rounds**. (2) Start = earliest workflow date, so durations **include applicant time**; one sampled record sat about 10 months in "Provide Further Information" (the applicant's court) before completeness passed. Recompute with rounds = distinct scheduled review starts, and split City vs applicant time.
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

| Group | n issued | median (elapsed, incl. applicant time) | p75 | p90 | median "Revisions Required" flags (not rounds) ⚠ |
|---|---|---|---|---|---|
| Residential alteration | 6,872 | 8 d | 34 d | 95 d | 0 |
| **Residential new construction** | 74 of 210 | **153 d** | 246 d | 340 d | **5** |
| Commercial new construction | 157 | 104 d | 245 d | not reported | not reported |

**All BDAs by start year:** median 25 d (2024), 21 d (2025), 9 d (2026).

## ⚠ Censoring caveat

- ⚠ **Residential new construction is right-censored, heavily** *(corrected 2026-09-26 per docs/04-critique.md row 3)*. Only **74 of 210 (35%)** have finished (62 Issued + 12 Completed, live status counts). The **136 unfinished** are 78 Applicant Revisions, 27 Application Finalization, 22 Application Incomplete, 6 In Review, 2 Submitted and 1 Ready For Issue. The 153-day median describes the finished minority and is **biased short by an unknown amount**.
- The 2026 by-year median (9 d) is also biased down: recent applications that are slow have not finished yet.
- The residential new-construction work descriptions are mostly single-family (78), then three-unit (21) and two-family (5). Small multi-unit projects are a thin sample.
- A survival-analysis estimate (e.g. Kaplan–Meier over open records) would correct for this; it has not been done.

## City-reported figures (article `[read]`; the measure itself not independently verified)

From PublicSource, 2026-09-23 ([link](https://www.publicsource.org/pittsburgh-building-permits-faster-under-oconnor/)):

- ⚠ *(corrected 2026-09-26 per docs/04-critique.md row 4)* The City reports, via PublicSource, that it "typically" took about **11 days to issue** a BDA in July 2026, vs **27** in July 2025. This is City-reported **time to issue**, not review time, relayed by journalism.
- Single-family permits: **11 → 5 days**, from the City's own analysis covering **January → June 2026**, a different date range from the July-to-July figure.
- EZ Permits now covers 15 permit types (one business day; not new housing; see [approval pathway](approval-pathway.md)).
- Remaining obstacles named: zoning restrictions, variances, and building-code conflicts (e.g. dual-exit rules for office-to-residential conversions).

Our all-BDA medians (25 → 21 → 9 days by start year) point the same way as the City's 27 → 11. ⚠ This is weak corroboration: our 2026 median (9 d) is censored and biased short, and the City's measures and date ranges differ from ours *(corrected 2026-09-26 per docs/04-critique.md row 4)*.

**Contradiction (dating):** the alternative-framings sweep states "a building permit took a typical 11 days in July 2025, down from 27". The permit and stakeholder sweeps, citing the same PublicSource article, give 27 days in July 2025 and 11 days in July 2026. We believe the latter: two sweeps agree and it matches the direction of our computed series. The framings sweep appears to have mis-dated it.

## What this says (inference)

- The by-right review for small residential work is fast and getting faster.
- ⚠ Residential new construction takes months **elapsed, including applicant response time**, among the 35% of cases issued, with a median of ~5 reviewer-level "Revisions Required" flags (not rounds). How much of the time is City review vs applicant time is not yet split *(corrected 2026-09-26 per docs/04-critique.md rows 2–3)*. One architect's complaint about resubmission was "screaming into the void" `[read]` ([r3 alternative-framings sweep](../../sweeps/r3-alternative-framings.md)); that is one anecdote.
- The discretionary steps (ZBA, Planning Commission, RCO meetings) are not measured in these data. The long waits appear to sit there, but **no hard numbers on ZBA wait times** were found.

## Open questions

- Re-run the pull and commit the script so the numbers are reproducible from the repo.
- Kaplan–Meier or similar to handle censoring for residential new construction.
- Recount rounds as distinct scheduled review starts, and split City time from applicant time ("Provide Further Information", "Applicant Revisions").
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
- [PublicSource, 2026-09-23, permits faster](https://www.publicsource.org/pittsburgh-building-permits-faster-under-oconnor/) `[read]` *(accessed 2026-09-26)*: City-reported 27 → 11 days, 11 → 5 days, EZ Permits, remaining obstacles
- [OneStopPGH Insights dashboard](https://experience.arcgis.com/experience/89d500285ecd4804ae9945d93d424569) `[skimmed]` *(accessed 2026-09-26)*: City's own permitting dashboard, not used for these numbers
- Sweep: [../../sweeps/r2-approval-pathway-and-timelines.md](../../sweeps/r2-approval-pathway-and-timelines.md)
- Sweep: [../../sweeps/r1-zoning-data-code-and-reforms.md](../../sweeps/r1-zoning-data-code-and-reforms.md)
- Sweep: [../../sweeps/r3-alternative-framings.md](../../sweeps/r3-alternative-framings.md)
- Sweep: [../../sweeps/r3-stakeholder-needs.md](../../sweeps/r3-stakeholder-needs.md)
- [Adversarial critique](../../docs/04-critique.md) — rows 2, 3, 4
