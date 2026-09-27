# Sweep: Revenue comps below the ZIP level. Are there enough new-construction sales and rent data per City neighborhood?

**Round 9** · 2026-09-27 · single research subagent

> Tags: **[read]** = fetched this session and the response inspected (for datasets: downloaded and queried); **[skimmed]** = partial or secondary; **[found]** = known to exist, not opened; **[inaccessible]** = blocked (blocker stated). Numbers below are our own computation from public data, reproducible with [`admin/scripts/new_construction_comps.py`](../admin/scripts/new_construction_comps.py). Bulk inputs were kept in a scratch directory, not the repo. No owner, buyer or seller names were read into the analysis or recorded here. Nothing here is financial advice or an appraisal.

---

## Why this sweep

Hackathon SMEs said financial feasibility needs comparable values and rents, that "enough comps in similar neighborhoods is key", and that "rent varies significantly by location within the City". The [pro forma node](../knowledge/methods/pro-forma.md) left this open: *"Whether code-16 sales plus assessment square footage give enough comps per neighborhood to be useful."* This sweep answers that for the City of Pittsburgh's 90 neighborhoods. It also checks whether keyless rent data exists below the ZIP level.

## TL;DR

- **New-construction sales comps are thin below the ZIP level. They exist in about 10–15 of the City's 90 neighborhoods and are absent in the rest.** Take all City residential sales from the last 5 years that are either code 16 ("BUILDING NOT YET ASSESSED") or valid (code 0) with YEARBLT ≥ 2015. That gives **361 sales in 29 neighborhoods**. Only **15 neighborhoods have ≥5 comps and 11 have ≥10**. Over 3 years it is 202 sales, 10 neighborhoods with ≥5 and 7 with ≥10.
- **Code 16 on its own is thinner still:** 146 City residential code-16 sales in 5 years (65 in 3 years). **9 neighborhoods have ≥5 and 4 have ≥10** (3 years: 4 and 3). About half are condos in the Strip, Downtown and Lower Lawrenceville.
- **The comps cluster where developers already build**: the Strip District, Lawrenceville, Downtown, Duquesne Heights, East Liberty, Central Northside and Shadyside. Neighborhoods with cheap land and the most vacant lots have essentially none. We infer that a new-build $/sf comp is **unavailable exactly where the tool is most likely to point**.
- **General comps are dense.** Valid City residential sales over 5 years give a median $/sf for **76 neighborhoods with ≥5 sales and 68 with ≥10** (3 years: 74 and 60). Median $/sf across neighborhoods (those with ≥10 sales) ranges from **about $52 (Larimer) to $469 (Strip District)**. The 10th–90th percentile is **$70–$268/sf, a spread of about 3.8×**. The citywide new-build median is about **$370–$390/sf**, against **$177–$188/sf** for all valid sales.
- **Rent does vary substantially within the City. The evidence:**
  - **ZORI:** 17 of the 18 ZIPs that are mostly inside the City have an Aug 2026 value. They run from **$1,333 (15210) to $2,097 (15222)**, 1.57× (15208 has no ZORI series).
  - **ACS 2024 5-year B25064 median gross rent:** across 113 City tracts with an estimate, from **$501 to $2,345**, with p10–p90 **$895–$1,773 (2.0×)**. Across 265 block groups, p10–p90 is **$823–$1,875 (2.3×)**, but **48 of the 265 block groups have a CV above 30%**.
- **The Census API is blocked without a key.** Keyless calls return a 302 redirect to `missing_key.html`. **But the same ACS table is available keylessly through the Census Reporter API** (ACS 2024 5-year, tract and block group, "within Pittsburgh city" in one call). This supersedes the claim in the [market node](../knowledge/data/market-and-affordability.md) that ACS rent needs a key, at least for B25064 via Census Reporter.

---

## Method

