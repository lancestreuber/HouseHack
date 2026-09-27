# Sweep: Public construction-cost benchmarks and gap-financing parameters, compared with the SME ranges

**Round 9** · 2026-09-27 · single research subagent

> Tags: **[read]** = we fetched and read the primary document this session (PDF text extracted, or page images read); **[skimmed]** = search snippet, a model-summarized web page, or a secondary source only; **[found]** = known to exist, not opened; **[inaccessible]** = blocked. Tags on news articles apply to the article, and any cost figures in it are secondhand reporting. The "ours" rows are our arithmetic, and each guess is labeled as one. Nothing here is financial advice, and nothing claims what other teams will build.

Companion sweep: [r9-permit-cost-per-sf](r9-permit-cost-per-sf.md) (City permit valuations, median $104/sf, which it judges understated). SME ranges come from [sme-feedback-gap-analysis](../knowledge/build-plan/sme-feedback-gap-analysis.md) S6–S8 and S13.

---

## TL;DR

- **NAHB 2024 (latest edition; n = 41 builders, national only):** construction cost is **$428,215, or $162/sf**, on a 2,647 sf home. That is 64.4% of a $665,298 sale price. The finished lot is $91,057 (13.7%) and profit 11.0% [read].
  - **Take out NAHB's "site work" stage ($32,719) and the rest is $149/sf.** That is almost exactly the SME's **$150/sf production-builder** figure.
  - Watch the definitions. **NAHB's "site work" is mostly fees**: permits, impact fees, water/sewer fees, and A&E. Excavation and backfill are counted under Foundations, and land development sits in the finished lot.
- **Pittsburgh location factor is about 1.0.** The RSMeans 2021 public PDF gives a **residential location factor of 1.01** and a City Cost Index of **100.7** for ZIP 150–152 [read]. That is the newest free copy; 2022–2026 are paywalled.
  - The DoD Area Cost Factors (2024) list **Pennsylvania at 1.06** but **no Pittsburgh entry**. Philadelphia is 1.15 [read].
  - Inference: national $/sf benchmarks need little or no adjustment for Pittsburgh.
- **Real Pittsburgh TDC/unit (13 data points, 2025–26):**
  - Small new construction: **$395k/unit** (8-unit Larimer rental, 3BR; hard cost $290k/unit) and **$487k/unit** (23 Hazelwood townhomes; hard cost $360k/unit) [read, URA Board].
  - LIHTC new construction: **$417k–$594k/unit** [skimmed, news].
  - Rehab/conversion: **$261k–$648k/unit**.
  - **Only one record gives square footage:** a 1,200 sf Beltzhoover rehab at **$186/sf hard, $242/sf TDC**, with a $210k sale price. That is an **$80.6k gap per home** [read].
- **PHFA DSCR: "1.15" is not the current general rule.**
  - The **2025** Loan Program Guidelines require **DSCR ≥ 1.20** in the first stabilized period, **≥ 1.05** in years 1–15, and **≤ 1.20 in year 15** (PennHOMES with an amortizing first loan). HUD MAP and certain Rural Development deals can go as low as **1.10** [read].
  - "115%" appears only in the **2016/2018** guidelines, for the now-absent **SMAP** small-loan program [read].
  - The SME's 1.15 was offered as an example threshold, not a citation (S13).
- **URA gap caps (current guidelines):**
  - **RGP**, Aug 2024: **$75k/unit at 30% AMI, $50k at 50%, $35k at 60%**. **$2.0M per project**, "typically $1.5–1.75M". Minimum 4 units, 40-year affordability, 10% equity [read].
  - **FSDP**, 9/2024: **$130k per new-construction unit**, **$100k per rehab unit**. Buyers **≤80% AMI**, or 80–115% AMI only with non-HOF/CDBG/HOME money. A grant is capped at TDC minus the sale price [read].
  - **2026 HOF plan:** $10M total, of which **RGP $2.5M** and **FSDP $0.5M** [read]. Final Council approval is not verified.
- **Contradictions kept visible:**
  - URA's June 2025 minutes cite a **$30k** 60%-AMI cap, while the guidelines say **$35k**.
  - URA waives its own caps often. Three of the four June 2025 RGP deals needed or cited waivers or above-typical amounts.
  - NAHB $162/sf sits far below the SMEs' **$200–250/sf city infill** and **$325–375/sf vertical**. No public source we reached confirms the higher SME ranges directly. The URA hard-cost-per-unit figures are *consistent* with them only if we assume unit sizes of about 1,000–1,500 sf (a guess).

