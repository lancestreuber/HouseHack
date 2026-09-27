# Round 1 review: Access, Climate & Environment, Overall aggregation

Reviewer lens: Access to Opportunity, Climate & Environment, the overall score (weighted geometric mean, then × legal multiplier).
Config reviewed: `apps/web/src/lib/pillars/pillars.config.json` version `2026-09-26.11`. Scores come from `public/data/pillars/parcels/*` rescored with `score.ts`, covering all 142,365 City parcels. No code or config was edited.

Evidence tags: **[read]** means I read the source or computed the number myself this session. **[skimmed]** means I only saw a search-result summary or snippet. **[unverified]** means from memory or not checked.

Note on diagnostics: the brief said Access and Climate correlate at −0.53. In the current build (`diagnostics.ts`, run today) they correlate at **+0.32** [read]. The sub-scores tell the real story: access–carbon r = **+0.78**, access–local_env r = **−0.66**, carbon–local_env r = **−0.60** [read]. The Climate pillar averages two anti-correlated halves, so it comes out nearly flat.

---

## 1. Per-parcel table

Columns: A = Access, C = Climate, carb/env = sub-scores, O = overall (after legal). "Strict grocery" is the distance to the nearest *current SNAP-authorized Supermarket or Super Store*, which I recomputed (see §2, P1). WS/TS = Walk Score / Transit Score for the neighborhood. I use them as a sanity check, not as ground truth.