1. **Sales:** the WPRDC property sales bulk dump (resource `5bbe6c55-bce6-4edb-9d04-68edeb6bf7b1`). 503,747 rows, with the latest SALEDATE 2026-09-24. Kept City rows (`MUNIDESC` matching `Ward - PITTSBURGH`, which also catches the `1st Ward  - PITTSBURGH` double-space variant) with PRICE ≥ $50,000. Windows are measured back from 2026-09-27: **3y = SALEDATE ≥ 2023-09-27** and **5y ≥ 2021-09-27**.
2. **Assessments:** the WPRDC bulk dump (resource `65855e14-549e-4992-b5be-d629afc676fa`, 512,000 parcels). Joined on PARID for USEDESC, YEARBLT and FINISHEDLIVINGAREA (sf). "Residential" means SINGLE FAMILY, TWO/THREE/FOUR FAMILY, ROWHOUSE, TOWNHOUSE or CONDOMINIUM. **$/sf is computed only where sf ≥ 400.** Every residential sale in scope had usable sf.
3. **City neighborhood:** the assessment table's `NEIGHDESC` is **not** the City neighborhood. It holds 301 assessor market-area codes such as `11903`, plus a few labels. We therefore joined PARID to PIN in WPRDC **Parcel Centroids March 2025** (resource `3fab7152-3f11-4788-8372-4c33f86ea813`, field `CITY_NEIGHBORHOOD`, 90 neighborhoods).
   - 124,896 City parcels matched directly.
   - 172 parcels created after March 2025 were given the modal neighborhood of their assessor NEIGHCODE.
   - 2 parcels were left unassigned.
4. **Comp definitions:**
   - (a) code 16;
   - (b) valid sales (code 0) of homes with YEARBLT ≥ 2015;
   - the union of (a, residential) and (b);
   - two sensitivity variants: non-condo only, and a broader code set that adds codes 27 and 14 (see Caveats).
5. **Rents:**
   - **ZORI:** the Zillow ZIP CSV, latest month 2026-08-31, Allegheny rows. A ZIP counts as a "City ZIP" when ≥50% of its residential parcels in the assessment table are in City wards. ZIPs with more than 5% of parcels in the City are listed as partial.
   - **ACS B25064:** tried `api.census.gov` keyless first, then Census Reporter's keyless API, using `geo_ids=140|16000US4261000` (tracts) and `150|16000US4261000` (block groups). CV = (MOE/1.645)/estimate.

## Results: new-construction comps

### Density by definition and window (City of Pittsburgh, 90 neighborhoods)

| Definition | Window | Sales | Nbhds with any | Nbhds ≥5 | Nbhds ≥10 | City median price | City median $/sf |
|---|---|---|---|---|---|---|---|
| Code 16, all uses | 3y | 92 | 22 | 4 | 3 | $520,000 | $387 |
| Code 16, residential | 3y | 65 | 16 | 4 | 3 | $515,000 | $390 |
| Valid, YEARBLT ≥ 2015, residential | 3y | 137 | 19 | 9 | 5 | $663,000 | $381 |
| **Union (code-16 res ∪ valid YB≥2015)** | **3y** | **202** | **22** | **10** | **7** | $647,500 | $384 |
| Union, non-condo only | 3y | 100 | 21 | 9 | 2 | $700,525 | $314 |
| Broad codes 0/16/27/14, YB≥2015, res | 3y | 232 | 23 | 12 | 7 | $654,500 | $383 |
| Code 16, all uses | 5y | 191 | 28 | 9 | 6 | $586,000 | $376 |
| Code 16, residential | 5y | 146 | 23 | 9 | 4 | $589,002 | $376 |
| Valid, YEARBLT ≥ 2015, residential | 5y | 215 | 23 | 10 | 7 | $650,000 | $363 |
| **Union (code-16 res ∪ valid YB≥2015)** | **5y** | **361** | **29** | **15** | **11** | $630,000 | $370 |
| Union, non-condo only | 5y | 191 | 27 | 14 | 9 | $674,000 | $304 |
| Broad codes 0/16/27/14, YB≥2015, res | 5y | 437 | 30 | 17 | 12 | $629,900 | $381 |
| *Comparison: all valid residential sales* | *3y* | *4,354* | *80* | *74* | *60* | *$260,000* | *$188* |
| *Comparison: all valid residential sales* | *5y* | *7,820* | *83* | *76* | *68* | *$245,000* | *$177* |

