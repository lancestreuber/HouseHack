# Round 2 review: citywide sanity check

**Reviewer lens:** does the whole-city ranking make sense as "where to build new housing"? This covers the top and bottom of the list, parcel classes, neighborhood medians against outside benchmarks, whether the round-1 fixes worked, and whether the phrases are accurate.
**Build reviewed:** `pillars.config.json` version `2026-09-26.18`, `parcel-indicators.json` built 2026-09-26 22:17Z (built after the config was saved). All 142,365 parcels were scored with `score-parcels.ts`. My reimplementation of the overall score (`geomean(pillars, missing→50) × zoning × availability`) matches it to within 0.09 points. No code or config was edited.
**Evidence tags:** **[read]** means I computed it on repo data or read the primary page this session. **[skimmed]** means a search-result summary only. **[unverified]** means my inference, not checked.
**Scratch files** (not in the repo): session scratchpad `scores.csv`, `joined.csv`, `ind.csv` (decoded normalized indicators), `hood.json`, `sim.py`, `sim2.py`.

---

## 0. Bottom line

- **Each pillar is now roughly sound, and each tracks an outside benchmark reasonably well** (neighborhood medians, n = 70–86):

  | Pillar | Benchmark | Spearman ρ now | Round 1 |
  |---|---|---|---|
  | Access | Walk Score | **0.89** | 0.85 |
  | Access | Transit Score | 0.84 | — |
  | Demand | Reinvestment Fund MVA class | **0.77** | 0.60 |
  | Need | CDC SVI socioeconomic percentile | **0.50** | — |

  All tagged [read]. Most round-1 fixes landed and work (§3).
- **The overall ranking is not yet logically sound at the top end.** Two faults cause this:
  1. **The score still measures location, not site availability.**
     - Occupied parcels outrank vacant ones: median 58.6 vs 55.6. Only 5% of vacant parcels reach the city top decile, against 12% of occupied ones.
     - Institutional and large occupied buildings score highest of any class: university-owned parcels median 69.5 (50% in the top decile), hotels 69.2, office towers 68.9, apartments with 20+ units 68.2, hospitals and charities 63.4.
     - The **Allegheny County Jail** (950 2nd Ave) scores 65.7, "better than 81%," with the phrase "Among the stronger places in the City to build new housing."
     - **Magee-Womens Hospital** (300 Halket St) scores 77.8. [read: WPRDC assessment records]
  2. **One student-dominated tract takes over the list.**
     - **All top 100 parcels are in South Oakland**: occupied rowhouses and 2–3-family student rentals.
     - They share one tract-level Need score of 83, driven by an extremely-low-income renter share at the county 96th percentile (62% of renters). Nothing corrects for students; the config rationale itself says "not yet corrected".
