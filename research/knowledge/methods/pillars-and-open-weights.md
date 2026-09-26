# Pillars and open weights

**Type:** method
**One line:** A draft of five per-parcel pillar scores (0–100) built from the Track 3 brief's seven axes and the low-level map datasets, and how their weights are published and user-editable ("open weights").
**Why we care:** The brief's success test requires that users "change normative weights" and "see why the tool ranked them differently". This node turns ~40 low-level layers into five numbers per parcel in a way a user can re-weight and audit.
**Last checked:** 2026-09-26

> **Superseded in part (2026-09-26 evening).** The pillars are built and live. Current state:
> - Scale: 100 = a good place to build new housing.
> - Pillar 3 is **Housing Need**. Displacement pressure is shown as a flag, not scored.
> - Climate has carbon and local-environment sub-scores.
> - Zoning and site availability multiply the overall score.
> - The overall is a weighted geometric mean.
> - The panel has weight sliders and presets.
>
> The how-to and the current rules are in `apps/web/scripts/pillars/README.md`; the reviews are in `research/pillars/reviews/`. The text below is the original draft, kept for history.
>
> **Original status: DRAFT for Rishit + Lance to decide.** The pillar list, the directions and the defaults are proposals. The method (normalize → weighted mean → publish the weights) is the part that comes from precedent: see [r8 composite indices](../../sweeps/r8-composite-indices.md).

## TL;DR

- **The brief has no list of five.** It names **seven axes**: demand, physical feasibility, affordability, displacement risk, infrastructure capacity, access to opportunity and marginal carbon emissions. It also names four user groups and five prototype ideas. Checked on the live page on 2026-09-26 `[read]`. See [brief](../track3/brief-and-requirements.md).
- **Proposal: copy the seven axes and merge two pairs into five pillars.** Every axis stays visible by name.
  1. Demand
  2. Site Feasibility (physical feasibility + infrastructure capacity)
  3. Affordability & Displacement
  4. Access to Opportunity
  5. Climate & Environment (marginal carbon + air + resilience)
- **Compatible with Mat's plan.** The plan's Demand / Site / Access sub-scores are pillars 1, 2 and 4. Pillars 3 and 5 are additions.
- **Recipe (the one nearly every official index uses; r8):**
  1. Normalize each indicator to 0–100, **100 = better for a future resident**.
  2. Take a weighted mean inside each pillar.
  3. Show the five pillars side by side.
  4. Hazards that must not be averaged away become **gates** that cap a pillar and raise a visible flag.
- **"Open weights" means:**
  - One JSON file in the repo holds every indicator, direction, normalization rule, weight and rationale.
  - The code, the methodology page and the chatbot all read that same file.
  - Users edit weights in the browser. The recompute is instant, because the normalized values are precomputed.
  - The URL encodes the weights, so any view can be shared and reproduced.

## 1. The five pillars (draft)

Each pillar is labeled with the brief axes it covers. The **Geography** column says what one value describes. Parcel-level values come from this parcel. Area values are inherited from the tract or block group and must be labeled that way in the UI.

### P1 Demand · *brief: demand*

| Indicator | Source (map dataset → field) | Geography | Direction |
|---|---|---|---|
| Market strength | `market-mva` → `mva` class | BG | ⚠ value judgment, see §4 |
| Rent growth | `market-zip` → `zori_yoy_pct` | ZIP | higher = more demand |
| Low vacancy | `usps-vacancy` → `res_vacancy_pct` | tract | lower vacancy = more demand |
| Jobs nearby | `jobs` → `jobs_per_sq_mi` | BG | higher = more demand |
| Household mix (65+, under 18, household size) | ACS neighborhood profiles, per Mat's plan A5 | neighborhood | typology-specific |

The brief-and-requirements node rates demand as the **weakest** axis. The household-mix inputs matter most per typology. For example, senior housing weighs the 65+ share.

### P2 Site Feasibility · *brief: physical feasibility, infrastructure capacity*