Composition:
- **All-use code-16 rows:** 22 have no current assessment row (their parcels were retired or split) and 14 are coded vacant land (5y). That is why the "all uses" $/sf coverage is only about 72–78%.
- **Year built:** 17 of the 146 residential code-16 sales have YEARBLT < 2015 (5y). Code 16 is therefore not purely new construction. It also catches substantial rebuilds and condo conversions.
- **Most valid YB ≥ 2015 sales are resales.** Only 20 were sold within a year of YEARBLT (5y).

### Per neighborhood: union definition (code-16 res ∪ valid YB≥2015), neighborhoods with ≥3 sales

| City neighborhood | 5y n | 5y median price | 5y median $/sf | 3y n | Non-condo 5y n | Non-condo 5y median $/sf |
|---|---|---|---|---|---|---|
| Strip District | 66 | $647,000 | $491 | 49 | 9 | $620 |
| Lower Lawrenceville | 48 | $567,150 | $407 | 21 | 11 | $313 |
| Central Business District | 41 | $450,000 | $523 | 25 | 0 | n/a |
| Upper Lawrenceville | 34 | $700,525 | $362 | 18 | 12 | $347 |
| Central Lawrenceville | 25 | $776,000 | $341 | 16 | 19 | $324 |
| Duquesne Heights | 24 | $630,000 | $261 | 14 | 24 | $261 |
| East Liberty | 20 | $725,000 | $320 | 6 | 20 | $320 |
| Central Northside | 18 | $631,244 | $293 | 9 | 18 | $293 |
| Shadyside | 16 | $1,058,938 | $400 | 13 | 12 | $412 |
| South Side Flats | 13 | $515,000 | $301 | 7 | 11 | $301 |
| West Oakland | 10 | $584,002 | $309 | <3 | 10 | $309 |
| Mount Washington | 9 | $546,100 | $275 | 3 | 9 | $275 |
| East Allegheny | 6 | $640,000 | $318 | 4 | 6 | $318 |
| Polish Hill | 5 | $690,000 | $259 | <3 | 5 | $259 |
| Highland Park | 5 | $750,000 | $319 | 3 | 5 | $319 |
| Stanton Heights | 3 | $535,000 | $273 | <3 | 3 | $273 |
| South Side Slopes | 3 | $446,000 | $265 | <3 | 3 | $265 |
| Hazelwood | 3 | $205,000 | $153 | 3 | 3 | $153 |
| *11 other neighborhoods* | 1–2 each | | | | | |
| *61 neighborhoods* | 0 | | | | | |

Code 16 alone, 5y, neighborhoods with ≥5:

| Neighborhood | n | Median $/sf |
|---|---|---|
| Lower Lawrenceville | 40 | $409 |
| Central Business District | 21 | $524 |
| Strip District | 15 | $498 |
| East Liberty | 11 | $327 |
| Central Northside | 9 | $263 |
| West Oakland | 8 | $301 |
| Central Lawrenceville | 8 | $335 |
| Upper Lawrenceville | 6 | $376 |
| Mount Washington | 5 | $214 |

### Comparison: all valid residential sales, neighborhood median $/sf (5y, neighborhoods with ≥10 sales, n = 68)

| Statistic | $/sf |
|---|---|
| Min | $52 (Larimer) |
| p10 | $70 |
| Median | $162 |
| p90 | $268 |
| Max | $469 (Strip District) |

- Lowest: Larimer $52, Lincoln-Lemington-Belmar $54, Knoxville $58, Spring Garden $64, Allentown $65.
- Highest: Strip District $469, Squirrel Hill North $293, Point Breeze $285, Regent Square $283, Central Lawrenceville $271.

The 3-year view is similar: 60 neighborhoods with ≥10 sales, p10–p90 $78–$281, median $176.

**Inference, not source:** in the neighborhoods at the low end, a new build's value probably cannot be read off existing-stock $/sf. New-build $/sf runs about 2× the citywide existing-stock median, and those neighborhoods have no new-build comps at all. That gap is the appraisal-gap problem the practitioner sources describe ([practitioners node](../knowledge/stakeholders/practitioners.md)). A tool that shows a single "comp $/sf" there should label it as existing-stock value, not new-build value.

## Results: rents

### Zillow ZORI (all homes plus multifamily, smoothed), Aug 2026, ZIPs with more than 5% of residential parcels in the City