- **The bottom of the list is right.** All bottom 40 are active rail, parks, or City open land (×0.05), or rail in non-residential districts.
- **Verdict.** Pillar logic: largely sound. Overall ranking: *not yet*. I think three small changes (R1–R3) would make it defensible: a real availability tier, a public-P-land rule, and a student correction for Need. In simulation, R1 plus the student correction turns the top 40 into vacant lots:
  - East Liberty (Penn/Shady area, R2-M/RM-VH);
  - Crawford-Roberts (City, URA and HACP lots on the Reed-Roberts / Bedford Choice block).

  Those are places where housing is actually being planned or built ([PublicSource on Bedford Choice](https://www.publicsource.org/pittsburgh-affordable-housing-bedford-dwellings-authority-hacp-choice-neighborhoods/), [URA Bedford Dwellings](https://www.ura.org/pages/bedford-dwellings) [skimmed]).

---

## 1. Top 40 and bottom 40 (current build)

D/S/N/A/C = Demand, Site, Need, Access, Climate. A dash means the pillar is missing and a neutral 50 was imputed.

**Top 40**

| # | PIN | Neighborhood | Zoning | Use | Vacant | D | S | N | A | C | Zoning / availability | Overall |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 0028N00134000000 | South Oakland | R1A-VH | Rowhouse |  | 67 | 97 | 83 | 88 | 64 | by_right ×1 / site ×1 | 79.0 |
| 2 | 0028N00135000000 | South Oakland | R1A-VH | Rowhouse |  | 67 | 97 | 83 | 88 | 63 | by_right ×1 / site ×1 | 78.7 |
| 3 | 0028N00131000000 | South Oakland | R1A-VH | Apart: 5-19 Units |  | 67 | 95 | 83 | 88 | 64 | by_right ×1 / site ×1 | 78.6 |
| 4 | 0028N00092000000 | South Oakland | R1A-VH | Rowhouse |  | 67 | 97 | 83 | 88 | 63 | by_right ×1 / site ×1 | 78.6 |
| 5 | 0028N00086000000 | South Oakland | R1A-VH | Two Family |  | 67 | 97 | 83 | 88 | 62 | by_right ×1 / site ×1 | 78.5 |
| 6 | 0028N00102000000 | South Oakland | R1A-VH | Three Family |  | 68 | 92 | 83 | 88 | 66 | by_right ×1 / site ×1 | 78.5 |
| 7 | 0028N00005000000 | South Oakland | UC-MU | Retl/Off Over |  | 67 | 97 | 83 | 89 | 61 | by_right ×1 / site ×1 | 78.4 |
| 8 | 0028N00088000000 | South Oakland | R1A-VH | Two Family |  | 67 | 97 | 83 | 88 | 62 | by_right ×1 / site ×1 | 78.4 |
| 9 | 0028N00087000000 | South Oakland | R1A-VH | Two Family |  | 67 | 97 | 83 | 88 | 62 | by_right ×1 / site ×1 | 78.4 |
| 10 | 0028N00084000000 | South Oakland | R1A-VH | Single Family |  | 67 | 97 | 83 | 88 | 62 | by_right ×1 / site ×1 | 78.4 |
| 11 | 0028N00019000002 | South Oakland | UC-MU | Apart: 5-19 Units |  | 67 | 97 | 83 | 89 | 61 | by_right ×1 / site ×1 | 78.3 |
| 12 | 0028N00037000000 | South Oakland | UC-MU | Office - 1-2 Stories |  | 67 | 97 | 83 | 89 | 61 | by_right ×1 / site ×1 | 78.3 |
| 13 | 0028J00275000000 | South Oakland | UC-MU | Parking Garage/Lots | Y | 68 | 97 | 83 | 89 | 60 | by_right ×1 / site ×1 | 78.3 |
| 14 | 0028N00017000000 | South Oakland | UC-MU | Office/Warehouse |  | 67 | 97 | 83 | 89 | 61 | by_right ×1 / site ×1 | 78.3 |
| 15 | 0028N00091000000 | South Oakland | R1A-VH | Single Family |  | 67 | 95 | 83 | 88 | 63 | by_right ×1 / site ×1 | 78.3 |
| 16 | 0028N00010000000 | South Oakland | UC-MU | Comm Aux Building |  | 67 | 97 | 83 | 89 | 61 | by_right ×1 / site ×1 | 78.3 |
| 17 | 0028P00014000000 | South Oakland | R1A-VH | Two Family |  | 67 | 97 | 83 | 89 | 61 | by_right ×1 / site ×1 | 78.2 |
| 18 | 0028P00009000000 | South Oakland | UC-MU | Apart: 5-19 Units |  | 67 | 97 | 83 | 89 | 60 | by_right ×1 / site ×1 | 78.2 |
| 19 | 0028P00010000000 | South Oakland | UC-MU | Three Family |  | 67 | 97 | 83 | 89 | 60 | by_right ×1 / site ×1 | 78.2 |
| 20 | 0028N00093000000 | South Oakland | R1A-VH | Rowhouse |  | 67 | 93 | 83 | 88 | 64 | by_right ×1 / site ×1 | 78.2 |
| 21 | 0028N00136000000 | South Oakland | R1A-VH | Rowhouse |  | 67 | 94 | 83 | 88 | 63 | by_right ×1 / site ×1 | 78.2 |
| 22 | 0028N00052000000 | South Oakland | R1A-VH | Single Family |  | 67 | 97 | 83 | 89 | 61 | by_right ×1 / site ×1 | 78.2 |
| 23 | 0028N00137000000 | South Oakland | R1A-VH | Two Family |  | 67 | 94 | 83 | 88 | 63 | by_right ×1 / site ×1 | 78.2 |
| 24 | 0028N00098000000 | South Oakland | R1A-VH | Two Family |  | 68 | 92 | 83 | 88 | 64 | by_right ×1 / site ×1 | 78.2 |
| 25 | 0028N00051000000 | South Oakland | R1A-VH | Single Family |  | 67 | 97 | 83 | 89 | 61 | by_right ×1 / site ×1 | 78.2 |
| 26 | 0028N00094000000 | South Oakland | R1A-VH | Rowhouse |  | 67 | 93 | 83 | 88 | 64 | by_right ×1 / site ×1 | 78.2 |
| 27 | 0028P00013000000 | South Oakland | R1A-VH | Two Family |  | 67 | 97 | 83 | 89 | 61 | by_right ×1 / site ×1 | 78.2 |
| 28 | 0028P00011000000 | South Oakland | R1A-VH | Two Family |  | 67 | 97 | 83 | 89 | 60 | by_right ×1 / site ×1 | 78.2 |
| 29 | 0028P00006000000 | South Oakland | UC-MU | Retl/Apt'S Over |  | 67 | 97 | 83 | 89 | 60 | by_right ×1 / site ×1 | 78.2 |
| 30 | 0028P00012000000 | South Oakland | R1A-VH | Single Family |  | 67 | 97 | 83 | 89 | 60 | by_right ×1 / site ×1 | 78.2 |
| 31 | 0028J00103000000 | South Oakland | EMI | Owned By College/Univ/Academy |  | 68 | 97 | 83 | 88 | 61 | by_right ×1 / site ×1 | 78.2 |
| 32 | 0028N00158000000 | South Oakland | R1A-VH | Rowhouse |  | 67 | 95 | 83 | 87 | 63 | by_right ×1 / site ×1 | 78.1 |
| 33 | 0028N00096000000 | South Oakland | R1A-VH | Single Family |  | 68 | 92 | 83 | 88 | 64 | by_right ×1 / site ×1 | 78.1 |
| 34 | 0028N00050000000 | South Oakland | R1A-VH | Single Family |  | 67 | 97 | 83 | 89 | 60 | by_right ×1 / site ×1 | 78.1 |
| 35 | 0028P00113000000 | South Oakland | R1A-VH | Two Family |  | 67 | 97 | 83 | 87 | 62 | by_right ×1 / site ×1 | 78.1 |
| 36 | 0028N00095000000 | South Oakland | R1A-VH | Two Family |  | 67 | 92 | 83 | 88 | 64 | by_right ×1 / site ×1 | 78.1 |
| 37 | 0028N00138000000 | South Oakland | R1A-VH | Rowhouse |  | 67 | 94 | 83 | 88 | 63 | by_right ×1 / site ×1 | 78.0 |
| 38 | 0028N00048000000 | South Oakland | R1A-VH | Single Family |  | 67 | 97 | 83 | 89 | 60 | by_right ×1 / site ×1 | 78.0 |
| 39 | 0028P00061000000 | South Oakland | R1A-VH | Three Family |  | 67 | 97 | 83 | 88 | 61 | by_right ×1 / site ×1 | 78.0 |
| 40 | 0028N00144000000 | South Oakland | R1A-VH | Rowhouse |  | 67 | 92 | 83 | 88 | 65 | by_right ×1 / site ×1 | 78.0 |

**Bottom 40**

| # | PIN | Neighborhood | Zoning | Use | Vacant | D | S | N | A | C | Zoning / availability | Overall |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 142326 | 0030M00100000000 | Glen Hazel | P | R.R. - Used In Operation |  | 24 | 5 | 68 | 65 | 62 | by_right ×1 / active_rail ×0.05 | 1.6 |
| 142327 | 0005L00207000001 | Duquesne Heights | P | Municipal Government |  | 50 | 5 | 27 | 44 | 72 | by_right ×1 / park_cemetery ×0.05 | 1.5 |
| 142328 | 0007N00050000000 | West End | H | R.R. - Used In Operation |  | 36 | 5 | 47 | 64 | 70 | za_hillside ×0.85 / active_rail ×0.05 | 1.4 |
| 142329 | 0003K00350000003 | South Side Flats | GI | R.R. - Used In Operation |  | 66 | 50 | 76 | 78 | 63 | not_permitted_border ×0.35 / active_rail ×0.05 | 1.2 |
| 142330 | 0056N00090000000 | Hazelwood | RIV-GI | Public Park |  | 48 | 94 | 78 | 60 | 39 | not_permitted_border ×0.35 / park_cemetery ×0.05 | 1.1 |
| 142331 | 0056K00350000A02 | Hazelwood | GI | R.R. - Used In Operation |  | 48 | 94 | 78 | 64 | 39 | not_permitted_border ×0.35 / active_rail ×0.05 | 1.1 |
| 142332 | 0121A00300000001 | Upper Lawrenceville | RIV-GI | R.R. - Used In Operation |  | 56 | 92 | 46 | 60 | 65 | not_permitted_border ×0.35 / active_rail ×0.05 | 1.1 |
| 142333 | 0057F00100000A01 | Hazelwood | RIV-GI | R.R. - Used In Operation |  | 44 | 94 | 78 | 52 | 40 | not_permitted_border ×0.35 / active_rail ×0.05 | 1.0 |
| 142334 | 0056K00134000A00 | Hazelwood | GI | R.R. - Used In Operation |  | 36 | 94 | 76 | 63 | 39 | not_permitted_border ×0.35 / active_rail ×0.05 | 1.0 |
| 142335 | 0075F00350000000 | Marshall-Shadeland | GI | R.R. - Used In Operation |  | — | 96 | — | 55 | 40 | not_permitted_border ×0.35 / active_rail ×0.05 | 1.0 |
| 142336 | 0056N00088000000 | Hazelwood | RIV-GI | Public Park |  | 47 | 94 | 78 | 59 | 38 | not_permitted_border ×0.35 / park_cemetery ×0.05 | 1.0 |
| 142337 | 0057G00425000000 | Hazelwood | RIV-GI | R.R. - Used In Operation |  | 30 | 92 | 74 | 54 | 55 | not_permitted_border ×0.35 / active_rail ×0.05 | 1.0 |
| 142338 | 0057F00050000A01 | Hazelwood | RIV-GI | R.R. - Used In Operation |  | 30 | 92 | 74 | 58 | 52 | not_permitted_border ×0.35 / active_rail ×0.05 | 1.0 |
| 142339 | 0031C00100000001 | Arlington | GI | R.R. - Used In Operation |  | 28 | 88 | 80 | 40 | 65 | not_permitted_border ×0.35 / active_rail ×0.05 | 1.0 |
| 142340 | 0057B00300000000 | Hazelwood | RIV-GI | R.R. - Used In Operation |  | 44 | 40 | 78 | 51 | 39 | not_permitted_border ×0.35 / active_rail ×0.05 | 0.9 |
| 142341 | 0044C00325000900 | Marshall-Shadeland | GI | R.R. - Used In Operation |  | 42 | 44 | 45 | 60 | 55 | not_permitted_border ×0.35 / active_rail ×0.05 | 0.9 |
| 142342 | 0044L00175000001 | Marshall-Shadeland | RIV-GI | R.R. - Used In Operation |  | — | 96 | — | 47 | 38 | not_permitted_border ×0.35 / active_rail ×0.05 | 0.9 |
| 142343 | 0021K00066000000 | Esplen | GI | R.R. - Used In Operation |  | 15 | 75 | 74 | 64 | 65 | not_permitted_border ×0.35 / active_rail ×0.05 | 0.9 |
| 142344 | 0034B00265000900 | Bon Air | HC | R.R. - Used In Operation |  | 30 | 42 | 57 | 57 | 67 | not_permitted_border ×0.35 / active_rail ×0.05 | 0.9 |
| 142345 | 0056N00300000000 | Hazelwood | RIV-GI | R.R. - Used In Operation |  | 44 | 40 | 78 | 49 | 42 | not_permitted_border ×0.35 / active_rail ×0.05 | 0.9 |
| 142346 | 0075F00118000000 | Marshall-Shadeland | GI | R.R. - Used In Operation |  | — | 45 | — | 59 | 56 | not_permitted_border ×0.35 / active_rail ×0.05 | 0.9 |
| 142347 | 0057S00060000000 | Hays | RIV-GI | R.R. - Used In Operation |  | 31 | 50 | 34 | 35 | 48 | not_permitted_border ×0.35 / active_rail ×0.05 | 0.7 |
| 142348 | 0057S00060000002 | Hays | RIV-GI | R.R. - Used In Operation |  | 31 | 50 | 34 | 35 | 48 | not_permitted_border ×0.35 / active_rail ×0.05 | 0.7 |
| 142349 | 0072P00200000003 | Windgap | GI | R.R. - Used In Operation |  | — | 93 | 60 | 42 | 52 | not_permitted ×0.2 / active_rail ×0.05 | 0.6 |
| 142350 | 0120C00075000000 | Morningside | RIV-GI | R.R. - Used In Operation |  | 53 | 92 | 46 | 62 | 56 | not_permitted ×0.2 / active_rail ×0.05 | 0.6 |
| 142351 | 0075J00075000000 | Marshall-Shadeland | RIV-GI | R.R. - Used In Operation |  | — | 40 | — | 49 | 43 | not_permitted ×0.2 / active_rail ×0.05 | 0.5 |
| 142352 | 0044G00308000001 | Marshall-Shadeland | GI | R.R. - Used In Operation |  | — | 96 | — | 50 | 37 | not_permitted ×0.2 / active_rail ×0.05 | 0.5 |
| 142353 | 0044M00300000001 | Marshall-Shadeland | GI | R.R. - Used In Operation |  | — | 96 | — | 51 | 40 | not_permitted ×0.2 / active_rail ×0.05 | 0.5 |
| 142354 | 0139H00100000001 | Overbrook | HC | R.R. - Used In Operation |  | 32 | 79 | 34 | 54 | 57 | not_permitted ×0.2 / active_rail ×0.05 | 0.5 |
| 142355 | 0075F00350000001 | Marshall-Shadeland | GI | R.R. - Used In Operation |  | — | 96 | — | 51 | 38 | not_permitted ×0.2 / active_rail ×0.05 | 0.5 |
| 142356 | 0031G00202000000 | Arlington | GI | Community Urban Renewal | Y | 28 | 40 | 80 | 39 | 63 | not_permitted ×0.2 / park_cemetery ×0.05 | 0.5 |
| 142357 | 0044L00180000001 | Marshall-Shadeland | RIV-GI | R.R. - Used In Operation |  | — | 91 | — | 48 | 37 | not_permitted ×0.2 / active_rail ×0.05 | 0.5 |
| 142358 | 0072P00200000005 | Fairywood | GI | R.R. - Used In Operation |  | 34 | 93 | 67 | 27 | 56 | not_permitted ×0.2 / active_rail ×0.05 | 0.5 |
| 142359 | 0139H00100000900 | Overbrook | HC | R.R. - Used In Operation |  | 32 | 79 | 34 | 54 | 57 | not_permitted ×0.2 / active_rail ×0.05 | 0.5 |
| 142360 | 0075F00125000001 | Marshall-Shadeland | GI | R.R. - Used In Operation |  | — | 45 | — | 60 | 57 | not_permitted ×0.2 / active_rail ×0.05 | 0.5 |
| 142361 | 0108M00150000001 | Fairywood | GI | R.R. - Used In Operation |  | 34 | 85 | 67 | 26 | 58 | not_permitted ×0.2 / active_rail ×0.05 | 0.5 |
| 142362 | 0044S00100000001 | Marshall-Shadeland | GI | R.R. - Used In Operation |  | — | 96 | — | 52 | 39 | not_permitted ×0.2 / active_rail ×0.05 | 0.5 |
| 142363 | 0057H00150000A01 | Glen Hazel | RIV-GI | R.R. - Used In Operation |  | 29 | 40 | 68 | 51 | 62 | not_permitted ×0.2 / active_rail ×0.05 | 0.5 |
| 142364 | 0067P00315000000 | East Carnegie | GI | R.R. - Used In Operation |  | 39 | 40 | 26 | 44 | 61 | not_permitted ×0.2 / active_rail ×0.05 | 0.4 |
| 142365 | 0090E00010000001 | Glen Hazel | RIV-GI | R.R. - Used In Operation |  | 29 | 5 | 68 | 52 | 62 | not_permitted ×0.2 / active_rail ×0.05 | 0.3 |

### Reading the top 40

- **Every parcel is in South Oakland**, mostly tax blocks 28-N and 28-P along the Boulevard of the Allies / Atwood corridor. **38 of 40 are occupied buildings.** Only #13, a surface parking lot (0028J00275000000), is flagged vacant. The list also includes a University-owned EMI parcel (#31, 0028J00103000000) and an office/warehouse.
- **The top parcels are near-identical.** Demand (67), Need (83) and Access (~88) are tract or block-group values, so the whole top is one tract. Parcels differ only by Site and Climate decimals.
- **Is South Oakland a plausible place to build?** Partly:
  - It is next to Pitt and UPMC.
  - Walk Score 70, Transit Score 64 [read].
  - Real rental demand.
- **Is it #1 in the City?** No, and the reasons don't survive inspection:
  - **Need 83** ("Very high need: many renters here are struggling") comes mostly from student households. Students count as extremely-low-income cost-burdened renters in CHAS. That is general knowledge, and the config rationale flags it [unverified that the South Oakland share is mostly students; I could not pull ACS B14007 because the Census API needs a key].
  - **Demand 67** comes from sales turnover at the 94th percentile. Student-rental investor churn is my [unverified] reading.
- **Sensitivity check** [read, `sim2.py`]: capping Need at the City median (52) in the six student-heavy neighborhoods (South, Central, North and West Oakland, Bluff, Squirrel Hill North) moves the top 40 to 40/40 East Liberty (block 83-K, R2-M/RM-M: Penn/Shady and the Target area). That is a far more credible "best place" list.

### Reading the bottom 40

- 37 are "R.R. – used in operation" (×0.05, often also not permitted or border).
- 2 are City park parcels (Duquesne Heights, Hazelwood riverfront).
- 1 is a City "Community Urban Renewal" GI parcel in Arlington that the parks overlap caught (0031G00202000000). I did not check whether it is really parkland.
- **All plausible.** Overall scores range 0.3–1.6, so the ordering inside the bottom 40 is noise, which is fine.

---

## 2. Parcel classes that still score nonsensically

Scored on all 142,365 parcels. City p90 = 69.5 and p99 = 74.5 [read].

| Class | n | Median overall | % in city top 10% | Verdict |
|---|---|---|---|---|
| University-owned (`OWNED BY COLLEGE/UNIV/ACADEMY`) | 408 | **69.5** | **50%** | **Wrong.** These are active campus buildings. All EMI parcels are coded by right ×1 because §911.02 lets a single detached house in EMI; the round-1 site review flagged this. |
| EMI-zoned (any use) | 621 | 67.8 | 39% | Same issue |
| Hospitals, charities, homes (`CHARITABLE EXEMPTION/HOS/HOMES`) | 290 | 63.4 | 29% (**20 in the top 1%**) | **Wrong** for hospitals. Magee-Womens (0028K00150000000) scores 77.8 [read] |
| County/State/Federal/Municipal government, occupied | 393 | 57.3 | 16% | **County Jail 0002P00300000000 = 65.7** [read]. Wrong. |
| Office tower (`OFFICE-ELEVATOR 3+`) | 202 | 68.9 | 37% | Occupied high-value buildings. At best a long-horizon conversion candidate. Too high. |
| Apartments with 20+ units | 389 | 68.2 | 42% | Existing housing. Redeveloping it removes homes. Too high. |
| Parking garages and lots | 562 | 65.9 | 34% | **Right.** Surface lots are prime infill sites. Structured garages are less so, but acceptable. |
| Board of Education (schools) | 331 | 52.4 | 5% | Acceptable (mid-pack). |
| Vacant (flag), non-condo, non-park | 29,674 | **55.6** | **5%** | **Backwards** relative to occupied (58.6, 12%). Partly real: public vacant land sits on hillsides and in weak markets (47% of City/URA vacant parcels have Site <60 or H zoning). But flat, by-right public vacant lots (n = 4,761) only reach a median of 59.6. |
| City/URA vacant land | 10,593 | 54.7 | 3% | Land-bank inventory ranks below the average house. |
| Single family (occupied) | 70,712 | 57.3 | 7% | 459 in the top 1%. Building here means demolishing a home. |
| **City/County-owned P-zoned land not caught by the parks overlap** | **1,227** | 50.4 | — | 870 are "MUNICIPAL GOVERNMENT". Example: **0028S00250000000, 0 Boundary St, 10.5 ac City land (my reading: Junction Hollow, beside Schenley Park) = 72.0, p94, "Among the stronger places…"**. The address is [read] via WPRDC; the location label is [unverified]. |
| Missing Demand (imputed 50) | 2,880 | **62.8** | **21%** | Mostly campus, stadium, HACP and industrial tracts: West and Central Oakland, Bedford Dwellings, North Shore, Allegheny West, Terrace Village, Chateau. Imputing 50 is generous when neighbors score in the 30s (Middle Hill 37). |
| Condo units (×0.5) | 5,204 | 34.8 | 0% | The fix works. But the phrase is wrong (see §5). |
| Parks, cemeteries, active rail, right-of-way (×0.05) | 2,799 | 2.8 | 0% | Fixed. |
| Slivers under 600 sf (Site capped at 30) | 1,553 | 50.5 | 0% | Fixed. 600–1,200 sf lots are fine (rowhouse lots). |
| Lots over 1 acre | 2,081 | 54.6 | 14% | OK |

**Highways:** there are no highway parcels as such. Right-of-way usedesc (n = 50) is ×0.05. I did not find limited-access highway land scored as a site. It is mostly unparcelled or `RIGHT OF WAY` [read].

---

## 3. Did the round-1 fixes work?

| Round-1 issue | Check (now) | Status |
|---|---|---|
| Hazelwood phantom grocery (Access P1) | Hazelwood `access_grocery` median 43 (was 100). The nearest SNAP Supermarket/Super Store is Costco Waterfront at 2.1 km and Giant Eagle Murray Ave at 2.4 km [read]. Homewood S keeps 90: Fresh International Market (263 m) and East End Food Co-op (451 m) are real. Upper Lawrenceville 98: ALDI 56th St at 750 m, real. | **Fixed** |
| Clairton/Irvin/ET emissions should reach the Mon Valley (Climate P2) | `climate_industrial_emissions` medians: Hays **2**, New Homestead **2**, Glen Hazel **3**, Lincoln Place **1**, Hazelwood 6 (was 72–75). CBD is now 35, Crawford-Roberts 55 [read]. | **Fixed** |
| Parks, cemeteries, rail near 0 | Frick Park 2.6, Homewood Cemetery 3.0, Allegheny Cemetery 3.0, LLB rail 3.2; class median 2.8 [read] | **Fixed**, except **1,227 public P-zoned parcels** outside the park polygons (F2) |
| Homewood / Hill need understated | Need medians, round 1 → now: Homewood S 35 → **61**, N 35 → **54**, W 22 → **48**, Middle Hill 21 → **45**, Bedford Dwellings 27 → **58**, Upper Hill **38** [read] | **Partly fixed.** Still below affluent student areas (Squirrel Hill N 71, Bluff 80). See F5. |
| Demand too low in Lawrenceville / East Liberty / Strip / CBD | Round 1 → now: Lower Lawrenceville 45 → **61**, Central 51 → **63**, Upper 52 → **64**, East Liberty 43 → **62**, Strip 42 → **57**, CBD 46 → **65**. ρ(Demand, MVA) 0.60 → **0.77** [read]. Household growth is now neutral (53) almost everywhere. | **Fixed.** Watch Crawford-Roberts (F6). |
| Demand ≥75 artifacts (Marshall-Shadeland government land, LLB rail) | Demand ≥65 is now 6% of parcels. Marshall-Shadeland government/rail Demand is blank (imputed). | **Fixed** (but see F3 on imputation) |
| Condo units topping the list | ×0.5; median 34.8 | **Fixed** (phrase issue remains) |
| Missing pillars inflate the overall (Bluff campus #1–11) | Now imputed 50 | **Partly.** Still 21% in the top decile (F3). |
| Jail, EMI campuses, institutions high | Jail 65.7; EMI all by right; university-owned median 69.5 | **Not fixed** (F1) |
| Site "easy lot" on hazardous land | Gates in place. But the landslide cap lands on a phrase boundary (F4). | **Mostly fixed** |
| Legal multipliers compressed ranks | ZA 0.98, SE 0.94, CU 0.92, plan 0.96, H 0.85, unknown 0.8, border 0.35 | **Fixed** |
| Access vs Walk Score | ρ 0.85 → **0.89** | **Improved.** The same hill/civic-only over-scores remain (F7). |

---

## 4. Neighborhood medians vs outside benchmarks

**Benchmarks:**
- Walk Score and Transit Score from <https://www.walkscore.com/PA/Pittsburgh> [read, fetched this session; 78 neighborhoods].
- Reinvestment Fund 2021 MVA class and CDC SVI 2022 socioeconomic percentile, from the repo overlays `market-mva.geojson` and `equity-svi-coi.geojson`. MVA is weight 0 in Demand; SVI is not used by any pillar. Both are independent of the scores except that MVA and Demand share inputs (sales, vacancy).
- Permitted new units 2022+ from `pgh_new_residential_permits_classified.csv`. This is partly circular, because it feeds `demand_new_construction`.

**Spearman ρ, neighborhoods with ≥100 parcels** [read]:

| Score | Benchmark | ρ | n |
|---|---|---|---|
| Access | Walk Score | **0.89** | 75 |
| Access | Transit Score | 0.84 | 75 |
| Access | EPA National Walkability Index | 0.66 | 75 |
| Demand | MVA class | **0.77** | 70 |
| Need | SVI socioeconomic | **0.50** | 86 |
| Overall | Walk Score | 0.72 | 75 |
| Overall | Permitted units per parcel | 0.60 | 86 |
| Overall | MVA | 0.34 | 71 |
| Overall | SVI minority percentile | **0.06** | 86 |
| Climate | Tract life expectancy | **−0.46** | 66 |

The round-1 equity result is resolved: round 1 had ρ(minority, overall) = −0.37; it is now 0.06, meaning **no racial gradient in the overall score** [read].

### Largest rank gaps (rank-percentile points, positive = we score higher than the benchmark) [read]

**Access vs Walk Score**
- Over: Perry South +34 (A 67 / WS 26), Beltzhoover +29, Homewood West +26, Lincoln-Lemington-Belmar +24, Homewood South +24, Fineview +24, Knoxville +23.
- Under: Regent Square −37, Upper Lawrenceville −30, Brookline −29, Troy Hill −26.
- Same pattern as round 1: civic services without commerce, plus straight-line distance on hills.

**Demand vs MVA**
- Over: **Crawford-Roberts +61** (D 72, the highest in the City, vs MVA class E), Stanton Heights +32, Banksville +30, East Liberty +29.
- Under: Arlington −54, Point Breeze North −44, Oakwood −41, Point Breeze −28, Highland Park −30.
- Point Breeze and Highland Park are "A/B" markets that rarely turn over or build. That is the known weakness of turnover and permits as demand signals.

**Need vs SVI socioeconomic**
- Over: South Shore +80 and Chateau +71 (industrial tracts with few residents), **Squirrel Hill North +65**, Upper Lawrenceville +56, **North Oakland +51**, South Side Flats +42.
- Under: **East Allegheny −73**, Hays −58, New Homestead −55, **Homewood West −44, Middle Hill −43, Upper Hill −43**.
- The pattern is students and affluent renters over-read, and subsidized or older owner-occupied poor areas under-read.

**Climate vs life expectancy (−0.46).** Climate is highest in Bedford Dwellings (77), Fineview (76), Northview Heights (74), Terrace Village (72) and Middle Hill (72), because the carbon half (household VMT, 50% of the pillar) is near 100 there. Those are among the City's lowest life-expectancy tracts (67–70 years). This follows from the design (low VMT really is low-carbon), not a bug. But the pillar name "Climate & Environment" plus a phrase like "Low driving and a healthy local environment" on the Hill (0010F00210000000) will read badly to residents (F8).

### All neighborhoods (medians of parcel scores)

- **Overall is dragged down where condo units dominate.** CBD reads 34.8, North Oakland 36.4 and the Strip 51.7, because the ×0.5 condo parcels are most of the parcels there. Use the "Blend" column (before multipliers) or the vacant-parcel column to compare places.
- "Vacant-parcel overall" is the median over parcels flagged vacant.
- MVA: A = 10 … J = 1.
| Neighborhood | n | Overall | Blend (pre-mult.) | Vacant-parcel overall | Demand | Site | Need | Access | Climate | Walk / Transit Score | MVA (A=10…J=1) | SVI socioecon pctile |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| South Side Flats | 3422 | 73 | 73 | 64 | 57 | 91 | 74 | 91 | 59 | 93 / 65 | 9 | 52 |
| Central Northside | 1762 | 73 | 73 | 73 | 68 | 91 | 61 | 86 | 64 | 72 / 61 | — | 59 |
| Central Oakland | 1098 | 73 | 73 | 72 | 58 | 93 | 80 | 84 | 61 | 92 / 68 | 9 | 93 |
| Crawford-Roberts | 1348 | 71 | 73 | 71 | 72 | 91 | 54 | 94 | 69 | 80 / 84 | 5 | 72 |
| Bluff | 747 | 71 | 71 | 71 | 49 | 92 | 80 | 90 | 57 | 77 / 89 | 7 | 73 |
| Allegheny Center | 64 | 70 | 70 | 69 | 70 | 92 | 45 | 95 | 64 | 86 / 81 | — | 42 |
| Shadyside | 3922 | 70 | 71 | 70 | 67 | 91 | 53 | 88 | 62 | 91 / 71 | 9 | 42 |
| Friendship | 373 | 70 | 70 | 70 | 52 | 95 | 52 | 93 | 68 | 92 / 68 | 9 | 44 |
| South Oakland | 1628 | 70 | 71 | 58 | 61 | 97 | 83 | 69 | 61 | 70 / 64 | 7 | 63 |
| Larimer | 1610 | 69 | 69 | 69 | 41 | 92 | 82 | 84 | 61 | 77 / 61 | — | 94 |
| East Liberty | 1483 | 69 | 69 | 68 | 62 | 91 | 49 | 92 | 63 | 82 / 62 | 7 | 47 |
| Central Lawrenceville | 2265 | 68 | 68 | 67 | 63 | 91 | 53 | 82 | 60 | 84 / 52 | 9 | 36 |
| Bedford Dwellings | 264 | 68 | 68 | 62 | — | 85 | 58 | 77 | 77 | 56 / 61 | 2 | 90 |
| Terrace Village | 204 | 66 | 67 | 67 | — | 84 | 56 | 78 | 72 | 66 / 71 | — | 94 |
| Upper Lawrenceville | 1572 | 66 | 67 | 62 | 64 | 92 | 64 | 69 | 57 | 74 / 42 | 9 | 34 |
| Squirrel Hill North | 2799 | 66 | 67 | 64 | 55 | 93 | 71 | 75 | 59 | 69 / 62 | 10 | 30 |
| Lower Lawrenceville | 1401 | 65 | 65 | 62 | 61 | 92 | 40 | 88 | 64 | 86 / 62 | 9 | 24 |
| Mount Washington | 4441 | 65 | 65 | 60 | 52 | 85 | 47 | 77 | 69 | 68 / 70 | 7 | 43 |
| Bloomfield | 3487 | 65 | 65 | 63 | 52 | 94 | 41 | 91 | 65 | 92 / 62 | 7 | 42 |
| Highland Park | 2130 | 64 | 64 | 60 | 48 | 92 | 47 | 71 | 66 | 61 / 48 | 9 | 11 |
| West Oakland | 789 | 63 | 64 | 58 | 43 | 55 | 86 | 86 | 61 | 83 / 71 | 7 | 78 |
| Allegheny West | 270 | 63 | 63 | 64 | 58 | 92 | 41 | 82 | 64 | 73 / 71 | 9 | 42 |
| Greenfield | 3569 | 62 | 62 | 57 | 52 | 88 | 50 | 75 | 55 | 68 / 46 | 7 | 47 |
| South Shore | 169 | 62 | 63 | 62 | 61 | 50 | 67 | 85 | 66 | — / — | 9 | 0 |
| Garfield | 2236 | 62 | 62 | 62 | 50 | 90 | 46 | 81 | 69 | 74 / 56 | 5 | 62 |
| Middle Hill | 1861 | 62 | 62 | 62 | 37 | 85 | 45 | 82 | 72 | 67 / 66 | 3 | 74 |
| Squirrel Hill South | 4698 | 61 | 62 | 56 | 54 | 88 | 52 | 80 | 58 | 74 / 51 | 9 | 16 |
| Beltzhoover | 1740 | 61 | 61 | 61 | 36 | 88 | 55 | 73 | 64 | 39 / 64 | 1 | 69 |
| East Allegheny | 1262 | 61 | 61 | 60 | 46 | 91 | 34 | 90 | 66 | 82 / 69 | — | 79 |
| Point Breeze | 2137 | 60 | 61 | 59 | 53 | 94 | 38 | 72 | 57 | 66 / 59 | 10 | 1 |
| California-Kirkbride | 826 | 60 | 60 | 58 | 51 | 91 | 38 | 74 | 64 | 55 / 51 | — | 50 |
| Polish Hill | 897 | 60 | 60 | 50 | 41 | 55 | 64 | 80 | 72 | 63 / 64 | 6 | 45 |
| Morningside | 1537 | 60 | 60 | 47 | 57 | 92 | 46 | 61 | 56 | 50 / 47 | 8 | 11 |
| Arlington | 1056 | 59 | 59 | 56 | 30 | 88 | 80 | 56 | 65 | 51 / 44 | 7 | 82 |
| Homewood South | 1839 | 59 | 59 | 59 | 28 | 94 | 61 | 84 | 54 | 63 / 61 | — | 74 |
| Lincoln-Lemington-Belmar | 2709 | 59 | 59 | 58 | 25 | 95 | 71 | 64 | 62 | 26 / 42 | 1 | 79 |
| Hazelwood | 3609 | 58 | 59 | 54 | 35 | 83 | 74 | 63 | 53 | 42 / 38 | 3 | 83 |
| Manchester | 1477 | 58 | 58 | 58 | 46 | 91 | 39 | 67 | 60 | 59 / 60 | — | 50 |
| Allentown | 1548 | 58 | 58 | 57 | 37 | 84 | 44 | 79 | 68 | 62 / 57 | 3 | 51 |
| Chateau | 203 | 58 | 59 | 56 | — | 92 | 74 | 62 | 34 | — / — | — | 28 |
| North Shore | 260 | 57 | 59 | 56 | — | 84 | 38 | 86 | 66 | — / — | — | 3 |
| Spring Garden | 761 | 57 | 58 | 56 | 47 | 73 | 56 | 69 | 68 | — / — | 5 | 48 |
| Regent Square | 387 | 57 | 57 | 53 | 51 | 95 | 37 | 65 | 53 | 74 / 51 | 9 | 1 |
| Homewood West | 662 | 57 | 57 | 57 | 29 | 96 | 48 | 81 | 58 | 55 / 59 | — | 81 |
| Troy Hill | 1289 | 57 | 57 | 55 | 36 | 92 | 49 | 64 | 63 | 67 / 49 | — | 48 |
| Brookline | 6490 | 56 | 57 | 51 | 50 | 85 | 42 | 58 | 57 | 56 / 42 | 6 | 45 |
| Bon Air | 510 | 56 | 56 | 50 | 31 | 81 | 57 | 60 | 68 | 26 / 60 | 4 | 69 |
| Carrick | 4670 | 56 | 56 | 54 | 33 | 82 | 53 | 65 | 59 | 58 / 48 | 4 | 79 |
| Westwood | 1583 | 56 | 56 | 55 | 49 | 84 | 36 | 63 | 59 | 55 / 36 | 6 | 63 |
| Homewood North | 2531 | 56 | 56 | 56 | 27 | 96 | 54 | 73 | 57 | 50 / 54 | 1 | 81 |
| Marshall-Shadeland | 2668 | 56 | 56 | 50 | 31 | 83 | 67 | 64 | 53 | 45 / 43 | 6 | 65 |
| Arlington Heights | 9 | 56 | 56 | 56 | 23 | 90 | 80 | 50 | 66 | — / — | — | 82 |
| Mt. Oliver | 300 | 56 | 56 | 54 | 23 | 85 | 80 | 59 | 59 | — / — | — | 82 |
| Upper Hill | 1329 | 56 | 56 | 55 | 35 | 81 | 38 | 76 | 70 | 55 / 69 | 3 | 67 |
| Crafton Heights | 1973 | 55 | 55 | 53 | 34 | 83 | 62 | 55 | 66 | 32 / 43 | 4 | 67 |
| Chartiers City | 330 | 55 | 55 | 56 | 31 | 93 | 66 | 51 | 55 | — / — | 4 | 61 |
| Brighton Heights | 3348 | 55 | 55 | 44 | 42 | 92 | 45 | 64 | 51 | 47 / 43 | 6 | 40 |
| Duquesne Heights | 1876 | 54 | 55 | 46 | 59 | 78 | 26 | 63 | 70 | 52 / 65 | 9 | 23 |
| East Hills | 1612 | 54 | 55 | 55 | 24 | 88 | 72 | 60 | 56 | 29 / 46 | 1 | 89 |
| Perry South | 3133 | 54 | 60 | 51 | 34 | 78 | 68 | 67 | 69 | 26 / 45 | 3 | 81 |
| Knoxville | 1725 | 54 | 54 | 56 | 17 | 81 | 63 | 78 | 66 | 54 / 54 | 2 | 93 |
| Fairywood | 275 | 54 | 54 | 54 | 40 | 93 | 67 | 34 | 55 | 23 / 35 | 3 | 61 |
| Swisshelm Park | 745 | 54 | 54 | 52 | 47 | 99 | 43 | 50 | 47 | 29 / 45 | 8 | 12 |
| Glen Hazel | 79 | 54 | 54 | 52 | 29 | 55 | 68 | 63 | 62 | 14 / 45 | 3 | 83 |
| Stanton Heights | 2387 | 53 | 53 | 44 | 57 | 86 | 26 | 57 | 55 | 32 / 45 | 6 | 3 |
| Beechview | 4195 | 53 | 54 | 49 | 46 | 83 | 35 | 65 | 59 | — / — | 4 | 41 |
| Ridgemont | 384 | 53 | 53 | 52 | 47 | 76 | 37 | 52 | 64 | 37 / 32 | 6 | 63 |
| Elliott | 1633 | 53 | 54 | 44 | 31 | 74 | 54 | 66 | 69 | 45 / 50 | 3 | 69 |
| St. Clair | 192 | 53 | 53 | 53 | 23 | 73 | 80 | 48 | 62 | — / — | — | 82 |
| Windgap | 755 | 52 | 52 | 52 | 31 | 93 | 60 | 45 | 52 | 21 / 35 | 4 | 61 |
| Strip District | 985 | 52 | 59 | 45 | 57 | 91 | 25 | 84 | 65 | 76 / 59 | 9 | 16 |
| Esplen | 385 | 52 | 52 | 51 | 15 | 93 | 74 | 65 | 58 | — / — | 3 | 95 |
| Spring Hill-City View | 1524 | 51 | 53 | 46 | 36 | 55 | 52 | 61 | 69 | 42 / 43 | 3 | 70 |
| Perry North | 2263 | 51 | 52 | 42 | 39 | 55 | 55 | 48 | 58 | 21 / 41 | 4 | 62 |
| Point Breeze North | 697 | 51 | 51 | 52 | 40 | 99 | 20 | 82 | 56 | 66 / 63 | 9 | 4 |
| South Side Slopes | 3106 | 51 | 55 | 48 | 45 | 55 | 36 | 78 | 69 | 72 / 50 | 7 | 51 |
| West End | 378 | 51 | 51 | 50 | 35 | 50 | 47 | 66 | 67 | — / — | 3 | 69 |
| Banksville | 1479 | 51 | 51 | 50 | 62 | 83 | 19 | 58 | 62 | 41 / 38 | 7 | 8 |
| Overbrook | 2076 | 50 | 51 | 49 | 40 | 86 | 50 | 56 | 56 | 36 / 48 | 4 | 43 |
| Fineview | 881 | 50 | 51 | 44 | 40 | 45 | 34 | 68 | 76 | 37 / 52 | 4 | 60 |
| Northview Heights | 99 | 50 | 50 | 48 | 36 | 55 | 42 | 49 | 74 | 5 / 41 | — | 78 |
| Oakwood | 430 | 50 | 50 | 49 | 34 | 88 | 28 | 52 | 70 | 47 / 40 | 7 | 50 |
| Sheraden | 2753 | 49 | 50 | 40 | 15 | 92 | 64 | 62 | 64 | 39 / 45 | 3 | 95 |
| East Carnegie | 308 | 48 | 48 | 47 | 39 | 98 | 26 | 42 | 62 | 29 / 38 | 4 | 50 |
| Lincoln Place | 1772 | 47 | 47 | 48 | 44 | 88 | 48 | 38 | 35 | 30 / 31 | 6 | 37 |
| Summer Hill | 621 | 47 | 48 | 44 | 38 | 76 | 52 | 36 | 54 | 5 / 41 | — | 78 |
| New Homestead | 1083 | 41 | 41 | 42 | 38 | 86 | 35 | 27 | 44 | 6 / 28 | — | 69 |
| North Oakland | 1251 | 36 | 71 | 58 | 61 | 92 | 60 | 86 | 61 | 91 / 70 | 8 | 25 |
| Central Business District | 1320 | 35 | 69 | 69 | 65 | 91 | 46 | 94 | 60 | — / — | 9 | 35 |
| Hays | 409 | 32 | 33 | 32 | 31 | 50 | 34 | 15 | 52 | 4 / 29 | 6 | 69 |

**Sanity read of the neighborhood ordering** (blend column):
- **Top** (blend ≥69): South Side Flats 73.4, Central Oakland 73.3, Crawford-Roberts 72.9, Central Northside 72.9, North Oakland 71.2, Bluff 71.0, South Oakland 70.9, Shadyside 70.8, Allegheny Center 70.5, Friendship 69.6, East Liberty 69.2, Larimer 69.2, CBD 68.9. These are the City's walkable core plus the Hill/Larimer redevelopment areas. **That ordering is plausible** for "where new housing makes sense." The student skew is the exception.
- **Bottom:** Hays, New Homestead, Summer Hill, Lincoln Place, East Carnegie, Sheraden, Oakwood, Northview Heights. These are car-dependent edges and heavily undermined or hillside areas. **Plausible.**
- **Surprises:**
  - **Strip District** blend 58.7 (43rd of 90 neighborhoods) despite being where the most units are being permitted (374 units, #1 [read]). Need is 25 there, and this is a value choice: the Need pillar deliberately favors places with cost-burdened renters.
  - **Point Breeze North** blend 51, **Regent Square** 57, **Highland Park** 64. Strong markets pulled down by low Need and low measured Demand.

---

## 5. Phrases: accuracy on sampled parcels

I sampled 15 parcels with `explain-parcel.ts` (0002P00300…, 0028S00250…, 0010F00210…, 0056C00129…, 0174K00352…, 0052L00036050100, 0009E00102…, 0138F00041…, 0127H00100000001, 0047K00076…, 0083B00066…, 0012F00071…, 0035N00192…, 0010G00069…, 0050L00076…), plus citywide counts [read].

| Problem | Example | Scale |
|---|---|---|
| **Landslide cap lands exactly on the "minor constraints" band.** The cap is 55 and the band minimum is 55. | Hazelwood 0056C00129000000: Site 55.0, "Mostly buildable, with minor site constraints," next to the flag "landslide-prone (geotechnical study required)". | **7,198 parcels** |
| **Sliver cap reads as a physical hazard** | Homewood S 0174K00352000000 (535 sf): Site 30, "Hard to build here: serious physical hazards." The issue is lot size, not hazard. | 1,578 |
| **Climate phrase hides a poor local environment** | South Side Flats 0012F00071000000: Climate 59, "Mostly good on carbon and environment," while local_env is 27 ("Worse air, heat or tree cover than most of the county"). | **30,484** parcels in the 55–70 climate band have local_env <35 |
| **Condo phrase blames the place** | Squirrel Hill N condo 0052L00036050100: blend 71, overall 35.6, "better than 5%… One of the harder places in the City to build new housing." The reason is that it is a condo unit, not the place. | 5,204 |
| **Institutions get top phrases** | Jail: "Among the stronger places…". 0 Boundary St City land: "Among the stronger places…" (p94) | F1/F2 |
| **Imputed pillars are silent in the CLI** | Jail: Demand "—", Need "—", with no note that 50 was imputed. I did not check whether the panel shows the flag [unverified]. | 2,880 / 438 |
| **Need phrase on student/affluent tracts** | Squirrel Hill N condo and 0 Boundary St: "Very high need: many renters here are struggling with housing costs." | ~5–8k parcels in the student neighborhoods |
| Correct phrases (spot-checked) | Overbrook floodplain lot ("Real site constraints", SFHA flag); Spring Hill steep + landslide (45, "Real site constraints"); East Liberty 3-family ("Solid demand", "Everything is close"); Frick Park ×0.05; Garfield displacement flags (DRR + price growth). | — |

---

## 6. Findings ranked by impact, with concrete changes

### F1 (high). Availability ignores occupancy and institutions, so the top of the list is occupied buildings, campuses, a hospital and a jail

**Change:** extend `site_parcel_use.source.rules` and `availability.levels`. New codes are appended so existing codes keep their meaning. Evaluate after the existing rules; the first match wins.

| New code | id | Rule | Multiplier |
|---|---|---|---|
| 5 | `active_institution` | `usedesc` ∈ {OWNED BY COLLEGE/UNIV/ACADEMY, CHARITABLE EXEMPTION/HOS/HOMES, OWNED BY BOARD OF EDUCATION, CHURCHES, PUBLIC WORSHIP, NURSING HOME/PRIVATE HOS}, **or** (`usedesc` ∈ {COUNTY/STATE/FEDERAL/MUNICIPAL GOVERNMENT} and `Vacant` = "Not Vacant"), **or** (`zon_new` = EMI and not vacant) | **0.6**, label "Active institution or public facility: a site only if the institution releases it" |
| 6 | `large_occupied` | `usedesc` ∈ {APART:20-39 UNITS, APART:40+ UNITS, OFFICE-ELEVATOR -3 + STORIES, HOTELS, CASINO} | **0.7**, label "Large occupied building: redevelopment or conversion only" |
| 7 | `occupied` | any other parcel with `Vacant` = "Not Vacant", except `usedesc` ∈ {PARKING GARAGE/LOTS, COMMERCIAL GARAGE, AUTO SALES & SERVICE, CAR WASH, COMM AUX BUILDING} | **0.9**, label "Occupied: building new means replacing what's there" |
| 0 | `site` | vacant-flagged, surface parking, urban renewal, builders lot, condo developmental land | 1.0 |

This needs `parcel_use` rules to support `Vacant` and `zon_new` conditions and a default rule. That is a small build change; I did not check whether the rule engine already supports `Vacant`.

**Why:**
- The brief asks for a *good place to build*. Vacant and underused land is where new housing actually goes first.
- Replacing an occupied home is direct displacement. The round-1 need review made this point.
- Hospitals, campuses and the jail are not sites.
- 0.9 is deliberately mild: occupied parcels stay valid redevelopment candidates.

**Expected effect** (simulated, `sim.py`) [read]:
- Top 40 goes from 40 occupied South Oakland buildings to 36 of 40 vacant lots or surface parking.
- Vacant median 55.6 → 55.5; occupied 58.6 → 52.4.
- Share of vacant parcels in the top decile goes 5% → 15%.
- Magee (77.8 → ~47), the jail (65.7 → ~39) and campus parcels leave the top decile.
- Affected counts: 2,022 institutions, 633 large buildings, 100,938 occupied.

### F2 (high). About 1,227 public P-zoned parcels escape the park rule

**Change:** add a rule to `site_parcel_use`:

```json
{"code": 1, "zon_new": ["P"], "owner": ["City","County","State","Other"], "usedesc_not": ["SINGLE FAMILY","TWO FAMILY","ROWHOUSE","TOWNHOUSE"]}
```

This is what round-1 site review §3.1 recommended, and it was not adopted. It needs `owner`/`zon_new` matching in the parcel_use builder.

**Why:** City-held P land is parkland, greenway or public open space. The PA Donated or Dedicated Property Act applies to dedicated parkland [skimmed in round 1]. Example: 0028S00250000000 (0 Boundary St, 10.5 ac) at 72.0.

**Expected effect:** 1,227 parcels (870 "MUNICIPAL GOVERNMENT", 249 City vacant land) go to ×0.05. The 859 private single-family houses zoned P are untouched.

### F3 (high for the top of the list). Student tracts inflate Need, and so the overall

**Change (build):**
1. Add `scripts/pillars/inputs/allegheny_tract_college_enrollment_acs.csv` from ACS 5-year **B14007** (enrolled in college undergrad + graduate ÷ population 3+, or better ÷ population 18–34). Getting it needs a Census API key.
2. Add to `afford_eli_renter_share` and `afford_lowinc_renter_burden`:
   ```json
   "require": [{"property": "college_share", "max": 0.30, "table": "…college_enrollment…"}]
   ```
   That blanks both where more than 30% of residents are enrolled. The alternative is to shrink their normalized value toward 50 by (1 − college_share).
3. Update the rationale ("Student-heavy tracts … not yet corrected").

**Why:**
- The top 100 citywide are all South Oakland, where Need is 83 from a 96th-percentile ELI-renter share.
- Squirrel Hill North and North Oakland over-read SVI socioeconomic by 65 and 51 rank points.

**Expected effect** (proxy simulation: cap Need at the City median in the six student neighborhoods) [read]:
- The top 40 moves to East Liberty.
- Combined with F1, the top 40 becomes East Liberty and Crawford-Roberts vacant lots.
- ρ(Need, SVI socioeconomic) should rise above 0.50 (not simulated). The 30% threshold is [unverified]; check the tract distribution first.

### F4 (medium). Missing pillars are imputed at 50 even where every neighbor is far lower

**Change:** add `overall.missing_pillar.impute_from: "neighborhood_median"` with fallback `"pillar_p25"` (Demand p25 ≈ 36). Show a visible "estimated, no data" flag in the panel and the CLI. This is a code change in `score.ts`, `overallScore`.

**Why:** the 2,880 missing-Demand parcels have median overall 62.8, and 21% of them are in the top decile. Bedford Dwellings and Terrace Village have *no* Demand anywhere, so 50 is assumed, while adjacent Middle Hill is 37 and Upper Hill 35.

**Expected effect:** Bedford and Terrace Village blends drop about 2–3 points. Campus parcels in Oakland take the Oakland median (~58–61), so they change little. The panel becomes honest about it.

### F5 (medium). Need still under-reads subsidized, poor neighborhoods

**Change:** add `afford_assisted_share` built from existing overlays: `subsidized-housing.geojson` units plus `housing-vouchers.geojson` vouchers, divided by tract renter households. Normalize by county-tract percentile, higher = more need, **weight 1.5**, sub `affordability`.

**Why:** subsidized tenants pay about 30% of income, so CHAS burden misses them. The residuals are Homewood West −44, Middle Hill −43, Upper Hill −43 and East Allegheny −73 against SVI socioeconomic. Round 1 identified this mechanism; the ELI-share fix only partly closed it.

**Expected effect:** Hill and Homewood Need rise toward 60–70, and ρ with SVI socioeconomic rises. Not simulated; the direction is [unverified] until built.

### F6 (medium). Phrase and cap mismatches

1. **Landslide cap on the band boundary.** Set `site.gates[landslide].cap` **55 → 54**, or `phrases.site[1].min` 55 → 56. **7,198 parcels** move from "minor constraints" to "Real site constraints…", matching their flag.
2. **Sliver phrase.** Add a `phrase_guards.site.override_when_flag`: `{"flag":"Sliver lot under 600 sq ft","text":"Too small to build on alone: combine with neighboring lots."}`. Small code change in `phrases.ts`. 1,578 parcels.
3. **Climate phrase.** Build it from the sub-scores. When carbon ≥ 70 and local_env < 35, show "Low driving, but worse air, heat or tree cover than most of the county." When carbon < 40 and local_env ≥ 55, show "Healthy surroundings, but residents would drive a lot." That fixes the **30,484** "Mostly good" contradictions. Round 1 made the same recommendation.
4. **Overall phrase when availability or zoning drives the score.** If `site_use_x < 1` or `zoning_x ≤ 0.35`, replace the rank phrase with the availability or zoning label. For example, for condos: "Individual condo unit: this score is ×0.5 for that reason; the location itself scores better than N%." That fixes 5,204 condo parcels (and the new F1 tiers).
5. **Imputed pillars.** Print "No data: counted as 50 (or the neighborhood median)" instead of "—".

### F7 (medium–low). Demand: Crawford-Roberts is the City's highest-demand neighborhood

- Crawford-Roberts Demand median is 71.5, with turnover at the 97th percentile, versus MVA class E (+61 rank gap).
- Round 1 flagged this as a watch item.
- It is partly real: the Reed-Roberts and City's Edge Bedford Choice replacement buildings are under construction ([URA](https://www.ura.org/pages/bedford-dwellings) [skimmed]). But turnover on a small owner base is the driver.

**Change:**
- Confirm `derived_tract_turnover.csv` blanks tracts with fewer than 150 owner-type units (round-1 demand R2 floor). If it doesn't, add `"require":[{"property":"owner_units","min":150}]`. I did not open `derive-inputs.ts` to check [unverified].
- Also set `demand_rent_growth.weight` **0.5 → 0**. Diagnostics show r = **−0.23** with its own pillar, a sign conflict, which the round-1 review predicted for supply-wave ZIPs [read].

**Expected effect:** Crawford-Roberts Demand falls toward the Hill median if its owner base is small. The rent-growth change has a small citywide effect and removes a known wrong-sign input.

### F8 (medium–low). Access still over-scores hilltop and civic-only neighborhoods

**Change:** `access_shops_restaurants.weight` **1 → 2**. It already correlates 0.81 with the pillar, and round 1 measured commerce as the best single Walk Score proxy.

**Why:** the over-scored places are Perry South, Beltzhoover, Lincoln-Lemington-Belmar, Homewood, Fineview and Knoxville. The under-scored ones are Regent Square, Upper Lawrenceville, Brookline and Troy Hill. The pattern is the same as round 1.

**Expected effect:** ρ vs Walk Score about 0.89 → 0.90+ [unverified, not re-simulated]. Hill-aware distances remain the real fix (build).

### F9 (low). Climate reads as "healthiest" in the lowest-life-expectancy neighborhoods

- ρ(Climate, life expectancy) = −0.46 at neighborhood level.
- This is by design: carbon is half the pillar, and dense neighborhoods have low VMT.
- **Change:** no weight change. Rename the pillar in the UI to "Climate (low-carbon location) & Local Environment", and apply F6.3 so the two halves show separately. Optionally add a `climate_near_highway` parcel flag (round 1 #8).

### F10 (low; analysis hygiene). Neighborhood aggregates are distorted by condo parcel counts

- **Change:** any neighborhood roll-up (map choropleth, pitch slides) should use the pre-multiplier blend, or exclude `site_use` ≠ `site`.
- **Why:** CBD reads 34.8 and North Oakland 36.4 purely from ×0.5 condo units.

---

## 7. What I did not verify

- The student share of South Oakland, Squirrel Hill North and North Oakland renters. The ACS B14007 pull needs an API key.
- The location label for 0028S00250000000. The WPRDC address is "0 Boundary St 15213"; "Junction Hollow" is my inference.
- Whether the `parcel_use` builder supports `Vacant`/`owner`/`zon_new` rules. I read the config, not the builder.
- Whether the panel (not the CLI) shows imputed-pillar flags.
- The F5 and F8 effect sizes. I did not simulate them.
- Walk Score figures are Walk Score's current page, not a dated snapshot. MVA is the 2021 vintage.
