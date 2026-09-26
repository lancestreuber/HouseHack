# Sweep: ZBA decisions sample

**Round 5** · 2026-09-26 · single research subagent · 90 Pittsburgh Zoning Board of Adjustment decisions (hearings 2026-01-08 to 2026-07-16), hand-coded from the decision PDFs

Tags: **[read]** = fetched and read in full this session · **[skimmed]** = fetched, part read · **[found]** = URL seen in a listing or search, not opened · **[inaccessible]** = tried and blocked (blocker named).

Companion data: `pittsburghpa-2026-09-26-zba-decisions-sample.csv` in `sources/`. It has one row per decision: zone case, BDA number, dates, days, address, parcel, district, neighborhood, project, each relief item with its section and required vs proposed value, outcome code, a decision-text excerpt, the PDF URL and data-quality notes. As instructed, it contains no applicant, owner, attorney, objector or board-member names.

---

## Headline numbers

- **Sample:** 90 decisions, all [read]. The hearings ran from Jan 8 to Jul 16, 2026, across 18 meeting dates. Decisions are dated Jan 22 to Aug 28, 2026. The case labels are 65 "N of 2026" and 25 "N of 2025". The 2025 numbers were filed in 2025 and heard in 2026.
- **Approval rate:** 84 of the 90 cases are an applicant asking for a variance or special exception; the other six are third-party or administrative appeals and nonconforming-status reviews. Of those 84:
  - **81% (68) were fully approved.** 35 of the 68 carried conditions.
  - **15.5% (13) were denied,** 2 of them "without prejudice".
  - **3.6% (3) were split,** part approved and part denied.
- **Most-cited code sections, by number of cases:**
  - **§903.03**, residential-district setbacks and site standards: 18 cases, all variances.
  - **§911.02/§911.04**, use: 24 cases. 10 are use variances for a use the district doesn't allow, 12 are special-exception uses and 2 are nonconforming-status reviews.
  - **§912.04**, accessory structures: 15 cases. 9 of them are front-yard parking pads under §912.04.L.3.
  - Then **§919** signs (15 cases, 14 of them variances), **§921.02** nonconforming use change or expansion (14 cases, all special exceptions), **§916** residential compatibility (9) and **§914** parking and loading (8).
  - **None cite §906 overlays.** **§925** appears only as the §925.06.C contextual side setback (3 variance cases) and in 3 appeals of administrator exceptions.
  - **Top 3 counting variances only:** §903.03 (18), §912.04 (15), §919 (14).
- **Residential share:**
  - **21% (19/90)** of cases are new residential construction or conversions that add units: 15 new construction and 4 conversions or additions.
  - **26% (23/90)** if you also count the 4 cases that legalize or confirm existing units.
  - New residential construction: 10 of 15 fully approved, 3 denied, 1 split, and 1 third-party appeal that vacated a parking approval.
- **Days from hearing to decision (n=90):**
  - Median **34**, mean 34.5, interquartile range 26–41, range 4–74.
  - 81% were decided within 45 days of the hearing listed on the decision.
  - That hearing is the *last* hearing. At least 15 cases appeared on two or more agendas, so the total time at the ZBA is longer than these figures show.

## Method

1. **Finding the meetings.** The index page ZBA-Agendas renders its list client-side, so it came back empty [read]. Instead I requested the per-meeting pages directly on the slug pattern `.../ZBA-Agendas/ZBA-<Month>-<D>-2026`, trying every Thursday from Jan 8 to Jul 16, 2026. I also opened the Sept 3 page from the brief. Each page that existed listed the cases, the request PDFs (the "ZBA Requests Supplement") and, where posted, the **decision PDF** link.
2. **Getting the PDFs.** `curl` got an Akamai "Access Denied" 403 on every pittsburghpa.gov URL, including with a Chrome User-Agent and Referer [inaccessible]. The WebFetch tool did retrieve every PDF and saved the binary, which `pdftotext -layout` converted. All 90 decision PDFs are text-layer PDFs, so no OCR was needed.
3. **Parsing.** Every decision opens with the same caption block: Date of Hearing, Date of Decision, Zone Case, Address, Lot and Block, Zoning District, Ward, Neighborhood, Request and Application, followed by a relief table (type, section, required vs proposed). A script pulled the caption fields and the operative "Decision:" paragraph.
4. **Hand-coding.** I read and coded each relief table and decision paragraph by hand for:
   - **Relief items:** type (V = variance, SE = special exception, APPEAL, REVIEW), section as cited, and required vs proposed values.
   - **Outcome:** Approved; Approved with conditions; Denied; Denied without prejudice; Split; Appeal denied (the administrator is upheld); Appeal granted; Nonconforming status confirmed.
   - **Project category**, plus a **residential-units class:** NEW = new residential construction; CONV = a conversion or addition that adds dwelling units; LEGAL = legalizing or confirming existing units.
   - Coding rules:
     - An approval counts as "with conditions" only if the decision paragraph imposes a condition. That includes the routine "subject to DOMI curb-cut review".
     - Sections are counted once per case at the family level, e.g. all §903.03.x = §903.03.
5. **Computing.** Python tallies over the coded CSV, so the numbers above can be reproduced from that file.
6. **PII.** Decision PDFs name applicants, owners, appellants, attorneys and board members. None of those are recorded here or in the CSV; board recusal lines were stripped from the excerpts. The fields kept are address, lot/block (parcel ID), district, ward-level neighborhood and project facts.

## Access log

| Resource | Result | Tag |
|---|---|---|
| ZBA-Agendas index page | 200, but the case list isn't in the fetched HTML (rendered client-side) | [read] (empty) |
| City-Planning-Meetings calendar page | 200; only the Zoom link and contacts, no per-date links | [read] |
| Per-meeting pages 2026 **found** (200): Jan 8, Jan 15, Feb 5, Feb 12, Feb 19, Mar 5, Mar 12, Mar 19, Apr 2, Apr 9, May 7, May 14, May 21, Jun 4, Jun 11, Jun 18, Jul 2, Jul 16, Sep 3 | case lists with request and decision links extracted | [read] |
| Per-meeting slugs that **404**: Jan 22, Jan 29, Feb 26, Mar 26, Apr 16, Apr 23, May 28 | either there was no meeting or the page uses a different slug (not checked) | [inaccessible] (404) |
| Per-meeting pages **not tried**: Apr 30; Jun 25; Jul 9, 23, 30; all of Aug. Search results also show Aug 13, Oct 1 and Oct 8 pages | not visited, so any decisions posted only there are missing | [found] (Aug 13 agenda PDF, Oct 1/Oct 8 pages via search) |
| 90 decision PDFs (listed in Sources) | fetched via WebFetch, text extracted, fully coded | [read] |
| `bda-2026-05389_5743-walnut-st-zba-2026-9-3.pdf` (Sept 3 case) | a 21-page **ZBA Requests Supplement** (the application packet: 1 page of staff summary plus plans), **not** a decision. Confirms that the `bda-...-zba-<date>.pdf` files are request packets | [skimmed] (page 1) |
| `dcp-pap-2025-00289-958-manton-way-zba-2026-1-15.pdf`, linked as a "decision" on the Jan 15 page | a stamped site plan, not a decision, so excluded | [skimmed] |
| All pittsburghpa.gov URLs via `curl` with a browser UA | 403 Akamai "Access Denied" | [inaccessible] (CDN bot block) |
| Wayback CDX for the `.../zoning-board-of-adjustment/` folder | 1,091 captured URLs, mostly captured Feb 2025, including many 2021–2024 decisions ("N of 2024", `zba_NN_of_2021_...`). This is a possible route to a larger historical sample | [skimmed] |
| June 5, 2025 "/Decisions" subpage | its list is rendered client-side and came back empty; the individual decision subpages (e.g. 3120 Brereton) do link PDFs | [skimmed] |

**Meeting pages that listed a case but posted no decision.** These 13 matters are outside the sample:
- 402 Kilday Way (Jan 15; staff report only)
- 1520 Smallman St (Feb 5; staff report only)
- 1174 Mifflin Rd (Mar 5)
- 2140 Saw Mill Run Blvd (Mar 19; the page mentions a decision but gives no link)
- 3801 Sarah St (Apr 2)
- 1600 Methyl St (May 7)
- 5528 Walnut St (May 21)
- Duffield St (Jun 4)
- 5821 Aylesboro Ave and 411 Taylor St (Jul 2)
- 802 Chestnut St and 2270 Noblestown Rd (Jul 16)
- 210 East End Ave (Jul 16; its "decision" link points to the 2025 request packet)