| Indicator | Source | Geography | Rule |
|---|---|---|---|
| Flood zone | `flood-zones` → `zone`, `class` | parcel | **Gate:** floodway caps the pillar at 20 and raises a flag; the 100-year floodplain is a penalty |
| Landslide susceptibility | `landslide-susceptibility` → `class` | parcel | penalty by class |
| Steep slope share | slope raster / city `SteepSlope` | parcel | share ≥25% → penalty |
| Undermined | `mined-out-areas` | parcel | penalty + flag |
| Landslide incidents within 500 m | `landslide-incidents` | parcel | count → penalty |
| Weather hazard ratings (inland flood, wind, winter) | `weather-risk` → `*_score` (FEMA NRI) | tract | **ratings, not EAL**: EAL scales with property value (r8 pitfall 2) |
| Lead service line | `lead-service-lines` → `status` (nearest address) | address | penalty if lead/galvanized; **unknown ≠ bad** |
| Sewer present | `sewer-lines` (live, viewport) | parcel | presence only; **capacity is not public** |
| Zoning legality | use table ([typology prototypes](../track3/typology-prototypes.md)) | parcel × typology | **Gate, not a weight.** Legality is data. |

### P3 Affordability & Displacement · *brief: affordability, displacement risk*

| Indicator | Source | Geography |
|---|---|---|
| Low-income renter cost burden | `chas-cost-burden` → `renter_lowinc_costburdened_pct` | tract |
| Severe burden, ≤30% AMI | `chas-cost-burden` → `renter_le30_severe_pct` | tract |
| Rent burden | `housing-costs` → `rent_burden_pct` | BG |
| Housing + transportation cost | `location-affordability` → `avg_h_cost` + `avg_hh_vmt` | tract |
| Rent growth | `market-zip` → `zori_5yr_pct` | ZIP |
| Expiring subsidized units nearby | `subsidized-housing` → `affordability_may_end_soon` | point → count |

⚠ **The direction of this pillar is the biggest open decision (§4).** "High burden" can mean either of two things:
- *bad for a resident*, so the score goes down, or
- *where new affordable housing is most needed*, so the score goes up.

These are opposite rankings. The displacement node warns that a "densify here" ranking lands in Transitional and Stressed markets. See [displacement](../track3/displacement-and-equity.md).

### P4 Access to Opportunity · *brief: access to opportunity*

All values here are parcel-level. There is no ecological fallacy. This follows the Walk Score and Transit Score pattern (r8 §1):
- **Transit:** Σ over stops within 800 m of `trips_wd` × distance decay. The decay is 1.0 at ≤400 m and falls linearly to 0 at 800 m. Rail and incline count 2×.
- **Destinations:** grocery, pharmacy, school, park or trail, health center or hospital, child care, library. Each uses the nearest distance with decay: 1.0 within 400 m, falling linearly to 0 at 2,400 m (a 30-minute walk).
- **Jobs by transit:** `jobs` → `transit_jobs_30` (BG), county percentile.
- **Caveat:** straight-line distance ignores hills and rivers. ACHD raised the same caveat for its own index.

### P5 Climate & Environment · *brief: marginal carbon emissions (+ "environmental resilience layers" in useful data)*

| Indicator | Source | Geography |
|---|---|---|
| Transport carbon proxy | `location-affordability` → `avg_hh_vmt` (lower = better) | tract |
| Fine particles | `air-quality` → `pm25_pct` | BG |
| Traffic combustion (**one** sub-score) | mean of `dslpm_pct`, `no2_pct`, `ptraf_pct` | BG |
| Industrial air toxics | `air-quality` → `rsei_air_pct` | BG |
| Heat wave rating | `weather-risk` → `heat_wave_score` | tract |

- **Traffic combustion counts once.** Diesel PM, NO2 and traffic proximity are correlated, so they are averaged into one sub-score first. This follows r8 §4.
- **Building-form (embodied) carbon depends on typology, not on the parcel.** It enters when typology scenarios are compared, not in the parcel pillar. See [carbon by typology](../track3/carbon-by-typology.md).

### Deliberately excluded by default

| Excluded | Why | Where it can go |
|---|---|---|
| Crime (`safety-tracts`) | Mat's spec says "race and crime never enter any score". Reported crime also tracks policing intensity (r8 pitfall 7). | Context row only. It could be offered at default weight 0, but that is a team decision. |
| Serious crashes (`crashes-ksi`) | This is less reporting-biased than crime. | Candidate for P4 as a walk-safety penalty. |
| Race / demographics as a penalty | Never used to lower a score (r8 pitfall 6). | — |

## 2. How each number is computed