| PIN | Hood | A | Transit raw (norm) | Grocery m (norm) → strict m | C | carb / env | Key env drivers (norm) | O | Our phrase (A / C / env) | Reality verdict | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 0052L00036050100 | Squirrel Hill N | 84 | 3600 (90) | 815 (79) → 1124 | 53 | 72 / 34 | traffic 14, PM 24, canopy 0, surface heat **80 (cool)** | 71 | "Everything is close" / "Trade-offs" / **"Poor air quality and hot, paved surroundings"** | Access OK (WS 69/TS 62). The env phrase is **wrong on heat**: this parcel is in the coolest 20% by surface heat. The phrase is fixed text, not built from the parcel's actual drivers | WS [read] |
| 0174K00352000000 | Homewood South | 88 | 2290 (73) | 638 (88) → 640 | 62 | 85 / 40 | PM 8, RSEI 40, industrial 96 | 57 | "Everything is close" / "Mostly good on carbon and environment" | **Access over-scored** (WS 63). Homewood is widely described as a food desert. The nearest "grocery" is Fresh International Market (SNAP "Supermarket"); I could not confirm its size. "Mostly good" hides env = 40 | [Vice](https://www.vice.com/en/article/this-neighborhood-without-a-grocery-store-for-40-years-is-changing-how-it-gets-good-food/) [skimmed]; WS [read] |
| 0049J00089040900 | Lower Lawrenceville | 86 | 2060 (69) | 1010 (69) → 1106 | 58 | 92 / 24 | surface heat 10, traffic 7, canopy 0 | 66 | "Everything is close" / "Mostly good" / "Poor air…hot, paved" | Plausible. Flat river-bottom rooftops are hot, and the heat phrase fits here | WS 86/62 [read] |
| 0002A00127110800 | Downtown | 97 | 14000 (100) | 93 (100) | 58 | 85 / 30 | traffic 1, **industrial 6** | 71 | "Everything is close" / "Mostly good" | Access correct. Industrial = 6 comes from gas-fired district-energy boilers and an asphalt plant, which score *worse* than Hays and Lincoln Place beside the Mon Valley mills (§2, P2) | ACHD CSV [read] |
| 0056C00129000000 | Hazelwood | 70 | 559 (16) | 590 (**90**) → 1240 | 65 | 74 / 55 | canopy 50, heat cool, PM 19 | 48 | "Good access to daily needs" | **Grocery wrong**: the matched store is "Hazelwood Market of Pittsburgh" (SNAP *Convenience Store*), and "Community Kitchen Pittsburgh" (a nonprofit kitchen) is also tagged full_grocery. Hazelwood has had no grocery store for decades | [PublicSource 2024](https://www.publicsource.org/hazelwood-grocery-store-co-op-plan-food-desert/), [New Pgh Courier 2024](https://newpittsburghcourier.com/2024/07/18/facing-a-worsening-food-desert-hazelwood-residents-may-finally-get-the-grocery-store-theyve-sought/) [skimmed] |
| 0056B00028000000 | Hazelwood | 73 | 897 (32) | 370 (100) → 1591 | 46 | 48 / 44 | industrial 50 | 61 | "Good access" | Same phantom grocery. WS for Hazelwood is 42 | same |
| 0035N00192000000 | Beechview | 72 | 670 (22) | 473 (96) → 471 | 60 | 63 / 58 | — | 55 | "Good access" | Reasonable (WS 71 for Beechview [unverified]; not in my fetched list) | — |
| 0004L00301000000 | Mount Washington | 85 | 2500 (77) | 533 (93) | 68 | 97 / 39 | traffic 2, industrial 17 | 57 | "Everything is close" | **Slightly high.** 44% of its transit weight comes from stops in South Shore/South Side Flats, **below the bluff** (reachable only by incline or long stairs). WS 68 / TS 70 | WS [read]; stop decomposition [read] |
| 0004P00222000000 | Mount Washington | 83 | 1920 (67) | 589 (91) | 66 | 95 / 37 | — | 57 | "Everything is close" | Slightly high. Its grocery (Mt Washington Foodland, SNAP Super Store) is real | [read] |
| 0012F00071000000 | South Side Flats | 94 | 2540 (77) | 152 (100) | 55 | 91 / 19 | surface heat 1, industrial 4 | 68 | "Everything is close" / "Poor air…hot, paved" | Access correct (WS 93). Hottest-surface area is plausible. Industrial 4 again reflects small gas boilers and asphalt, not heavy industry | [read] |
| 0083B00066000000 | East Liberty | 89 | 2690 (80) | 659 (87) → 947 | 60 | 93 / 26 | heat 19 | 62 | "Everything is close" | Correct (WS 82) | [read] |
| 0052D00141001100 | Shadyside | 89 | 3950 (92) | 540 (93) | 59 | 95 / 23 | heat 11, traffic 15 | 68 | "Everything is close" | Correct | [read] |
| 0096C00022000000 | Brookline | 59 | 659 (21) | 1070 (67) → 1334 | 55 | 50 / 61 | — | 54 | "Good access" | Slightly **under**-scored against WS 56 in rank terms (Brookline Blvd is a real main street). Our Access has no restaurants or retail (§2, P4) | WS [read] |
| 0124N00365000000 | Larimer | 87 | 1830 (65) | 189 (100) → 856 | 63 | 86 / 39 | — | 63 | "Everything is close" | Grocery at 189 m is "La Grocery West Indian" (a small grocer). The true supermarket is 856 m away (East Liberty), so still reasonable | [read] |
| 0138E00098000000 | Overbrook | 64 | 576 (17) | 645 (88) → 1399 | 55 | 44 / 66 | canopy 63 | 37 | "Good access" | Grocery is optimistic. Overbrook is car-oriented (WS 36) | WS [read] |
| 0075F00310000000 | Marshall-Shadeland (RIV-GI, county-owned) | 68 | 640 | 489 → 1346 | 55 | **n/a** / 55 | Afford & carbon missing | **14** (pre-legal **71**) | "Hard place" | Legal ×0.2 correctly buries it. But pre-legal 71 is top-1% citywide **because two pillars are missing and the weights renormalize** (§2, P5) | [read] |
| 0045N00357000000 | Marshall-Shadeland (GI) | 61 | 733 | 676 → 775 | 41 | n/a / 41 | heat 19 | 31 (pre 62) | "Hard place" | Same missing-pillar inflation | [read] |
| 0047K00076000000 | Spring Hill–City View | 72 | 730 (24) | 712 (84) → 1694 | 61 | 82 / 40 | — | 49 | "Good access" | Grocery optimistic. WS 42 | WS [read] |
| 0023D00191000000 | Fineview | 74 | 936 (33) | 1140 (63) | 69 | 91 / 47 | — | 57 | "Good access" | **Over-scored** (WS 37). **75% of transit weight comes from valley stops** (Central Northside, Allegheny Center, East Allegheny) at the foot of a steep hillside | WS [read]; stop decomposition [read] |
| 0013M00202000000 | Arlington | 63 | 677 (22) | 1110 (64) | 60 | 74 / 47 | industrial 25 | 49 | "Good access" | Roughly right (WS 51). 62% of transit weight is from South Side Slopes stops; slope separation is likely but unconfirmed | [read] |
| 0015L00040000000 | Beltzhoover | 83 | 2920 (84) | 626 (89) → 1298 | 61 | 73 / 50 | — | 53 | "Everything is close" | **Over-scored**. Of all neighborhoods, the biggest rank gap vs WS (+40 pct-pts; WS 39, TS 64). Nearest "grocery" is "Schwartz's Supermarket #3, 800 Warrington" (ACHD permit only, *not* SNAP-authorized, probably stale). USDA FARA 2025 flags its tract (562400) as low-income/low-access | WS [read]; FARA overlay [read] |
| 0042D00038000000 | Esplen | 70 | 801 (28) | 389 (100) | 56 | 66 / 46 | PM 66, industrial 44 | 49 | "Good access" | Somewhat high (WS n/a for Esplen). Neville Island industry sits 2–4 km away, across the Ohio | [read] |
| 0071L00216000000 | Chartiers City | 56 | 739 (25) | 1480 (46) | 50 | 46 / 54 | PM 78, industrial 65 | 55 | "Good access" (≥55) | Roughly right; the phrase is generous | [read] |
| 0070E00044000000 | Fairywood | 39 | 331 (8) | 1150 (63) | 53 | 46 / 59 | industrial 88 | 56 | "Some needs are walkable" | Correct (WS 23) | WS [read] |
| 0135D00022000000 | Hays | 19 | 221 (5) | 2240 (8) | 54 | 48 / 59 | **industrial 72 (good)**, PM 24 | 42 | "Car-dependent" / env "A fairly healthy local environment" | Access **correct** (WS 4). Env is **too kind**: Hays is the City's closest point to the Mon Valley mills (Irvin ~4 km, Edgar Thomson ~6 km, Clairton ~11 km). The 5 km cutoff gives Clairton zero weight | [Allegheny Front](https://www.alleghenyfront.org/inversions-air-pollution-allegheny-county-pittsburgh-clairton-coke-works/), [GASP](https://www.gasp-pgh.org/clairton-coke-works) [skimmed] |
| 0091G00376000000 | New Homestead | 33 | 0 (0) | 1490 (46) | 44 | 31 / 58 | industrial 75 (good) | 47 | "Car-dependent" | Access correct (WS 6). Industrial understated for the same reason | same |
| 0133P00055000000 | Lincoln Place | 45 | 278 (7) | 933 (73) → 1762 | 36 | 32 / 40 | PM 14, industrial 22 | 47 | "Some needs walkable" / "Trade-offs" | Climate **roughly right** (Irvin Works within 5 km). Grocery optimistic: the strict supermarket is 1.8 km away | WS 30 [read] |

**Citywide check** [read]: neighborhood-median Access vs Walk Score has Spearman ρ = **0.85**, and vs Transit Score **0.87**. That is good agreement. The misses are systematic, not random:
- **Over-scored**: Beltzhoover (+40 rank-pct), Lincoln-Lemington (+28), Perry South (+26), Glen Hazel (+24), Homewood W/S (+22/23), Fineview (+23), Allentown (+23), Knoxville (+19), Hazelwood (+15). These are disinvested and/or hilltop places.
- **Under-scored**: Regent Square (−47), Upper Lawrenceville (−33), Brookline (−31), South Oakland (−26), Troy Hill (−22). These are places with real commercial main streets.

Walk Score's reference list: <https://www.walkscore.com/PA/Pittsburgh> [read, via WebFetch summary].

---

## 2. Systematic problems, ranked by impact

### P1. The grocery layer counts convenience stores, defunct stores and non-stores as "full grocery" (high impact on Access)
`places-groceries.geojson`, tier `full_grocery`, has 346 records [read]:
- ~95 have `snap_type = null`, meaning they are ACHD permits only and not currently SNAP-authorized. These include obviously dead or non-grocery rows: **Blockbuster Video (6401 Penn), Hollywood Video #038303, Eckerd Drug, Ames #543, "Test Client 04292019", "Golden Triangle News/Condom Na", Dollar Max, Dollar Tree, Party Cake Shop, Community Kitchen Pittsburgh**.
- It also includes SNAP "Convenience Store" (e.g., "Hazelwood Market of Pittsburgh") and "Other" (Family Dollar, Dollar General).

Grocery has weight 2 of 14.5 in Access.

**Measured effect of restricting to SNAP `Super Store` + `Supermarket` (160 stores)** [read, my recomputation, straight-line]: 26% of City parcels lose ≥30 grocery points. Neighborhood medians: Hazelwood 100→43, West End 100→32, Elliott 92→27, Central/North Oakland 100→39/40, Manchester 99→45, Beltzhoover 93→51, Allentown 94→47, Troy Hill 86→49. Each of these is a place with a known supermarket gap. The Hill District correctly already has none: Salem's closed in Feb 2025 ([WESA](https://www.wesanews.org/economy-business/2025-02-19/pittsburgh-hill-district-salems-market-closure) [skimmed]).

### P2. Industrial emissions indicator is inverted relative to the real industrial burden (high impact on Climate/local_env)
`climate_industrial_emissions` sums `criteria_tpy` (mostly NOx/CO/SO₂) with a linear fade from 1 km to 5 km.
- The county's dominant source, **U.S. Steel Clairton (8,859 tpy)**, is 8–11 km from Lincoln Place, New Homestead and Hays, so it contributes **zero to every City parcel**.
- Downtown, the Hill, the Bluff and the South Side instead rank worst (norm 2–7). The drivers there are Energy Center Pittsburgh (70 t), Cordia (56 t), the Bellefield boiler (63 t), Lindy Paving 2nd Ave (63 t) and Metaltech. These are gas boilers and an asphalt plant.
- Hays (72), New Homestead (75) and Glen Hazel (72) score as *clean*.

I recomputed alternatives [read]:

| Hood | current (norm) | PM2.5 tpy, 1→10 km | criteria, 2→15 km |
|---|---|---|---|
| Hays | 73 | **2** | 2 |
| New Homestead | 75 | **2** | 2 |
| Glen Hazel | 72 | 3 | 2 |
| Lincoln Place | 3 | 1 | 1 |
| Hazelwood | 58 | 6 | 4 |
| Downtown | 7 | 34 | 66 |
| Crawford-Roberts | 2 | 55 | 56 |
| Fairywood | 89 | 81 | 96 |

The file's own caveat notes NRG Cheswick may have retired in 2022 [unverified]; it is >10 km from the City in any case.

### P3. The Climate pillar is near-constant, and its phrases hide the trade-off (high impact on usefulness)
- Carbon and local_env correlate at −0.60, so the pillar lands at p10–p90 **51–67** (sd 6.6, vs 11–13 for the other pillars). 78% of parcels get "Mostly good on carbon and environment." [read]
- Climate correlates with overall at only **r = 0.09**, so it barely affects rankings [read].
- **Nobody** gets local_env ≥ 75, and 33.5% get "Poor air quality and hot, paved surroundings" even when heat is their *best* indicator (Squirrel Hill N example).
- Carbon (HUD VMT, tract, 2012–16 inputs) correlates **0.78** with Access. Location efficiency is effectively counted about 1.4 times.
- `climate_traffic_combustion` (weight 2) and PM2.5 are county-re-ranked block-group percentiles. They behave as density proxies: city medians are 15 and 36.
- Tree canopy is a single 30 m pixel at the centroid, and ≥25% of parcels read exactly 0.

### P4. Access rewards civic services but not commerce, and uses generous straight-line decays (medium)
- Parks have p10 = 94, so the indicator carries almost no information (r with pillar 0.11). Health has median 95.
- 51% of parcels get "Everything is close: transit, groceries, health care and services."
- The over-scored neighborhoods (P1 list) have schools, rec centers, pantries, senior centers and child care, but no shops or restaurants.
- WPRDC `commerce-density.geojson` has 9,411 restaurants and 1,877 shops. Its 800 m decay count alone matches Walk Score better (ρ 0.90) than our full Access (0.85). Blending it in at weight 3 lifts Access to ρ 0.90 [read, 15k-parcel sample].

### P5. Missing pillars inflate the overall score (medium; it tops the leaderboard)
Missing pillars are dropped and the weights renormalized. The **top 11 parcels in the City are Bluff (Duquesne campus) parcels missing Demand and Afford**, scoring ~80. Only Site/Access/Climate remain, and those are all high there.
- 449 parcels are affected. Their median pre-legal score is 60.7 vs 57.5 for all parcels [read].
- Industrial riverfront parcels also reach pre-legal 62–71 this way.

### P6. The legal multiplier has outsized rank effects on a compressed scale (medium)
The overall score spans roughly 49–65 at p10–p90, so a multiplier moves rank far more than its size suggests [read]:

| Legal level | Multiplier | Median rank drop |
|---|---|---|
| Zoning Administrator approval | ×0.95 | **13 percentile points** |
| Per plan | ×0.9 | **28** |
| Special exception | ×0.85 | **39** |
| Not permitted, borders a housing district | ×0.5 | 35 |

A special exception with a 90% approval rate costs more rank than being next to a housing district, and more than any realistic swing in a single pillar.

### P7. Overall is too compressed for its phrases (medium; display)
- Pre-legal p10–p90 is **49–65**, sd 6.1.
- **0.0%** of parcels reach 75 ("A strong place to build"), while 62% get "A good place to build, with some trade-offs."

This is structural, not a bug. Averaging five pillars that barely correlate with each other shrinks the spread by roughly √5. Weight changes do not fix it: arithmetic mean gives 53–68, and carbon at 0.5 gives 49–63 [read, simulated].

### P8. Straight-line distance misleads on hills (medium locally, low citywide)
Transit decomposition [read]:
- Mount Washington (near the bluff): 44% of transit weight comes from stops below the cliff.
- Fineview: 75% from valley stops.
- Arlington: 62% from South Side Slopes stops.

The same applies to groceries on hilltops (Fineview, Spring Hill, Troy Hill). Transit also sums *every* stop within 800 m, counting both directions of each route and repeat stops along the same route. That rewards stop density on long straight corridors rather than route frequency. Busway stations are coded BUS (weight 1), but their high trip counts partly offset this.

---

## 3. Recommended changes (config-level unless marked "build")

1. **Grocery filter (P1).** Change `access_grocery.source.where` to `{"tier":"full_grocery","snap_type":["Super Store","Supermarket"]}`. Add `access_small_grocer` (same file, `snap_type:["Grocery Store"]`, weight 0.5, same 400/2400 decay) so ethnic and small markets still count, but less.
   - *Why:* it removes stale ACHD rows and convenience/dollar stores. `matches()` already supports arrays, so this is config only.
   - *Expected:* 26% of parcels lose ≥30 grocery points. Hazelwood, Beltzhoover, West End, Oakland and Manchester Access drops about 4–8 points, closing most of the Walk Score rank gap for those places.
   - *Separately:* ask the data owner to delete the Blockbuster/Hollywood/Eckerd/Ames/"Test Client" rows from the merged food file.

2. **Industrial emissions (P2).** Set `property: "pm25_total_tpy"`, `full_m: 1000`, `zero_m: 10000`. Optionally add a second indicator on `hap_tpy` with the same decay, weight 0.5.
   - *Why:* primary PM2.5 and HAPs, not boiler NOx, drive health harm. Clairton/Irvin/ET plumes reach the SE City edge, especially during inversions ([Allegheny Front](https://www.alleghenyfront.org/inversions-air-pollution-allegheny-county-pittsburgh-clairton-coke-works/) [skimmed]).
   - *Expected:* Hays, New Homestead and Glen Hazel go from about 72–75 to 2–3; Downtown and the Hill go from 2–7 to 34–55.
   - Keep the caveat that these are emissions, not exposure.

3. **Show city percentile ranks and re-bin phrases on them (P7, P3).** Keep the 0–100 score, but *display* "better than X% of City parcels" for overall and each pillar. Drive phrases from the percentile: top 10% "among the strongest sites in the City", 60–90 "above average", 30–60 "mixed", bottom 30% "hard". Build the Climate and local_env phrases from the sub-scores and the two lowest indicators, e.g. "Low driving, but heavy traffic air and little tree cover" instead of fixed text.
   - *Why:* 0% of parcels can reach the top overall phrase, and the local_env phrase asserts heat that isn't there.
   - *Expected:* no change to rankings; the output becomes readable and honest.

4. **Require all five pillars for an overall score (P5).** Add `overall.min_pillars: 5`. If a pillar is missing, show "incomplete". Alternatively impute the City median for the missing pillar and flag it.
   - *Expected:* the Bluff campus parcels leave the top of the list; 449 parcels are affected.

5. **Re-calibrate the legal multiplier to rank space (P6).** Either (a) apply the multiplier to the *percentile* score, or (b) soften the raw multipliers to ZA 0.98, special exception 0.94, per_plan 0.96, keeping border 0.5 and not_permitted 0.2.
   - *Why:* ×0.85 on a 49–65 scale currently costs about 39 rank points for a process with a 90% approval rate.
   - *Expected:* ZA and special-exception parcels fall about 5 and 15 rank points instead of 13 and 39.

6. **Add commerce to Access (P4).** New `access_commerce`: `decay_sum` over `commerce-density.geojson` (value = 1 per point), full 400 m, zero 800 m, percentile vs parcels, weight 3.
   - *Expected:* Access vs Walk Score ρ rises from 0.85 to 0.90. Regent Square, Brookline and Upper Lawrenceville rise; civic-only areas fall.

7. **Tighten decays for ubiquitous amenities (P4).**
   - `access_park`: full 200, zero 1200 (or weight 0.5).
   - `access_health`: full 400, zero 2400.
   - Consider a 1.3× straight-line circuity factor for all walking distances (build: multiply before normalizing) [circuity figure unverified from literature memory; ~1.2–1.4 is the typical urban range].
   - *Expected:* parks and health start to discriminate. The share of "Everything is close" falls from 51% (exact effect not simulated).

8. **Reduce the density double-count inside Climate (P3).**
   - Set `climate_traffic_combustion` weight 2→1.
   - Replace centroid-pixel canopy with a 100 m buffer mean or the block-group canopy already in `inputs/allegheny_bg_canopy_impervious_lst.csv`.
   - *Build:* add a parcel-level "within 150 m of a limited-access highway" penalty. That captures near-road exposure sharply instead of through block-group percentiles.
   - Do **not** cut carbon's weight. Carbon is the brief's named axis for this pillar, and a carbon weight of 0.5 only moves overall ρ to 0.989 while turning climate–access negative [read, simulated].
   - *Expected:* local_env becomes less of an "anti-city" score. There is little change to the overall ranking.

9. **Hill-aware distances (P8, build).** Use a pedestrian network (OSM foot graph) for transit and grocery at minimum. As a cheaper proxy, drop a stop's contribution when the DEM elevation difference is over 40 m unless an incline or public stair connects them.
   - *Expected:* Fineview, Mount Washington's bluff-edge parcels and Arlington lose about 5–15 transit points.

10. **Transit: route-level deduplication (build).** For each route and direction, count only the nearest stop within 800 m (Transit Score style) instead of every stop.
   - *Expected:* corridor-adjacent parcels are no longer over-rewarded. Stop density stops substituting for frequency.

---

### Scratch artifacts
My working files are in the session scratchpad at `ac-review/` (rows.json, groc.json, ws.txt). None of them are in the repo.
