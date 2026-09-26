# Sweep: Council records, County HNA, MVA/DRR methodology, PWSA, Land Bank

Round 5 · 2026-09-26 · single research subagent · primary records first (Legistar Web API, PDFs extracted with pdftotext, WPRDC CKAN, a shapefile .dbf inspected directly) · Chrome tools not used

> **Tags:**
> - `[read]` = we fetched and read it, or queried an endpoint and inspected the response
> - `[skimmed]` = snippet, search-result summary or secondary report
> - `[found]` = known to exist, not opened
> - `[inaccessible]` = blocked (the blocker is stated)
>
> **Inference** means our reasoning, not the source's. People are named by role. Nothing here is legal or zoning advice.
>
> **Saved primary text:**
> - `sources/pittsburgh-legistar-2026-09-26-zoning-bills-1545-0834-1579.md`
> - `sources/alleghenycounty-2026-09-26-executive-order-2026-1-housing-for-all.md`
> - `sources/reinvestment-fund-2026-09-26-mva-2021-market-types-and-drr.md`
> - `sources/pgh2o-2026-09-26-developers-manual-sfpm-fees-excerpts.md`
> - `sources/pghlandbank-2026-09-26-disposition-policy-and-2026-board-records.md`

---

## 1. Pittsburgh City Council legislative records (Legistar)