---

## 1. NAHB "Cost of Constructing a Home-2024" [read]

Source: the NAHB special study PDF (2025-01-20), with an excerpt saved at [sources/nahb-2026-09-27-cost-of-constructing-a-home-2024.md](../sources/nahb-2026-09-27-cost-of-constructing-a-home-2024.md). This is the latest edition. A Sept 2026 NAHB blog post says the next one is still in progress [skimmed].

| Item | Value |
|---|---|
| Construction cost | $428,215, **$162/sf** (2022: $153; 2019: $114) |
| Share of sale price | 64.4% (a series record) |
| Finished lot (incl. financing) | $91,057, 13.7% (a series low) |
| Overhead / financing / marketing / commission / profit | 5.7% / 1.5% / 0.8% / 2.8% / 11.0% |
| Sale price | $665,298, about $251/sf |
| Home / lot size | 2,647 sf / 20,907 sf lot |
| Stage shares of construction cost | interior finishes 24.1%, systems 19.2%, framing 16.6%, exterior 13.4%, foundations 10.5%, **site work 7.6%**, final steps 6.5%, other 2.1% |
| "Site work" detail | permits $7,640, impact fee $6,367, water/sewer fees $6,260, A&E $6,480, other $5,972 |

**Caveats from NAHB itself:**
- The sample is "not large enough for a geographic breakdown".
- There were 41 usable responses.
- The survey is not designed to be representative of average homes.
- NAHB points readers to RSMeans or Marshall & Swift for local estimates.

**Our derived figures** (arithmetic on Table 1):
- Construction cost excluding the site-work stage: $395,496, or **$149/sf**.
- Also excluding final steps (landscaping and driveway): **$139/sf**.
- Construction plus finished lot: **$196/sf**.
- The site-work stage alone is $12/sf, **$32.7k per home**. That falls inside the SME's $25–50k/unit site range, but NAHB's content is fees and A&E, not grading and taps. **Do not treat them as the same thing.**

## 2. Location factors for Pittsburgh

| Index | Pittsburgh value | Base | Vintage | Tag |
|---|---|---|---|---|
| RSMeans residential location factor, ZIP 150–152 | **1.01** | national average = 1.00 | 2021 (free V2 PDF) | [read] |
| RSMeans commercial location factor | 1.01 | national = 1.00 | 2021 | [read] |
| RSMeans City Cost Index, weighted average | 100.7 (materials 99.3, installation 102.6); site work 96.3 | 30-city average = 100 | 2021 | [read] |
| RSMeans quarterly change, Pittsburgh | +0.79% average (Q2 2023) | — | 2023 | [read] |
| DoD ACF, Pennsylvania (state) | 1.06 (2024); 1.10 (2023) | 96 base cities, national = 1.00 | 2024 PAX | [read] |
| DoD ACF, Pittsburgh | **not listed** in 2023 or 2024; 1.03 (2013) and 0.95 (2005) per search snippets | — | old | [skimmed] |
| DoD UFS 3-701-01 (Feb 2026), Table 4-1 | not obtained: the data file sits behind the WBDG SPA and returns 403 | — | 2026 | [inaccessible] |

Excerpts: [rsmeans](../sources/rsmeans-2026-09-27-2021-location-factors-pittsburgh.md), [usace](../sources/usace-2026-09-27-dod-area-cost-factors-pennsylvania.md).

**Inference:** Pittsburgh construction prices sit at about the national average. The DoD notes that ACFs shift year to year because the base changes, and it tells users not to apply ACFs to commercial cost data. Treat 1.00–1.06 as the plausible band.

We did not reach RLB, Cumming or Turner Pittsburgh residential $/sf. Turner's index is national. RLB and Cumming publish Pittsburgh in some quarterly reports, but we did not open them. [found, from memory; not verified]

## 3. Pittsburgh project budgets (TDC per unit)

Per-unit figures are our arithmetic. Board records are [read]; news-reported totals are [skimmed].

