# Round 1 review: Demand and market reality

Reviewer lens: the Demand pillar, plus the market signals in the displacement sub-score (Housing Need & Displacement Risk pillar).
Config reviewed: `pillars.config.json` version `2026-09-26.11`. Date: 2026-09-26.

Evidence tags: **[read]** means I opened the file or page and checked the number myself. **[skimmed]** means a search-result summary or listing page that I did not verify line by line. Real-estate portal figures (Redfin, Homes.com, Zillow) come from small monthly samples and swing a lot, so I treat them as direction only. Broker blogs are marketing and get low weight.

Method:
- Ran `explain-parcel.ts` on the 17 review PINs and 7 extra PINs I chose.
- Ran `diagnostics.ts`.
- Computed neighborhood medians of every Demand indicator across all 142,292 scored parcels.
- Checked the raw input CSVs and build scripts.
- Re-scored every parcel offline under the proposed changes (scratch script, not committed) to estimate what each change does.

I changed no code or config.

---

## TL;DR

The Demand pillar ranks Pittsburgh's clearly hot, renter-heavy, new-supply neighborhoods as "middling" and below stable owner-occupied areas:

| Neighborhood | Median Demand |
|---|---|
| Strip District | 42 |
| East Liberty | 43 |
| Lower Lawrenceville | 45 |
| Squirrel Hill South | 45 |
| Downtown | 46 |
| Brookline | 54 |
| Overbrook | 53 |
| Swisshelm Park | 62 |

Its only top-band ("People really want to live here") scores go almost entirely to artifacts: a railroad right-of-way and industrial or government land. Three causes account for most of this, and each is a data-pipeline problem rather than a weighting choice:

1. **Apartment buildings never reach `demand_new_construction`.** The permits overlay keeps only permits PLI tags "Residential". All 57 multifamily (5+ unit) new-construction permits since 2022 are tagged "Commercial" and are dropped. Permits are also counted, not units.
2. **`demand_sales_turnover` mostly measures homeownership share.** Spearman ρ = 0.71 with tract % owner-occupied.
3. **Small-denominator artifacts pass through unguarded.** Examples: USPS vacancy of 0% from a tract with 1 residential address, block-group job growth of +278% on a base of 60 jobs, and price-growth medians from 5–7 sales. A documented rule ("fewer than 10 sales are blank") is not implemented.

With the fixes below, my offline re-score raises the neighborhood-level Spearman correlation between Demand and the independent Reinvestment Fund MVA class from **0.60 to 0.77** (83 neighborhoods, ≥100 parcels each). The fixed version does not use prices, so this is not circular by construction. The MVA does share inputs (sales, vacancy), so read it as a sanity check, not ground truth.

---

## 1. Parcel-by-parcel verdicts

"Ours" is the current Demand score and phrase. "Disp" is the displacement sub-score (100 = low risk). "A" is the re-scored Demand under recommendations R1–R6 (see §3). All scores are 0–100.