**Normalization.** Each raw indicator becomes a value `x ∈ [0, 100]`, where 100 is best. Three methods are used:

| Method | Used for | Precedent |
|---|---|---|
| `percentile` within Allegheny County units (BG or tract), direction-flipped if needed | area-level rates such as CHAS, air and jobs | SVI, EJI, CalEnviroScreen, HUD AFFH |
| `decay`, piecewise-linear by distance | parcel-level access | Walk Score, HUD Jobs Proximity |
| `flag` / `class` lookup table | hazards and legality | CEJST, SVI flags, First Street |

The reference population is **Allegheny County**, because the overlays are all county-wide. The UI states this. The raw value is shown beside every percentile, because percentile compression makes small raw gaps look large (r8 pitfall 4).

**Aggregation inside a pillar:**

```
pillar_p = Σ_{i ∈ available} w_i · x_i  /  Σ_{i ∈ available} w_i
```

- **Missing data** is excluded, never zero-filled (the SVI rule). The weights are renormalized over the indicators that are available.
- If the available weight share falls **below 50%**, the pillar reads "insufficient data" (the LA Equity Index rule). The UI shows "n of m indicators".
- **Gates** apply after the mean. `pillar_p = min(pillar_p, cap)` and a flag is shown. A floodway parcel can't be averaged back to "good".
- Pillars stay **separate**. First Street and ClimateCheck don't merge unlike perils either.

**Optional overall rank.** This is only for sorting and coloring the map:

```
overall = Σ_p W_p · pillar_p
```

`W_p` are the five top-level sliders. The pillar scores themselves never depend on `W_p`.

## 3. Open weights: how it works

### 3a. One file is the source of truth

The file lives at `packages/scoring/src/pillars.json` (Lane B owns this folder in PLAN.md). It is public in the repo, and every change is a reviewable diff.

```jsonc
{
  "version": "2026-09-26.1",
  "reference": "Allegheny County block groups / tracts",
  "pillars": [
    {
      "id": "access", "label": "Access to Opportunity",
      "brief_axes": ["access to opportunity"],
      "weight": 0.2,                       // top-level W_p (overall rank only)
      "indicators": [
        {
          "id": "transit", "label": "Transit service within 800 m",
          "overlay": "transit-stops", "property": "trips_wd",
          "geography": "parcel",
          "normalize": { "method": "decay_sum", "full_m": 400, "zero_m": 800, "mode_weight": { "rail": 2, "incline": 2, "bus": 1 } },
          "direction": "higher_is_better",
          "weight": 3,                     // relative, renormalized within the pillar
          "evidence": "observed",          // observed | assumption | policy | value
          "rationale": "Transit Score pattern: trips × distance decay",
          "precedent": "Walk Score Transit Score"
        }
      ],
      "gates": []
    },
    {
      "id": "site", "label": "Site Feasibility",
      "indicators": [ /* ... */ ],
      "gates": [
        { "indicator": "flood_floodway", "when": true, "cap": 20, "flag": "In the regulatory floodway" }
      ]
    }
  ],
  "presets": {
    "equal":        { "demand": 1, "site": 1, "afford": 1, "access": 1, "climate": 1 },
    "family":       { "access": 2, "site": 1.5, "afford": 1, "demand": 1, "climate": 1 },
    "older_adult":  { "access": 2, "site": 2, "afford": 1, "demand": 1, "climate": 1 },
    "climate_first":{ "climate": 3, "access": 1.5, "site": 1, "afford": 1, "demand": 1 },
    "affordability":{ "afford": 3, "access": 1.5, "site": 1, "demand": 1, "climate": 1 }
  }
}
```

The `evidence` field implements the brief's closing line: *"separate observed evidence from policy choices, assumptions, and value judgments."* The overlay registry already uses the same four-value `EvidenceType` (`apps/web/src/components/map/overlays/types.ts` on `lance-map-data`). **Weights are always `value`**, and the slider panel says so.

### 3b. What is precomputed and what is live

| Step | Where | When |
|---|---|---|
| Raw → normalized `x_i` for each parcel (~30 indicators, 0–100 integers) | offline build script → `parcel_features.features` jsonb (Lane A), or a static file | once per data refresh |
| Weighted mean, gates, overall rank | browser, `packages/scoring` (pure TS) | on every slider move |
| Contribution breakdown, sensitivity range | browser, for the selected parcel only | on click |