| ZIP | Share of res. parcels in City | ZORI Aug 2026 |
|---|---|---|
| 15222 (Downtown/Strip) | 1.00 | $2,097 |
| 15201 | 1.00 | $1,899 |
| 15219 | 1.00 | $1,852 |
| 15203 | 1.00 | $1,820 |
| 15206 | 1.00 | $1,751 |
| 15213 | 1.00 | $1,722 |
| 15217 | 1.00 | $1,585 |
| 15232 | 1.00 | $1,578 |
| 15204 | 1.00 | $1,560 |
| 15214 | 0.73 | $1,515 |
| 15211 | 1.00 | $1,514 |
| 15224 | 1.00 | $1,499 |
| 15212 | 0.90 | $1,488 |
| 15233 | 1.00 | $1,462 |
| 15226 | 0.94 | $1,412 |
| 15207 | 0.99 | $1,394 |
| 15210 | 0.87 | $1,333 |
| 15208 | 1.00 | *no ZORI series* |
| *Partial:* 15220 (0.44) $1,406; 15216 (0.41) $1,359; 15205 (0.27) $1,401; 15218 (0.15) $1,198; 15221 (0.14) $1,257; 15234 (0.13) $1,391; 15227 (0.11) $1,225; 15120 (0.08) $1,320 | | |

- ZORI covers **55 Allegheny ZIPs**, consistent with round 2.
- For the 17 City-majority ZIPs with values, the median is **$1,560** and the range **$1,333–$2,097 (1.57×)**.
- A ZIP is coarse. 15206 alone spans East Liberty, Highland Park, Larimer and parts of Garfield, and the 5-year existing-stock median $/sf in those neighborhoods starts at $52 (Larimer).

### ACS B25064 median gross rent (ACS 2024 5-year, via Census Reporter)

| Geography within Pittsburgh city | Geos | With estimate | Min | p10 | p25 | Median | p75 | p90 | Max | CV > 30% |
|---|---|---|---|---|---|---|---|---|---|---|
| Census tracts | 128 | 113 | $501 | $895 | $1,059 | $1,230 | $1,449 | $1,773 | $2,345 | 6 |
| Block groups | 314 | 265 | $273 | $823 | $1,071 | $1,249 | $1,583 | $1,875 | $3,132 | 48 |

- The whole-city figure, ACS 2024 **1-year**, is $1,304 (MOE ±$59).
- Mapping each tract to its modal City neighborhood via parcel centroids, **71 of 90 neighborhoods get at least one tract rent estimate**.
- Census Reporter returned 128 tracts for "within Pittsburgh city". We did not check how it handles tracts that straddle the city line. Treat the count as approximate.
- **ACS gross rent is not market rent.** It covers all renter households, including long-tenured and subsidized units, and includes utilities. ZORI is a smoothed index of asking rents on listed units. The two answer different questions, which is why ZORI's floor ($1,333) sits far above ACS's p10 ($895). For a pro forma's revenue line, ZORI (or HUD SAFMR, which the [market node](../knowledge/data/market-and-affordability.md) covers) is closer to the right concept. ACS is better for showing the within-City spread and for affordability-burden framing.

## What this means for the build (inference)

1. **A per-neighborhood new-build $/sf is defensible for about 10–15 neighborhoods** (≥5 comps over 5 years). Everywhere else it needs:
   - a fallback: pool adjacent neighborhoods, pool the assessor market area (NEIGHCODE) or go to citywide, with the count shown on screen; or
   - a hedonic adjustment from existing-stock $/sf; or
   - an explicit "no local new-construction comps" flag.

   Showing the n beside every comp fits the project's "unknown is not bad" rule.
2. **Existing-stock $/sf is dense enough** (68–76 neighborhoods) to show "how rent and value vary within the City" and to back up the SME's point directly.
3. **For rent below the ZIP level, keyless ACS via Census Reporter works at tract level.** Block-group values are noisy (18% have CV > 30%). Tract is the safer grain.

## Caveats