| # | Project (neighborhood) | Type | Units | TDC | TDC/unit | Hard/unit | Hard % of TDC | Source |
|---|---|---|---|---|---|---|---|---|
| 1 | Mayflower Meadows (Larimer) | **new construction**, 2 × 4-unit buildings, all 3BR, 30–50% AMI | 8 | $3,156,570 | **$394.6k** | $289.8k | 73% | URA agenda 12/11/2025 [read] |
| 2 | Woods Village (Hazelwood) | **new construction** townhomes, mostly market-rate for-sale; land $1 + ~$105k | 23 | $11,198,390 | **$486.9k** | $360.5k | 74% | URA minutes 3/12/2026 [read] |
| 3 | African Queens Apts (Hill) | **new construction** mixed-use, 2 retail + 12 affordable | 12 | $8,624,884 | $718.7k (includes retail) | — | — | URA minutes 3/12/2026 [read] |
| 4 | Mosaic Apartments (Oakland) | **new construction** LIHTC senior | 48 | $28.5M | **$593.8k** | — | — | NEXTpittsburgh 12/17/2025 [skimmed] |
| 5 | Shannon Heights (Penn Hills) | **new construction** LIHTC senior | 48 | ~$20M | **~$416.7k** | — | — | same [skimmed] |
| 6 | Hill Top Villas (Fairywood) | **new construction** LIHTC senior 1BR | 48 | ~$23M | **~$479.2k** | — | — | same [skimmed]; $2M RGP (URA 5/14/2026) [read] |
| 7 | Smithfield Lofts (CBD) | office conversion | 46 | $26,063,667 | $566.6k | $367.6k | 65% | URA minutes 6/2025 [read] |
| 8 | May Building (CBD) | occupied rehab | 86 | $38,589,139* | $448.7k | $256.6k | 57% | same [read] |
| 9 | Carson Square (South Side) | recapitalization | 54 | $23,917,236 | $442.9k | $126.5k | 29% | same [read] |
| 10 | El Court Ph 1 (Homewood S.) | townhouse rehab | 10 | $2,607,000 | $260.7k | $202.9k | 78% | same [read] |
| 11 | 421 Seventh Ave (CBD) | office conversion | 40 | $24M | $600.0k | — | — | NEXTpittsburgh [skimmed] |
| 12 | Ross Lofts (CBD) | office conversion | 46 | $29.8M | $647.8k | — | — | NEXTpittsburgh [skimmed] |
| 13 | 244 E Warrington (Beltzhoover) | SF rehab for sale, 1,200 sf | 1 | $290,621 | $290.6k, **$242/sf** | $223.8k, **$186/sf** | 77% | URA minutes 6/2026 [read] |

\* The narrative says $38,599,139 and the sources/uses table says $38,589,139, a $10k discrepancy in URA's own minutes.

Excerpts: [ura board budgets](../sources/ura-2026-09-27-board-project-budgets-2025-2026.md).

**Earlier data point**, already in the base: about $300k/unit for a 9-unit Hazelwood rehab (WESA 2025-02-12), and about $350k for an average SF rehab (PCRG). See [pro-forma](../knowledge/methods/pro-forma.md).

**Not reached:** PHFA's 2025 9% applications list (read; Allegheny rows carry only units and credit/PennHOMES requests, **no TDC**). PHFA award notices do not publish TDC. HACP project budgets were not searched.

## 4. Comparison table: every $/sf figure against the SME ranges

SME ranges: **$150/sf** production builder, **$200–250/sf** City SF infill, **$325–375/sf** vertical excluding site, **$25–50k/unit** site work.