Size: 140k city parcels × ~30 bytes is about 4 MB, and only the visible parcels are scored. **Moving a slider is only a dot product, so recoloring is instant.** Changing a *normalization* rule, such as a decay distance, needs a rebuild. v1 therefore exposes weights and gate caps only, not normalization parameters.

### 3c. What the user sees

- **Five sliders**, one per pillar, plus preset buttons.
- **An "Advanced" drawer per pillar** with a slider for each indicator. This is where "open weight" is most tangible.
- **A contribution bar per pillar:** `w_i·x_i / Σw` stacked, with the dominant driver named (like Google UAQI's `dominantPollutant`).
- **A per-indicator tag:** geography ("this parcel" vs "tract average") and evidence type.
- **A stability badge.** 200 Dirichlet draws are taken around the current weights, and the pillar and overall-rank range (p10–p90) is shown. If the range is under 10 points, the badge reads "stable"; otherwise "sensitive to weights". This is the OECD/JRC sensitivity step (r8 §4).
- **Where the ranking flips.** For a two-scenario compare, the app reports where the order changes: "townhomes overtake duplex when Climate > 0.35". This answers the brief's "see why the tool ranked them differently".
- **A URL like `?w=d20,s20,a20,x20,c20&wv=2026-09-26.1`.** It reproduces the exact view, and the version pins which weights file was used.

### 3d. Why this counts as "open"

- The weights, formulas and rationale sit in one public file.
- The methodology page is **generated from that file**, so the docs can't drift from the code.
- The chatbot reads the same file (Lane E grounding).
- Any user's custom weighting is a shareable URL.
- A team or community group can propose new defaults by PR, and the diff shows exactly what changed.

## 4. Decisions needed (Rishit + Lance, then Mat for the plan)

1. **Five pillars vs Mat's three.** Is this a superset that replaces Demand/Site/Access, or does it sit beside them? PLAN.md currently says "Scores: Demand, Site, Access. Three user sliders."
2. **Direction of P3 Affordability & Displacement.** Choose one:
   - (a) 100 = affordable and low pressure, i.e. good for a resident; or
   - (b) 100 = high need for affordable units.

   Or split it into two numbers. Either way, displacement risk may belong as a **flag, not a weight** ([displacement](../track3/displacement-and-equity.md)).
3. **Whether P1 Demand uses MVA.** MVA is a market-strength typology. Treating "Robust" as good steers building to already-strong markets. That is a value judgment, so label it one.
4. **Per-typology weights.** Mat's spec gives each typology its own factor weights. Should the pillar scores stay typology-free (per parcel), with the typology only changing the indicator weights? Or is each pillar computed for each typology?
5. **Crime.** Keep it excluded (Mat's rule), or offer it at default weight 0?
6. **Reference area.** County percentiles, or city-only (the plan imports city parcels only)?

## Connects to

- [r8 composite indices sweep](../../sweeps/r8-composite-indices.md): how AQI, SVI, EJI, CalEnviroScreen, FEMA NRI, Walk Score and the ACHD EJ Index aggregate
- [Track 3 brief](../track3/brief-and-requirements.md): the seven axes and the success test
- [Score design options](score-design-options.md): gates vs friction vs opportunity; never average a FAIL away
- [Uncertainty and explainability](uncertainty-and-explainability.md): ranges, confidence and vintage
- [Displacement and equity](../track3/displacement-and-equity.md): why P3 direction matters
- [Carbon by typology](../track3/carbon-by-typology.md): the typology-level half of P5

## Sources

- [Track 3 brief](https://ai-horizons-2026-ai-for-housing-hackathon.brandon831577.chatgpt.site/challenges/typology-equity-climate.html) `[read]` *(accessed 2026-09-26, re-fetched live)*: seven axes, four user groups, five prototype possibilities; no list of five pillars or decision makers
- Map dataset fields: `lance-map-data` branch, `apps/web/public/data/overlays/*.geojson` `[read]` *(inspected 2026-09-26)*
- Team plan: `mat-new-plan` branch, `PLAN.md` and `docs/superpowers/specs/2026-09-26-groundwork-pgh-design.md` `[read]` *(2026-09-26)*
- Method precedents: see the source list in [r8](../../sweeps/r8-composite-indices.md)
