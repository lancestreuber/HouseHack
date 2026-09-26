# Zoning Board of Adjustment decisions

**Type:** data
**One line:** ZBA variance and special-exception decisions are per-case PDFs on pittsburghpa.gov with a consistent caption template; a hand-coded sample of 90 decisions from 2026 hearings now gives the first outcome, section and timing numbers we have *(updated 2026-09-26, round 5)*.
**Why we care:** Variance history is the only direct evidence of how often dimensional or use relief is granted, which is what a "needs a variance" flag should be calibrated against. There is no structured dataset; our 90-row CSV is the closest thing.
**Last checked:** 2026-09-26

## What exists
- **No structured ZBA or variance dataset on WPRDC** (searches for "zoning board" and "variance" found none) `[read]`.
- `ZoningApplications` FeatureServer exists but returns **0 records** `[read]`.
- OneStopPGH `OSPI_H` exposes no ZBA step; keyword hits are 49 "variance" and 11 "ZBA" ([permits](permits-and-outcomes.md)).
- Decisions are per-case PDFs under `pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/`; per-meeting pages under `.../City-Planning-Meetings/ZBA-Agendas/ZBA-<Month>-<D>-2026`.
- The organizer catalog lists ZBA decisions as a **Useful** source for Feasibility and Permit Navigator, caveat: "Documents may be PDFs and inconsistent over time; outcomes require careful extraction" ([organizer catalog](organizer-data-catalog.md)).
- **Our coded sample** *(updated 2026-09-26, round 5)*: [`sources/pittsburghpa-2026-09-26-zba-decisions-sample.csv`](../../sources/pittsburghpa-2026-09-26-zba-decisions-sample.csv), one row per decision (zone case, BDA number, hearing and decision dates, days, address, parcel, district, neighborhood, each relief item with section and required vs proposed, outcome code, decision excerpt, PDF URL, data-quality notes). It holds **no applicant, owner, attorney, objector or board-member names**. `[read]` (all 90 PDFs read and hand-coded by an agent) — [sweep](../../sweeps/r5-zba-decisions-sample.md)

## Document structure `[read]` *(updated 2026-09-26, round 5)*
All 90 decisions in the sample share one caption block: Date of Hearing, Date of Decision, Zone Case "N of YYYY", Address, Lot and Block (parcel ID), Zoning District, Ward, Neighborhood, Request, **Application BDA-xxxx** (joins to `OSPI_H`), a relief table (type, section, required vs proposed), and a closing "Decision:" paragraph. All 90 are text-layer PDFs (no OCR needed). The earlier "generalized from one PDF" caveat now holds only for **pre-2026** decisions, whose template is still unchecked.

Data-quality issues seen in the sample (all flagged in the CSV `notes` column): one PDF prints the wrong year; one case number says 2025 where the URL says 2026; BDA numbers disagree between meeting page and PDF in 3 cases (CSV keeps the PDF); two PDFs cite §912.03 for front-yard parking whose substance is §912.04.L.3; one relief table and its decision paragraph cite different sections; two PDFs swap the Request and Application fields.

## What the 2026 sample shows *(updated 2026-09-26, round 5)*
Sample: **90 decisions**, hearings Jan 8 – Jul 16, 2026 (18 meeting dates), decisions dated Jan 22 – Aug 28, 2026. `[read]` — [sweep](../../sweeps/r5-zba-decisions-sample.md)

**Outcomes.** 84 of the 90 are an applicant asking for a variance or special exception (the other 6 are third-party or administrative appeals and nonconforming-status reviews). Of those 84:
- **81% (68) approved**, of which **35 carried conditions** (DOMI curb-cut review on parking pads, landscaping/screening, hours limits, "no additional signage", time limits)
- **15.5% (13) denied**, 2 of them without prejudice
- **3.6% (3) split** (part approved, part denied)

**Most-cited sections (cases, each topic counted once per case).** §911.02/.04 use (24: 10 use variances, 12 special-exception uses, 2 nonconforming reviews); §903.03 residential setbacks and site standards (18, all variances); §912.04 accessory structures (15, of which 9 front-yard parking pads under §912.04.L.3); §919 signs (15); §921.02 nonconforming use change or expansion (14); §916 residential compatibility (9); §914 parking and loading (8). **No case cited a §906 overlay.**

**Risk by relief type** (case outcome; small n, treat as indicative only):

| Relief type | Cases | Approved | Denied |
|---|---|---|---|
| Signs (§919) | 15 | 9 | **6 (40%)** |
| Front-yard parking pad (§912.04.L.3) | 9 | 6 | **3 (33%)** |
| §903.03 setbacks | 18 | 15 | 2 (+1 split, setback part granted) |
| Use variance, use not permitted (§911.02) | 10 | 7 | 1 (+2 split, the use part denied in both) |
| Nonconforming use change/expansion (§921.02, SE) | 14 | **14 (100%)** | 0 |
| Residential compatibility waivers (§916, SE) | 9 | 9 | 0 |
| Parking, loading, bike (§914) | 8 | 8 | 0 |
| Inclusionary zoning waiver (§907.04) | 1 | 0 | 1 |