| Figure | $/sf | Includes | Excludes | Geography / year | Tag | Against the SME ranges |
|---|---|---|---|---|---|---|
| NAHB construction cost | **$162** | vertical + NAHB "site work" (permits, impact/tap fees, A&E) + foundations incl. excavation + landscaping/driveway | finished lot, overhead, financing, profit, commission | US, 2024, n=41 | [read] | just above $150 production |
| NAHB excl. site-work stage (ours) | **$149** | vertical + foundations + final steps | fees, A&E, lot, soft costs | US 2024 | [read] + arithmetic | ≈ $150 production |
| NAHB construction + finished lot (ours) | $196 | above + developed lot | overhead, financing, profit | US 2024 | [read] + arithmetic | just below $200–250 infill |
| NAHB sale price | $251 | everything incl. profit | — | US 2024 | [read] | top of $200–250 infill (but it is a *price*, not a cost) |
| NAHB × RSMeans 1.01 (ours) | ~$164 | as NAHB | as NAHB | Pittsburgh-adjusted (mixes 2021 factor with 2024 cost) | inference | ≈ production |
| Beltzhoover rehab, hard | **$186** | rehab hard cost | fees, acquisition, financing | Pittsburgh 2026 | [read] | between production and infill (rehab, not new) |
| Beltzhoover rehab, TDC | **$242** | all-in incl. $17.9k acquisition | — | Pittsburgh 2026 | [read] | inside $200–250 infill |
| City permit valuations, 1–2 family new construction | median $104 (p90 $152) | declared value, probably mostly vertical, understated | site? unclear | Pittsburgh 2019–24 | [read] (companion sweep) | below every SME range |
| Mayflower Meadows hard/unit at **assumed** 1,200–1,500 sf per 3BR | $193–242 | hard cost | soft, acquisition | Larimer 2025 | **guess** (unit sf not in record) | inside or near $200–250 |
| Woods Village hard/unit at **assumed** 1,200–1,500 sf | $240–300 | hard (the record gives no split between site and vertical) | soft $2.79M, acquisition | Hazelwood 2026 | **guess** | above infill, below $325 vertical |
| Incline Homes builder blog | $200–450 | new construction; hillside site work $30–80k extra; soft 10–20% extra | — | Pittsburgh 2026 | [skimmed] (in base) | spans all SME ranges; marketing |

**What the table shows:**
- The **$150 production figure is well supported** by NAHB.
- The **$200–250 infill** range is consistent with the one Pittsburgh sf-level record we have (Beltzhoover TDC $242/sf, a rehab). It is also consistent with URA hard-cost-per-unit figures *if* unit sizes are about 1,200–1,500 sf, which is an assumption.
- **No public source we reached supports or refutes $325–375/sf vertical.** That range likely applies to elevator multifamily and conversions. Smithfield Lofts' $367.6k/unit hard cost would equal $325–375/sf only at about 1,000–1,130 sf per unit, and we have no unit sf for it. This is a guess.

## 5. PHFA debt service coverage [read]

Excerpt: [phfa dscr](../sources/phfa-2026-09-27-dscr-and-underwriting-assumptions.md).

| Document | Rule |
|---|---|
| **2025 Loan Program Guidelines** (2025-mpg-05), PennHOMES with an amortizing primary loan | "Debt Service Coverage Ratio is **at least 1.20** in the initial stabilized operating period and is **not less than 1.05** in years one through and including fifteen and **no more than 1.20 in year 15**." |
| same, PennHOMES as first mortgage | "breakeven cash flow for the first fifteen years" |
| same, HUD MAP or certain Rural Development | "as low as **110%** in the first operating period but must maintain a ratio of 100% through year 15" |
| same, LTV | usually ≤80% of replacement or appraised value; never >90% of development cost (for-profit) or 100% (nonprofit) |
| 2016 and 2017/18 guidelines, **SMAP only** ($200k–$750k loans) | "minimum debt service coverage ratio of **115%** in the base year, and must not fall below breakeven throughout the initial 15 years" |
| 2025 Tab 2.01 pro forma instructions | 5% residential vacancy; ≥10% commercial vacancy; income trended at 2% and expenses at 3% per year; replacement reserves $375 (elderly) / $500 (family) / $200 (SRO) per unit per year; cash flow positive through year 10 |

**Result:** We could not confirm 1.15 as PHFA's current requirement. For a default, **1.20** has a current PHFA citation. A 1.15 default would need to be labeled "SME example / legacy PHFA SMAP", or treated as a user-chosen threshold (which S13 says is acceptable if it is clear). The 2026 guidelines were not found (404).

## 6. URA gap financing [read]

Excerpt: [ura programs](../sources/ura-2026-09-27-rgp-fsdp-guidelines-and-hof-2026-plan.md).