## Results

### 1. Outcomes (n = 90)

| Outcome | n | % of 90 |
|---|---|---|
| Approved (no conditions) | 33 | 36.7% |
| Approved with conditions | 35 | 38.9% |
| Denied | 11 | 12.2% |
| Denied without prejudice (e.g. "submit a revised signage plan") | 2 | 2.2% |
| Split: part approved, part denied | 4 | 4.4% |
| Appeal denied (administrator's approval or determination upheld) | 2 | 2.2% |
| Appeal granted (approval vacated) | 1 | 1.1% |
| Nonconforming status confirmed (review; the existing 2 units may continue) | 2 | 2.2% |

The **applicant-relief subset** (n = 84) leaves out the three third-party or protest appeals, the one applicant appeal of a use determination and the two nonconforming reviews:
- **68 approved (81.0%)**, of which 35 had conditions
- **13 denied (15.5%)**
- **3 split (3.6%)**

The splits are:
- dog services: boarding denied, daycare approved
- a Sheetz-type store: retail confirmed, service station denied without prejudice
- a 2-unit new build: use variance denied, setback variance granted

Common conditions:
- DOMI curb-cut review on parking pads
- landscaping or screening
- hours and operating limits
- "no additional signage"
- time limits on temporary uses

### 2. Relief requested: sections and topics

There are 140 relief items across the 90 cases: 88 variances, 43 special exceptions, 5 appeals and 4 reviews. Each topic counts once per case.

| Topic (section) | Cases | Approved (A+AC) | Denied (D+DWP) | Split / other |
|---|---|---|---|---|
| Residential-district setbacks and site standards (§903.03) | 18 | 15 | 2 | 1 split (setback part granted) |
| Signs (§919.01–919.05) | 15 | 9 | **6 (40%)** | – |
| Nonconforming use change or expansion (§921.02, SE) | 14 | **14 (100%)** | 0 | – |
| Special-exception use (§911.02/911.04.A.x) | 12 | 11 | 0 | 1 split |
| Use variance: use not permitted in district (§911.02) | 10 | 7 | 1 | 2 split (the use part denied in both) |
| Front-yard parking pad (§912.04.L.3) | 9 | 6 | **3 (33%)** | – |
| Residential compatibility waivers (§916.04/916.09, SE) | 9 | 9 | 0 | – |
| Parking, loading, bike (§914.02, .05, .07, .10, .11) | 8 | 8 | 0 | – |
| Special-district standards (§905: P, H, RIV) | 5 | 5 | 0 | – |
| Appeals (§923.02, §911.03, §917.07; administrator exceptions under §925.06) | 5 | – | – | 2 appeals denied, 1 granted in part, 1 granted; plus 1 appeal decided alongside an approved variance |
| Other accessory structures (§912.04 height, dumpster, setbacks) | 4 | 4 | 0 | – |
| Fence height or location (§912.04.K) | 4 | 4 | 0 | – |
| §925.06.C contextual side setback cited with §903.03 (0' requested where contextual 3' is allowed by right) | 3 | 3 | 0 | – |
| Street frontage for subdivision (§926.129) | 2 | 2 | 0 | – |
| Environmental (§915.02: tree replacement, retaining wall) | 2 | 2 | 0 | – |
| Nonconforming status review (§911.02) | 2 | – | – | 2 confirmed |
| Inclusionary zoning waiver (§907.04) | 1 | 0 | 1 | – |
| Commercial height (§904.02) | 1 | 1 | 0 | – |
| **Overlays (§906)** | **0** | – | – | – |

The most common individual subsections (items): §911.02 alone (12), §921.02.A.4 change of nonconforming use (11), §912.04.L.3 parking pad (9), §921.02.A.1 expansion of nonconforming use (4), §916.04.B/916.09 dumpster compatibility (4), §919.03.M.7 (4).

What the §903.03 setback variances looked like:
- **Interior side setbacks cut to 0'**: Sheffield St, Hillcrest St (3 houses), Spring Garden Ave, Orwell Way.
- **Rear setbacks roughly halved**:
  - 15' required, 8' proposed (E Jefferson)
  - 30' required, 6'-11" proposed (Camp St)
  - 30' required, 9' proposed (Maryland Ave; denied)
- **Front setbacks**: 30' required, 5–8' proposed.
- **Generator and dumpster setbacks.**

The two §903.03 denials were a 6-inch side setback for an addition, and three 2-unit buildings on newly created lots with 5' front and 9' rear setbacks.

### 3. Residential new construction and unit additions

| Class | Cases | Outcomes | Cases (district) |
|---|---|---|---|
| NEW: new residential construction | 15 (16.7%) | 7 A, 3 AC, 3 D, 1 split, 1 appeal granted against the project | E Jefferson house (R1A-VH); 1065 Spring Garden 2-unit (R1A-H); 1406 Sheffield house (R2-H); Monongahela St 2 attached (R1D-H); 530 Mellon house, tree waiver (R2-H); 256 McKee 159 units, IZ waiver **denied** (R-MU); 724 Maryland 3×2-unit **denied** (R2-M); 5409 Hillcrest 3 houses (R2-H); 3315 Camp house (R2-L); 2227 Somers 7 multi-unit buildings (RM-M); Buena Vista St 18 townhouses (H); Kendall St 2-unit **denied** (H); Rockland Ave 2-unit, use **denied** / setback granted (R1D-H); 2560 Smallman 38 units, parking max exceeded (RIV-IMU); 49th St 15 units, parking plan **vacated on appeal** (RIV-MU) |
| CONV: conversion or addition adding units | 4 (4.4%) | 2 A, 2 AC | 1110 Middle St to 2 units (R1A-VH); 70 S 22nd St office to 6 units (R1A-VH); 1013 Chestnut St office/apt to 2 units (R1A-VH); 5904 Bryant St addition with restaurant + 3 DU (LNC) |
| LEGAL: legalize or confirm existing units | 4 (4.4%) | 2 NC confirmed, 1 A, 1 AC | 802 Boggs (R1D-H), 2306 Perrysville (R1D-H), 2530 Josephine (UI), 5742 Holden 16 DU (R2-M) |
| **Subtotal NEW + CONV** | **19 (21.1%)** | 14 of 19 fully approved | |
| **All residential-unit cases** | **23 (25.6%)** | 18 of 23 fully approved | |

Two-unit dwellings in single-unit or H districts (§911.02 use variance) came up 5 times. Three were approved (new builds in R1A-H and R1D-H, and a conversion in R1A-VH) and two denied (H; R1D-H). Two more existing 2-unit buildings in R1D-H were confirmed as legal nonconforming. For a parcel-flagging tool, "2-unit in R1" is a real ZBA risk, not a formality.

The other 67 cases break down as:
- commercial or institutional use changes and expansions: 26
- signs: 15
- front-yard parking pads: 9
- generators, dumpsters, garage and fences: 8
- appeals: 3
- subdivisions or lot creation: 3, involving existing lots or housing
- residential additions with no new units: 2
- home occupation: 1

### 4. Days from hearing to decision (n = 90)

| Statistic | Days |
|---|---|
| Min | 4 |
| Q1 | 26 |
| Median | 34 |
| Mean | 34.5 |
| Q3 | 41 |
| Max | 74 |

| Bucket | n | % |
|---|---|---|
| ≤ 14 days | 7 | 7.8% |
| 15–30 | 23 | 25.6% |
| 31–45 | 43 | 47.8% |
| 46–60 | 13 | 14.4% |
| > 60 | 4 | 4.4% |

- **By outcome:** the median is 34 days for approvals (n = 68), 34 for denials (n = 13) and 43 for splits, appeals and reviews (n = 9).
- **Fast cases (4–8 days)** are emergency or time-bound: temporary school use (4), temporary event sign (6), vehicle-sales special exception (7), and emergency generators filed on EP permits (8).
- **Slow cases (64–74 days)** are complex commercial or institutional matters:
  - grocery store with a parking reduction (74)
  - convenience store / service station (71)
  - high wall signs (70)
  - university dormitory (64)
- **Continuances:** at least 15 of the 90 cases appear on two or more of the meeting pages I visited. Examples: E Jefferson, Feb 12 then Mar 12; Buena Vista St, Mar 12 then May 14 then May 21; 1700 Murray, Mar 19 then May 7; 116 15th St, Mar 19 then May 14. The decision PDF gives the final hearing date, so **the days above measure final hearing to decision.** The time from first listing, and from filing, is longer.
- **Against the 45-day rule:** the 2024 ZBA process handout says the decision is due within 45 days of the record closing. 17 of the 90 (19%) took more than 45 days from the final hearing. The record can be held open after the hearing, so these are not necessarily violations.

### 5. Sample composition

- **District prefix:** R1D 24, R2 16, R1A 9, LNC 6, RIV 6, RM 5, UI 4, and 20 across GT, NDI, EMI, H, UNC, P, UC, R-MU and SP.
- **Most frequent neighborhoods:** Bloomfield 5, Squirrel Hill North 5, Strip District 4, Mount Washington 4, Shadyside 4, Central Lawrenceville 4.
- **Hearing dates:** Jan 8 (8), Jan 15 (5), Feb 5 (5), Feb 12 (3), Feb 19 (5), Mar 5 (6), Mar 12 (6), Mar 19 (3), Apr 2 (3), Apr 9 (5), May 7 (6), May 14 (8), May 21 (6), Jun 4 (5), Jun 11 (6), Jun 18 (4), Jul 2 (2), Jul 16 (4).

## Caveats and sample-selection bias

- **Coverage.**
  - 2026 zone-case numbers in the sample run from 1 to 101. The sample holds 65 distinct 2026 numbers, 66 if the "30 of 2025" typo is really 30 of 2026.
  - So roughly **a third of 2026 zone-case numbers issued through late August are missing.**
  - The missing ones may have been withdrawn or continued, heard at meetings I did not visit (Apr 30, Jun 25, Jul 9/23/30, August), or posted without a link. How the city assigns these numbers is [unverified].
- **Withdrawn cases are invisible.** Withdrawals and not-yet-decided cases get no decision PDF, and the pages carry no "withdrawn" label. The 13 matters listed without decisions (Access log) are the only visible trace. **The 81% approval rate is conditional on a decision being issued and posted.** If withdrawals are mostly would-be denials, the true success rate for everyone who files is lower.
- **Slug gaps.** Seven date slugs returned 404. I did not check whether those were non-meeting days or pages with different slugs.
- **Posting lag.** Decisions for the Jul 16 hearing were posted by late August. Decisions for later hearings are mostly not posted yet, so the sample stops at Jul 16.
- **Data-quality fixes** (all flagged in the CSV `notes` column):
  - 307 N Taylor's PDF prints 2025 dates. It was heard Feb 5, 2026, and the dates were corrected.
  - 6615 Kinsman says "30 of 2025" in the PDF, while the URL says 2026.
  - BDA numbers disagree between the meeting page and the PDF in 3 cases (2103 Noblestown, 5231 Penn, 2560 Smallman). The CSV keeps the PDF value.
  - Two PDFs cite §912.03 for front-yard parking; the substance is §912.04.L.3.
  - 2560 Smallman's relief table cites §914.02 but its decision cites §905.04.I.1(b).
  - Two PDFs swap the "Request" and "Application" fields; these were corrected.
- **Coding judgment.**
  - The line between "with conditions" and plain approval follows the text of the decision paragraph.
  - The residential classes (NEW/CONV/LEGAL) are my reading of each decision. Examples: 5742 Holden, 16 units in use since the 1980s, is LEGAL; 150 Almond, a subdivision of existing rowhouses, is not residential construction.
  - 146 of 2025 (fence) is captioned as a special exception but decided as a variance; it is coded as a variance.
- **This sample is not Lenze et al.'s 2020 population.** Their 210 applications in 2020 imply roughly 200 ZBA cases a year, so this sample is about 5–6 months of decisions. It says nothing about seasonality or multi-year trends.
- **Counting unit.** Topic counts are per case, and one case often carries several relief items. Approval rates by topic use the case outcome. The only case where the requested items got different results is a split, and splits are shown separately.
- **Not checked:** the Wayback archive of about 1,000 older (2021–2024) decision PDFs, which is a route to a multi-year dataset; and the Sept 3 / Oct 2026 meetings, whose decisions are not yet issued.

## Per-case table (n = 90)

Codes: V = variance, SE = special exception. "u" = dwelling units. NEW / CONV / LEGAL = residential-units class. Days = final hearing to decision.

| # | Zone case | BDA / application | Hearing | Days | Address | Parcel | District | Neighborhood | Project | Relief (type §section: req / proposed) | Outcome |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 158 of 2025 | BDA-2025-06620 | 2026-01-08 | 22 | 1065 Spring Garden Avenue | 24-F-196 | R1A-H | Spring Garden | Construction of 2-unit residential structure (NEW, 2 u) | V §911.02: 2-unit residential prohibited in R1A-H<br>V §903.03.D: interior side setback 5' req / 0' prop | Approved |
| 2 | 162 of 2025 | BDA-2025-08317 | 2026-01-08 | 35 | 1464 Smallman Street | 9-G-13 | GT-B | Strip District | Wall signs | V §919.03.M.7: wall sign 80 sf max / 111 sf and 130 sf prop | Denied w/o prejudice |
| 3 | 152 of 2025 | BDA-2025-10308 | 2026-01-08 | 41 | 1709 Saw Mill Run Boulevard | 60-N-115 | NDI | Carrick | Dumpster screening | V §912.04.H: dumpster enclosure/screening waiver | Approved |
| 4 | 128 of 2025 | BDA-2025-08535 | 2026-01-08 | 20 | 1923 Broadway Avenue | 35-P-9 | R1D-M | Beechview | Funeral home to art studio/gallery with existing upstairs unit | SE §921.02.A.4: change of nonconforming use | Approved |
| 5 | 156 of 2025 | BDA-2025-10840 | 2026-01-08 | 22 | 213 Smith Way | 4-P-285, 4-P-284 | R1D-H | Mount Washington | Addition | V §903.03.D: side setback 5' req / 6in prop | Denied |
| 6 | 164 of 2025 | BDA-2025-10536 | 2026-01-08 | 20 | 530 Mellon Street | 83-F-206 | R2-H | East Liberty | Construction of house (NEW, 1 u) | V §915.02.D: tree replacement for removal of 40in tree - waiver | Approved w/ cond. |
| 7 | 141 of 2025 | BDA-2025-09507 | 2026-01-08 | 20 | 5308 Ellsworth Avenue | 52-C-149 | R2-M | Shadyside | Parking pad | V §912.04.L.3: front yard parking prohibited | Denied |
| 8 | 134 of 2025 | BDA-2025-09147 | 2026-01-08 | 39 | Monongahela Street | 55-P-82 | R1D-H | Hazelwood | Two attached single-family houses (NEW, 2 u) | V §911.02: 2-unit residential not permitted in R1D-H | Approved |
| 9 | 166 of 2025 | BDA-2025-05447 | 2026-01-15 | 35 | 1110 Middle Street | 23-M-144 | R1A-VH | East Allegheny | Conversion of existing structure to two units (CONV, 2 u) | V §911.02: 2-unit residential not permitted in R1A-VH | Approved |
| 10 | 190 of 2025 | BDA-2025-10490 | 2026-01-15 | 34 | 1406 Sheffield Street | 22-P-260 | R2-H | Manchester | Construction of single-family house (NEW, 1 u) | V §903.03.D.2/925.06.C: interior side setback 3' req / 0' prop | Approved |
| 11 | 160 of 2025 | BDA-2025-06335 | 2026-01-15 | 41 | 201 S. Pacific Avenue | 50-R-170 | R2-M | Bloomfield | Home occupation for dog services; boarding denied, daycare/walking approved w/ conditions | REVIEW §912.05: home occupation standards<br>V §912.05.B.5: home-occupation noise<br>V §911.02: animal care (limited) use - boarding | Split |
| 12 | 173 of 2025 | BDA-2025-11861 | 2026-01-15 | 34 | 341 Orwell Way | 26-D-109-B | R2-H | Bloomfield | One-story rear addition | V §903.03.E/925.06.C: rear setback 15' req / 11'-10" prop; interior side 3' req / 0' prop | Approved |
| 13 | 171 of 2025 | BDA-2024-00051 | 2026-01-15 | 7 | 8012 Conemaugh Street | 174-S-231, 174-S-200, 174-M-3, 174-M-6 | LNC, NDI | East Hills | Vehicle sales/service occupancy | SE §911.02/911.04.A.75: vehicle/equipment sales (limited) | Approved |
| 14 | 178 of 2025 | BDA-2025-05757 | 2026-02-05 | 32 | 2103 Noblestown Avenue | 39-D-165 | UNC | Westwood | Supermarket wall sign | V §919.03.M.5(a): wall sign 80 sf max / 198 sf prop | Approved w/ cond. |
| 15 | 172 of 2025 | DCP-ZDR-2024-02267 | 2026-02-05 | 56 | 256 McKee Place | 28-F-308 | R-MU | Central Oakland | 159-unit multi-unit building (NEW, 159 u) | V §907.04: inclusionary zoning 16 affordable units req / 0 prop | Denied |
| 16 | 168 of 2025 | BDA-2025-11244 | 2026-02-05 | 30 | 307 N. Taylor Avenue | 23-K-187 | R1A-H | Central Northside | Renovation for bakery | SE §921.02.A.4: change of nonconforming use | Approved w/ cond. |
| 17 | 175 of 2025 | BDA-2025-10213 | 2026-02-05 | 56 | 5280 Northumberland Street | 53-G-70, 53-C-1 | EMI, R1D-L | Squirrel Hill North | Addition to existing club | SE §921.02.A.1: expansion of nonconforming use<br>SE §914.02/914.07.G.2: 80 additional parking spaces req; alternative access/parking plan | Approved |
| 18 | 154 of 2025 | BDA-2025-10720 | 2026-02-05 | 70 | 75 Hopper Place | 25-F-288 | RIV-IMU | Strip District | Wall signs | V §919.03.M.5: wall sign max height 20' / 42'-43' prop; 3rd-floor placement; 80 sf area<br>REVIEW §prior condition: condition from 2021 case barring more signs | Denied w/o prejudice |
| 19 | 6 of 2026 | BDA-2025-11682 | 2026-02-12 | 27 | 1200 Goettmann Street | 24-G-270 | P | Troy Hill | Community center with outdoor recreation | SE §911.02/911.04.A.14: community center (general)<br>SE §916.04.B/916.09: trash area residential compatibility 30' / 13'-4"<br>V §905.01.C: front setback 30' / 23'-4" (bldg), 20' (parking) | Approved |
| 20 | 181 of 2025 | BDA-2025-11615 | 2026-02-12 | 42 | 3520 Forbes Avenue | 28-F-368 | UC-E | Central Oakland | Wall signs (window decals) | V §919.03.M.5(a): wall sign 80 sf / 185 and 219 sf | Approved w/ cond. |
| 21 | 169 of 2025 | BDA-2025-11184 | 2026-02-12 | 34 | 724 Maryland Avenue | 84-N-275, 84-N-277 | R2-M | Shadyside | Three two-unit buildings on three new lots (NEW, 6 u) | V §903.03.C: exterior side 30' / 13'-5"; rear 30' / 9'; front 30' / 5' | Denied |
| 22 | 177 of 2025 | DCP-PAP-2025-00304 | 2026-02-19 | 46 | 115 E. Jefferson Street | 23-F-175 | R1A-VH | Central Northside | Neighbor appeal of deck approval | APPEAL §923.02.B/D (925.06.G): appeal of Administrator Exception for deck in side setback - granted in part (3.5' usable setback) | Split |
| 23 | 5 of 2026 | BDA-2025-11386 | 2026-02-19 | 42 | 756 S. Millvale Avenue | 51-J-43, 51-J-46 | R2-M | Bloomfield | Parking expansion for rental car business | SE §921.02.A.1: expansion of nonconforming use<br>V §921.02.A.1.a.1: expansion beyond % limit<br>V §903.03.C.2: front setback 30' / 2'; interior side 5' / 1' | Approved |
| 24 | 4 of 2026 | BDA-2025-12890 | 2026-02-19 | 19 | 802 Boggs Avenue | 15-J-81 | R1D-H | Mount Washington | Use of existing building for two units (LEGAL) | REVIEW §911.02: 2-unit residential in R1D-H - nonconforming status | NC status confirmed |
| 25 | 15 of 2026 | BDA-2026-00608 | 2026-02-19 | 18 | 814 Kroll Drive | 7-F-25 | RIV-IMU | Chateau | Temporary helistop | SE §911.02/911.04.A.28,31,32: helistop use<br>SE §914.07.G.2: off-site parking<br>V §911.04.A.28(H): 50' setback from lot lines - reduced<br>V §905.04.E.4: riverfront 125' setback - reduced for fence | Approved w/ cond. |
| 26 | 8 of 2026 | BDA-2025-03714 | 2026-02-19 | 35 | Grape Street | 14-R-230 | R1D-H | Knoxville | Playground construction | SE §911.02/911.04.A.46: parks and recreation (limited)<br>SE §916.04.A/916.09: residential compatibility playground setback 50' / 18'-11"<br>V §903.03.D.2/912.03: front setback 15' / 3'; exterior side 15' / 0' and 9' | Approved |
| 27 | 103 of 2025 | DCP-LOT-2025-00171 | 2026-03-05 | 27 | 150 Almond Way | 49-A-295 | RIV-IMU | Central Lawrenceville | Subdivision into two lots (existing rowhouses) | V §911.02: single-unit attached residential prohibited in RIV-IMU | Approved |
| 28 | 9 of 2026 | BDA-2025-10163 | 2026-03-05 | 39 | 1709 Termon Avenue | 75-B-101 | R2-M | Brighton Heights | Dumpster enclosure | V §903.03.C.2: front setback 20' / 0'; side 5' / 1' | Approved |
| 29 | 12 of 2026 | BDA-2025-12114 | 2026-03-05 | 33 | 200 The Boulevard | 60-H-32, 30, 28 | R1D-H | Carrick | New parking area and playground at school | V §903.03.D.2: front setback 15' / 3' and 5' (parking); side 5' / 1' (dumpster)<br>V §912.04.K.1: front-yard fence 4' max / 5'<br>V §912.04: accessory structure height 15' / 15'-11"<br>SE §916.04.B/916.09: dumpster residential compatibility<br>SE §916.04.A/916.09: playground residential compatibility | Approved w/ cond. |
| 30 | 1 of 2026 | BDA-2025-09438 | 2026-03-05 | 43 | 3108 McClure Avenue | 44-D-78, 80, 81-B and 83 | UI | Marshall Shadeland | Lot for construction material storage | APPEAL §911.03: ZA determination that use is most similar to salvage yard | Appeal denied |
| 31 | 10 of 2026 | BDA-2025-12551 | 2026-03-05 | 39 | 5409 Hillcrest Street | 50-H-144, 142, 140 | R2-H | Garfield | Three houses (NEW, 3 u) | V §903.03.D.2/925.06.C: interior side setback 3' / 0' | Approved w/ cond. |
| 32 | 146 of 2025 | BDA-2025-00389 | 2026-03-05 | 33 | 935 South Side Avenue | 47-E-22 | R1D-L | Spring Hill City View | Fence | V §912.04.K.1: front/exterior-side fence 4' open max / 6' solid | Approved w/ cond. |
| 33 | 13 of 2026 | BDA-2026-00053 | 2026-03-12 | 46 | 119 Kearsarge Street | 4-B-209 | R2-H | Mount Washington | Two-car parking pad | V §912.04.L.3: front yard parking prohibited | Approved w/ cond. |
| 34 | 149 of 2025 | DCP-LOT-2025-00247 | 2026-03-12 | 33 | 1316 Juniata Street | 22-K-76, 77 | R1A-VH | Manchester | Subdivision | V §926.129: street frontage required | Approved |
| 35 | 14 of 2026 | BDA-2024-06371 | 2026-03-12 | 46 | 4103 Beechwood Boulevard | 54-L-184 | RM-M | Beechwood | Two-story garage | V §912.04.E: accessory height 15'/1 story / 20'-5"/2 stories | Approved |
| 36 | 17 of 2026 | BDA-2025-12751 | 2026-03-12 | 46 | 4644 Forbes Avenue | 52-N-59 | EMI | North Oakland | Restaurant | SE §911.02/911.04.A.57: restaurant (general) in EMI | Approved |
| 37 | 21 of 2026 | BDA-2025-12010 | 2026-03-12 | 46 | 710 Dunster Street | 61-B-94 | R1D-H | Brookline | Parking pad | V §912.04.L.3: front yard parking prohibited | Approved w/ cond. |
| 38 | 3 of 2026 | BDA-2025-01446 | 2026-03-12 | 44 | East Jefferson Street | 23-F-131 | R1A-VH | Central Northside | New 3-story house on vacant lot (NEW, 1 u) | V §903.03.E: rear setback 15' req / 8' prop<br>APPEAL §923.02.B/D (925.06.G): third-party appeal of Administrator Exception for decks in side setback - appeal denied | Approved |
| 39 | 22 of 2026 | BDA-2025-12527 | 2026-03-19 | 41 | 185 41st Street | 49-B-145 | LNC | Central Lawrenceville | Vehicle sales | SE §911.02/911.04.A.75: vehicle/equipment sales (limited) | Approved |
| 40 | 20 of 2026 | BDA-2025-09448 | 2026-03-19 | 41 | 3106 Viola Street | 77-F-246 | R1D-L | Perry North | Parking pad | V §912.04.L.3: front yard parking prohibited | Approved w/ cond. |
| 41 | 29 of 2026 | BDA-2026-01129 | 2026-03-19 | 6 | 600 Commonwealth Place | 1-C-190 | GT-D | Central Business District | Temporary event sign | V §919.05: temporary event sign 378 sf / 38,908 sf<br>V §919.03.M.7: electronic signs prohibited in GT<br>V §919.02.C/919.03.O: dwell/twirl time | Approved w/ cond. |
| 42 | 16 of 2026 | BDA-2026-00297 | 2026-04-02 | 27 | 3315 Camp Street | 27-B-14 | R2-L | Upper Hill | Construction of house (NEW, 1 u) | V §903.03.B.2: rear setback 30' / 6'-11"; front 30' / 8' | Approved |
| 43 | 31 of 2026 | BDA-2025-11639 | 2026-04-02 | 32 | 51 Philander Street | 129-G-211 | R1D-L | Swisshelm Park | Parking pad | V §912.04.L.3: front yard parking prohibited | Approved w/ cond. |
| 44 | 24 of 2026 | BDA-2026-00600 | 2026-04-02 | 56 | 921 Saw Mill Run Boulevard | 5-L-110 | UI, P | Duquesne Heights | Electronic advertising sign | SE §919.02.C.3: electronic advertising sign | Denied |
| 45 | 33 of 2026 | EP-2026-01018 | 2026-04-09 | 8 | 1400 Bennington Street | 86-A-27 | R1D-VL | Squirrel Hill North | Emergency generator | V §903.03.A: exterior side setback 30' / 11' | Approved |
| 46 | 18 of 2026 | BDA-2025-11995 | 2026-04-09 | 36 | 3400 Fifth Avenue | 28-F-63, 67, 68, 69 | UC-E | Central Oakland | 15-space commercial parking lot | V §911.02: commercial parking (limited) prohibited in UC-E<br>V §922.15: surface parking prohibited in UC-E | Approved w/ cond. |
| 47 | 35 of 2026 | BDA-2025-11814 | 2026-04-09 | 28 | 4811 Butler Street | 80-K-209 | LNC | Central Lawrenceville | Electronic sign (already installed; ordered removed) | V §919.03.O.3: electronic signs prohibited | Denied |
| 48 | 32 of 2026 | BDA-2025-11579 | 2026-04-09 | 26 | 5253 Liberty Avenue | 51-L-262 | UNC | Bloomfield | Restaurant | SE §911.02/911.04.A.57: restaurant (general) | Approved |
| 49 | 30 of 2025 | EP-2026-00111 | 2026-04-09 | 8 | 6615 Kinsman Road | 126-N-306 | R1D-L | Squirrel Hill North | Emergency generator | V §903.03.B: side setback 5' / 6in | Approved |
| 50 | 41 of 2026 | BDA-2026-00202 | 2026-05-07 | 21 | 1400 Troy Hill Road | 24-D-215 | R1D-H | Troy Hill | School electronic sign | V §919.03.O.3: electronic non-advertising sign not permitted in R1 | Approved w/ cond. |
| 51 | 26 of 2026 | BDA-2026-00955 | 2026-05-07 | 74 | 1700 Murray Avenue | 86-L-13 | LNC | Squirrel Hill South | Renovation for grocery store | SE §911.02/911.04.A.83.c: grocery store (general)<br>SE §914.02/914.11.A.1: parking 79 req / 23 prop | Approved w/ cond. |
| 52 | 2 of 2026 | BDA-2025-10279 | 2026-05-07 | 32 | 2100 Wharton Street | 12-F-270 | UI | South Side Flats | Roof sign | V §919.03.M.6.a: sign area 80 sf / 344.5 sf; height 40' / 90'<br>V §919.01.E.6: roof signs prohibited | Denied |
| 53 | 25 of 2026 | BDA-2025-12833 | 2026-05-07 | 71 | 2501 Banksville Road | 36-S-155 | NDI | Banksville | Convenience/gas store; retail confirmed, service station denied without prejudice | SE §911.02/911.04.A.65: convenience store/service station<br>V §911.04.A.65.f: 150' from residential district / 30' | Split |
| 54 | 42 of 2026 | BDA-2026-01923 | 2026-05-07 | 20 | 2860 Perrysville Avenue | 77-K-325 | R1D-H | Perry South | Funeral home to office | SE §921.02.A.4: change of nonconforming use<br>SE §916.09: residential compatibility noise (HVAC) | Approved |
| 55 | 36 of 2026 | BDA-2025-12852 | 2026-05-07 | 39 | 5904 Bryant Street | 82-M-181 | LNC | Highland Park | Addition to mixed-use building for restaurant and three dwelling units (CONV, 3 u) | V §904.02.C: height 45'/3 stories / 38'/4 stories<br>SE §916.02.A.8/916.09: residential compatibility 15' rear setback waiver<br>V §914.02: parking 3 req / 1 prop<br>V §914.10: loading 1 req / 0 prop<br>SE §916.04.B/916.09: dumpster residential compatibility 30' | Approved w/ cond. |
| 56 | 27 of 2026 | BDA-2025-12930 | 2026-05-14 | 40 | 116 15th Street | 9-G-170 | SP-8 | Strip District | Wall sign | V §919.03.M.7: wall sign height 40' / 69' | Denied |
| 57 | 47 of 2026 | BDA-2026-01507 | 2026-05-14 | 18 | 1222 Muldowney Avenue | 184-J-237 | R1D-L | Lincoln Place | Funeral home to dental office | SE §921.02.A.4: change of nonconforming use | Approved |
| 58 | 45 of 2026 | BDA-2025-08528 | 2026-05-14 | 32 | 2227 Somers Drive | 10-F-200, 300, 400 | RM-M | Bedford Dwellings | Seven multi-unit residential buildings (NEW, multi u) | V §903.03.C.2: front 25' / 20' and 15'; exterior side 25' / 8'-15'<br>V §912.04.K.1: fence 4' / 6'<br>V §914.02: parking 46 req / 38 prop<br>V §914.05.D.2(a): 60% protected bike parking / 0<br>V §912.04: dumpster exterior side 25' / 15' | Approved |
| 59 | 40 of 2026 | BDA-2026-01465 | 2026-05-14 | 33 | 2728 Custer Avenue | 94-B-306 | R1D-L | Carrick | Change to religious assembly | SE §911.02/911.04.A.53: religious assembly (general)<br>SE §914.07.G.2: off-site parking<br>V §903.03.B.2: front 30' / 0'; side 5' / 0' (parking)<br>SE §916.04.C/916.09: residential compatibility parking setback 15' / 0' | Approved w/ cond. |
| 60 | 57 of 2026 | BDA-2026-01929 | 2026-05-14 | 14 | 2729 Murray Avenue | 87-G-64 | RM-M | Squirrel Hill South | Medical office/retail to office | SE §921.02.A.4: change of nonconforming use | Approved w/ cond. |
| 61 | 52 of 2026 | DCP-LOT-2026-00072 | 2026-05-14 | 14 | 353 Cedarville Street | 26-D-399 | R2-VH | Bloomfield | Subdivision | V §926.129: lot without street frontage | Approved |
| 62 | 49 of 2026 | BDA-2026-01366 | 2026-05-14 | 41 | 5898 Wilkins Avenue | 28-F-206 | R1D-VL | Squirrel Hill North | Generator | SE §916.09: residential compatibility noise waiver | Approved w/ cond. |
| 63 | 23 of 2026 | BDA-2025-06337 | 2026-05-14 | 18 | 70 S 22nd Street | 12-F-324 | R1A-VH | South Side Flats | Offices to 6-unit residential (CONV, 6 u) | SE §921.02.A.4: change of nonconforming use | Approved w/ cond. |
| 64 | 53 of 2026 | BDA-2026-00633 | 2026-05-21 | 26 | 2306 Perrysville Avenue | 46-K-124 | R1D-H | Perry South | Use of building as two units (LEGAL) | REVIEW §911.02: 2-unit residential in R1D-H - nonconforming status | NC status confirmed |
| 65 | 46 of 2026 | BDA-2026-01401 | 2026-05-21 | 40 | 30 Isabella Street | 8-H-211 | RIV-NS | North Shore | High wall sign | V §919.03.M.7(c): high wall sign; 2% facade area | Approved w/ cond. |
| 66 | 56 of 2026 | BDA-2026-01015 | 2026-05-21 | 26 | 320 Cedarhurst Street | 15-M-131 | R2-H | Beltzhoover | Ground sign | V §919.01.F/919.03.N.2: ground sign identifying nonconforming use; 0' setback | Approved |
| 67 | 50 of 2026 | BDA-2025-03224 | 2026-05-21 | 41 | 625 W. Warrington Avenue | 15-P-146 | P | Mount Washington | Expansion of auto sales use | SE §921.02.A.1: expansion of nonconforming use<br>V §921.02.A.1: expansion >25%<br>V §905.01.C: front 30' / 0'; rear 20' / 0'; exterior side 20' / 0'<br>V §918.03: screening | Approved w/ cond. |
| 68 | 19 of 2026 | BDA-2025-12227 | 2026-05-21 | 46 | Buena Vista Street | 23-A-192, 196, 213, 23-E-12 | H | Perry South | 18 single-unit attached houses (NEW, 18 u) | V §911.02: unlisted use similar to multi-unit residential in H<br>V §905.02.C: height 3 stories / 4 | Approved w/ cond. |
| 69 | 58 of 2026 | BDA-2025-09345 | 2026-05-21 | 28 | Kendall Street | 81-A-152 | H | Upper Lawrenceville | Construction of two-unit residence (NEW, 2 u) | V §911.02: 2-unit residential prohibited in H | Denied |
| 70 | 43 of 2026 | BDA-2026-01492 | 2026-06-04 | 40 | 226 N. Negley Avenue | 83-J-277, 83-J-280 | RM-M | East Liberty | Addition to nonconforming convenience store | SE §921.02.A.2: change of nonconforming use<br>V §921.02.A.4: expansion >25%<br>V §903.03.C: rear 25' / 12'; exterior side 30' / less<br>V §914.10: loading 1 / 0<br>SE §916.04.B/916.09: dumpster residential compatibility | Approved w/ cond. |
| 71 | 66 of 2026 | BDA-2026-01363 | 2026-06-04 | 36 | 2530 Josephine Street | 12-S-239 | UI | South Side Slopes | Use of building for two units (de facto) (LEGAL) | SE §921.02.A.4: change of nonconforming use to 2-unit residential | Approved w/ cond. |
| 72 | 59 of 2026 | BDA-2026-02291 | 2026-06-04 | 33 | 7534 Kensington Street | 176-A-281 | R1D-L | Point Breeze | Parking pad | V §912.04.L.3: front yard parking prohibited | Denied |
| 73 | 63 of 2026 | BDA-2026-03277 | 2026-06-04 | 20 | 901 N. Saint Claire Street | 82-R-93 | R2-M | Highland Park | Convenience store to yoga studio | SE §921.02.A.4: change of nonconforming use | Approved w/ cond. |
| 74 | 51 of 2026 | BDA-2025-01286 | 2026-06-04 | 46 | Danley Street | 20-F-219, 225, 226, 230, 232, 234, 237, 237-1 | H | Elliott | Warehouse | V §911.02: warehouse (limited) prohibited in H<br>V §905.02.C: max site disturbance 50% / 79%<br>V §915.02.A.1(e): retaining wall 10' / 13' | Approved w/ cond. |
| 75 | 71 of 2026 | BDA-2026-03415 | 2026-06-11 | 46 | 107 6th Street | 8-S-68 | GT-C | Central Business District | Projecting sign | V §919.03.M: sign area 9 sf / 30 sf | Approved |
| 76 | 69 of 2026 | BDA-2026-03534 | 2026-06-11 | 40 | 1345 Windermere Drive | 129-D-257 | R1D-L | Swisshelm Park | Parking pad | V §912.04.L.3: front yard parking prohibited | Denied |
| 77 | 72 of 2026 | DCP-PAP-2026-00101 | 2026-06-11 | 57 | 1639 Denniston Street | 86-H-216 | R2-L | Squirrel Hill North | Neighbor appeal of porch approval | APPEAL §923.02.D/925.06.A.14: appeal of zoning approval of porch in front setback | Appeal denied |
| 78 | 70 of 2026 | BDA-2025-12731 | 2026-06-11 | 41 | 2515 Banksville Road | 36-S-27 | NDI | Banksville | Wall sign | V §919.03.M.6(a): wall sign 80 sf / 225 sf | Approved w/ cond. |
| 79 | 68 of 2026 | BDA-2026-03872 | 2026-06-11 | 64 | 4337 Fifth Avenue | 27-M-53 | EMI | North Oakland | University dormitory | SE §911.02/911.04.A.23: dormitory<br>SE §911.04.A.57.a: restaurant (general) | Approved w/ cond. |
| 80 | 39 of 2026 | BDA-2026-01379 | 2026-06-11 | 40 | 5742 Holden Street | 84-N-255, 84-N-260 | R2-M | Shadyside | Occupancy for 16-unit building (LEGAL) | SE §921.02.A.4: change of nonconforming use | Approved |
| 81 | 76 of 2026 | BDA-2025-01786 | 2026-06-18 | 33 | 3412 Ligonier Street | 26-A-5, 26-A-6, 26-A-7 | R1A-H, LNC | Lower Lawrenceville | Three-stall parking area | V §912.01.D: accessory use in different district<br>SE §916.04.C/916.09: residential compatibility 15' / 5' | Approved w/ cond. |
| 82 | 38 of 2026 | DCP-PAP-2026-00058 | 2026-06-18 | 46 | 49th Street | 80-F-97 | RIV-MU | Central Lawrenceville | Appeal of parking plan for 15-unit residential (NEW, 15 u) | APPEAL §917.07.D.1: appeal of ZA approval of alternative access and parking plan - granted, approval vacated | Appeal granted |
| 83 | 82 of 2026 | BDA-2026-03730 | 2026-06-18 | 34 | 5436 Walnut Street | 52-D-244 | LNC | Shadyside | Projecting signs | V §919.03.M.8: 1 projecting sign / 2 | Approved w/ cond. |
| 84 | 73 of 2026 | BDA-2024-03589 | 2026-06-18 | 35 | 962 Proctor Way | 14-G-232 | R1D-H | Allentown | Existing front-yard parking pad | V §912.04.L.3: front yard parking prohibited | Approved w/ cond. |
| 85 | 83 of 2026 | BDA-2026-04217 | 2026-07-02 | 21 | 1518 Valentine Street | 24-D-136 | R1D-H | Troy Hill | Parking pad | V §912.04.L.3: front yard parking prohibited | Approved w/ cond. |
| 86 | 94 of 2026 | BDA-2026-12682 | 2026-07-02 | 4 | 5231 Penn Avenue | 50-L-306 | R1D-H | Garfield | Temporary school use | SE §911.02/911.04.A.63.a: school (limited) temporary | Approved w/ cond. |
| 87 | 98 of 2026 | BDA-2026-04103 | 2026-07-16 | 32 | 1013 Chestnut Street | 24-J-238 | R1A-VH | East Allegheny | Office/apartment to 2-unit (CONV, 2 u) | SE §921.02.A.4: change of nonconforming use | Approved |
| 88 | 95 of 2026 | BDA-2026-02224 | 2026-07-16 | 28 | 1134 Sheffield Street | 22-R-148 | RM-M | Manchester | 8-ft open fence | V §912.04.K.2: fence in exterior side setback | Approved |
| 89 | 101 of 2026 | BDA-2026-02153 | 2026-07-16 | 43 | 2560 Smallman Street | 25-N-104 | RIV-IMU | Strip District | 38-unit multi-unit building (NEW, 38 u) | V §914.02 (decision cites 905.04.I.1(b)): max parking 38 / 68 | Approved |
| 90 | 96 of 2026 | BDA-2026-02055 | 2026-07-16 | 33 | Rockland Avenue | 35-D-22 | R1D-H | Beechview | New two-unit structure (NEW, 2 u) | V §911.02: 2-unit residential not permitted in R1D-H (DENIED)<br>V §903.03.D.2: exterior side 15' / 5' (APPROVED) | Split |

## Sources

Meeting pages and indexes:
- [read] ZBA Agendas index: https://www.pittsburghpa.gov/Business-Development/City-Planning/City-Planning-Meetings/ZBA-Agendas (accessed 2026-09-26)
- [read] City Planning Meeting Calendar: https://www.pittsburghpa.gov/Business-Development/City-Planning/City-Planning-Meetings (accessed 2026-09-26)
- [read] ZBA Jan 8, 2026: https://www.pittsburghpa.gov/Business-Development/City-Planning/City-Planning-Meetings/ZBA-Agendas/ZBA-January-8-2026 (accessed 2026-09-26)
- [read] ZBA Jan 15, 2026: https://www.pittsburghpa.gov/Business-Development/City-Planning/City-Planning-Meetings/ZBA-Agendas/ZBA-January-15-2026 (accessed 2026-09-26)
- [read] ZBA Feb 5, 2026: https://www.pittsburghpa.gov/Business-Development/City-Planning/City-Planning-Meetings/ZBA-Agendas/ZBA-February-5-2026 (accessed 2026-09-26)
- [read] ZBA Feb 12, 2026: https://www.pittsburghpa.gov/Business-Development/City-Planning/City-Planning-Meetings/ZBA-Agendas/ZBA-February-12-2026 (accessed 2026-09-26)
- [read] ZBA Feb 19, 2026: https://www.pittsburghpa.gov/Business-Development/City-Planning/City-Planning-Meetings/ZBA-Agendas/ZBA-February-19-2026 (accessed 2026-09-26)
- [read] ZBA Mar 5, 2026: https://www.pittsburghpa.gov/Business-Development/City-Planning/City-Planning-Meetings/ZBA-Agendas/ZBA-March-5-2026 (accessed 2026-09-26)
- [read] ZBA Mar 12, 2026: https://www.pittsburghpa.gov/Business-Development/City-Planning/City-Planning-Meetings/ZBA-Agendas/ZBA-March-12-2026 (accessed 2026-09-26)
- [read] ZBA Mar 19, 2026: https://www.pittsburghpa.gov/Business-Development/City-Planning/City-Planning-Meetings/ZBA-Agendas/ZBA-March-19-2026 (accessed 2026-09-26)
- [read] ZBA Apr 2, 2026: https://www.pittsburghpa.gov/Business-Development/City-Planning/City-Planning-Meetings/ZBA-Agendas/ZBA-April-2-2026 (accessed 2026-09-26)
- [read] ZBA Apr 9, 2026: https://www.pittsburghpa.gov/Business-Development/City-Planning/City-Planning-Meetings/ZBA-Agendas/ZBA-April-9-2026 (accessed 2026-09-26)
- [read] ZBA May 7, 2026: https://www.pittsburghpa.gov/Business-Development/City-Planning/City-Planning-Meetings/ZBA-Agendas/ZBA-May-7-2026 (accessed 2026-09-26)
- [read] ZBA May 14, 2026: https://www.pittsburghpa.gov/Business-Development/City-Planning/City-Planning-Meetings/ZBA-Agendas/ZBA-May-14-2026 (accessed 2026-09-26)
- [read] ZBA May 21, 2026: https://www.pittsburghpa.gov/Business-Development/City-Planning/City-Planning-Meetings/ZBA-Agendas/ZBA-May-21-2026 (accessed 2026-09-26)
- [read] ZBA Jun 4, 2026: https://www.pittsburghpa.gov/Business-Development/City-Planning/City-Planning-Meetings/ZBA-Agendas/ZBA-June-4-2026 (accessed 2026-09-26)
- [read] ZBA Jun 11, 2026: https://www.pittsburghpa.gov/Business-Development/City-Planning/City-Planning-Meetings/ZBA-Agendas/ZBA-June-11-2026 (accessed 2026-09-26)
- [read] ZBA Jun 18, 2026: https://www.pittsburghpa.gov/Business-Development/City-Planning/City-Planning-Meetings/ZBA-Agendas/ZBA-June-18-2026 (accessed 2026-09-26)
- [read] ZBA Jul 2, 2026: https://www.pittsburghpa.gov/Business-Development/City-Planning/City-Planning-Meetings/ZBA-Agendas/ZBA-July-2-2026 (accessed 2026-09-26)
- [read] ZBA Jul 16, 2026: https://www.pittsburghpa.gov/Business-Development/City-Planning/City-Planning-Meetings/ZBA-Agendas/ZBA-July-16-2026 (accessed 2026-09-26)
- [read] ZBA Sep 3, 2026: https://www.pittsburghpa.gov/Business-Development/City-Planning/City-Planning-Meetings/ZBA-Agendas/ZBA-September-3-2026 (accessed 2026-09-26)
- [inaccessible] (404) ZBA-January-22-2026, ZBA-January-29-2026, ZBA-February-26-2026, ZBA-March-26-2026, ZBA-April-16-2026, ZBA-April-23-2026, ZBA-May-28-2026, same URL pattern (accessed 2026-09-26)
- [skimmed] ZBA June 5, 2025 Decisions subpage (client-rendered, empty): https://www.pittsburghpa.gov/Business-Development/City-Planning/City-Planning-Meetings/ZBA-Agendas/Zoning-board-of-Adjustment-June-5-2025/Decisions (accessed 2026-09-26)
- [skimmed] 3120 Brereton decision subpage (links a PDF): https://www.pittsburghpa.gov/Business-Development/City-Planning/City-Planning-Meetings/ZBA-Agendas/Zoning-board-of-Adjustment-June-5-2025/Decisions/3120-Brereton-ZBA-Decision (accessed 2026-09-26)
- [skimmed] ZBA Requests Supplement, 5743 Walnut St (request packet, not a decision): https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/bda-2026-05389_5743-walnut-st-zba-2026-9-3.pdf (accessed 2026-09-26)
- [skimmed] 958 Manton Way site plan, linked as a decision (excluded): https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/dcp-pap-2025-00289-958-manton-way-zba-2026-1-15.pdf (accessed 2026-09-26)
- [skimmed] Wayback CDX listing for the ZBA documents folder: https://web.archive.org/cdx/search/cdx?url=pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/&matchType=prefix (accessed 2026-09-26)
- [found] ZBA Aug 13, 2026 agenda PDF: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/2026-8-13-zba-agenda-updated.pdf (accessed 2026-09-26)
- [found] ZBA Oct 1 and Oct 8, 2026 pages: https://www.pittsburghpa.gov/Business-Development/City-Planning/City-Planning-Meetings/ZBA-Agendas/ZBA-October-1-2026 , https://www.pittsburghpa.gov/Business-Development/City-Planning/City-Planning-Meetings/ZBA-Agendas/ZBA-October-8-2026 (accessed 2026-09-26)
- [found] ZBA process handout (45-day decision rule, cited from the Round 2 sweep, not re-read): https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/process-guides-and-handouts/process-guide-handout-zba-2024.pdf (accessed 2026-09-26)

Decision PDFs (90), in hearing-date order:
- [read] ZBA decision, Zone Case 158 of 2025, 1065 Spring Garden Avenue: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/1065-spring-garden-zba-decision-158-of-2026.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 162 of 2025, 1464 Smallman Street: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/1464-smallman-street-162-of-2025.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 152 of 2025, 1709 Saw Mill Run Boulevard: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/1709-saw-mill-run-blvd-179-of-2025.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 128 of 2025, 1923 Broadway Avenue: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/1923-broadway-ave-zba-decision-128-of-2025.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 156 of 2025, 213 Smith Way: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/213-smith-way-zba-decision-156-of-2025.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 164 of 2025, 530 Mellon Street: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/530-mellon-st-zba-decision-164-of-2025.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 141 of 2025, 5308 Ellsworth Avenue: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/5308-ellsworth-ave-zba-decision-141-of-2025.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 134 of 2025, Monongahela Street: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/monongahela-street-134-of-2025.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 166 of 2025, 1110 Middle Street: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/1110-middle-street-zone-case-166.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 190 of 2025, 1406 Sheffield Street: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/1406-sheffield-street-190-of-2025.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 160 of 2025, 201 S. Pacific Avenue: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/201-s-pacific-ave-160-of-2025.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 173 of 2025, 341 Orwell Way: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/341-orwell-way-173-of-2025-1.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 171 of 2025, 8012 Conemaugh Street: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/8012-conemaugh-street-171-of-2025.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 178 of 2025, 2103 Noblestown Avenue: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/2103-noblestown-road-178-of-2026.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 172 of 2025, 256 McKee Place: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/dcp-zdr-2024-02267-256-mckee-place-decision.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 168 of 2025, 307 N. Taylor Avenue: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/307-n-taylor-avenue-165-of-2025.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 175 of 2025, 5280 Northumberland Street: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/bda-2025-10213-5280-northumberland-street-decision.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 154 of 2025, 75 Hopper Place: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/75-hopper-place-154-of-2025-zba-decision.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 6 of 2026, 1200 Goettmann Street: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/1200-goettman-street-6-of-2026.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 181 of 2025, 3520 Forbes Avenue: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/bda-2025-11615-3520-forbes-ave-decision.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 169 of 2025, 724 Maryland Avenue: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/bda-2025-11184-724-maryland-ave-decision.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 177 of 2025, 115 E. Jefferson Street: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/dcp-pap-2025-00304-115-e.-jefferson-decision.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 5 of 2026, 756 S. Millvale Avenue: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/bda-2025-11386-756-s-millvale-ave-decision.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 4 of 2026, 802 Boggs Avenue: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/802-boggs-ave-4-of-2026.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 15 of 2026, 814 Kroll Drive: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/814-kroll-drive-15-of-2026-1.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 8 of 2026, Grape Street: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/bda-2025-03714-grape-street-decision.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 103 of 2025, 150 Almond Way: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/dcp-lot-2025-00171-150-almond-way-decision.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 9 of 2026, 1709 Termon Avenue: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/1709-termon-avenue-9-of-2026.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 12 of 2026, 200 The Boulevard: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/bda-2025-12114-200-the-boulevard-decision.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 1 of 2026, 3108 McClure Avenue: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/3108-mcclure-avenue-1-of-2026-zba-decision.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 10 of 2026, 5409 Hillcrest Street: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/5409-hillcrest-street-10-of-2026.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 146 of 2025, 935 South Side Avenue: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/bda-2025-00389-935-s-side-ave-decision.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 13 of 2026, 119 Kearsarge Street: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/119-kearsarge-street-13-of-2026-zba-decision.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 149 of 2025, 1316 Juniata Street: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/1316-juniata-street-149-of-2026-zba-decision.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 14 of 2026, 4103 Beechwood Boulevard: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/4103-beechwood-boulevard-14-of-2026-zba-decision.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 17 of 2026, 4644 Forbes Avenue: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/4644-forbes-avenue-17-of-2026-zba-decision.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 21 of 2026, 710 Dunster Street: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/710-dunster-street-21-of-2026-zba-decision.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 3 of 2026, East Jefferson Street: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/e-jefferson-street-3-of-2026-zba-decision.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 22 of 2026, 185 41st Street: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/185-41st-street-22-of-2026-zba-decision.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 20 of 2026, 3106 Viola Street: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/3106-viola-street-20-of-2026-zba-decision.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 29 of 2026, 600 Commonwealth Place: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/bda-2026-01129-600-commonwealth-place-decision.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 16 of 2026, 3315 Camp Street: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/3315-camp-street-16-of-2026-zba-decision.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 31 of 2026, 51 Philander Street: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/51-philander-street-31-of-2026.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 24 of 2026, 921 Saw Mill Run Boulevard: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/921-saw-mill-run-boulevard-24-of-2026.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 33 of 2026, 1400 Bennington Street: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/1400-bennington-ave-33-of-2026-zba-decision.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 18 of 2026, 3400 Fifth Avenue: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/3400-fifth-avenue-18-of-2026.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 35 of 2026, 4811 Butler Street: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/4811-butler-street-35-of-2026.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 32 of 2026, 5253 Liberty Avenue: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/5253-liberty-avenue-32-of-2026.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 30 of 2025, 6615 Kinsman Road: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/6615-kinsman-road-30-of-2026-zba-decision.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 41 of 2026, 1400 Troy Hill Road: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/1400-troy-hill-road-41-of-2026.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 26 of 2026, 1700 Murray Avenue: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/1700-murray-avenue-26-of-2026.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 2 of 2026, 2100 Wharton Street: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/2100-wharton-street-2-of-2026.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 25 of 2026, 2501 Banksville Road: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/2501-banksville-road-25-of-2026.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 42 of 2026, 2860 Perrysville Avenue: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/2860-perrysville-avenue-42-of-2026.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 36 of 2026, 5904 Bryant Street: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/5904-bryant-street-36-of-2026.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 27 of 2026, 116 15th Street: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/116-15th-street-27-of-2026.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 47 of 2026, 1222 Muldowney Avenue: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/1222-muldowney-ave-47-of-2026.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 45 of 2026, 2227 Somers Drive: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/2227-somers-drive-45-of-2026.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 40 of 2026, 2728 Custer Avenue: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/2728-custer-street-40-of-2026.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 57 of 2026, 2729 Murray Avenue: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/2729-murray-ave-57-of-2026.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 52 of 2026, 353 Cedarville Street: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/353-cedarville-st-52-of-2026.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 49 of 2026, 5898 Wilkins Avenue: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/5898-wilkins-avenue-49-of-2026.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 23 of 2026, 70 S 22nd Street: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/70-s-22nd-st-23-of-2026.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 53 of 2026, 2306 Perrysville Avenue: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/2306-perrysville-avenue-53-of-2026.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 46 of 2026, 30 Isabella Street: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/30-isabella-street-46-of-2026.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 56 of 2026, 320 Cedarhurst Street: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/320-cedarhurst-street-56-of-2026.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 50 of 2026, 625 W. Warrington Avenue: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/zone-case-50-–-w.-warrington-amended_1.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 19 of 2026, Buena Vista Street: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/buena-vista-street-19-of-2026_1.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 58 of 2026, Kendall Street: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/kendall-street-58-of-2026.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 43 of 2026, 226 N. Negley Avenue: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/226-n-negley-ave-43-of-2026-1.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 66 of 2026, 2530 Josephine Street: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/2530-josephine-street-66-of-2026_1.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 59 of 2026, 7534 Kensington Street: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/7534-kensington-street-59-of-2026_1.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 63 of 2026, 901 N. Saint Claire Street: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/901-n-saint-claire-street-63-of-2026.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 51 of 2026, Danley Street: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/danley-street-51-of-2026.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 71 of 2026, 107 6th Street: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/107-6th-street-71-of-2026-part-2.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 69 of 2026, 1345 Windermere Drive: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/1345-windermere-drive-69-of-2026.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 72 of 2026, 1639 Denniston Street: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/1639-denniston-street-72-of-2026.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 70 of 2026, 2515 Banksville Road: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/2515-banksville-road-70-of-2026.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 68 of 2026, 4337 Fifth Avenue: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/4337-fifth-avenue-68-of-2026-1.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 39 of 2026, 5742 Holden Street: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/5742-holden-st-39-of-2026.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 76 of 2026, 3412 Ligonier Street: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/3412-ligonier-street-76-of-2026.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 38 of 2026, 49th Street: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/49th-street-38-of-2026.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 82 of 2026, 5436 Walnut Street: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/5436-walnut-street-82-of-2026.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 73 of 2026, 962 Proctor Way: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/962-proctor-way-73-of-2026.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 83 of 2026, 1518 Valentine Street: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/1518-valentine-street-83-of-2026.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 94 of 2026, 5231 Penn Avenue: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/5231-penn-avenue-94-of-2027_1.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 98 of 2026, 1013 Chestnut Street: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/1013-chestnut-street-98-of-2026.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 95 of 2026, 1134 Sheffield Street: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/1134-sheffield-street-95-of-2026.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 101 of 2026, 2560 Smallman Street: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/2560-smallman-street-101-of-2026.pdf (accessed 2026-09-26)
- [read] ZBA decision, Zone Case 96 of 2026, Rockland Avenue: https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/rockland-avenue-96-of-2026.pdf (accessed 2026-09-26)