| PIN | Neighborhood | Ours (Demand) | Verdict | Why (our data) | External evidence |
|---|---|---|---|---|---|
| 0052L00036050100 (condo) | Squirrel Hill North | 59.8 "Solid demand" | **Agrees** (arguably a bit low) | Low vacancy 1.5%, mid turnover | Median sale about $766K, days on market falling ([Redfin via search](https://www.redfin.com/neighborhood/156317/PA/Pittsburgh/Squirrel-Hill-North/housing-market)) [skimmed]. A = 53, because owners rarely sell and turnover understates demand. Option B (price level) = 61. |
| 0174K00352000000 (City vacant lot) | Homewood South | 17.4 "Not many people are looking to move here right now" | **Score agrees; phrase and displacement wrong** | Vacancy 17.3%, 7 sales in 2024–25, households −11% (within margin of error) | Long population decline and high vacancy ([NeighborhoodScout](https://www.neighborhoodscout.com/pa/pittsburgh/homewood-south), [Allegheny Analytics profile](https://analytics.alleghenycounty.us/wp-content/uploads/2015/12/Homewood-A-Community-Profile.pdf)) [skimmed]. Active nonprofit and land-bank rebuilding ([WESA 2025](https://www.wesa.fm/development-transportation/2025-05-16/pittsburgh-homewood-redevelopment-row-houses), [PublicSource](https://www.publicsource.org/homewood-vacant-properties-revitalization-efforts-pittsburgh/)) [skimmed]. **Disp = 100 "Prices are stable" is wrong:** it rests on −54% from 5 sales to 7 sales. The config says such tracts are blank, but they are not. The phrase stigmatizes the place and describes preference rather than the data (see R8). |
| 0049J00089040900 (condo) | Lower Lawrenceville | 45.0 "Demand is middling" | **Too low** | Turnover 35 (renter tract); vacancy 5.4%, likely lease-up of new buildings (USPS no-stat 18.5%); ZIP rent growth 26; only 2 "new residential" permits in the whole neighborhood since 2022 (one is a retaining wall) | Lawrenceville and the Strip are consistently the hottest urban submarkets ([BHHS 2026](https://www.thepreferredrealty.com/blog/article/Neighborhood-Deep-Dive-2026-Real-Estate-Trends-in-Pittsburgh-and-What-to-Expect-Next/), broker source) [skimmed]. The classified permits file has a 343-unit Lower Lawrenceville apartment permit (2020) that the indicator never sees [read]. A = 60. Disp 70 "Mild price pressure" is defensible, since the price run-up mostly happened before 2020 (+4.8% since 2020–21). |
| 0002A00127110800 (condo) | Central Business District | 48.8 "Demand is middling" | **Too low** | Vacancy 0.7% (86th percentile), but household change −5% (within margin of error) → 26, turnover 30, **new construction 0 → 15** | About 1,300 units from office-to-residential conversions ([Planetizen 2025](https://www.planetizen.com/news/2025/04/134821-downtown-pittsburgh-set-gain-1300-new-housing-units), [WESA 2025-09](https://www.wesa.fm/development-transportation/2025-09-11/downtown-pittsburgh-office-conversion-projects-ura-loans)) [skimmed]. Conversions and commercial-code permits are both excluded. A = 72. Disp 99 "stable" is consistent with −8.5% condo prices. |
| 0056C00129000000 (vacant) | Hazelwood | 38.4 "Demand is middling" | **Agrees** | Turnover 10, vacancy 6.2% | Hazelwood Green's first 50 apartments open in 2027 ([NEXTpittsburgh](https://nextpittsburgh.com/city-design/hazelwood-greens-first-apartments-will-open-in-2027/)) [skimmed]. **Disp 9.8 "Prices are surging" is overstated.** It rests on a tract median going from $69K to $173K on 15 and 18 sales. Portals disagree wildly: Redfin +73% YoY (Nov 2025), Homes.com +15%, Movoto −3% ([search summary](https://www.homes.com/pittsburgh-pa/hazelwood-neighborhood/)) [skimmed]. Displacement concern is real (the neighborhood plan's goal is "no displacement", [City plan](https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/7601_final_hazelwood_plan.pdf)), but the magnitude is small-sample noise from a low base. |
| 0035N00192000000 (single family) | Beechview | 47.5 "Demand is middling" | **Right number, wrong reason** | **Job growth +278% → 100** in a block group that went from 60 to 227 jobs (+12.5 pts). Without it the score is 40.0. | Median about $200K, +9% YoY, days on market up from 40 to 57 ([Redfin via search](https://www.redfin.com/neighborhood/156561/PA/Pittsburgh/Beechview/housing-market)) [skimmed]: a middling market. Disp 40 "Prices are rising" is fair. |
| 0004L00301000000 (single family) | Mount Washington | 43.1 "Demand is middling" | **Slightly low** | Vacancy 12.3% → 8 (odd for this tract, no-stat only 4.5%); 15 permits nearby → 87 | Median about $230K, flat, days on market 56 → 84; new Grandview townhomes selling ([search summary](https://www.redfin.com/neighborhood/156466/PA/Pittsburgh/Mount-Washington/housing-market), [Marzullo 2026](https://johnmarzulloteam.com/mt-washington-pittsburgh-real-estate/)) [skimmed]. A = 50. **Disp 27 "Prices are surging" is too harsh:** +53% on 12 → 22 sales, while portals show about +1% YoY. |
| 0012F00071000000 (single family) | South Side Flats | 45.8 "Demand is middling" | **Agrees / slightly low** | Job growth −36% (bar-district block group) → 9 | Renter-heavy nightlife district with rising rents and crime complaints ([Homes.com guide](https://www.homes.com/local-guide/pittsburgh-pa/southside-flats-neighborhood/)) [skimmed]. A = 57. Disp 80 fits +11% prices. |
| 0083B00066000000 (three-family) | East Liberty | 41.4 "Demand is middling" | **Too low** | Turnover 23 (renter-heavy), vacancy 6.8% (lease-up); rent growth 76 and permits 92 are the only strong signals | Planning Commission approved a 199-unit building at Penn and Shady in 2026, plus a separate roughly 235-unit two-building project ([WESA 2026-07](https://www.wesanews.org/development-transportation/2026-07-01/pittsburgh-planners-approve-east-liberty-apartments-south-side), [EngagePGH](https://engage.pittsburghpa.gov/development-review/liberty-ave-and-penn-ave-new-construction)) [skimmed]. A = 49, B = 56. |
| 0052D00141001100 (condo) | Shadyside | 53.6 "Demand is middling" | **Too low** | Household change −14.5% (exceeds margin of error) → 5; otherwise strong | Median about $772K ([Redfin via search](https://www.redfin.com/neighborhood/156434/PA/Pittsburgh/Shadyside/housing-market)) [skimmed]; Walnut Capital apartment pipeline. A = 63. |
| 0096C00022000000 (single family) | Brookline | 50.3 "Demand is middling" | **Too high relative to others** | Owner-heavy, so turnover 53 and vacancy 52 | Described as a "buyer's paradise": about $196–210K, flat, Zillow forecasts −0.1% ([Houzeo](https://www.houzeo.com/housing-market/pennsylvania/pittsburgh/brookline), [Zillow](https://www.zillow.com/home-values/208709/brookline-pittsburgh-pa/)) [skimmed]. It currently outranks East Liberty and Lawrenceville. A = 38. |
| 0124N00365000000 (URA vacant lot) | Larimer | 33.3 "Not many people are looking…" | **Somewhat too low near Bakery Square; phrase wrong** | 8 sales in the tract; vacancy 11.9% | 220-unit apartment permit in Larimer in 2025 (our own `pgh_new_residential_permits_classified.csv`) [read], plus the Choice Neighborhoods build-out ([URA](https://www.ura.org/pages/larimer-east-liberty-choice-neighborhood-initiative)) [skimmed]. The tract signal is right for interior Larimer and wrong for the Bakery Square edge. **Disp 68 "Mild price pressure" rests on 7 → 8 sales** and should be blank. |
| 0175H00123000000 (City vacant lot) | Homewood South | 14.2 "Not many people are looking…" | Same as 0174K | Same as 0174K | Same as 0174K |
| 0138E00098000000 (single family) | Overbrook | 35.0 "Demand is middling" | **Agrees** | | No neighborhood-specific external evidence found (unverified). **Disp 21 "Prices are surging"** is +78% on 19 → 21 sales ($110K → $196K); likely composition or flips. Overstated. |
| 0075F00310000000 (County land, RIV-GI) | Marshall-Shadeland | **71.8 "Solid demand"** | **Far too high (artifact)** | Tract 9809 has **1 residential address**, so vacancy is 0% → 96. No household or sales data. Demand is computed from vacancy plus job growth alone at exactly the 0.5 coverage floor. | The neighborhood median is 34.6. Marshall-Shadeland is a weak market (MVA class H) [read, overlay]. |
| 0045N00357000000 (State land, GI) | Marshall-Shadeland | **77.5 "People really want to live here"** | **Far too high (artifact)** | Same tract 9809 | Same as above. The legal ×0.5 multiplier masks the overall score, but the Demand phrase still shows. |
| 0047K00076000000 (single family) | Spring Hill–City View | 45.5 "Demand is middling" | **Too high** | Household change +10% (within margin of error) → 93 inflates the score; turnover 14 | Median about $173.5K, +5% over the prior 12 months, about 48 days on market ([Homes.com](https://www.homes.com/pittsburgh-pa/spring-hill-city-view-neighborhood/)) [skimmed]. A = 34. **Disp 20 "Prices are surging"** comes from $82.5K → $195K on 15 → 17 sales; portals show about +5%. Overstated. |

**Extra parcels I chose to test hypotheses** [read, from `explain-parcel.ts`]:

| PIN | Hypothesis | Result |
|---|---|---|
| 0122R00300000000 (Lincoln-Lemington-Belmar, P-zoned railroad) | Artifacts reach the top band | **76.6 "People really want to live here"**: vacancy 0% (tract has 4 addresses) plus **job growth +1,840% → 100**. 31 of the 43 parcels citywide with Demand ≥75 are in Lincoln-Lemington-Belmar, and 8 are in Marshall-Shadeland. |
| 0007M00150000000 (North Shore, county parcel) | Stadium tract artifacts | 67.4 "Solid demand" from vacancy (0.4%) plus rent growth, with no household or sales data. The North Shore neighborhood median is 63.5, the highest in the city, all from this effect. |
| 0025F0017700E200 (Strip District condo) | Hot condo market scored low | **39.8 "Demand is middling."** The Strip has about 2,000 units in the pipeline and a 500-unit complex approved ([Post-Gazette 2025-11](https://www.post-gazette.com/business/development/2025/11/18/strip-district-planning-commission-apartments-pittsburgh/stories/202511180084), [Pittsburgh Magazine](https://www.pittsburghmagazine.com/more-housing-coming-to-the-strip-including-in-a-historical-building/)) [skimmed]. The indicator sees 2 permits. A = 68. |
| 0069B00002000000 (Fairywood, large RP lot) | Permit counts reflect subsidized clusters | Fairywood as a whole has 46 "new residential" permits, **44 of them one-story townhouse permits**, which match HACP's 46-unit Cedarwood senior cottage community ([HACP](https://hacp.org/housing_communties/cedarwood-homes/)) [skimmed]. One permit per unit gives Fairywood parcels a 100th-percentile construction score, while a 224-unit Strip building would count as 1 (if it were counted at all). |
| 0028G00087000000 (Central Oakland two-family) | Student rental market | Turnover 3/100 (almost no owner sales), household change −26% (student counting), rent growth 86. Middling at 44, which is plausible because student demand is not a family-housing signal. With fixes, A = 59. |
| 0050L00048000000 (Garfield vacant lot) | BG job-growth outlier | Job growth +155% → 99. Disp 30 from +141% prices. Garfield's price run-up is widely reported (not checked this round). |
| 0080D00164000000 (Upper Lawrenceville vacant lot) | | 51.6 "Demand is middling"; turnover 82 (owner-type rowhouses). A = 62. |

---

## 2. Systematic problems, ranked by impact

### P1. `demand_new_construction` misses every apartment building, counts permits instead of homes, and misses conversions. Impact: high, citywide.

- `scripts/data/activity.ts` keeps permits only when `commercial_or_residential === "residential"`. In the classified permits file [read], **all 57 multifamily 5+ permits since 2022 are tagged "Commercial"**, along with 19 single-family, 14 townhouse and 7 two-unit permits. At least 734 units sit in non-Residential permits.
- Result: the Strip District shows 2 permits, Lower Lawrenceville 2, Downtown 0.
- Each permit counts as 1. Fairywood's 44 HACP townhouse permits outweigh any apartment tower.
- Office-to-residential conversions (Downtown's main new supply) are not "NEW CONSTRUCTION" work.
- Diagnostics show r = 0.13 with the pillar.

### P2. `demand_sales_turnover` is a homeownership proxy. Impact: high.

- Sales counted are owner-type dwellings only (single family through four-family, condos). The denominator is **all** housing units, including apartments.
- Spearman ρ with tract owner share = **0.71** [read, computed from `allegheny_demand_acs_tract.csv`].
- Renter-heavy strong markets score low: East Liberty 23, Strip 25, Central Oakland 3, Lower Lawrenceville 35. Owner-heavy flat markets score high: Brookline 79, Overbrook 80.
- It carries weight 2 of 8.

### P3. Small-denominator artifacts, plus a coverage floor low enough to publish them. Impact: medium overall, severe where it hits.

- **USPS vacancy:** 12 tracts have fewer than 200 residential addresses. A 0% vacancy there ranks at the 96th percentile.
- **LODES block-group job growth:** 356 of 1,062 block groups had fewer than 100 jobs in 2019. Growth such as 60 → 227 jobs (+278%) or +1,840% reaches the 100th percentile. Commuting means home-block-group jobs are a weak demand signal anyway.
- **Coverage floor:** `min_coverage` 0.5 lets a Demand score be built from vacancy plus jobs alone (4 of 8 weight). The top phrase band (≥75) holds **43 parcels citywide, essentially all such artifacts**.

### P4. The documented low-sample rule for price growth is not implemented. Impact: medium on the displacement sub-score.

- The `afford_price_growth` rationale says "tracts with fewer than 10 sales in a pool are blank". Neither `tract_sales.py` nor `build-indicators.ts` blanks them.
- 38 tracts carry a value despite `low_n_flag` "pooled…<10". Their median |change| is 59%, against 32% for adequately sampled tracts [read].
- Homewood South: −54% from 5 → 7 sales becomes "Prices are stable" (100). Larimer: 7 → 8 sales becomes "Mild price pressure".

### P5. Percent price change mostly reflects a low starting price. Impact: medium on the displacement sub-score and its phrases.

- Among tracts with ≥10 sales, Spearman ρ between the 2020–21 median price and the % change is **−0.50** [read].
- Cheap tracts (Hazelwood, Spring Hill, Overbrook, Mount Washington, Garfield) are labeled "Prices are surging". Some of that is real (Garfield, Hazelwood). Some is composition: flips and a changing mix of what sells.
- "Surging" is stronger than the evidence for n ≈ 15–20 sales.

### P6. New-supply areas are penalized twice by vacancy and 12-month rent growth. Impact: medium.

- **Vacancy:** buildings in lease-up show up as vacant or no-stat. The USPS data is 2023 Q4, the peak delivery period; Downtown's no-stat share is 33.8%, Lower Lawrenceville's 18.5%.
- **Rent growth:** ZIP-level ZORI year-over-year growth is lowest where supply is highest (15201 at +2.6%). It is uncorrelated with the pillar (r = −0.08).
- Pittsburgh stabilized occupancy is 95.2% with 4,735 units under construction ([Yardi Matrix, Apr 2026](https://www.yardimatrix.com/blog/pittsburgh-multifamily-market-report/)) [read]. Soft short-run rents in new-supply ZIPs reflect a supply wave, not weak demand.

### P7. Household growth ranks noise across the full 0–100 scale. Impact: low to medium.

- Only 35 of 394 tracts change by more than the margin of error (the config says so itself).
- Percentile ranking still turns ±5% noise into scores of 8 to 93. Spring Hill (+10%, within the margin of error) gets 93; Beechview (−10%, within the margin of error) gets 9.

### P8. Phrase bands don't match the score distribution, and the low-band wording is unfair. Impact: communication.

- Demand distribution: p10 = 29, median = 43, p90 = 57.
- Band counts: 36,614 parcels below 35, **83,878 (59%) at 35–55 "middling"**, 21,757 at 55–75, **43 at ≥75**.
- "Not many people are looking to move here right now" claims to know people's preferences. The data measure market transactions and vacancy. The phrase lands on Homewood, Larimer and Lincoln-Lemington, predominantly Black neighborhoods that are the target of active reinvestment, so it reads as stigmatizing.
- "Prices are stable" is shown for falling prices and for missing data.

---

## 3. Concrete recommended changes

Each item gives the change, the reason and the expected effect. Neighborhood medians come from my offline re-score of all parcels with R1–R6 together, labeled **A**. **B** is A plus R7.

### R1. Fix `demand_new_construction`: count homes, include apartment buildings, weight 1 → 1.5

Either:

- change the `activity.ts` filter to accept `commercial_or_residential` = Commercial when the description matches apartment, multifamily, dwelling or unit (the logic already exists in `permits_classify.py`), or
- point the indicator at `scripts/pillars/inputs/pgh_new_residential_permits_classified.csv` (filter `year >= 2022`).

Then sum units instead of counting permits. This needs a small build change: `count_within` → `sum_within` with a `property` option. Use `log1p(units_guess ?? 1)`, so one 224-unit tower counts about as much as 5–6 single-family homes rather than 1, and never as much as 224.

Also add change-of-use and residential-conversion permits if PLI's `work_type` exposes them. That is **unverified**; check the WPRDC permit field values first.

- **Reason:** P1.
- **Expected effect:** the Strip, Lower Lawrenceville, Larimer (Bakery Square edge) and East Liberty gain construction signal. Fairywood's subsidized townhouse cluster no longer dominates.
- **Build note:** keep `radius_m` 800. Keep `reference: parcels`, but because 0-permit ties sit at the 15th percentile, consider `linear` with zero = 0 and full = the parcel p95 of log-units.

### R2. Fix the `demand_sales_turnover` denominator; weight 2 → 1.5

- Denominator: owner-type dwelling parcels in the tract (single family through four-family, townhouse, rowhouse, condo, from the assessment file already loaded in `tract_sales.py`), or owner-occupied units (HU × `pct_owner`).
- Blank the value when that denominator is below 150.
- **Reason:** P2. The indicator should measure how fast the for-sale stock turns over, not how much of the stock is for sale at all.
- **Expected effect (owner-unit version, simulated):** Strip turnover 25 → high, Shadyside 73 → 99, Lower Lawrenceville 35 → 89, Brookline 79 → 24.
- **Side effects to check before adopting:**
  - Terrace Village (45 → 75) and Crawford-Roberts (46 → 73) jump because their owner bases are small and include new for-sale homes. The parcel-count denominator with the ≥150 floor should damp this; verify.
  - Squirrel Hill North drops (60 → 53) because long-tenure owners rarely sell. That is a known weakness of turnover as a demand signal, and one reason to consider R7.

### R3. Guard small denominators and raise Demand coverage

- **`demand_low_vacancy`:** add a guard (new optional `source.min_base: {property: "res_addresses", min: 200}`) so the value is null when there are fewer than 200 residential addresses. Refresh USPS data to the latest quarter; it is 2023 Q4 now.
- **`demand_job_growth`:**
  - Null when `jobs_2019` < 250.
  - Weight 1 → 0.5.
  - Better: move to tract level, or replace with "change in jobs reachable within 45 min by transit", since residents commute.
  - Rationale text: say it is where people work, not where they live.
- **Pillar-level coverage:** add `"min_coverage": 0.75` on the Demand pillar (the scorer currently reads only the global `missing.min_coverage`, so this needs a small `score.ts` change). Alternatively, require at least one of `demand_sales_turnover` or `demand_household_growth`.
- **Reason:** P3.
- **Expected effect:** the 43 artifact parcels at ≥75 disappear (Lincoln-Lemington railroad land, Marshall-Shadeland government land, North Shore and Chateau tracts). Both Marshall-Shadeland review parcels become "insufficient data" instead of 72 and 78. Beechview's job artifact goes away.

### R4. Implement the documented low-sample rule for `afford_price_growth`

- In `tract_sales.py`, write null for `chg_pct_pooled_2021_to_2425` when either pool has fewer than 10 sales. Or add a config filter (`source.exclude_if: {low_n_flag_contains: "pooled"}`).
- Consider raising the threshold to 20. Among the review parcels, Mount Washington (12 sales) and Hazelwood (15) are borderline.
- **Reason:** P4. The config already promises this.
- **Expected effect:**
  - 38 tracts go blank.
  - Homewood South and Larimer displacement becomes "insufficient data" (the remaining weight, 1.5 of 3.5, is under 0.5 coverage) instead of "Prices are stable" and "Mild price pressure".
  - Neighborhood medians barely move elsewhere (Bloomfield 65 → 73, Fineview 67 → 21, Bluff 32 → 93: all small-sample tracts).

### R5. Reduce the short-run supply-sensitive signals

- `demand_rent_growth`: weight 1 → 0.5. Change the rationale to note that rents dip where new supply lands. Better: switch the property to a 3-year ZORI change so one lease-up year matters less.
- Add to the `demand_low_vacancy` rationale: "USPS counts units in lease-up as vacant; new-supply areas are understated."
- **Reason:** P6. r = −0.08 with the pillar; it is ZIP-level and has the wrong sign in supply waves.

### R6. Neutralize household change that is within the margin of error

In `hh_growth.py` or the build step, set the normalized value to 50 when `change_exceeds_moe` is False, and keep the percentile only for the 35 tracts that exceed it.

- **Reason:** P7.
- **Expected effect:** Spring Hill 93 → 50 and Beechview 9 → 50 on this indicator. Shadyside stays at 5 because its change exceeds the margin of error. That is worth a separate check: the −14.5% looks like a 2020-Census student-counting effect.

### R7 (value choice, for the team to decide). Add a price-level signal to Demand

Add `demand_price_level`: tract median sale price 2024–25 (`median_2024_2025` in the tract sales CSV, n ≥ 10), percentile, higher is better, **weight 1.5**. Alternatively, set `demand_market_strength` (MVA) to 1 in the `market_first` preset only.

- **Reason:** turnover and vacancy both misread stable prime areas (Squirrel Hill North, Point Breeze). Sale price is the most direct "willingness to pay" signal and is what a developer's pro forma needs.
- **Counter-argument, which the config already makes for MVA:** it steers housing toward strong markets. The Housing Need pillar exists to balance that, so I would still keep MVA at 0 by default and treat R7 as optional.
- **Expected effect (B):** Squirrel Hill North 52 → 60, East Liberty 49 → 56, Strip 68 → 73. Low-price, low-activity neighborhoods drop a further 1–5 points.

### R8. Phrases

Recalibrate the Demand bands to the distribution and make the wording describe data, not people:

```json
"demand": [
  { "min": 65, "text": "Strong market: homes sell steadily, few sit empty, and builders are active nearby." },
  { "min": 50, "text": "Steady demand for new homes." },
  { "min": 35, "text": "Mixed market signals." },
  { "min": 0,  "text": "Weak market signals right now (few sales, more empty homes). New homes here will likely need public or nonprofit support." }
]
```

- **Reason:** P8. Under variant A, p90 is about 64, so ≥65 is a real top-decile band rather than an artifact band. The low band now says what the data shows and what it implies for a builder, without claiming "people don't want to live here".
- **Displacement phrases:**
  - Change ≥75 from "Prices are stable" to "Little sign of fast price or rent growth."
  - Change <35 from "Prices are surging: new building here risks pushing people out." to "Prices or rents have risen fast here: new building could add displacement pressure." This drops "surging" given P5.
- **UI:** show "Not enough sales data" whenever the sub-score is null. Today the null state renders as a blank phrase ("— —").

### R9 (follow-up, not a config edit). Address the low-base effect in price growth (P5)

Options:

- Use the change in log median, shrunk toward the county median by sample size (for example, an empirical-Bayes weight n/(n+20)).
- Or follow the Urban Displacement Project approach: flag only tracts that are low-income **and** above the county median in appreciation, and do not rank every tract continuously.

Until then, cap `afford_price_growth` weight at 1.5 (from 2).

### Combined expected effect of R1–R6 (simulated, neighborhood medians)

| Neighborhood | Now | A (R1–R6) | B (+R7) |
|---|---|---|---|
| Strip District | 42 | 68 | 73 |
| Shadyside | 51 | 71 | 72 |
| Central Business District | 46 | 70 | 69 |
| Central Lawrenceville | 51 | 63 | 67 |
| Lower Lawrenceville | 45 | 60 | 64 |
| Squirrel Hill South | 45 | 58 | 64 |
| East Liberty | 43 | 50 | 57 |
| Squirrel Hill North | 55 | 52 | 60 |
| Brookline | 54 | 54 | 51 |
| Overbrook | 53 | 44 | 39 |
| Swisshelm Park | 62 | 50 | 52 |
| Spring Hill–City View | 46 | 34 | 33 |
| Hazelwood | 38 | 32 | 30 |
| Homewood South | 18 | 22 | 22 |
| North Shore / Chateau (artifacts) | 64 / 61 | blank | blank |
| Terrace Village / Crawford-Roberts (watch) | 46 / 46 | 75 / 73 | — / 65 |

- Demand distribution p10/p50/p90 moves from 29/43/57 to 25/43/64.
- Neighborhood Spearman ρ against MVA class moves from 0.60 to 0.77 (A).

**Caveats:**

- The simulation ranks my substitute indicators across the available county tracts and block groups. It approximates R1 with `log1p(units)` from the classified CSV, and it does not include conversions.
- A real rebuild will differ by a few points.
- Terrace Village and Crawford-Roberts need a look before shipping R2.

---

## 4. What I did not verify

- **PLI fields:** whether PLI permit data has a work-type value for residential conversions (R1).
- **Shadyside tract 703:** whether the −14.5% household change is a student or group-quarters counting artifact.
- **Overbrook:** market conditions; I found no neighborhood-specific source.
- **Portal figures:** exact values (Redfin pages returned 403 to direct fetch; figures are from search summaries).
- **Other pillars:** I did not review them.