**Method.** We queried the Legistar Web API with `matters?$filter=MatterFile eq '…'`, then pulled `/histories`, `/attachments`, `/versions`, `/texts/{id}`, `/events/{id}/eventitems` and `/eventitems/{id}/votes`. We also scanned all events dated on or after 2026-09-15 for these file numbers. The attached PDFs and DOCX files were downloaded and their text extracted. `[read]` [Legistar Web API](https://webapi.legistar.com/v1/pittsburgh/matters) · [Legistar portal](https://pittsburgh.legistar.com/)

### 1a. Bill 2025-1545 (ADUs, parking, affordable housing bonus, formerly citywide inclusionary zoning). **It has NOT passed.**

**Status and record** `[read]`
- MatterId 31504, Ordinance. Status **"Held In Council"**. `MatterPassedDate` = null. `MatterEnactmentNumber` = null. Version **2**.
- Committee: Land Use & Economic Development. Sponsors: four councilmembers. Last modified 2026-09-24.
- The title suffix reads "(Public Hearing held 9/10/25) (Sent to the Planning Commission for a Report & Recommendation on 10/15/25) (Report & Recommendation received on 6/12/26) (Public Hearing held 9/23/26)".

**Full action history** `[read]`

| Date | Body | Action | Result |
|---|---|---|---|
| 2025-07-15 | City Council | Read and referred | n/a |
| 2025-07-23 | Standing Committees | Held for Cablecast Public Hearing | Pass |
| 2025-09-10 | Hearings & Policy | Public Hearing Held | n/a |
| 2025-10-15 | Standing Committees | Referred to Planning Commission for Report & Recommendation | Pass |
| 2025-10-15 | Standing Committees | **Amended by Substitute** | **5–4** |
| 2026-07-29 | Standing Committees | Held for Cablecast Public Hearing | Pass |
| 2026-09-23 | Hearings & Policy | **Public Hearing Held** | no vote |

- There is no "Affirmatively Recommended", "Passed Finally" or "Signed by the Mayor" entry. `[read]`
- 2025-1545 is **not** an item on the 2026-09-29 City Council agenda (event 12093) or the 2026-09-30 Standing Committees agenda (event 12089). `[read]`
- The 9/23/26 minutes record only "Public Hearing Held to the Committee on Land Use and Economic Development". `[read]` [minutes PDF](https://pittsburgh.legistar1.com/pittsburgh/meetings/2026/9/12056_M_Committee_on_Hearings_and_Policy__26-09-23_Meeting_Minutes.pdf)

**What is pending (inference from the record).** Before this becomes law, three steps are still needed:
1. A committee motion to amend by substitute with the Planning Commission's June 2026 text (if Council adopts it) and to recommend.
2. A City Council final vote. The Planning Commission letter says "the bill may be enacted with five affirmative votes".
3. The Mayor's signature.

The 5–4 split on the October 2025 substitute is the only roll-call signal we have. It is not a prediction.

**What the bill now contains** (Planning Commission Report & Recommendation, letter dated June 11, 2026; decision date June 2, 2026) `[read]` [R&R PDF](https://pittsburgh.legistar1.com/pittsburgh/attachments/1aea03bb-c723-4b1d-bff2-f7b61b7766db.pdf)
- **History.** The 10/15/25 substitute "kept the provisions for Accessory Dwelling Units and Parking Reform but replaced the City-wide Inclusionary Zoning provisions with an Affordable Housing Bonus program". Minimum lot size had already been split out into 2025-1579. The v1 title had "Chapter 903 … to amend minimum lot sizes" and would remove IZ-O. The v2 title instead adds a **sunset clause** to IZ-O. `[read]`
- **ADUs.** By-right on any lot with a residential, Community Center or Religious Assembly primary use. Max **two ADUs per residential lot**, "up to two stories and 30 feet". The staff substitute keeps 30 ft but **drops the story limit**. `[read]`
- **Parking.**
  - "Removal of Parking Minimums for all uses/districts"
  - maximums tiered by frequent-transit access
  - a Mobility Trust Fund payment to exceed the maximums
  - TDM above a size threshold (the substitute removes the TDM delayed start) `[read]`
- **Affordable housing.** In the Council substitute (Oct 2025), a voluntary bonus: ≥20 units, 10% affordable, rentals ≤50% AMI for 20 years, for-sale ≤80% AMI, +30 ft and +2 FAR, off-site 12%, fee-in-lieu $25/sf. The **Planning Commission's recommended substitute** (June 2026) replaces this. It extends the **existing 915.07 Affordable Housing Performance Points** to RM, NDO, LNC, NDI, UNC, UI and select GPR subdistricts, with on-site, off-site and payment-in-lieu options. `[read]`
- **Planning Commission conditions** `[read]`:
  - payment-in-lieu dollar amounts for parking and affordable units to be set annually in the fee schedule, not in the code
  - a 20-year affordability period for the voluntary program only, with "the mandatory program stays unchanged" (inference: the mandatory program is the existing IZ-O)
- The letter set the 120-day hearing deadline as "September 30, 2026". The 9/23 hearing met it. `[read]`

**Housing-tool implication (inference).** Model 2025-1545 as a **scenario toggle**: "if enacted as PC-recommended". Do not model it as current law. The ADU and parking-minimum changes are the parts most likely to alter parcel feasibility. The bonus text is still in flux between two substitutes.

### 1b. Bill 2026-0834 (EO 2026-01 Phase One zoning text and map amendment)

**Status and history** `[read]`
- MatterId 33576. Status "Held In Council". Requester: **Department of City Planning**. Intro 2026-08-28.
- 2026-09-01: read and referred.
- 2026-09-09: Held for Cablecast Public Hearing (Pass).
- Title: "(Public Hearing scheduled for 10/13/26)". Event 12083 on 2026-10-13 lists the item, but no agenda file is posted yet.
- Planning Commission: positive recommendation on July 28, 2026 (decision dated July 29). The cover letter gives a 120-day hearing deadline of **Nov 25, 2026**. `[read]` [hearing report PDF](https://pittsburgh.legistar1.com/pittsburgh/attachments/3db4d4bd-73a6-4791-bff7-c02657c58913.pdf)

**Substance** (Findings of Fact) `[read]`:
- Removes **height-in-stories** limits across 903/904/905 and keeps height in feet.
- Removes **FAR** in the mixed-use districts (904). UI keeps a maximum FAR.
- UNC base height of 60 ft districtwide. Previously that applied only within 1,500 ft of a Major Transit Facility. The height special exception stays at 85 ft.
- Deletes Chapter 913 and the View Protection Overlay. Removes the Oakland Public Realm.
- Chapter 916 residential compatibility:
  - setback 10 ft from an abutting or across-a-Way R1D/R1A/R2/R3/Hillside lot, 5 ft across a street
  - heights of 40 ft within 25 ft, 55 ft at 26–50 ft, 65 ft at 51–75 ft
- Street-tree rules.
- Rezones part of GT-D to GT-C.

The report says two more phases follow: a "comprehensive overhaul of the Zoning Code", then adoption and maintenance. EO 2026-01 is dated January 6, 2026. `[read]`

### 1c. Bill 2025-1579 = **Ordinance 10 of 2025** (minimum lot size). **In force.**

**Status and history** `[read]`
- MatterId 31538. Status **"Passed Finally"**. Enactment number **10**.
- 2025-04-23: public hearing.
- 2025-04-30: Affirmatively Recommended, 5 Aye, 1 No, 2 Abstain, 1 Out of Room. A motion to hold failed 4–5.
- **2025-05-06: Passed Finally, 8 Aye, 1 Absent.**
- **2025-05-07: signed by the Mayor.**

The June 2026 Planning Commission findings say "approved at City Council on May 5, 2025". The Legistar history says 5/6. We treat the Legistar record as authoritative. `[read]`

**Text changes** (recovered from strike/underline formatting in the Legistar RTF) `[read]`:

| Subdistrict | Min lot size | Min lot size per unit | Other |
|---|---|---|---|
| VL | 8,000 → **6,000 sf** | deleted | n/a |
| L | 5,000 → **3,000 sf** | deleted | n/a |
| M | 3,200 → **2,400 sf** | deleted | n/a |
| H | 1,800 → **1,200 sf** | deleted | n/a |
| VH | **deleted** | deleted | RM height "no limit" → **180 ft** |

The Chapter 926 density definitions become "Reserved". This agrees with the round-1 eCode360 read of 903.03 (see `sources/ecode360-2026-09-26-pittsburgh-903-03-dimensional-standards.md`); we did not re-open eCode360 this round.

### 1d. Adjacent records found while scanning
- **2026-0892** (in Standing Committee, on the 9/30/26 agenda): "Resolution adopting Plan Revision to the City of Pittsburgh's Official Sewage Facilities Plan for 929 Liberty Avenue". This is a live example of the City Council resolution step in the DEP sewage planning process (see §4). `[read]`
- **2025-2224**: a site-specific rezoning to RP in Banksville. On the 9/29/26 Council agenda. `[read]`

---

## 2. Allegheny County Housing Needs Assessment: does one exist before Feb 2026?

**Answer.**
- No completed County HNA predates the executive order, going by the order's own text.
- One has been **in progress since an RFP in mid-2025**.
- Findings were **presented publicly in Aug–Sep 2026**.
- We found **no published report** (no title, consultant or PDF) as of 2026-09-26.

**Evidence**
- **The EO primary text** `[read]` [PDF](https://www.alleghenycounty.us/files/assets/county/v/1/government/county-executive/documents/executive-orders/executive-order-housing-for-all.pdf)
  - Executive Order **2026-1**, "HOUSING (Housing Outcomes through Unified Strategies, Investment, and Governance) for All", dated **February 5, 2026**.
  - Section 2: "Allegheny County shall, through Allegheny County Economic Development … undertake the **County's first Housing Needs Assessment**". Its stated scope covers barriers to production, a shortage estimate "across all income levels, geographic areas, and household sizes", financing tools, and policy recommendations.
  - Section 3 orders a review of land recycling and land banking.
  - Section 4.3 orders a template zoning-ordinance library through the Comprehensive Plan.
  - Section 5 orders a rank-ordering of County-owned sites for housing by **Dec 1, 2026**.
  - Section 8 orders an Emergency Housing Strike Team at-risk list that uses "Other key metrics as identified in the Housing Needs Assessment".
- **WESA, 2026-02-05:** "The county has never before conducted such an assessment; the city of Pittsburgh has done two in recent years, most recently in 2022"; "The county has already issued a request for proposals". `[read]` [WESA](https://www.wesanews.org/politics-government/2026-02-05/allegheny-county-housing-study)
- **The RFP.** Issued by the Redevelopment Authority of Allegheny County, administered by ACED: "a one-time contract to develop a comprehensive Housing Needs Assessment for Allegheny County". The BidNet listing is dated about **June 11, 2025**. `[skimmed]` (search summary only). [BidNet](https://www.bidnetdirect.com/pennsylvania/solicitations/open-bids/statewide/Housing-Needs-Assessment/443543343419) is `[inaccessible]` (HTTP 403).
- **WESA, 2026-08-03:** it quotes "the county's **ongoing** housing needs assessment", with findings on rental loss. `[read]` (article; no report link) [WESA](https://www.wesanews.org/development-transportation/2026-08-03/housing-acquisition-fund)
- **Altoona Mirror, 2026-09-18:** the County Executive "outlined the findings of a new county housing needs assessment" at a state House committee hearing. The findings covered starter-home supply dwindling, the loss of about $1,000/month apartments, and gains in $2,000+/month units. `[skimmed]` (secondary; no report). [Altoona Mirror](https://www.altoonamirror.com/news/local-news/2026/09/pittsburgh-targets-housing-woes)
- **The catalog URL** `https://www.alleghenycounty.us/Services/Housing/Housing-Needs-Assessment` returns **404** (WebFetch) and **403** (curl). `[inaccessible]` (dead link). The County Housing services page lists no HNA. `[read]` [Housing page](https://www.alleghenycounty.us/Services/Housing)
- **ACED's "Plans and Evaluations" page** lists the Analysis of Impediments (May 15, 2015), the **2021 Allegheny County Market Value Analysis**, the **2020–2024 Consolidated Plan**, a 2024 Annual Report and the 2023 CAPER. It lists no HNA. `[read]` [ACED Plans and Evaluations](https://www.alleghenycounty.us/Projects-and-Initiatives/Economic-Development/Plans-and-Evaluations)
- **Look-alikes that are not a County HNA:**
  - The **City of Pittsburgh HNA**: 2017, with an update by HR&A "published in January 2022", per Planning Commission findings. `[read]` (via the Legistar attachment). The PLB site hosts a copy; see [PLB resources](https://pghlandbank.org/resources/). `[found]`
  - DHS's **"Allegheny Housing Assessment (AHA)"**, a homelessness-services prioritization tool. `[skimmed]` [DHS page](https://www.alleghenycounty.us/Services/Human-Services-DHS/DHS-News-and-Events/Accomplishments-and-Innovations/Allegheny-Housing-Assessment)
  - The **Consolidated Plan's HUD-required "Needs Assessment" section**. `[found]` (not opened)

**Inference.** The catalog's "Allegheny County Housing Needs Assessment" entry, with its "13 subregions" and a URL that does not exist, looks like a placeholder for the in-progress 2025–26 study, or a conflation with one of the look-alikes above. We did not find the "13 subregions" claim in any source (RFP text not opened).

---

## 3. Reinvestment Fund 2021 MVA: market types and Displacement Risk Ratio

**Primary artefacts**
- The WPRDC dataset `market-value-analysis-2021`: Executive Summary PDF, Dec 14 2021 presentation, MVA and DRR shapefiles, and the **"MVA/DDR Data Dictionary" XLSX**. `[read]` [WPRDC](https://data.wprdc.org/dataset/market-value-analysis-2021)
- The dataset was commissioned jointly by ACED and URA. It is a single city-plus-county model at Census block group (BG) level, using 2017–2019 data. `[read]`

**MVA method** (Exec Summary) `[read]`
- A cluster analysis of BGs on eight indicators:
  - median sale price and price variance (OPA sales 2017–19)
  - foreclosure filings as % of owner-occupants
  - new construction (% of residential parcels built 2016+)
  - % of parcels in poor or worse condition
  - % of residential lot area that is vacant land
  - building violations (ACHD inspections)
  - owner occupancy (ACS)
  - % of rental units subsidized (HUD Picture of Subsidized Housing)
- It produced **10 clusters**. The indicators were validated by field visits and a local expert panel.
- 13 of 1,110 BGs are unassigned because they had too few sales.

**A–J meanings** (verbatim in the saved source)

| Tier | Type | Short description |
|---|---|---|
| Robust | A | highest values, most new construction, highest owner occupancy, little distress |
| Robust | B | elevated values, substantial new construction, more renters than owners, little distress |
| Robust | C | above-average values, highest owner occupancy |
| Steady | D | average values, half the average new construction, more renters, low vacancy and poor condition |
| Steady | E | slightly below-average values, high owner occupancy, above-average vacant land |
| Steady | F | slightly below-average values, high share of subsidized renters |
| Transitional | G | below-average values, above-average foreclosure and vacant land |
| Transitional | H | values well below average, the highest vacant land and foreclosure |
| Stressed | I | second-lowest values, the highest subsidized renters and violations |
| Stressed | J | lowest (highly variable) values, the highest share in poor condition |

- BG counts: A 76, B 113, C 185, D 100, E 196, F 24, G 190, H 122, I 30, J 42. `[read]`
- MVA fields: `MVA21`, `MSP1719`, `VSP1719`, `PHHOO`, `PROSubHH`, `pforc1719`, `pcond_flag`, `PViolAddress`, `PNRofRCnt`, `PVacLot`. `[read]`

**DRR: what the primary sources say**

*Data dictionary* `[read]`
- `DRRxxxx` = "Displacement Risk Ratio for each two-year period".
- `dDRR1419` = the change from 2014/15 to 2018/19.
- Mapping classes run from "Below avg" through 0.5 steps to "3.0 or Above".
- **The dictionary gives no formula.**

*Shapefile inspection* `[read]`
- 1,100 BGs. Six two-year windows: 1415, 1516, 1617, 1718, 1819 and 1920 (i.e. 2019–20).
- Values range from about −1.8 to about +18. The median is about −0.1 to −0.2 in each window.
- DRR1819 classes: 618 "Below Countywide Ave", 32 "3.0 or Above", 47 "Insufficient Data".

*Definition* (from Reinvestment Fund's own description and Pew's 2016 report, which used the same index under the name "affordability index")
- Reinvestment Fund: "compares changing residential sales prices over time with the inflation-adjusted median income of residents at a fixed starting point … A score over 3.0 is considered unaffordable, and a negative value, which can result from the index's adjustment for citywide price trends, indicates deep affordability." `[read]` [Reinvestment Fund, 2016-05-24](https://www.reinvestment.com/insights/measuring-displacement-risk-in-gentrifying-neighborhoods/)
- Pew endnote 9: "tracks changing residential sales prices in an area over time in relation to the inflation-adjusted median income of area residents at the starting point … The citywide values are then subtracted to remove the influence of broader trends". `[read]` [Pew PDF](https://www.pew.org/-/media/assets/2016/05/philadelphias_changing_neighborhoods.pdf)

*Reconstructed formula (inference, not stated in any Allegheny document)*

  `DRR(bg, t) ≈ [MSP(bg, t) / MHHI(bg, base) × CPI adj] − [same ratio for the county]`

  where MSP is the median sale price over a two-year window and MHHI(bg, base) is median household income in the base year.

  Supporting evidence:
  - The Pittsburgh file's "Below Countywide Ave" label for negative values.
  - Within each period, every DRR value shares the same trailing decimal digits, which suggests one constant is subtracted from each BG's ratio.

  **Not documented:**
  - the base year or ACS vintage
  - the inflation index
  - whether the county term is a ratio of medians
  - the minimum sales count

  Treat the DRR as an **ordinal warning flag** (for example, a value ≥ 3 is "out of reach for the base-period resident"). Do not treat it as a calibrated probability of displacement.

- **Staleness (inference).** The windows end in 2019–20 and the sales data end in 2019. The DRR is pre-pandemic. The Exec Summary itself shows city E-market prices up 96% from 2016 to 2021.

---

## 4. PWSA (Pittsburgh Water) developer requirements and DEP sewage planning

**Developer's Manual, revised March 6, 2026 (47 pp)** `[read]` [PDF](https://www.pgh2o.com/sites/default/files/2026-03/2026%20Developer%27s%20Manual.pdf) · [page](https://www.pgh2o.com/developers-contractors-vendors/developers-manual-standard-details)

**What triggers a review** `[read]`
- **Every** development permit starts with a mandatory **pre-development meeting**.
- A **Water & Sewer Availability ("will-serve") Letter** is required for projects that need a DEP Sewage Facilities Planning Module (SFPM). The manual says it "is not a permit".
- **Residential permits** cover single-family new or reconnected taps. They need no tap-in drawings and are "typically issued within two weeks".
- A **development permit** is required for:
  - anything else
  - a single-family home with fire service
  - subdivided lots
  - more than 2 homes in a planned development
  - more than 2 tap terminations
- **Tap-in plans** (PE-stamped) are required for "new taps, increasing flow to existing taps, or increasing storm flow".
- [Permits page](https://www.pgh2o.com/developers-contractors-vendors/permits) `[read]`

**The capacity test** `[read]`
- SFPM review asks whether the proposed flows cause a **dry-weather** hydraulic overload within **5 years** at the **most limited capacity sewer (MLCS)** downstream.
- PWSA provides the MLCS location in the portal.
- Present flow at the MLCS is measured by:
  - flow-depth readings (5 readings, 6–8 AM or PM) when project flows are ≤ 4,000 gpd
  - 30-day professional flow monitoring when they are > 4,000 gpd
- Peaking factors are 3.5 for combined and 3.0 for separate systems.
- ALCOSAN separately reviews conveyance and treatment.

**When sewage planning is needed** (Planning Workflow Diagram) `[read]`, with the branch layout reconstructed from the PDF's text, so the arrows are `[skimmed]`
- For a lot created **before May 15, 1972**: planning is triggered by existing flows > 799 gpd **and** net flows > 399 gpd, or by project flows > 799 gpd.
- For newer lots: planning is triggered by no prior planning approval, additional lots created since 1972, or flows exceeding the prior approval.
- The manual: "subdivisions which result in additional lots … will always result in the need for sewage planning". Lot consolidations and lot-line revisions "do not necessarily" trigger it. [diagram](https://www.pgh2o.com/sites/default/files/2025-04/WSUse_PlanningWorkflowDiagram.pdf)

**Timelines** `[read]`
- Baseline review is 30 business days per review. Expedited review is guaranteed within 15 business days.
- The SFPM sign-off chain is PWSA → ALCOSAN → City Planning → Law (drafts a resolution) → **City Council** → DEP. The SFPM page says this "could take 3-6 months". "The DEP has up to 90 days to respond."
- "No Pittsburgh Water tap-in permits will be issued until final approval from DEP".
- Permits are valid 5 years. Applications lapse after 1 year of inactivity.
- **2025 actuals** ([report](https://www.pgh2o.com/sites/default/files/2026-01/Development%20Services%20Report%202025%20For%20Website.pdf)) `[read]`:
  - 63 development permits
  - 32 availability requests
  - development permits took "an average of just 6 to 8 months" including developer delays
  - fastest 68 days; an expedited review done in 9 days

**Fees (2026 schedule)** `[read]` [PDF](https://www.pgh2o.com/sites/default/files/2026-01/Fee%20Schedule%202026_0.pdf)

| Item | Fee |
|---|---|
| Availability letter | $40 |
| Residential permit | $40 |
| Development permit (includes SFPM and tap-in review) | $740 (expedited $1,290) |
| SFPM review only | $320 |
| Tap-in review only | $420 |
| Connection fee | $340 (1") to $400 (4–12") |
| 5/8" meter | $190 |
| Typical single-family 1" service + 5/8" meter (permits page) | $570 total |

"Pittsburgh Water does not provide a preliminary cost estimation." `[read]`

**Public capacity map: none found.**
- Neither pgh2o.com nor an ArcGIS Online search turned up a sewer or water **capacity** layer.
- The public layers we found are sewersheds, "PWSA_Sanitary_Sewer_Areas" and project locations. `[skimmed]` (ArcGIS search metadata only)
- Capacity is determined per project at the MLCS. This is consistent with the repo rule that "capacity is unknown, not fails". `[read]` / inference

**Checking the "no exemptions since 2011" claim: confirmed, with a date correction.**
- The Manual (rev. 3/6/2026) says: "On March 2, 2011, the DEP issued a determination that, due to an ongoing consent order regarding the discharge of untreated wastewater, the Pittsburgh Water and ALCOSAN do not comply with the Clean Streams Law. As a result, the DEP does not accept SFPM exemptions for any development located within the Pittsburgh Water service area." It cites 25 Pa. Code 71.51(2). `[read]`
- A search-engine snippet of the pgh2o SFPM page gave "as of March 24, 2011" and "all 83 municipalities which discharge to ALCOSAN". That wording is **not on the live page** we fetched on 2026-09-26. `[skimmed]`
- Use **March 2, 2011** (the Manual) as the determination date. The March 24 date may have been an effective date on an older page version, but that is unverified.
- **Nuance.** "No exemptions" does not mean "every project needs a module". The workflow thresholds above decide whether planning is required at all. `[read]` [SFPM page](https://www.pgh2o.com/developers-contractors-vendors/permits/dep-sewage-facilities-planning-module)

---

## 5. Pittsburgh Land Bank: inventory and disposition policy, 2026 records

**The correct domain is pghlandbank.org.** `pittsburghlandbank.org` did not resolve in DNS from here. `[inaccessible]` (no DNS answer)

**Disposition policy** `[read]`
- **2022 Disposition Process** ([PDF](https://pghlandbank.org/wp-content/uploads/2022/10/PLB-Disposition-Process_2022.pdf)):
  - Property Transfer Application.
  - A **two-thirds Board vote** on the sale and the end user.
  - At least **30 days' public notice** and signage before the Purchase and Sale Agreement.
  - A **20-day objection window**. **15 or more** petitioners trigger a neighborhood public hearing.
  - 30 days to sign the Purchase and Sale Agreement, and closing within 6 months.
- **Noncompetitive ("direct sale") uses**, adopted by amendment on 4/6/2022 and implemented in 2023:
  - side yards (adjacent owner-occupants, at most 2)
  - housing with **≥25% of units at ≤80% AMI**
  - Property Reserve
  - community facilities
  - assemblages (applicant owns ≥50% of the site)
  - nonprofit green space
- Consideration is market-based unless a policy exception applies. [P&P 2022](https://pghlandbank.org/wp-content/uploads/2022/12/2022-PLB-Policies-Procedures-Amendment-4.6.22_FINAL.pdf) · [2024 Annual Report](https://pghlandbank.org/wp-content/uploads/2025/07/Pittsburgh-Land-Bank-2024-Annual-Report-1.pdf)
- **City–URA–PLB Tri-Party Agreement** (rev. 10/18/23), §7(g): a goal that "**eighty percent (80%)** of the properties disposed of by the PLB will be for the development of affordable housing", defined as rentals at ≤50% AMI and for-sale at ≤80% AMI. §17 requires reporting of properties held and transferred and units created. `[read]` [PDF](https://pghlandbank.org/wp-content/uploads/2024/02/PLB-City-URA-Tri-Party-Coop-Agreement-final-revised-10.18.23.pdf)

**2026 board records** `[read]` [Agendas & Minutes](https://pghlandbank.org/agendas-and-minutes-2/)
- Meetings are on the second Friday at 1 PM. There were no meetings in January or August.
- Agendas and minutes are posted for Feb–Jun. The July agenda is posted, but its minutes are not yet.
- The **Sept 11, 2026 agenda** has 8 actions:
  - City-lot acquisition for resale to a nonprofit
  - a conservatorship intervention
  - three PLB-inventory sales at $12k–$28k
  - $1 side-yard slices of a 232,289 sf parcel
  - a Sheriff's Sale acquisition
  - a donation
  - a RAAC grant application
- The posted "minutes" are annotated agendas.

**Inventory** `[read]`
- **There is no machine-readable PLB parcel inventory** on pghlandbank.org or WPRDC (CKAN search, 2026-09-26).
- Pending sales: 46 project entries ([page](https://pghlandbank.org/pending-sales/)).
- Completed sales: 3 in 2023, 7 in 2024, 31 in 2025, and 8 in 2026 to date ([page](https://pghlandbank.org/completed-sales/)).
- Parcel IDs appear only inside individual board resolutions.

**Scale and funding** (Task Force report, Dec 22, 2025, Council file 2025-2698) `[read]` [PDF](https://pghlandbank.org/wp-content/uploads/2026/01/2025-2698-PLB-Task-Force-Report-Recommendations-1.pdf)
- A universe of **13,770 parcels** needing intervention: about 5,000 vacant lots and 270 condemned structures in the Three Taxing Bodies inventory, plus 3,825 lots and 4,675 structures delinquent five or more years.
- About 11,311 tax-delinquent parcels citywide.
- The Sheriff's Sale access agreement was executed in Nov 2025.
- ARPA, the main revenue source, must be spent by the end of FY2026.
- The report calls its figures "preliminary projections" and recommends improving "the accuracy, completeness, and usability" of the 3TB inventory.

**Trap caught.** A search result titled "PLB Board … Approved Meeting Minutes for April 14, 2026", with claims about an "EOI process" and "disposition policy not updated since January 2020", is the **Philadelphia** Land Bank. We opened the PDF and its header reads "PHILADELPHIA LAND BANK". It does not apply to Pittsburgh. `[read]`
- A claimed 2026 PLB budget detail ("71 sales", "46 properties from city inventory") comes from a citizenportal.ai summary. The Dec 2025 minutes record only "Motion to approve the budget … passed unanimously", with no figures. The claim is `[skimmed]` and unverified. [citizenportal.ai](https://citizenportal.ai/articles/7435878/pennsylvania/allegheny-county/pittsburgh/pittsburgh-land-bank-approves-2026-budget-authorizes-banking-and-bookkeeping-changes-and-greenlights-multiple-property-transfers)

---

## Contradictions resolved and remaining

**Resolved**
1. **Did 2025-1545 pass?** No. As of 2026-09-26 its status is "Held In Council", with no passage or enactment, and the last action was the 9/23/26 public hearing. `[read]`
2. **Is Ord 10-2025 the same as 2025-1579?** Yes: enactment number 10, passed 5/6/2025, signed 5/7/2025. The "May 5" in the June 2026 Planning Commission findings conflicts with Legistar's 5/6; **we use Legistar**. `[read]`
3. **County HNA: "existing" vs. "first".** The EO's own text says "the County's first Housing Needs Assessment". The RFP dates to about June 2025 `[skimmed]`. Findings were presented in Aug–Sep 2026, but no report has been published. The catalog's URL is dead (404/403). **The "first" claim is supported by the primary EO text. The catalog entry is unsupported.** The inference that the catalog conflated the in-progress study or a look-alike is ours.
4. **The "no SFPM exemptions since 2011" claim** is confirmed by the Manual. The **date is March 2, 2011** (the DEP determination). "March 24, 2011" comes only from an unverified snippet.
5. **The Philadelphia/Pittsburgh "PLB" mix-up** in search results is identified and excluded.

**Remaining**
- **Which affordable-housing text will Council adopt for 2025-1545?** Either the Oct 2025 Council substitute (voluntary bonus) or the June 2026 Planning Commission substitute (Performance Points citywide). The record does not decide it yet.
- The June 2026 R&R says the Planning Commission hearing was "June 5, 2026", but its decision page says June 2, 2026. This is an internal inconsistency in the attachment.
- **The DRR formula** is reconstructed from the Philadelphia/Pew description. The base year, income vintage and inflation index for the Allegheny 2021 run are **undocumented** in every artefact we opened. The presentation PDF's text layer has no DRR slides; the image-only slides were not OCR'd.
- **The County HNA** (title, consultant, release date, geography, and whether it has "13 subregions") is unknown. Also unknown: whether the catalog's "13 subregions" comes from the RFP.
- **PLB current inventory size** (parcels held today) is not published in machine-readable form. The Tri-Party §17 reports were not found.
- **PWSA workflow-diagram arrows** were reconstructed from extracted text and should be checked against the graphic.

---

## Sources (all accessed 2026-09-26)

**Council records**
- [read] Legistar Web API, matters, histories, attachments, texts, events, eventitems and votes for 2025-1545 (31504), 2026-0834 (33576) and 2025-1579 (31538): https://webapi.legistar.com/v1/pittsburgh/matters
- [read] 2025-1545 Planning Commission Report & Recommendation (June 11, 2026 letter; June 2, 2026 hearing report): https://pittsburgh.legistar1.com/pittsburgh/attachments/1aea03bb-c723-4b1d-bff2-f7b61b7766db.pdf
- [read] 2025-1545 cover letter (Feb 18, 2025): https://pittsburgh.legistar1.com/pittsburgh/attachments/457a6639-f87b-4859-946e-b66029a3e1ab.docx
- [read] 2025-1545 summary / fiscal impact: https://pittsburgh.legistar1.com/pittsburgh/attachments/f94d19fe-36ff-43ed-bed8-27d1bc92a04f.docx
- [skimmed] 2025-1545 Version 2 full text (145 pp; extracted, title and structure checked only): https://pittsburgh.legistar1.com/pittsburgh/attachments/65d6fdab-191c-486b-bb06-56db9d20c310.pdf
- [skimmed] 2025-1545 Planning Commission recommended substitute text (June 2, 2026; extracted, not read in full): https://pittsburgh.legistar1.com/pittsburgh/attachments/a2344b06-117d-4bb0-b13a-cbe04b7385fd.pdf
- [read] 2026-09-23 Committee on Hearings and Policy minutes: https://pittsburgh.legistar1.com/pittsburgh/meetings/2026/9/12056_M_Committee_on_Hearings_and_Policy__26-09-23_Meeting_Minutes.pdf
- [read] 2025-10-15 Standing Committee minutes (the 2025-1545 substitute vote): https://pittsburgh.legistar1.com/pittsburgh/meetings/2025/10/11721_M_Standing_Committee_25-10-15_Meeting_Minutes.pdf
- [read] 2026-0834 hearing report (July 28, 2026): https://pittsburgh.legistar1.com/pittsburgh/attachments/3db4d4bd-73a6-4791-bff7-c02657c58913.pdf
- [read] 2026-0834 cover letter, Planning Commission decision and summary (DOCX, via the matter attachments endpoint)
- [read] 2025-1579 matter text with strike/underline (Legistar `matters/31538/texts/33085`, RTF)

**Allegheny County HNA**
- [read] Allegheny County Executive Order 2026-1, "HOUSING for All": https://www.alleghenycounty.us/files/assets/county/v/1/government/county-executive/documents/executive-orders/executive-order-housing-for-all.pdf
- [read] WESA, 2026-02-05: https://www.wesanews.org/politics-government/2026-02-05/allegheny-county-housing-study
- [read] WESA, 2026-08-03: https://www.wesanews.org/development-transportation/2026-08-03/housing-acquisition-fund
- [skimmed] Altoona Mirror, 2026-09-18: https://www.altoonamirror.com/news/local-news/2026/09/pittsburgh-targets-housing-woes
- [skimmed] BidNet, RAAC "Housing Needs Assessment" RFP (the page itself was [inaccessible], HTTP 403): https://www.bidnetdirect.com/pennsylvania/solicitations/open-bids/statewide/Housing-Needs-Assessment/443543343419
- [inaccessible] Catalog URL, HTTP 404/403: https://www.alleghenycounty.us/Services/Housing/Housing-Needs-Assessment
- [read] Allegheny County Housing services page: https://www.alleghenycounty.us/Services/Housing
- [read] ACED Plans and Evaluations: https://www.alleghenycounty.us/Projects-and-Initiatives/Economic-Development/Plans-and-Evaluations
- [skimmed] DHS Allegheny Housing Assessment (AHA): https://www.alleghenycounty.us/Services/Human-Services-DHS/DHS-News-and-Events/Accomplishments-and-Innovations/Allegheny-Housing-Assessment

**MVA / DRR**
- [read] WPRDC market-value-analysis-2021 (CKAN metadata, Exec Summary PDF, Data Dictionary XLSX, DRR shapefile .dbf): https://data.wprdc.org/dataset/market-value-analysis-2021
- [skimmed] MVA presentation, Dec 14 2021 (text layer only; image slides not OCR'd): https://data.wprdc.org/dataset/f669d677-c9e2-4d2f-b16f-c9ab5a4f3d10/resource/8f79a5b6-14e0-422d-8a7e-abcb78f85093/download/mva_alleghpittspa_rollout_dec21.pdf
- [read] Reinvestment Fund, "Measuring displacement risk in gentrifying neighborhoods" (2016-05-24): https://www.reinvestment.com/insights/measuring-displacement-risk-in-gentrifying-neighborhoods/
- [read] Pew Charitable Trusts, "Philadelphia's Changing Neighborhoods" (May 2016), endnote 9 and figure notes: https://www.pew.org/-/media/assets/2016/05/philadelphias_changing_neighborhoods.pdf
- [skimmed] PolicyMap, TRF MVAs source page (no DRR content): https://www.policymap.com/data/sources/trf-market-value-analyses-mvas

**PWSA / DEP**
- [read] PWSA Developer's Manual, rev. March 6, 2026: https://www.pgh2o.com/sites/default/files/2026-03/2026%20Developer%27s%20Manual.pdf
- [read] PWSA DEP SFPM page: https://www.pgh2o.com/developers-contractors-vendors/permits/dep-sewage-facilities-planning-module
- [read] PWSA Permits page: https://www.pgh2o.com/developers-contractors-vendors/permits
- [read] PWSA Tap-in Plan Review page: https://www.pgh2o.com/developers-contractors-vendors/permits/water-and-sewer-tap-plan-review
- [read] PWSA Developer's Manual & Standard Details page: https://www.pgh2o.com/developers-contractors-vendors/developers-manual-standard-details
- [read] PWSA 2026 Fee Schedule: https://www.pgh2o.com/sites/default/files/2026-01/Fee%20Schedule%202026_0.pdf
- [read] PWSA Planning Workflow Diagram (text extracted; arrows [skimmed]): https://www.pgh2o.com/sites/default/files/2025-04/WSUse_PlanningWorkflowDiagram.pdf
- [read] PWSA Development Services Report, 2025 in Review: https://www.pgh2o.com/sites/default/files/2026-01/Development%20Services%20Report%202025%20For%20Website.pdf
- [skimmed] ArcGIS Online search for PWSA sewer layers (metadata only): https://www.arcgis.com/sharing/rest/search

**Pittsburgh Land Bank**
- [read] Pittsburgh Land Bank, Agendas & Minutes, Pending Sales, Completed Sales and Board Meetings pages: https://pghlandbank.org/agendas-and-minutes-2/ · https://pghlandbank.org/pending-sales/ · https://pghlandbank.org/completed-sales/ · https://pghlandbank.org/monthly-meetings/
- [read] PLB Sept 11, 2026 agenda: https://pghlandbank.org/wp-content/uploads/2026/09/September-2026-_Chairmans-Agenda-FINAL-9926.pdf
- [read] PLB minutes for Apr 10, May 8 and Jun 12, 2026, and Dec 2025 (PDFs linked from the Agendas & Minutes page)
- [read] PLB Disposition Process 2022: https://pghlandbank.org/wp-content/uploads/2022/10/PLB-Disposition-Process_2022.pdf
- [read] PLB Policies & Procedures, amended 4/6/2022: https://pghlandbank.org/wp-content/uploads/2022/12/2022-PLB-Policies-Procedures-Amendment-4.6.22_FINAL.pdf
- [read] PLB 2024 Annual Report: https://pghlandbank.org/wp-content/uploads/2025/07/Pittsburgh-Land-Bank-2024-Annual-Report-1.pdf
- [read] City–URA–PLB Tri-Party Cooperation Agreement, rev. 10/18/23: https://pghlandbank.org/wp-content/uploads/2024/02/PLB-City-URA-Tri-Party-Coop-Agreement-final-revised-10.18.23.pdf
- [read] Task Force on Sustainable Funding for the PLB, report of Dec 22, 2025: https://pghlandbank.org/wp-content/uploads/2026/01/2025-2698-PLB-Task-Force-Report-Recommendations-1.pdf
- [read] Philadelphia Land Bank minutes of April 14, 2026 (opened only to rule them out): https://landbank-media.s3.amazonaws.com/media/2026/05/15102807/PLB-Board-Approved-Meeting-Minutes-4.14.2026.pdf
- [skimmed] citizenportal.ai summary of the PLB 2026 budget: https://citizenportal.ai/articles/7435878/pennsylvania/allegheny-county/pittsburgh/pittsburgh-land-bank-approves-2026-budget-authorizes-banking-and-bookkeeping-changes-and-greenlights-multiple-property-transfers
- [inaccessible] pittsburghlandbank.org (no DNS answer)