| Program | Per-unit cap | Per-project cap | Income target | Other |
|---|---|---|---|---|
| **Rental Gap (RGP)**, Aug 2024 | **$75k** at ≤30% AMI · **$50k** at ≤50% · **$35k** at ≤60%; plus services $10k/unit (≤$200k) | **$2,000,000** (typically $1.5–1.75M) | ≤60% AMI; rent at 60% AMI capped at 30% of **50%** AMI | ≥4 units; 4 affordable units (4–40 unit projects) or ≥10% (41+); 40-year affordability; 10% equity; ≥10% mobility-accessible / 4% sensory-accessible for new construction; cash sweep if NOI > 130% of debt service; nonprofit partner required when HOF-funded |
| RGP, 2020 (superseded) | $60k / $30k / $25k | $1.25M (typically $400–600k) | same | shows the caps roughly doubled 2020→2024 |
| **For-Sale Development (FSDP)**, 9/2024 | **$130k** new construction · **$100k** rehab | — (Board approval >$250k) | buyers ≤80% AMI; 80–115% only with non-HOF/CDBG/HOME funds | a grant cannot exceed TDC − sale price; a for-profit loan is ≤30% of post-appraised value at 2–4%; nonprofit 0%; 18-month term; detached, semi-detached or townhouse only |
| **HOF 2026 Annual Allocation Plan** | — | — | — | $10M total: RGP $2.5M, Homeowner Assistance $2.0M, Stabilization $1.5M, Legal–Tenants $1.4M, DPCC $0.6M, **FSDP $0.5M**, Legal–Homeowners $0.3M, Demonstration $0.2M, Admin $1.0M. Approved by the Advisory Board 11/4/2025; URA Board and Council approval **not verified** |

**Real deals against the caps** (inference from §3):
- **Beltzhoover:** TDC $290,621 minus the $210,000 sale price leaves an $80,621 gap. The FSDP grant is $100,000. The FSDP rule says a grant "cannot exceed the difference between the total development costs and the total proposed sales price(s)", so on its face the grant is about $19k over that limit. The sources also include a $145k construction loan. **We have not reconciled this.**
- **Mayflower Meadows:** under the 2024 caps, 3 units × $75k + 5 units × $50k = $475k. **The $555k RGP request exceeds that**, yet the agenda requests only an accessibility waiver. **We have not explained this.**
- **Scale check (inference):** RGP from HOF in 2026 ($2.5M) covers about 1–2 max-size projects. RGP is also funded by 2023 Affordable Housing Bond proceeds, HOME and CDBG, which is how 2025–26 deals were paid for.

## 7. Contradictions and gaps (kept visible)

1. **RGP 60% AMI cap:** $35k in the Aug 2024 guidelines versus "$30,000" in the waiver text of the June 2025 minutes. We believe the guidelines are current, but URA's own minutes disagree.
2. **Mayflower RGP $555k is above the 2024 per-unit caps** without a stated cap waiver (see §6).
3. **May Building TDC** differs by $10k between the narrative and the table.
4. **PHFA DSCR:** SME/base "1.15" versus current PHFA 1.20 / 1.05. "115%" exists only in legacy SMAP text.
5. **NAHB "site work" ≠ SME "site work."** NAHB counts fees and A&E ($32.7k). The SME counts taps, grading, sidewalks and landscaping ($25–50k). The dollar amounts are similar by coincidence.
6. **NAHB is national with n=41.** RSMeans 1.01 comes from 2021. Mixing them gives a rough ~$164/sf, not a measured Pittsburgh figure.
7. **No Pittsburgh multifamily $/sf** was found in any public record reached. Board records give $/unit, not sf.

## 8. Where to look next (different methods)

- PHFA **cost certifications** or **Tab 1 development budgets** for Allegheny 2025 awards. These are probably reachable only by request or RTKL.
- URA Board **May 2026 minutes** for the Hill Top Villas, HG Blair and Bedford Dwellings III sources/uses. They were not located this round. The June 2026 minutes did not contain them.
- The HACP board resolutions for Bedford Dwellings (Choice Neighborhoods) budgets.
- RLB or Cumming quarterly cost reports, which may carry Pittsburgh multifamily $/sf.
- Asking a URA housing lending analyst for typical unit sf on RGP deals, which would turn the $/unit figures into $/sf.

## Sources