**Two-unit dwellings in single-unit or H districts** (§911.02 use variance) came up 5 times: **3 approved, 2 denied**. For a parcel-flagging tool, "2-unit in an R1 district" is a real ZBA risk, not a formality (sweep's inference).

**Residential share.** **21% (19/90)** of cases add housing units (15 new construction, 4 conversions/additions); **26% (23/90)** if 4 cases legalizing or confirming existing units are included. New residential construction: 10 of 15 fully approved, 3 denied, 1 split, 1 third-party appeal that vacated a parking approval.

**Timing.** From the **final** hearing listed on the decision to the decision date (n=90): median **34 days**, IQR **26–41**, mean 34.5, range 4–74. 17 of 90 (19%) took more than 45 days; because the record can be held open after the hearing, these are not necessarily breaches of the 45-day rule. ⚠ **At least 15 cases appeared on two or more meeting agendas**, so time at the ZBA from first listing, and from filing, is longer than these figures.

## Selection bias and limits *(updated 2026-09-26, round 5)*
- **Coverage.** The sample holds ~65 distinct 2026 zone-case numbers out of numbers running 1–101, so **roughly a third of 2026 cases through late August are missing** (withdrawn, continued, heard at meetings not visited, or posted without a link).
- **Withdrawals are invisible.** They get no decision PDF and pages carry no "withdrawn" label. **The 81% rate is conditional on a decision being issued and posted.** If withdrawals are mostly would-be denials, the success rate for everyone who files is lower (inference).
- **7 per-meeting date slugs returned 404** (Jan 22, Jan 29, Feb 26, Mar 26, Apr 16, Apr 23, May 28); whether those were non-meeting days or used a different slug was not checked. Apr 30, Jun 25, Jul 9/23/30 and August were not tried.
- 13 matters listed on meeting pages had no posted decision and are outside the sample.
- About 5–6 months of decisions; nothing about seasonality or multi-year trends.
- Coding (conditions vs plain approval; NEW/CONV/LEGAL classes) is one agent's reading of each decision.

## Crawling
- **Filenames are inconsistent** (`bda-2024-07715-1137-pennsylvania-ave-zba-decision.pdf`, `bda-2026-05389_5743-walnut-st-zba-2026-9-3.pdf`, `e-jefferson-street-3-of-2026-zba-decision.pdf`), so crawl per-meeting pages rather than guess URLs.
- `bda-…-zba-<date>.pdf` files are **request packets** ("ZBA Requests Supplement"), not decisions; one link labelled "decision" was a stamped site plan *(updated 2026-09-26, round 5)* `[skimmed]`.
- The ZBA-Agendas index renders its list client-side and comes back empty; request per-meeting slugs directly *(updated 2026-09-26, round 5)* `[read]`.
- **Access method** *(updated 2026-09-26, round 5)*: `curl` gets an Akamai **403 "Access Denied"** on every pittsburghpa.gov URL, even with a browser User-Agent and Referer `[inaccessible]`. The WebFetch tool retrieved all 90 PDFs, and `pdftotext -layout` extracted the text. Works at ~100-PDF volume; larger volume untested.
- **Next step for a multi-year sample:** the Internet Archive CDX listing of the ZBA documents folder shows **~1,091 captured URLs**, mostly captured Feb 2025, including many 2021–2024 decisions `[skimmed]` (listing only; PDFs not opened) *(updated 2026-09-26, round 5)*.
- Hearings: first three Thursdays of each month (PublicSource Board Explorer, `[skimmed]` in the approval sweep).

## Volume and statistics
- Estimated ~5 cases/meeting × ~36 meetings/yr ≈ **150–200 cases/yr** (estimate). The 2026 sample (~100 case numbers by late August) is consistent with this *(updated 2026-09-26, round 5; inference)*.
- **No published ZBA approval rates found** besides our own sample. "Lenze et al. 2024" is `[skimmed]` (abstract only) everywhere *(corrected 2026-09-26 per docs/04-critique.md row 29)* (see [approval pathway](../policy/approval-pathway.md)).

## Process facts (from the ZBA handout, Dec 2024) `[read]`
$400 fee on top of zoning fees; ≥21-day posted notice; decision within 45 days after the record closes; appeal to Common Pleas within 30 days; approval expires in 1 year. ⚠ The code (§922.07, §922.09) says decision within 45 days **of the Board hearing**, and a missed deadline is a **deemed denial** *(updated 2026-09-26, round 5)*; see [approval pathway](../policy/approval-pathway.md).

## Open questions
- Do pre-2026 decisions share the same template? (Wayback sample needed.)
- How many filed cases are withdrawn, and are they would-be denials?
- Time from filing and from first hearing to decision (needs agenda history or OneStopPGH join on BDA).
- Does a browser-like client get past the Akamai 403 at crawl volume?
- Whether any external study has tabulated Pittsburgh ZBA outcomes.

## Connects to
- [Permits and outcomes](permits-and-outcomes.md): BDA join key
- [Approval pathway](../policy/approval-pathway.md): special exception / variance step
- [Permit timelines](../policy/permit-timelines.md)
- [Backtest and calibration](../methods/backtest-and-calibration.md): outcome rates by relief type as priors
- [LLM role](../methods/llm-role.md): PDF field extraction
- [Organizer data catalog](organizer-data-catalog.md)

## Sources
- 90 ZBA decision PDFs (hearings 2026-01-08 to 2026-07-16), URLs listed per row in [`sources/pittsburghpa-2026-09-26-zba-decisions-sample.csv`](../../sources/pittsburghpa-2026-09-26-zba-decisions-sample.csv) `[read]` *(accessed 2026-09-26)*: agent-read and hand-coded
- ZBA per-meeting pages, 19 dates Jan 8 – Sep 3, 2026, e.g. [ZBA January 8, 2026](https://www.pittsburghpa.gov/Business-Development/City-Planning/City-Planning-Meetings/ZBA-Agendas/ZBA-January-8-2026) `[read]` *(accessed 2026-09-26)*: full list in the sweep
- 7 per-meeting slugs (Jan 22, Jan 29, Feb 26, Mar 26, Apr 16, Apr 23, May 28, 2026) `[inaccessible]` (404) *(accessed 2026-09-26)*
- [ZBA Agendas index](https://www.pittsburghpa.gov/Business-Development/City-Planning/City-Planning-Meetings/ZBA-Agendas) `[read]` *(accessed 2026-09-26)*: client-rendered, empty list
- [Wayback CDX listing, ZBA documents folder](https://web.archive.org/cdx/search/cdx?url=pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/&matchType=prefix) `[skimmed]` *(accessed 2026-09-26)*: ~1,091 captured URLs, PDFs not opened
- [ZBA decision, E Jefferson Street, 3 of 2026 (PDF)](https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/e-jefferson-street-3-of-2026-zba-decision.pdf) `[read]` *(accessed 2026-09-26)*
- ZBA decision `bda-2024-07715-1137-pennsylvania-ave-zba-decision.pdf` (same directory) `[read]` *(accessed 2026-09-26)*: parsed fields
- [ZBA September 3, 2026 meeting page](https://www.pittsburghpa.gov/Business-Development/City-Planning/City-Planning-Meetings/ZBA-Agendas/ZBA-September-3-2026) `[read]` *(accessed 2026-09-26)*
- [ZBA process handout 2024 (PDF)](https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/process-guides-and-handouts/process-guide-handout-zba-2024.pdf) `[read]` *(accessed 2026-09-26)*
- [eCode360 Ch. 922 procedures (saved text)](../../sources/ecode360-2026-09-26-pittsburgh-922-procedures.md) `[read]` *(accessed 2026-09-26)*: 45 days from hearing; deemed denial
- PublicSource Board Explorer `[skimmed]` *(accessed 2026-09-26)*: cadence and members only; URL not recorded
- City `ZoningApplications` FeatureServer `[read]` *(accessed 2026-09-26)*: 0 records
- [ZBA page (organizer catalog URL)](https://pittsburghpa.gov/dcp/zba) `[found]` *(accessed 2026-09-26)*
- [Organizer Public Data Catalog (Google Sheet)](https://docs.google.com/spreadsheets/d/19CKyt1kansUZ3VGOAOBihYYxNFuitx5VTkzOiEy4iXA) `[read]` *(accessed 2026-09-26)*; saved copy [../../sources/organizers-2026-09-26-public-data-catalog.csv](../../sources/organizers-2026-09-26-public-data-catalog.csv)
- Sweep: [../../sweeps/r5-zba-decisions-sample.md](../../sweeps/r5-zba-decisions-sample.md)
- Sweep: [../../sweeps/r1-zoning-data-code-and-reforms.md](../../sweeps/r1-zoning-data-code-and-reforms.md)
- Sweep: [../../sweeps/r2-approval-pathway-and-timelines.md](../../sweeps/r2-approval-pathway-and-timelines.md)
- [Lenze, Hinojos and Grady 2024](https://ascelibrary.com/doi/full/10.1061/JUPDDM.UPENG-4474) `[skimmed]` *(accessed 2026-09-26)*: abstract only
- [Adversarial critique](../../docs/04-critique.md) — rows 21, 29