- **Code 16 is not a clean new-construction flag.** It marks "building not yet assessed". About 12% (17 of 146) of residential code-16 sales (5y) are on parcels with YEARBLT < 2015. **New builds also appear under other codes.** For City residential parcels with YEARBLT ≥ 2020 sold for ≥$50k since 2021-09-27 (430 sales):
  - code 16: 129
  - code 0: 113
  - **27 "NO ASSESSED VALUATION": 58**
  - H multi-parcel: 51
  - 14 "TIME ON MARKET": 20
  - others: the rest

  The "broad codes" row above adds 27 and 14 as a sensitivity. It raises the 5y count to 17 neighborhoods with ≥5 comps, but those codes are flagged as not arm's-length-validated by the assessor, so use them with care.
- **The City builds few new homes.** Only 652 City residential parcels have YEARBLT ≥ 2020, and 1,209 have YEARBLT ≥ 2015. Sparse comps reflect sparse construction, not a data defect.
- **YEARBLT for condos** is the building's year. Some YB ≥ 2015 condo sales may be conversions dated to the renovation. We did not verify this.
- **Condos dominate the Strip District and Downtown.** For small-infill typologies (duplex, townhouse, ADU), the non-condo columns are the more relevant comps.
- **FINISHEDLIVINGAREA** is the assessor's figure and was not checked against listings. Multi-card parcels (about 340 cards beyond card 1 in the City) use card 1's area only.
- **Price floor.** The $50k floor removes nominal transfers. It may also drop some genuine low-value sales in the weakest markets.
- **ZIP to City assignment.** This uses parcel counts, not population or housing units.
- **Snapshot dates.** Parcel Centroids is a March 2025 snapshot. The assessments and sales dumps were pulled 2026-09-27.
- **Census blocker.** The `api.census.gov` keyless blocker should be recorded in `admin/source-access.md` (this sweep did not edit that file).

## Sources

- [WPRDC property sales, resource 5bbe6c55-bce6-4edb-9d04-68edeb6bf7b1, bulk dump](https://data.wprdc.org/datastore/dump/5bbe6c55-bce6-4edb-9d04-68edeb6bf7b1) `[read]` *(accessed 2026-09-27)*: 503,747 rows, max SALEDATE 2026-09-24, fields PARID, MUNIDESC, SALEDATE, PRICE, SALECODE, SALEDESC
- [WPRDC property assessments, resource 65855e14-549e-4992-b5be-d629afc676fa, bulk dump](https://data.wprdc.org/datastore/dump/65855e14-549e-4992-b5be-d629afc676fa) `[read]` *(accessed 2026-09-27)*: 512,000 parcels; used PARID, MUNIDESC, NEIGHCODE/NEIGHDESC (assessor codes, not City neighborhoods), USEDESC, YEARBLT, FINISHEDLIVINGAREA, PROPERTYZIP
- [WPRDC Parcel Centroids with Geographic Identifiers, March 2025, resource 3fab7152-3f11-4788-8372-4c33f86ea813](https://data.wprdc.org/dataset/parcel-centroids-in-allegheny-county-with-geographic-identifiers) `[read]` *(accessed 2026-09-27)*: PIN → CITY_NEIGHBORHOOD (90), FIPS_TRACT, FIPS_BLOCKGROUP
- [Zillow ZORI by ZIP CSV](https://files.zillowstatic.com/research/public_csvs/zori/Zip_zori_uc_sfrcondomfr_sm_month.csv) `[read]` *(accessed 2026-09-27)*: latest column 2026-08-31, 55 Allegheny ZIPs
- [Census Reporter API, B25064 tracts within Pittsburgh city](https://api.censusreporter.org/1.0/data/show/latest?table_ids=B25064&geo_ids=140|16000US4261000) `[read]` *(accessed 2026-09-27)*: keyless, release ACS 2024 5-year; block groups via `150|16000US4261000`; city via `16000US4261000` (returned ACS 2024 1-year)
- [Census Data API, ACS 5-year B25064](https://api.census.gov/data/2023/acs/acs5?get=NAME,B25064_001E&for=tract:*&in=state:42%20county:003) `[inaccessible]` *(accessed 2026-09-27)*: keyless call returns 302 → `https://api.census.gov/data/missing_key.html` (2023 and 2024 vintages tried)
- Prior context: [pro forma node](../knowledge/methods/pro-forma.md) and [market and affordability node](../knowledge/data/market-and-affordability.md) `[read]` *(accessed 2026-09-27)*; [round 2 deeper data sweep](r2-deeper-data-sources.md) `[found]` (cited via the nodes, not re-read this round)