- [NAHB, Cost of Constructing a Home-2024 (PDF, 2025-01-20)](https://www.nahb.org/news-and-economics/housing-economics-plus/special-studies/special-studies-pages/cost-of-constructing-a-home-in-2024) `[read]` *(accessed 2026-09-27)*
- [Eye On Housing, Cost of Constructing a Home in 2024](https://eyeonhousing.org/2025/01/cost-of-constructing-a-home-in-2024/) `[read]` *(2026-09-27)*: percentages only
- [NAHB blog, construction cost survey (2026-09)](https://www.nahb.org/blog/2026/09/construction-cost-survey) `[skimmed]` *(2026-09-27)*: next edition pending
- [RSMeans 2021 City Cost Indexes & Location Factors V2 (PDF)](https://www.rsmeans.com/media/wysiwyg/quarterly_updates/2021-CCI-LocationFactors-V2.pdf) `[read]` *(2026-09-27)*
- [RSMeans Q2 2023 change notice](https://www.rsmeans.com/media/wysiwyg/quarterly_updates/Q2-2023-ChangeNotice.pdf) `[read]` *(2026-09-27)*
- [DoD ACF PAX 3.2.1, 29 Mar 2024](https://usace.contentdm.oclc.org/digital/api/collection/p16021coll8/id/4495/download) `[read]` *(2026-09-27)*
- [DoD ACF PAX 3.2.1, 31 Mar 2023](https://usace.contentdm.oclc.org/digital/api/collection/p16021coll8/id/4441/download) `[read]` *(2026-09-27)*
- [UFS 3-701-01, 2 Feb 2026](https://www.wbdg.org/FFC/DOD/UFC/ufs_3_701_01_2026.pdf) `[read]` *(2026-09-27)*: Table 4-1 is in a separate file; the data file is `[inaccessible]` (WBDG SPA, 403)
- [DoD ACF 2013](https://www.usace.army.mil/Portals/2/docs/costengineering/AFC_2013.pdf) and [2005](https://www.usace.army.mil/Portals/2/docs/costengineering/ACF_2005.pdf) `[skimmed]` *(2026-09-27)*: search snippets only
- [URA RGP Guidelines, Aug 2024 (corrected 12/2025)](https://www.ura.org/media/W1siZiIsIjIwMjUvMTIvMDMvM2wwcDl1MnRpbF9SZW50YWxfR2FwX1Byb2dyYW1fR3VpZGVsaW5lc19BbWVuZGVkX0F1Z3VzdF8yMDI0X0NvcnJlY3RfMTIuMjAyNS5wZGYiXV0/Rental%20Gap%20Program%20Guidelines_Amended%20August%202024%20-%20Correct%2012.2025.pdf) `[read]` *(2026-09-27)*
- [URA RGP Guidelines, July 2020](https://www.ura.org/media/W1siZiIsIjIwMjAvMTAvMDgvNzUxbW83bmNkMV9SR1BfUHJvZ3JhbV9HdWlkZWxpbmVzX0p1bHlfMjAyMC5wZGYiXV0/RGP%20Program%20Guidelines%20-%20July%202020.pdf) `[read]` *(2026-09-27)*: superseded
- [URA RGP page](https://www.ura.org/pages/rental-gap-program) and [FSDP page](https://www.ura.org/pages/for-sale-development-program) `[read]` *(2026-09-27)*
- [URA FSDP Guidelines, 9/2024](https://www.ura.org/media/W1siZiIsIjIwMjQvMDkvMDQvOHdsZGlzcmkzaF9FeGhpYml0X0FfRlNEUF9HdWlkZWxpbmVzXzkuMjAyNC5wZGYiXV0/Exhibit%20A-%20FSDP%20Guidelines%209.2024.pdf) `[read]` *(2026-09-27)*
- [URA Board agenda, Nov 13 2025 (2026 HOF AAP)](https://www.ura.org/media/W1siZiIsIjIwMjUvMTEvMTAvN2I4bzdzMjNhd19OT1ZFTUJFUl8yMDI1X1VSQV9SRUdVTEFSX0JPQVJEX01FRVRJTkdfQUdFTkRBX0ZJTkFMLnBkZiJdXQ/NOVEMBER%202025%20URA%20REGULAR%20BOARD%20MEETING%20AGENDA%20-%20FINAL.pdf) `[read]` *(2026-09-27)*
- [HOF Advisory Board minutes, 10/7/2025](https://www.ura.org/media/W1siZiIsIjIwMjUvMTEvMDcvMnNpYzZ2OGxjcl9IT0ZfQUJfTWVldGluZ19NaW51dGVzXzEwLjcuMjUucGRmIl1d/HOF%20AB%20Meeting%20Minutes%2010.7.25.pdf) `[read]` *(2026-09-27)*
- [URA Board minutes, June 2025](https://www.ura.org/media/W1siZiIsIjIwMjUvMDcvMTAvZWkxeWNpY3Y4X0pVTkVfMjAyNV9VUkFfUkVHVUxBUl9CT0FSRF9NRUVUSU5HX01JTlVURVMucGRmIl1d/JUNE%202025%20URA%20REGULAR%20BOARD%20MEETING%20MINUTES.pdf) `[read]` *(2026-09-27)*
- [URA Board agenda, Dec 11 2025](https://www.ura.org/media/W1siZiIsIjIwMjUvMTIvMDkvaTNibm90b3I5X0RFQ0VNQkVSXzIwMjVfVVJBX1JFR1VMQVJfQk9BUkRfTUVFVElOR19BR0VOREFfRklOQUwucGRmIl1d/DECEMBER%202025%20URA%20REGULAR%20BOARD%20MEETING%20AGENDA%20-%20FINAL.pdf) `[read]` *(2026-09-27)*
- [URA Board minutes, Mar 12 2026](https://www.ura.org/media/W1siZiIsIjIwMjYvMDQvMDkvNjdrNzJreXRmal9NQVJDSF8yMDI2X1VSQV9SRUdVTEFSX0JPQVJEX01FRVRJTkdfTUlOVVRFUy5wZGYiXV0/MARCH%202026%20URA%20REGULAR%20BOARD%20MEETING%20MINUTES.pdf) `[read]` *(2026-09-27)*
- [URA Board minutes, June 2026](https://www.ura.org/media/W1siZiIsIjIwMjYvMDcvMTAvODZ3cjR3Nnc0dV9KVU5FXzIwMjZfUkVHVUxBUl9CT0FSRF9NRUVUSU5HX01JTlVURVNfRklOQUwuZG9jeC5wZGYiXV0/JUNE%202026%20REGULAR%20BOARD%20MEETING%20MINUTES%20-%20FINAL.docx.pdf) `[read]` *(2026-09-27)*
- [URA news, May 14 2026: three RGP projects](https://www.ura.org/news/ura-board-to-vote-on-funding-for-three-affordable-housing-projects-providing-over-260-affordable-bedrooms-in-fairywood-hazelwood-and-the-hill-district) `[read]` *(2026-09-27)*: model-summarized fetch
- [URA news, Oct 10 2025: six LIHTC awards, 309 affordable homes](https://www.ura.org/news/pittsburgh-awarded-six-low-income-housing-tax-credits-to-bring-309-affordable-homes-to-the-city) `[read]` *(2026-09-27)*: no per-project costs
- [NEXTpittsburgh, 8 affordable housing developments to watch in 2026 (2025-12-17)](https://nextpittsburgh.com/city-design/8-affordable-housing-developments-to-keep-an-eye-on-in-2026/) `[skimmed]` *(2026-09-27)*: model-summarized fetch of a news article; totals are secondhand
- [PHFA 2025 9% LIHTC applications received](https://www.phfa.org/forms/multifamily_news/news/2025/2025-9-lihtc-applications-received.pdf) `[read]` *(2026-09-27)*: no TDC column
- [PHFA 2025 Loan Program Guidelines (2025-mpg-05)](https://www.phfa.org/forms/multifamily_application_guidelines/guidelines/2025/2025-mpg-05.pdf) `[read]` *(2026-09-27)*
- [PHFA 2016 Loan Program Guidelines](https://www.phfa.org/forms/multifamily_application_guidelines/guidelines/2016/6-loan-program-guidelines.pdf) and [2017/18 mpg_06](https://www.phfa.org/forms/multifamily_application_guidelines/guidelines/2017_and_2018/mpg_06.pdf) `[read]` *(2026-09-27)*: SMAP 115%
- [PHFA 2025 Tab 2.01 underwriting instructions](https://www.phfa.org/forms/multifamily_application_guidelines/submission/tab_02/tab_02_01.pdf) `[read]` *(2026-09-27)*
- [PHFA 2025–2026 QAP](https://www.phfa.org/forms/multifamily_program_notices/qap/2025_and_2026/2025-2026-lihtc-qap.pdf) `[read]` *(2026-09-27)*: grepped; no DSCR language
