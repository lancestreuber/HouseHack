# Housing types (sub-typologies): design

**Status:** proposal, 2026-09-26. Builds on the five pillars already live on `lance-map-data` and on Rishit's `TRACK3-SCORING-PLAN.md` (gate × ratings, per-type ranking). Nothing here is built yet.

## TL;DR

- **Two levels.** 5 families that the user sees first, with 13 sub-types underneath. Each sub-type maps to exact rows of the City use table (§911.02), so its legality is read, not guessed.
- **A sub-type is a profile, not a new model.** The parcel's 42 measured indicators stay the same. A sub-type changes only four things:
  1. which legal pathway gates it;
  2. whether it physically fits the lot;
  3. how its indicators are weighted (e.g., senior housing weights clinics, transit and flat ground up and schools down);
  4. a small deterministic carbon adjustment.

  The scorer already accepts weight overrides, so a profile is just a named override set in `pillars.config.json`. It stays fully open-weight.
- **The output for a clicked parcel is a ranked list of sub-types.** Each shows a score, its legal pathway (with ZBA approval rate and n), top reasons, and a "compare" button. This is the brief's "compare at least two housing scenarios for a real place".
- **Data readiness: good.** We already have legal pathways for all 16 matrix types, ZBA rates for pooled groups, and demographics for demand (65+, under 18, living alone, renters, household size). We also have existing senior and group sites (124), permits by type, and lot area and width.

## 1. The type tree

| Family | Sub-type (UI label) | `id` | Use-table rows (`matrix typology`) | Notes |
|---|---|---|---|---|
| **Houses** | Detached house | `detached` | `single_detached` | |
| | House + ADU | `adu` | none today | Not permitted anywhere; shown greyed with "Bill 2025-1545 pending". Toggle for the reform scenario (Rishit §10). |
| **Missing middle** | Townhouse / rowhouse | `townhouse` | `single_attached` | |
| | Duplex | `duplex` | `two_unit` | |
| | Triplex | `triplex` | `three_unit` | |
| | Fourplex | `fourplex` | `multi_unit` | Four units already counts as "Multi-Unit" in the code. |
| **Apartments** | Small apartment (5–19 units) | `apt_small` | `multi_unit` | |
| | Large apartment (20+ units) | `apt_large` | `multi_unit` | Inclusionary zoning (IZ-O) applies in 4 neighborhoods; flag it. |
| **Senior & supportive** | Senior apartments (independent) | `senior_apts` | `elderly_limited`, `elderly_general` | Limited vs General depends on size (thresholds in `use-definitions.csv`); pick by unit count. |
| | Assisted living | `assisted_living` | `assisted_living_a/b/c` | Class depends on residents; default to the class matching the unit count. |
| | Personal care home | `personal_care` | `personal_care_small/large` | |
| **Group & special** | Group / community home | `group_home` | `community_home` | Federal fair-housing rules (FHA) limit how the City can treat these. Show a note and don't penalize demand. |
| | SRO / co-living (multi-suite) | `sro` | `multi_suite_limited/general` | |

We deliberately leave `interim_housing` (shelters) out of the ranker. Its matrix column is 16 `unknown` of 57, and siting shelters is a different decision process.

