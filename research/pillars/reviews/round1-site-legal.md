# Round 1 review: Site Feasibility, physical hazards, legal gate

**Reviewer lens:** site feasibility, physical hazards, legal and zoning reality.
**Config reviewed:** `apps/web/src/lib/pillars/pillars.config.json` v`2026-09-26.11`, built indicators in `public/data/pillars/parcel-indicators.json` (142,365 parcels).
**Method:** I ran `explain-parcel.ts` on the 17 review parcels plus 11 parcels I chose to test specific hypotheses. I scored every parcel with `score.ts` (scratch script, same code path as the map), grouped the results by use, owner, district and hazard, re-ran the hazard overlaps at 12×12 on a 10% sample, re-computed the border distances, and read Ch. 906 and §911.02 on eCode360. I did not edit any code or config.

Evidence tags: **[read]** = I read the primary text or data this session. **[computed]** = my own computation on the repo's data this session. **[skimmed]** = search-result summary or partial read. **[unverified]** = my belief, not checked this session.

---

## 1. Per-parcel table

Site = Site Feasibility pillar score. Overall = after the legal multiplier.

### Review set (`review-parcels.txt`)

| PIN | Place / district / use | Site | Legal (mult.) | Overall | Verdict and evidence |
|---|---|---|---|---|---|
| 0052L00036050100 | Sq. Hill N · RM-M · CONDOMINIUM, 693 sf | 93.4 | by right ×1 | 71.2 | **Misleading.** This is one condo unit in an existing building, not a development site. Condo parcels are the highest-scoring use class in the city (see §2.1). [computed] |
| 0174K00352000000 | Homewood S · RM-M · City vacant, 535 sf | 94.8 | by right ×1 | 56.8 | **Legal status right** (RM-M allows 1–4+ units by right [read §911.02]). The lot is 535 sf, too small to build on alone; it only works if combined with neighboring lots. Nothing in Site measures lot size. |
| 0049J00089040900 | Lawrenceville · LNC · CONDOMINIUM, 193 sf | 92.4 | by right ×1 | 65.7 | **Misleading.** Condo unit. |
| 0002A00127110800 | CBD · GT-A · CONDOMINIUM, 256 sf | 91.7 | by right ×1 | 70.5 | **Legal correct:** GT-A is parsed correctly, and 2-, 3- and multi-unit are P in the GT column [read §911.02]. The parcel is still a condo unit. |
| 0056C00129000000 | Hazelwood · R1D-H · vacant, 2,815 sf | 63.8 | by right ×1 | 48.2 | **Hazard understated.** The lot is 50% at 25%+ slope and 100% landslide-prone, yet the label is "Mostly buildable, with minor site constraints." LS-O requires a geotechnical investigation and approval from the Chief of Building Inspection (§906.04) [read]. Slopes of 25%+ trigger SS-O Planning Commission review (§906.08.C.1) [read]. Should be ≤45. |
| 0035N00192000000 | Beechview · R1D-H · SFD | 77.8 | by right ×1 | 54.9 | Hazard shares are plausible: undermined 1.0, and 93% of Beechview parcels are in UM-O [computed]. The label "no major physical hazards" is wrong for a UM-O lot (§906.05 requires overburden evidence) [read]. |
| 0004L00301000000 | Mt Washington · R1D-H · SFD | 72.2 | by right ×1 | 57.4 | Plausible. The lead-line penalty (−7.7) comes from the existing house's service line, which does not matter for new construction. |
| 0012F00071000000 | South Side Flats · R1A-VH · rowhouse, 827 sf | 85.0 | by right ×1 | 67.8 | Plausible: no hazards. It also takes a lead-line penalty. |
| 0083B00066000000 | East Liberty · R3-L · 3-family | 92.3 | by right ×1 | 61.9 | Plausible. It is an occupied building. |
| 0052D00141001100 | Shadyside · R2-M · CONDOMINIUM, 340 sf | 85.5 | by right ×1 | 68.3 | **Misleading.** Condo unit. |
| 0096C00022000000 | Brookline · R1D-L · SFD | 74.2 | by right ×1 | 53.6 | Plausible: 31% steep, fully undermined. |
| 0124N00365000000 | Larimer · R1A-H · URA vacant, 3,308 sf | 92.7 | by right ×1 | 62.7 | **Correct.** This is the kind of parcel the tool should rank highly: vacant, publicly held, by right, flat. |
| 0175H00123000000 | Homewood S · RM-M · City vacant, 2,449 sf | 94.8 | by right ×1 | 54.7 | **Correct.** |
| 0138E00098000000 | Overbrook · R1D-L · floodway 30%, steep 80% | 20.0 (cap) | by right ×1 | 36.9 | **Direction right.** §906.02 bars new construction in the floodway unless a no-rise hydraulic analysis and a DEP permit are provided [read]. The 80% steep share alone should also have made this lot hard. |
| 0075F00310000000 | Marshall-Shadeland · RIV-GI · County vacant | 96.2 | not permitted ×0.2 | 14.3 | **Correct.** The RIV-GI column is blank for every dwelling type [read §911.02]. (Housing Need is missing here: another reviewer's lens.) |
| 0045N00357000000 | Marshall-Shadeland · GI · state-owned vacant, 75% steep | 77.4 | border ×0.5 | 31.1 | **Site overstated.** A 75% steep lot is labelled "An easy lot to build on." State-owned vacant GI land is plausibly highway right-of-way [unverified]. |
| 0047K00076000000 | Spring Hill · R1A-H · SFD, 100% steep, 58% landslide | 60.5 | by right ×1 | 48.7 | **Hazard understated.** Labelled "minor constraints." SS-O plus LS-O apply [read]. |

### Extra parcels chosen to test hypotheses

| PIN | Place / district / use | Site | Legal | Overall | Verdict and evidence |
|---|---|---|---|---|---|
| 0127H00100000001 | **Frick Park** · P · City PUBLIC PARK, 452 ac | 77.8 | by right ×1 | **63.4** "good place to build" | **Wrong.** P is coded by right because §911.02 really does list Single-Unit Detached as **P** in the P column. I parsed the rendered table myself and cross-checked the Multi-Unit row, where UI=S, UC-E=A and EMI=A match the matrix [read]. But this is dedicated public parkland. Under the PA Donated or Dedicated Property Act (53 P.S. §§3381–3386), the City holds it in trust, and it can go to a private developer only if the Orphans' Court finds park use is no longer practicable [skimmed: [Babst Calland](https://www.babstcalland.com/news-article/commonwealth-court-finds-proposed-sale-of-unused-park-land-violates-the-ddpa/), [WeConservePA](https://library.weconservepa.org/guides/191-parks-in-perpetuity)]. |
| 0127B00001000000 | **Homewood Cemetery** · P · CEMETERY, 176 ac | 95.9 | by right ×1 | **70.4** | **Wrong.** An operating cemetery. |
| 0080R00001000002 | **Allegheny Cemetery** · P · CEMETERY, 300 ac | 84.3 | by right ×1 | **67.5** | **Wrong.** |
| 0002P00300000000 | Bluff · RIV-MU · County government, 4.2 ac | 99.9 | by right ×1 | **79.0**, #9 of 142,365 | The centroid (40.4347, −79.9936) matches the Allegheny County Jail at 950 Second Ave. I matched the location only and did not check an assessor record. Legal is correct (RIV-MU multi-unit P [read]), but the parcel is an operating jail. |
| 0171L00200000900 | Lincoln-Lemington · RIV-IMU · **R.R. used in operation**, 5.2 ac | 98.3 | by right ×1 | **75.8**, #12 citywide | **Wrong.** Active rail corridor. |
| 0015K00006000000 | Mt Washington · H · SFD, 75% steep, 100% landslide | 63.9 | ZA ×0.95 | 50.6 | **Hazard understated** (see above). H is ×0.95 for SFD only, and 2–4+ units are not permitted in H [read §911.02]. |
| 0138F00041000000 | Overbrook (Saw Mill Run) · NDI · vacant industrial | 77.3 "easy lot, no major hazards" | by right ×1 | 62.1 | **Label wrong.** 80% of the lot is SFHA. In FP-O, new residential construction must have its lowest floor at or above the regulatory flood elevation (§906.02.F) [read]. The flood-share placement along Saw Mill Run is plausible. |
| 0009E00102000000 | North Shore · RIV-NS · office tower | 78.8 "easy lot" | by right ×1 | 65.9 | Same labelling problem: 56% SFHA. |
| 0095A00168000500 | Overbrook · HC · vacant, 918 sf | 97.3 | border ×0.5 | 31.8 | HC permits no dwelling types [read §911.02]. The border status is geometrically true. |
| 0044S00100000001 | Marshall-Shadeland · GI · R.R. in operation | 96.2 | not permitted ×0.2 | 12.8 | The low result is right, but for the wrong reason: the parcel is rail, not just industrial. |
| 0004H00073000000 | South Shore · UI · County, **223 sf** | 96.3 | SE ×0.85 | **60.1** "good place to build" | **Wrong.** A 223 sf sliver. UI multi-unit is S [read]. |

**Hazard placement at known places checks out** [computed]:
- Highest mean steep share: Fineview .51, South Side Slopes .50, Spring Hill .50.
- Highest landslide-prone share: Polish Hill .95, Fineview .94.
- Undermined: Knoxville 1.0, Carrick .96, Brookline .93, Beechview .93.
- SFHA: North Shore .44, West End .41, Hays .37, Chateau .19.
- Floodway: West End .16.
- 18 of 20 City landslide-incident points lie within about 40 m of a 25%-slope polygon, and 10 of 20 fall inside City landslide-prone polygons.

The data layers look right. The problems are in how the layers are aggregated and labelled.

---

## 2. Systematic problems, ranked by impact

### 2.1 Places that are not development sites score as good or strong places to build (highest impact: credibility of the top of the list)

[computed]

| Group | n | Median overall | Share ≥60 |
|---|---|---|---|
| All parcels | 142,365 | 57.1 | 32% |
| Condo-coded parcels (CONDOMINIUM, CONDO UNIT/GARAGE/OFFICE/COMMON) | 5,282 | **63.2** | **75%** |
| Parks and cemeteries (parks.geojson share ≥0.5, PUBLIC PARK, CEMETERY, or City-owned in P) | 3,649 | 53.8 | 11% |
| Railroad in operation | 268 | 53.7 | 28% (p90 67.3) |
| Vacant-flagged parcels | 31,779 | **54.4** | 19% |
| Not-vacant parcels | 110,586 | 57.8 | 35% |

- **Condos are the best-scoring use class in the city.** The 5,282 condo parcels sit on only about 371 lots (grouped by the first 9 PIN characters). One lot has 328 units. 90% of condo parcels are under 1,000 sf.
- Parks and cemeteries have a low median, but the big, famous ones score highly: Frick Park 63.4, Homewood Cemetery 70.4, Allegheny Cemetery 67.5.
- **The tool ranks occupied land above vacant land.** Vacant parcels have a lower median than occupied ones. Office towers ("OFFICE-ELEVATOR 3+", median 67.0) and condos outrank vacant lots. For "where to build new housing" this is backwards: the tool is scoring location quality, not site availability.
- Among the top 25 parcels citywide are the County Jail site, 2 active rail parcels, and County/City parking and government parcels on the Bluff.

### 2.2 The Site pillar is compensatory and saturated, so labels say "easy lot" on hazardous land

[computed]
- 73% of parcels score ≥75, which is labelled "An easy lot to build on: no major physical hazards." The p10 is 63 and the p1 is 48.6.
- Outside the floodway gate, Site almost never goes below 50. With the weights 3/3/2/1/2/1, one hazard can remove at most its weight share (≤25 points), and the hazard-free indicators still contribute their full points.
- A lot that is 100% steep and 100% landslide-prone scores about 58, labelled "Mostly buildable, with minor site constraints." 13,073 parcels are ≥50% steep and ≥50% landslide-prone; their **median Site is 57.0**.
- A lot that is 80% SFHA scores 77, labelled "no major physical hazards."
- Ch. 906 turns these overlays into real procedural steps [read]:
  - SS-O: "all uses and structures … shall be reviewed and approved by the Planning Commission" (§906.08.C.1), with a public hearing and 21-day notice.
  - LS-O: a subsurface investigation plus plan approval by the Chief of Building Inspection (§906.04).
  - UM-O: a single-unit dwelling is allowed only with evidence of more than 100 ft of overburden. For anything "larger or heavier than a typical single-unit dwelling," development is prohibited until a site investigation shows the site is safe (§906.05.B.2–3).
  - FP-O: the lowest floor must be elevated.
- None of these steps reach the legal gate.

### 2.3 The legal gate fails open, and district coding ignores what the land actually is

- **Unknown districts get ×1.** OPR-B (77 parcels), SP-7 (3) and blank zoning (6) have no matrix row. `legalStatus` returns null, and `score.ts` then uses a multiplier of 1. These 86 parcels have a median of 61.8, and 64% score ≥60 [computed]. The gate should fail closed.
- **P district:** single-unit detached is by right, which is correct code reading [read]. Applied to 4,471 parcels at ×1, that includes Frick, Schenley and Highland Parks and the cemeteries. The legal gate is right; what is missing is a land-status gate (see 3.1).
- **H district (10,611 parcels, ×0.95):**
  - Single-unit detached is A, attached is S, and 2+ units are not permitted [read].
  - The matrix notes that any construction in H also triggers Site Plan Review.
  - H parcels are 59% vacant, with a mean steep share of 0.66 [computed].
  - A multiplier of ×0.95 treats H like a routine administrative approval. The H minimum lot size and maximum-disturbance rules are not captured [unverified: search snippets say density in H is controlled only by minimum lot size and height, with a maximum disturbance area instead of setbacks].
- **EMI (621 parcels, ×1):** single-unit detached is P and multi-unit is A. Development in practice follows the institution's master plan. These are campus buildings, not open sites [unverified for specific parcels].

### 2.4 The border exception is the default, and its evidence does not cover the districts it is applied to

[computed]
- 598 of 671 not-permitted parcels (89%) get the border code. 423 of 676 (by my recount) touch an allowed district within 10 m.
- 156 border parcels qualify only because the nearest "housing" district is **H (95) or P (61)**: a hillside greenway or a park boundary, not a residential edge that a rezoning would extend.
- If P, H and EMI are excluded as "allows housing":
  - 414 parcels are within 30 m of an allowed district.
  - 146 are 30–100 m away.
  - 116 are more than 100 m away.
- **The evidence cited for ×0.5 comes mostly from residential districts.** I examined the 30 housing-unit use variances in `zba-decisions.csv` [read]. About 22 are in R1/R2/H or other residential districts, mostly typology upgrades such as two-unit or attached units in R1D. Only these were in districts the tool codes as not permitted:
  - 1 GI case: a garage conversion, approved.
  - 2 P cases: a 160-unit building in Squirrel Hill, denied; senior housing in Fairywood, split-zoned P/R1D-L, approved.
  - 0 HC or RIV-GI cases.
  - (UI cases exist, but the tool codes UI as a special exception, not "not permitted.")
- "Council adopted all 42 rezonings since 2015" counts only rezonings that reached a vote, which were sponsored and pre-negotiated. That is not a base rate for a random GI parcel. Only 15 rezonings since 2015 raised by-right residential capacity citywide [read, `council-land-use-actions.md`].
- A ×0.5 multiplier means a 70-point GI parcel next to an H hillside scores 35, "a mixed case." That overstates the chance of legalizing housing there.

### 2.5 Three hazard indicators are miscalibrated

- **`site_recent_landslide_share` (weight 1) carries almost no signal.**
  - Only 0.2% of parcels have any "recent" hit, nearly all in South Shore. It fell inside 137 of 142,812 parcel centroids [computed].
  - 0 of the 20 City landslide-incident points fall in "recent"; 10 of 20 fall in the county's `old_or_redbed` class [computed].
  - The layer's `old_or_redbed` class covers 18,593 parcel centroids (13%) and is ignored.
- **`site_lead_line` (weight 1) can only penalize.**
  - The source contains only `lead` (11,954), `galvanized` (1,781) and `unknown` (6,104). There are no "not lead" records [read].
  - So the indicator is 0 or 40 for 23.5% of parcels and missing (renormalized away) for everyone else.
  - It matches to the nearest point within 30 m of the parcel centroid, not by address.
  - It describes the existing building's service line. New construction gets a new service tap regardless [unverified that PWSA requires a new tap for every new build, but a new building needs a new service connection].
- **`site_undermined_share` (weight 2) acts as a regional dummy.**
  - 29% of parcels are fully undermined: essentially all of Knoxville, Carrick, Brookline, Beechview, Banksville and Allentown [computed].
  - The hazard is real, and §906.05 matters most for multi-unit buildings [read].
  - But a flat 16.7-point deduction across the whole South Hills mostly encodes geography. It ignores overburden depth, which is the variable the code actually uses.

### 2.6 Lot size and shape are ignored

- `lot-dimensions.geojson` (Parcel_Width and Parcel_Len) is downloaded by `fetch-inputs.ts` but never used [read].
- 1,531 non-condo parcels are under 600 sf: 612 of them vacant land, 172 municipal. Their median overall is 58.7, and 41% score ≥60 [computed]. Example: the 223 sf sliver at 60.1.

### 2.7 4×4 sampling is fine for shares but unreliable for binary gates and odd-shaped lots

[computed; 10% sample, 14,264 parcels, 4×4 vs 12×12]

| Layer | Mean absolute error | Parcels off by ≥0.25 | "Any hit" disagrees |
|---|---|---|---|
| Slope | 0.032 | 92 | 915 (13% of hits) |
| SFHA | 0.0007 | — | 16 of ~190 |
| Floodway | 0.0004 | — | **7 of 47** (~15% of floodway-touching parcels flip the cap-20 gate) |
| Undermined | 0.0016 | — | 38 |

- 19,662 parcels (14%) have fewer than 6 of 16 grid points inside the polygon (thin, diagonal or L-shaped lots). 160 fall back to a single point.
- On a 450-acre park, 16 points are 400 m or more apart. That is fine for a share but meaningless for small features.

---

## 3. Recommended changes

Each item gives the change, the reason and the expected effect. The effects are my estimates from the counts above, not re-runs.

### 3.1 New gate: "not an available site" (parks, cemeteries, active rail)

- **Change.** Add `availability` gates to the `legal` block, or a sibling block, that multiply the overall score:
  - `parkland_or_cemetery`: parks.geojson share ≥0.5 (reusing the `overlap` source), or `usedesc` ∈ {PUBLIC PARK, CEMETERY/MONUMENTS}, or (`zon_new`=P and `OwnerCateg`=City). **×0.05**, label "Dedicated park or cemetery: not a development site (PA Donated or Dedicated Property Act)."
  - `active_rail`: `usedesc` = "R.R. - USED IN OPERATION". **×0.05**.
- **Reason.** Parkland diversion needs Orphans' Court approval (DDPA). Active rail is not developable. The zoning code alone cannot catch either, because P legitimately allows single-unit detached.
- **Effect.**
  - About 3,650 park/cemetery parcels and 268 rail parcels drop to near 0.
  - Frick Park, Homewood and Allegheny cemeteries, and 2 of the citywide top 25 leave the list.
  - The 860 private houses zoned P keep ×1, which is correct: they are lawful single-family lots.

### 3.2 New gate: condo units scored at the building lot, not per unit

- **Change.**
  - For `usedesc` ∈ {CONDOMINIUM, CONDOMINIUM UNIT, CONDO GARAGE UNITS, CONDOMINIUM OFFICE BUILDING}: return `null` for overall, or apply ×0.05, with the flag "Individual condo unit in an existing building."
  - Keep CONDOMINIUM COMMON PROPERTY and CONDO DEVELOPMENTAL LAND scored. Those are the actual lots.
  - Exclude condo units from any parcel-level percentile references.
- **Reason.** 5,282 unit parcels on about 371 lots, over-represented at the top (75% ≥60). Nobody can build on a 193 sf unit.
- **Effect.**
  - The "strong/good" band loses about 4,000 parcels.
  - The downtown, Shadyside and Lawrenceville hot spots stop being driven by stacked condo polygons.

### 3.3 Make Site non-compensatory: add caps and fix the labels

- **Change.** Add these gates to `pillars[site].gates`. `below` is on the normalized 0–100 value, so share s maps to 100·(1−s).

| Gate | Condition | Cap | Flag |
|---|---|---|---|
| Steep | steep share ≥0.75 (`site_steep_slope_share` below 26) | **50** | "Most of the lot is 25%+ slope: Planning Commission review (§906.08)" |
| Landslide-prone | landslide share ≥0.5 (below 51) | **55** | "Landslide-prone overlay: geotechnical study required (§906.04)" |
| Steep + landslide | both ≥0.5 (needs a compound-gate feature, or approximate with a 45 cap when both fire) | **45** | — |
| SFHA | SFHA share ≥0.5 (below 51) | **50** | "Mostly in the 100-year floodplain: elevate above base flood elevation (§906.02)" |
| Floodway | graded (replaces today's single gate) | share ≥0.5 → **cap 5**; 0 < share < 0.5 → **cap 40** | Partial: "Part of the lot is floodway; build only on the remainder" |

- Also key the "easy lot / no major physical hazards" label to *no hazard share >0.25*, not just score ≥75.
- **Reason.** A single serious hazard is a threshold condition that triggers a hearing or a geotechnical study. Healthy scores on other indicators should not average it away.
- **Effect** [computed with a similar rule set]:
  - About 30,000–35,000 parcels get capped.
  - The "Real site constraints" band grows from about 5,300 to roughly 25,000 parcels.
  - Fineview, Polish Hill, Spring Hill and South Side Slopes hillside lots move from "minor constraints" to "real constraints."
  - The overall score changes only modestly (site is 1/5 of a geometric mean), so rank stability should hold.

### 3.4 Legal gate: fail closed, reprice H, and move overlay procedures into the pathway

- **Unknown district.** Add level `{code: 8, id: "unknown", multiplier: 0.8}`. In the builder, map `unknown` and missing `zon_new` to it instead of `null`. **Effect:** the 86 OPR-B, SP-7 and blank parcels stop getting a free ×1. Better still, fill in OPR-B from §908.03 (not done in `special-districts.md`). Note that pending Bill 2026-0834 would remove the Oakland Public Realm [read, `special-districts.md`].
- **H district.** Use **×0.85** instead of ×0.95. Reasons:
  - Single-unit detached only, as an Administrator Exception.
  - Every H construction triggers Site Plan Review.
  - The disturbance and minimum-lot controls are unmodelled.
  - Evidence is small: 3 H housing-unit ZBA cases, 1 denied [read].
  - **Effect:** 10,611 parcels lose about 10% of their overall score. Most are hillside greenways.
- **Overlay pathway bump** (optional; stronger than 3.3).
  - If steep share ≥0.5, treat the easiest pathway as at least Planning Commission review, i.e. `min(current multiplier, 0.85)`, flagged "SS-O hearing."
  - If undermined, and the best legal pathway depends on multi-unit (RM/LNC/etc.), add the note "Multi-unit needs a mine investigation first (§906.05.B.3)." Keep it as a note, not a multiplier; overburden depth is unknown.
  - **Caveat:** I did not verify how the Zoning Administrator applies SS-O to lots that are only partly steep. Confirm before adopting this as a multiplier.
- **per_plan (RP/AP).** Keep ×0.9. There is no evidence to move it.

### 3.5 Border exception: define "allows housing" properly, tighten the distance, lower the reward

- **Changes:**
  1. Build the allowed-boundary set only from districts whose best pathway for **2+ units or attached** is by right or ZA. That excludes **P, H and EMI**, whose only by-right or ZA dwelling type is single-unit detached on park, hillside or campus land.
  2. `border_m`: **100 → 30.** That means abutting or across one street. A map amendment extends a contiguous district, and 100 m spans rivers and highways.
  3. `not_permitted_border`: **×0.5 → ×0.35**. Keep `not_permitted` at ×0.2.
- **Reason.**
  - The cited 73% use-variance approval rate comes almost entirely from residential districts. There is n≈1 for GI and 0 for HC/RIV-GI.
  - The rezoning record is conditional on reaching a vote.
  - Border status should mean "a residential edge you could plausibly extend," not "near any line."
- **Effect.**
  - Border parcels drop from 598 to about 414.
  - Those remaining border parcels move from a median of about 27.5 to about 19.
  - The ordering stays by right > ZA > SE > CU > per plan > border > not permitted, with a clearer gap between "border" and anything approvable.
- The multipliers are value judgments. The UI slider already lets users override them.

### 3.6 Re-weight or replace the weak hazard indicators

- **`site_recent_landslide_share`.** Change `where.class` from `"recent"` to `["recent","old_or_redbed"]` and keep weight 1. Or drop it to weight 0. **Effect:** it goes from a 0.2%-coverage constant to a real signal over about 13% of parcels, and it catches half of the City's recorded incidents instead of none. The county layer's vintage is unverified, so keep the weight low.
- **`site_lead_line`.** Weight **1 → 0**, and show it as a flag only ("existing lead or galvanized line; matters for rehab, not new construction"). **Effect:** removes a one-sided −4 to −8 point penalty on 23.5% of parcels, concentrated in older dense neighborhoods.
- **`site_undermined_share`.** Weight **2 → 1**, plus a flag citing §906.05. **Effect:** the South Hills regional penalty halves, from about −16.7 to about −9 Site points. If the mined-out-areas layer can support seam or depth later, use that instead.

### 3.7 Add lot size and shape (data already fetched)

- **Change.** New indicator `site_lot_size`: `table` source joined on pin from `lot-dimensions.geojson`, or `Shape__Area`.
  - Normalize linearly from zero at 600 sf to full at 2,400 sf. Weight 2.
  - Add a gate: area < 600 sf and not a condo → cap Site at 30, flag "Too small to build alone; assemble with neighbors (side-lot program)."
  - Optionally add width < 16 ft.
- **Reason.** Unbuildable slivers currently score "good."
- **Effect.** About 1,500 slivers drop. Rowhouse lots of 800–1,000 sf (South Side) are only mildly affected. Check the thresholds against §903.03 minimum lot sizes. I did not verify the per-district values.

### 3.8 Site availability: flag it, don't multiply

- **Change.** Keep "good location" and "available site" separate. Add a displayed `availability` tag:
  - Vacant land, vacant commercial or industrial land, parking lots, and City/URA/County/HACP land → "available or underused."
  - Occupied residential → "existing home."
  - EMI/jail/school/government facilities → "active institution."
- Make the map's default ranking filter show available and underused parcels. Do not multiply the score.
- **Reason.** The brief asks for "a good place to build." Occupied parcels are valid redevelopment candidates, but vacant and public parcels are where housing actually gets built first. Today vacant land ranks *below* occupied land (median 54.4 vs 57.8).
- **Effect.** The top of the default list turns into vacant and public parcels like 0124N00365 (Larimer URA) and 0175H00123 (Homewood City lot), instead of the jail and office towers.

### 3.9 Sampling

- **Change.**
  - Use an adaptive grid in `samplePoints`: n=4 by default; n=8 when fewer than 8 of 16 points land inside the polygon or when area exceeds 1 acre.
  - Evaluate floodway and SFHA at n=8 for parcels within about 100 m of a flood polygon.
- **Reason.** Shares are fine at 4×4 (slope MAE 0.03), but the binary floodway gate flips for about 15% of floodway-touching parcels, and 14% of parcels have fewer than 6 interior points.
- **Effect.** The build is slower only for about 20% of parcels. Gate decisions become stable.

---

## 4. Summary of confidence

| Level | Findings |
|---|---|
| High | Condo, park, cemetery and rail over-scoring; Site saturation and labels; fail-open unknown districts; border set includes P/H; recent-landslide layer is near-empty; lead indicator is penalty-only. All computed on the repo's data. |
| Medium | Magnitude of the proposed multipliers (value judgments); the H multiplier; lot-size thresholds. |
| Unverified | How SS-O is applied to partly steep lots; H minimum lot size; that 0002P00300 is the jail (location match only); the vintage of the county "recent" landslide class. |