**The UI shows 6 headline sub-types by default:** detached, townhouse, duplex, triplex/fourplex, small apartment, and senior apartments. The rest sit in a "More housing types" drawer, which keeps the demo readable (Rishit's plan: "five is the most a panel can carry").

## 2. What a sub-type changes

```
score(parcel, type) = gate(type) × fit(type) × blend over pillars( pillar scores recomputed with type's indicator weights ) + carbon modifier
```

### 2a. Legal gate (per type, replaces the "easiest mainstream type" gate)
- Pathway = the matrix cell for `zon_new` × that type's rows. Use the easiest row if a sub-type maps to several.
- Same multipliers as now: by right 1, ZA 0.95, special exception 0.85, conditional use 0.8, not permitted but on a district border 0.5, not permitted 0.2. These live in the config's `legal` block and can be edited.
- Show the ZBA approval rate that applies, with its n:
  - senior/elderly and assisted living/personal care use the feasibility session's pooled groups;
  - "not permitted" uses the citywide use-variance rate (73%, n=30).
- Housing types become greyed rows, not hidden, so "why not a fourplex here?" has a visible answer.

### 2b. Physical fit (per type, deterministic)
- **Inputs:** lot area (`Shape__Area`) and lot width and depth (`Parcel_Width`/`Parcel_Len`, 105k residential lots), the district minimum lot size (§903.03: VL 6,000 / L 3,000 / M 2,400 / H 1,200 / VH none), and the steep-slope share.
- **Assumed minimums per type,** labeled *assumption* until checked:

| Type | Min lot area (assumed) | Min width (assumed) |
|---|---|---|
| detached | district minimum | 25 ft |
| townhouse | 1,200 sq ft per unit | 16 ft |
| duplex / triplex / fourplex | 2,400 / 3,200 / 4,000 sq ft | 25 / 30 / 35 ft |
| small apartment | 5,000 sq ft | 50 ft |
| large apartment | 15,000 sq ft | 100 ft |
| senior apartments / assisted living | 10,000 sq ft | 60 ft |
| personal care small / group home | district minimum | 25 ft |

- **Fit multiplier:** 1 if both minimums are met. A graded 0.5–0.9 applies if the lot is within 25% of a minimum, since an undersized lot can go to a variance or be assembled with a neighbour. It's 0.3 below that.
- **Senior types:** the steep-slope penalty doubles for `senior_apts`, `assisted_living` and `personal_care` (accessibility).
- **Where Jev fits (Rishit's plan):** this is the step where Jev's bounded "site fit" adjustment of ±0.2 on the multiplier has value. It can reason about narrow hillside lots, corner lots and adjacent row houses, with cited facts. The deterministic number is the fallback.

### 2c. Indicator weight profiles (per type)

A profile is `WeightOverrides.indicators` for that type. It uses the scorer's existing override mechanism, so the panel's "points" breakdown works unchanged. Several new indicators are added at weight 0 by default and switched on only by the profiles that use them.

| Profile | Up-weight | Down-weight | New indicators it switches on |
|---|---|---|---|
| **Family** (detached, townhouse, duplex, triplex) | schools ×2, parks ×2, child care ×2, playgrounds | library, senior centers | `demand_pct_under18` (tract), `demand_avg_hh_size` |
| **Apartments** (fourplex, small, large) | transit ×2, jobs by transit ×1.5, grocery | parks, schools | `demand_pct_living_alone`, `demand_pct_renter` |
| **Senior** (senior apartments, assisted living, personal care) | health ×3, pharmacy ×2, transit ×2, senior centers ×3, steep slope ×2, surface heat ×2 | schools, child care, jobs by transit | `demand_pct_65plus` (tract), `demand_senior_supply_gap` (65+ residents within 1.5 km per existing senior/assisted bed; from `senior-and-group-housing.geojson` capacity) |
| **Supportive / group** (group home, SRO) | transit ×2, health ×2, food assistance ×2, jobs by transit | market demand (sales turnover, rent growth), since these serve need, not the market | none |

All multipliers are value judgments, so they go in the config under `typologies[].weights`. They're shown in the panel as "this type cares more about…".

### 2d. Carbon modifier (per type, deterministic)

These are from Rishit's table: RECS 2020 operational site energy per household and Dublin embodied carbon per m². The modifier shifts the **carbon sub-score** by up to ±15 points: detached −15, townhouse −5, duplex/triplex 0, small apartment +10, large apartment +12. Per unit vs per m² is a toggle and a labeled value judgment: the ranking can flip (the BfCA finding).

### 2e. Need vs market (per type)
- Apartments, senior and supportive types are often the vehicles for affordable housing, so the housing-need sub-score gets more weight for them.
- For large market-rate apartments in high displacement-risk areas, the displacement sub-score gets more weight.
- An optional "affordable / market-rate" switch per scenario makes that explicit.

## 3. What the user sees

```
┌ Parcel 0174K00352000000 · Homewood South · RM-M · 535 sq ft · City-owned ┐
│ Best fits here (current code, equal weights)                             │
│  1 Townhouse            68  ● by right      fits (16 ft wide)       ▸    │
│  2 Duplex               61  ● by right      tight lot (−10%)        ▸    │
│  3 Senior apartments    44  ◐ special exc.  lot too small           ▸    │
│  4 Small apartment      22  ● by right      lot far too small       ▸    │
│  ─ House + ADU          —   ○ not permitted (Bill 2025-1545 pending)     │
│  [ Compare 1 vs 3 ]   More housing types ▾                               │
├──────────────────────────────────────────────────────────────────────────┤
│ Townhouse vs Senior apartments                                           │
│  Legal   by right (×1)          vs  special exception (×0.85, ZBA 90%, n=30)│
│  Fit     OK                     vs  needs 10,000 sq ft, has 535          │
│  Demand  52 (families, u18 31%) vs  61 (65+ 24%, few beds nearby)        │
│  Access  88                     vs  91 (clinic 400 m, pharmacy 600 m)    │
│  Climate 60                     vs  66 (+apartment carbon)               │
│  → Townhouse leads on lot fit; senior apartments would lead if you       │
│    assembled 3+ lots or set Access weight above 40%.                     │
└──────────────────────────────────────────────────────────────────────────┘
```

Click a row, and today's pillar cards open **for that type**. They're the same drill-down, recomputed with the type's weights. The five pillar sliders apply to every type at once.

## 4. Data readiness

| Need | Have? | Where |
|---|---|---|
| Legal pathway, all types × 57 districts | ✅ | `scripts/data/inputs/legal-feasibility/typology-district-matrix.json` |
| ZBA approval rates (with n), pooled for senior and assisted living | ✅ | `zba-outcomes-by-district-typology.csv`, `typology-crosswalk.csv` |
| Days to permit by type | ✅ | `permits-by-typology-district.csv` |
| 65+, under 18, living alone, renter share, household size (tract, with MOE) | ✅ | `scripts/pillars/inputs/allegheny_demand_acs_tract.csv` |
| Existing senior and group facilities with capacity | ✅ | `senior-and-group-housing.geojson` (124) |
| Lot area and width | ✅ | parcels + `lot-dimensions.geojson` (residential only) |
| Size thresholds (Limited vs General, A/B/C) | ✅ | `use-definitions.csv` (feasibility session) |
| Carbon per type | ⚠ national and overseas averages | Rishit §4.2, `carbon-by-typology` research |
| Per-type minimum lot sizes | ⚠ assumptions | need a check against §903.03 and the practitioner sources |
| Playgrounds, nursing homes | ✅ new on map (#30) | `places-playgrounds`, `places-nursing-homes` |

## 5. Build plan (about 4–5 h)

1. **Config (1 h):** add `typologies[]` with id, family, matrix rows, fit minimums, weight profile and carbon modifier. Add the new demand indicators at weight 0.
2. **Build (45 min):** per-parcel legal code for each sub-type; lot width and depth into the shards; tract demographics as indicators.
3. **Scorer (1 h):** `scoreParcelForType(values, type, overrides)` returns gate, fit and the pillar scores. Add `rankTypes()`, a pairwise "why A beats B", and a flip point for one slider, following Rishit §7.
4. **Panel (1.5 h):** the ranked type list, a type-aware drill-down, and a compare view.
5. **Review (1 h):** rerun the parcel review agents with the type lens (for example "does a senior facility rank well next to Homewood's clinics?").

## 6. Open questions

1. Is the 13-sub-type list right? Should shelters and interim housing be added, even though a third of districts are unknown?
2. Is it OK to use assumed per-type minimum lot sizes, labeled as assumptions, until someone checks them?
3. Should "affordable vs market-rate" be a switch now, or later?
4. Does Jev's site-fit adjustment go in this round, or after the deterministic version works?
