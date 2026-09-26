# Household Lens: who a place and a typology serve (Track 3)

*Researched 2026-09-26 by the household-lens lane. This doc builds on `track3-methodology.md` (the Evidence/Assumption/Policy/Value labels, percentile normalization, the `suit(t,h)` matrix and `HouseholdMatch`), `data-sources.md` (Census Reporter, HUD income limits and FMRs, CHAS, PRT GTFS, EPA SLD) and `pro-forma.md` (AMI rents). It doesn't repeat them. Amenity distances (grocery, clinic, park, school locations) and hazard layers come from the parallel amenities and environment docs. Every number below was pulled or computed live today. Scripts are in the scratchpad (`hh/lodes2.py`, `hh/basket.py`, `hh/r5run.py`) and are easy to move to `scripts/data`.*

**Thesis:** Track 3 already asks "which typology fits this place?" The household lens adds "**for whom?**" The user picks a profile, and optionally a workplace. We then (1) re-weight place metrics with that persona's preset, (2) swap generic job access for travel time to *their* workplace, (3) test affordability at *their* income, and (4) show, for each neighborhood, which household types are underserved right now.

---

## 0. Headline facts (all EVIDENCE, computed today)

- **44% of jobs held by Pittsburgh residents are outside the city:** 30.0% in suburban Allegheny County and 13.9% in other PA counties (LODES 2023, JT00). **Low-wage workers commute out more than high-wage workers:** 53% of SE01 jobs (≤$1,250/mo) and 49% of SE02 jobs are outside the city, vs 39% of SE03 jobs. Only 40% of low-wage residents' jobs fall inside our 14 job centers, vs 57% of high-wage jobs, because low-wage work is dispersed.
- Downtown (16.6% of residents' jobs) and Oakland (12.5%) are the only big single destinations. Each suburban center holds 1–2%: Robinson 1.8%, the airport corridor 1.5%, Monroeville 1.2%, Cranberry 1.1%, Southpointe 0.3%.
- **19.1% of city households have no vehicle.** That's 30.7% of renters and 6.7% of owners (ACS 2024 1-yr B25044). 17.6% of workers work from home, 13.8% take transit, and 50.6% drive alone (B08301).
- **Mismatch:** 46% of households are 1 person, but only 27% of units are studios or 1BR (B25009, B25041). At least **30,600 owner households of 1–2 people live in 3+BR homes** (pigeonhole bound from B25042 × B25009). Meanwhile renter households of 3+ people (14,600) compete with student groups for about 15,800 renter-occupied 3+BR units.
- **Burden by type (CHAS 2018–22, city):** among households at or below 80% HAMFI, renters who are small families are **61%** cost-burdened, large families **56%**, elderly non-family **55%**, and elderly-non-family *owners* **45%**. Renter households with subfamilies or multiple families (a multigenerational proxy) are **17.0%** overcrowded, vs 0.7% of non-family renters (CHAS Table 10).
- Jobs reachable by transit within 45 min (UMN Access Across America 2024, AM peak) range across city tracts from **14k to 352k**, with a median of 204k.
- **Suburban job centers are effectively car-only from the city** (our r5py run, §2c). Median AM transit time from city BGs is 80 min to Robinson, 90 to Monroeville and 93 to the airport. Cranberry and Southpointe have no PRT stop at all. Late-evening transit reaches none of the three served suburban centers. By car it's 24–33 min.

---

## 1. Commute data

### 1a. LEHD LODES 8 (Pennsylvania), public domain. **2023 is now the latest year** (posted 2025-12-03). 2022 and 2021 are still available.

| File | URL | Size |
|---|---|---|
| OD main (PA home → PA work) | `https://lehd.ces.census.gov/data/lodes/LODES8/pa/od/pa_od_main_JT00_2023.csv.gz` | 30.7 MB |
| OD aux (out-of-state home → PA work) | `…/pa/od/pa_od_aux_JT00_2023.csv.gz` | 2.6 MB |
| OD main 2022 | `…/pa/od/pa_od_main_JT00_2022.csv.gz` | 30.2 MB |
| WAC (jobs by workplace block) | `…/pa/wac/pa_wac_S000_JT00_2023.csv.gz` | 2.4 MB |
| RAC (workers by home block) | `…/pa/rac/pa_rac_S000_JT00_2023.csv.gz` | 6.7 MB |
| Crosswalk (block → tract, place `stplc`, municipality `ctycsubname`, lat/lon) | `…/pa/pa_xwalk.csv.gz` | 5.8 MB |
| Tech doc | `https://lehd.ces.census.gov/data/lodes/LODES8/LODESTechDoc8.4.pdf` | — |

**Columns:** OD has `w_geocode, h_geocode, S000` plus age bands `SA01–03` and **earnings bands `SE01` (≤$1,250/mo, about ≤$15k/yr), `SE02` ($1,251–3,333/mo, about $15–40k), `SE03` (>$3,333/mo, above $40k)**, and industry groups `SI01–03`. WAC adds 20 NAICS sectors (`CNS01–20`). City of Pittsburgh residence is `stplc == "4261000"` in the crosswalk.

**Mapping wage tiers to AMI** (FY2026, 1 person): 30% AMI is $23.2k and 50% AMI is $38.65k. So SE01 means "below 30% AMI if single-earner", SE02 is about 30–50% AMI, and SE03 is above 50%. This is coarse, and it describes a *job*, not a household (ASSUMPTION). Use it only to choose which destination basket a persona gets.

**Gotchas:**
- JT00 counts *all jobs*. Use JT01 (primary jobs) if you want to count workers.
- Blocks have noise infused. Aggregate to tract or center level before showing anything.
- The main OD file misses PA residents who work in OH, WV or MD. That's small for Pittsburgh.
- Tract 42003982200 (and similar 98xxxx tracts) are special-use tracts with odd ratios, so drop tracts with fewer than 300 jobs.

**Job centers** (WAC 2023, radius around a center point; EVIDENCE counts, ASSUMPTION radii):

| Center | lat, lon | r km | Jobs | %SE01/02/03 | PGH residents' jobs there |
|---|---|---|---|---|---|
| Downtown | 40.4406, −79.9959 | 1.2 | 103,708 | 8/12/80 | 21,193 (16.6%) |
| Oakland | 40.4443, −79.9532 | 1.3 | 55,628 | 10/17/72 | 15,934 (12.5%) |
| North Shore / AGH | 40.4530, −80.0050 | 1.0 | 23,015 | 12/17/71 | 4,563 |
| East Liberty / Bakery Sq | 40.4600, −79.9250 | 1.0 | 14,812 | 18/26/56 | 4,170 |
| South Side Works | 40.4285, −79.9700 | 1.2 | 11,922 | 14/19/67 | 2,495 |
| Strip / Lawrenceville | 40.4600, −79.9700 | 1.2 | 8,258 | 13/19/68 | 2,085 |
| Cranberry (Butler Co.) | 40.6840, −80.1070 | 4 | 34,668 | 16/19/66 | 1,464 |
| Robinson / Settlers Ridge | 40.4450, −80.1650 | 3 | 26,415 | 19/22/59 | 2,260 |
| Airport corridor (Moon/Findlay) | 40.5000, −80.2300 | 5 | 25,479 | 14/19/67 | 1,900 |
| Monroeville | 40.4270, −79.7600 | 3 | 20,455 | 19/24/57 | 1,548 |
| RIDC O'Hara | 40.4900, −79.8900 | 2.5 | 20,002 | 9/17/74 | 2,360 |
| McKnight / Ross | 40.5250, −80.0080 | 2.5 | 12,813 | 26/25/49 | 1,774 |
| Waterfront / Homestead | 40.4060, −79.9150 | 1.5 | 7,910 | 24/27/50 | 1,072 |
| Southpointe (Cecil, Washington Co.) | 40.3050, −80.1650 | 2.5 | 7,221 | 7/14/79 | 349 |

The top outside-city municipalities for Pittsburgh residents' jobs are Ross (2,141), Robinson (2,025), Monroeville (1,701), Moon (1,612), Green Tree (1,609), Findlay (1,506), McCandless, O'Hara, West Mifflin and Bethel Park. Retail and health-care edge centers (Ross/McKnight, Waterfront) have the most low-wage jobs.

**Default destination basket** (used when no workplace is picked). Weights come from Pittsburgh residents' flows to the 14 centers, normalized:
- **Low-wage (SE01+02):** Downtown .26, Oakland .22, East Liberty .09, North Shore .09, Robinson .05, South Side .05, McKnight .05, Strip .05, Monroeville .035, RIDC .035, airport .034, Waterfront .028, Cranberry .022, Southpointe .003.
- **SE03:** Downtown .37, Oakland .27, North Shore .07, East Liberty .06, RIDC .04, South Side .035, Robinson .03, airport .03, Strip .03, Cranberry .024, Monroeville .02, McKnight .02, Waterfront .01, Southpointe .007.

Because low-wage work is dispersed, low-wage personas should also use a *cumulative* measure (jobs reachable within 45 min, §2b), not only the basket.

### 1b. ACS commute and vehicle tables (Census Reporter, no key)

Tract call (5-year): `https://api.censusreporter.org/1.0/data/show/latest?table_ids=B08301,B08303,B25044,B08141&geo_ids=140|05000US42003`. For the city geo, `latest` returns **ACS 2024 1-year**. Tract geos return 5-year.

| Table | Use | City value (2024 1-yr) |
|---|---|---|
| B08301 means to work | transit share (`010/001`), WFH (`021/001`), walk (`019`) | transit 13.8%, WFH 17.6%, walk 9.0%, drive alone 50.6% |
| B08303 travel time | share with a commute ≥45 min (`011+012+013`) / `001` | 10.5% |
| B25044 tenure × vehicles | zero-car HH = (`003+010`)/`001` | 19.1% (renters 30.7%) |
| B08141 mode × vehicles | transit riders with 0 cars: captive vs choice riders | 8,658 of 21,880 transit commuters have no car |

---

## 2. Travel time to workplaces

### 2a. Options compared

| Option | Transit? | Limits / cost | Verdict |
|---|---|---|---|
| **r5py** (Python wrapper of Conveyal R5) with PRT GTFS + OSM | Yes, full schedule, departure-time windows | Free. Needs JDK 21 (`r5py 1.1.7`, Python ≥3.10). Run offline. | **Recommended.** See the timing in §2c. |
| OpenTripPlanner 2 | Yes | Free. Heavier setup (graph build, server, one query per OD pair). | Fine, but r5py does many-to-many in one call. |
| PRT Trip Planner ([rideprt.org](https://www.rideprt.org/inside-Pittsburgh-Regional-Transit/Accessible-Services-and-Features/plan-your-trip/)) | Yes | Interactive only, no batch API | Deep-link only ("plan this trip"). |
| Mapbox Matrix API | **No** (driving, driving-traffic, walk, bike) | 25 coords per request (10 with traffic), 60 req/min, **100k elements/mo free** | Good for **peak car** times: 314 BGs × 14 centers = 4,396 elements. |
| TravelTime API | Yes | Free "Basic" plan for research/evaluation only, **non-commercial**, 120 hits/min | Possible live "any workplace" isochrone; licensing is awkward for a public demo. |
| OSRM demo (`router.project-osrm.org`) | No | ≤1 req/s, non-commercial, no SLA | Free-flow car only. Use as a fallback. |
| Valhalla public (`valhalla1.openstreetmap.de`) | No (public instance) | Fair use | Fallback only. |
| **UMN Access Across America 2024** | Yes (jobs reachable, 5–60 min) | CC BY-NC 4.0; PA zip 23.8 MB | **Use as-is** for "jobs within 45 min". |

### 2b. Jobs reachable (no routing needed)

The Accessibility Observatory publishes **Transit 2024** data (issued 2026-01-07), with worker-weighted jobs reachable at 7–9 AM for thresholds of 5–60 min, at **block, BG, tract, county and state** level. Get the PA zip: `https://conservancy.umn.edu/server/api/core/bitstreams/82f5db0b-5e6b-495b-9685-374219785c17/content` (23.8 MB; the block CSV inside is 287 MB, so use the BG file at 10.7 MB). The collection is [hdl 11299/277775](https://hdl.handle.net/11299/277775), with Auto 2024 and Walk 2024 items alongside. Fields: `Summary Level, Census ID, Threshold, Weighted_average_total_jobs`. Allegheny County averages 64,216 jobs at 45 min and 127,222 at 60 min.

This supersedes EPA SLD `D5BR` (2010-vintage BGs) for the "A" sub-score. Label it EVIDENCE with a non-commercial license note.

### 2c. Recipe (precompute, ship about 60 KB of JSON)

1. Origins: the **314 city block groups** as *worker-weighted* centroids (RAC `C000` weights on block lat/lon from the crosswalk). Parcels inherit their BG's times. Add a parcel's walk to the nearest stop only if you want parcel-level precision.
2. Destinations: the 14 centers above, plus the user's custom workplace (see step 5). For transit, anchor each suburban destination at its busiest stop (gotcha b below).
3. Network: Geofabrik `pennsylvania-latest.osm.pbf` (347 MB), clipped with `osmium extract -b -80.45,40.20,-79.60,40.80` → `pgh.osm.pbf`, plus PRT `GTFS.zip` with its empty tables removed (valid 2026-06-28 to 10-14, so pick a Tuesday inside that range).
4. Run `TravelTimeMatrix` three times:
   - transit+walk, departing 07:00 with a 2 h window (the median over the window absorbs headway luck);
   - transit, departing 22:30 (the **shift-worker** view);
   - CAR (free-flow). Multiply by a peak factor from Mapbox `driving-traffic` samples, or by 1.3 as an ASSUMPTION.
5. Custom workplace: the user types an address or clicks the map. If it's within 1.5 km of a center, reuse that center's column (label: "approximated by nearest job center"). Otherwise, show car time from a Mapbox Matrix call made at click time (1 destination × 25 origins per request, about 13 requests), and transit as "not precomputed".

```python
net = r5py.TransportNetwork("pgh.osm.pbf", ["GTFS.zip"])
tt = r5py.TravelTimeMatrix(net, origins=bg_pts, destinations=centers,
      departure=datetime.datetime(2026,10,6,7,0), departure_time_window=datetime.timedelta(hours=2),
      transport_modes=[r5py.TransportMode.TRANSIT, r5py.TransportMode.WALK],
      max_time=datetime.timedelta(minutes=120), snap_to_network=True)
```

**We ran this today** (M-series Mac, JDK 21, r5py 1.1.7; script `hh/r5run.py`):

- **Setup:** `pip install r5py` plus the PA pbf download plus `brew install osmium-tool` took about 3 min. The clip took 5 s and produced a 46.6 MB pbf.
- **Network build:** 35 s the first time, then 3 s from r5py's cache.
- **Matrices (314 BGs × 14 centers):** each transit matrix took about 40 s and the car matrix 188 s.
- **End to end:** under 10 min. The output CSV is 0.5 MB, and the JSON will be about 60 KB. This is **well within a 36 h budget** and needs no API keys.

**Two gotchas we hit:**
- (a) R5 rejects PRT's GTFS because `frequencies.txt` and `fare_rules.txt` are header-only. Delete empty tables and re-zip before loading.
- (b) `snap_to_network` can snap a suburban destination onto a motorway you can't walk from, which returns NaN. Anchor transit destinations at the busiest nearby stop instead: Robinson at Park Manor Blvd/IKEA (40.4530, −80.1660), the airport terminal stop (40.4970, −80.2490), Monroeville Mall (40.4290, −79.7970).

**Results** (median over city BGs, EVIDENCE model output):

| Destination | Transit, AM 7–9 | Car, free-flow |
|---|---|---|
| Downtown | 37 min | 10 min |
| Oakland | 42 | 11 |
| East Liberty | 43 | 12 |
| McKnight | 72 | 18 |
| Robinson | 80 | 24 |
| Monroeville | 90 | 25 |
| Airport | 93 | 28 |
| Cranberry | **no PRT stop within 6 km** | 32 |
| Southpointe | **no PRT stop within 6 km** | 33 |

- In-city transit takes about 3.9× the free-flow car time.
- 83% of BGs reach Downtown within 45 min by transit, and 58% reach Oakland.
- **Departing 22:30–00:30, no BG has a reliable transit trip to Robinson, the airport or Monroeville**, and only 6 BGs reach McKnight. That's the core shift-worker finding.

**Fallback (no Java):** `t_transit ≈ walk(origin → nearest HighFrequencyTransit stop)/80 m·min⁻¹ + headway/2 + crowDist(stop → center)·1.35/(18 km/h) + walk at the destination`. Only use it for the four in-city centers. Suburban transit is poorly served, and straight-line distance will badly underestimate it there (ASSUMPTION; label "approximate").

---

## 3. Household composition and needs data

All by tract through Census Reporter (5-year, `geo_ids=140|05000US42003`, ≤10 tables per call), then aggregated to neighborhoods with the tract→hood index from `data-sources.md`.

| Need | Table / cells | City value |
|---|---|---|
| HH with kids; single parents | **B11005**: `002` with <18; `005` other family with kids | 23,197 (16.2%); 8,108 single-parent |
| 65+ living alone | **B11007** `003` (or B09021 `023`) | 22,265 (15.6% of HH) |
| Multigenerational | **B11017 is *not* published for tracts or places** (Census Reporter returns it for the nation only). Use **2020 DHC `PCT14`** (tract; needs a free Census API key, since keyless calls 302) or the CHAS Table 10 subfamily proxy. | — |
| Grandparents raising kids | B10051 `002` | 523 |
| Disability | **B18101** (persons); for households, CHAS **Table 6** (ambulatory / self-care limitation × income × problems) | 13.9% of persons; 31.5% of 65+ |
| Tenure × age | B25007 | 27,083 owner householders are 65+ |
| Crowding | **B25014** `005+006+007+011+012+013` | 2,745 (1.9%), 83% of them renters |
| Size vs bedrooms | **B25009** × **B25042** (tenure × bedrooms), B25041 | see §0 bound |
| Commute / cars | B08301, B08303, B25044, B08141 | §1b |

**HUD CHAS 2018–22.** Tract zip `…/cp/2018thru2022-140-csv.zip` (226 MB); place zip `…-160-csv.zip` (84 MB, verified today). Dictionary: `https://www.huduser.gov/portal/datasets/cp/CHAS-data-dictionary-18-22.xlsx` (sheet per table; column meaning in cols 2–6). Table numbers to use:
- **Table 7:** tenure × income (5 HAMFI bins) × **household type** (elderly family, small family, large family 5+, elderly non-family, other) × cost burden (≤30, 30–50, >50). This is the core demand table.
- **Table 16:** the same types × housing problems, with a 2000-comparable income split.
- **Table 10:** tenure × **overcrowding** × income × family status (non-family / one family / **subfamily or multiple families**).
- **Table 6:** tenure × disability type × income × problems.
- **Table 5:** elderly status (62–74, 75+) × income × problems.
- **Table 13:** year built × income × **presence of children** (lead-risk context).
- **Tables 15C / 18C:** renter units by **rent affordability (RHUD30/50/80) × occupant income × bedrooms (≤1, 2, 3+)** / × units in structure. This is the **supply** side. **14B**: vacant-for-rent by affordability × bedrooms.

**Other local sources:**
- PPS enrollment by school, feeder pattern and neighborhood, 2020–21 (WPRDC `pittsburgh-public-schools-enrollment`), plus feeder attendance boundaries (WPRDC `pittsburgh-public-schools-feeder-pattern-attendance-boundaries`, adopted 2012–13). The data is old, so use it for "which feeder serves this parcel", not for trends.
- Allegheny County AAA [Four-Year Area Plan 2024–2028](https://analytics.alleghenycounty.us/wp-content/uploads/2025/02/four-year-plan-2024-2028.pdf): county-level demographics and needs, as context text.
- UCSUR *State of Aging* 2014 survey microdata (WPRDC `state-of-aging-in-allegheny-county-survey`): dated, for background only.

---

## 4. Personas

Income limits are HUD FY2026 for the Pittsburgh HMFA (MFI $110,400; 60% = 50% × 1.2, 100% = 50% × 2). The max housing cost is 30% of income ÷ 12. The weights are **VALUE** presets (0–5) with a cited rationale. Each persona's typology suitability is VALUE/ASSUMPTION.

| id | Profile | Size / BR | AMI → income → max rent | Key weights | Typologies (best first) |
|---|---|---|---|---|---|
| `familyKids` | Two parents, 2 school-age kids | 4p / 3BR | 80% → $88,300 → $2,208 | schools 5, parks 4, calm 4, afford 4, commute 3 | townhome, duplex (3BR unit), triplex |
| `singleParent` | 1 adult + 2 kids, often no car | 3p / 2BR | 50% → $49,700 → $1,243 (2BR FMR is $1,299) | afford 5, transit 4, daily 4, schools 4, commute 4 | smallMf, duplex, triplex |
| `seniorInPlace` | 65+, alone, downsizing or ADU | 1p / 1BR | 50% → $38,650 → $966 | access 5, health 5, daily 5, calm 4, transit 3 | adu, midRise (elevator), smallMf ground floor |
| `youngNoCar` | 25–34 worker, no car | 1p / 0–1BR | 60% → $46,380 → $1,160 | transit 5, afford 5, commute 4, daily 4, night 3 | smallMf, midRise, adu |
| `multigen` | Grandparent + parents + kids | 6p / 4BR | 60% → $76,860 → $1,922 (4BR FMR is $1,789) | afford 5, schools 4, health 4, access 3 | duplex (up/down), townhome + adu, triplex |
| `disability` | Adult with ambulatory disability, SSI-level income | 1p / 1BR step-free | 30% → $23,200 → $580 | access 5, transit 5, health 5, afford 5, daily 4 | midRise (elevator), smallMf ground floor, adu |
| `student` | Grad or undergrad, shared unit | 1p of 3–4 / per-BR | about 30% → $580 per bedroom (ASSUMPTION) | commute to campus 5, afford 5, transit 4, night 3 | triplex, smallMf, duplex |
| `remoteWorker` | WFH couple, needs an office room | 2p / 2BR | 100% → $88,400 → $2,210 | parks 4, daily 4, calm 4, afford 3, commute 1 | townhome, duplex, smallMf |
| `shiftWorker` | Hospital, warehouse or retail, nights or weekends | 2p / 1–2BR | 50% → $44,200 → $1,105 | commute 5 (low-wage basket), night 5, afford 5, transit 3 | smallMf, duplex, adu |
| `firstTimeBuyer` | Young couple + 1 child buying | 3p / 2–3BR own | 80% → $79,500 → $1,988 PITI ≈ **$250k price** (6.3% rate, 5% down, 2.5%/yr tax+insurance, all ASSUMPTION) vs city median $275k | afford 5, calm 4, commute 3, schools 3 | townhome (fee-simple), duplex (owner + rental unit), CLT townhome |

**Evidence behind the weights:**
- **NAR 2025 Generational Trends, Exhibit 2-7** ([PDF](https://cms.nar.realtor/sites/default/files/2025-03/2025-home-buyers-and-sellers-generational-trends-report-04-01-2025.pdf)): "quality of school district" is cited by 29–34% of buyers aged 26–44 but only 3–7% of those 60+. "Convenient to health facilities" rises from 7–8% (26–44) to 35–40% (70+). "Convenient to job" is 64% for ages 26–34. Affordability is 50–51% for buyers under 35. **Exhibit 1-5:** 17% of buyers bought a multigenerational home, citing cost savings (36%) and caring for aging parents (25%). This drives `familyKids`, `seniorInPlace`, `youngNoCar`, `multigen` and `firstTimeBuyer`.
- **NAR 2023 Community & Transportation Preferences** ([slides](https://www.nar.realtor/sites/default/files/documents/2023-community-and-transportation-preferences-survey-slides-06-20-2023.pdf)): low crime is the top-ranked quality. 56% would trade a larger yard for walkability. Gen Z and Millennials prioritize transit and prefer an apartment or townhouse with a short commute. Gen X with kids lean toward larger homes. This drives the `calm` weights and the family and young-adult typologies.
- **AARP 2024 Home & Community Preferences** ([AARP PRI](https://www.aarp.org/pri/topics/livable-communities/housing/2024-home-community-preferences/)): 75% of adults 50+ want to stay in their home and 73% in their community. Of those planning upgrades, 71% expect accessibility changes. **One in four older homeowners would consider building an ADU** for caregiving. This drives `seniorInPlace` (ADU, access) and `multigen` (ADU).
- **Pew 2022** ([multigenerational](https://www.pewresearch.org/social-trends/2022/03/24/financial-issues-top-the-list-of-reasons-u-s-adults-live-in-multigenerational-homes/)): 18% of Americans live in multigenerational homes. Finances are the top reason, and caregiving is a major reason for a third.
- **HUD AHS accessibility study** ([HUD USER](https://www.huduser.gov/portal/publications/mdrt/accessibility-america-housingStock.html)): 0.15% of units are wheelchair accessible and about 4% are livable with a moderate mobility difficulty. So `disability` and `seniorInPlace` weight *new* elevator or ground-floor units heavily (existing stock rarely qualifies).
- **Pew 2023 remote work** ([short read](https://www.pewresearch.org/short-reads/2023/03/30/about-a-third-of-us-workers-who-can-work-from-home-do-so-all-the-time/)): 35% of workers whose jobs can be done remotely do so all the time, and 41% are hybrid. `remoteWorker` gets commute 1 and a +1 bedroom for an office.
- **BLS Job Flexibilities 2017–18** ([release](https://www.bls.gov/news.release/flex2.nr0.htm)): 16% of wage and salary workers usually work a non-daytime schedule. Locally, PRT has **1,067 stops with ≥6 weekday departures between 23:00 and 05:00** (computed from GTFS today). That becomes the `night` metric: departures 23–05 within 400 m.
- **NAR 2025 Profile** ([top-10](https://www.nar.realtor/news/economists-outlook/top-10-takeaways-from-nars-2025-profile-of-home-buyers-and-sellers)): first-time buyers are 21% of buyers (a record low), with a median age of 40. This is why `firstTimeBuyer` has affordability 5 and uses ownership typologies.

---

## 5. Scoring

### 5a. Household fit (place × persona)

```
M_d(p)   = city percentile of metric d at place p (existing §2.2 method; CV>30% → missing)
Commute_h(p) = Σ_c b_{h,c} · clamp((90 − t_{p,c}^{mode_h}) / (90 − 20), 0, 1)
      // b = chosen workplace (1.0) or the persona's LODES basket; t in minutes
      // mode_h = transit for no-car personas; min(car·1.3, transit) otherwise; night table for shiftWorker
Afford_{h,t}(p) = clamp((1.3 − r) / 0.6, 0, 1),  r = expectedRent_{t,BR_h}(p) / maxRent_h
      // expectedRent = min(SAFMR_zip[BR], pro-forma breakeven rent_t) → AMI-restricted units use the AMI rent
Access_h(p)  = persona-specific: step-free (slope < 8% on parcel + frontage, from the environment doc), elevator typology, stop within 400 m
HHFit_{p,h}  = 100 · Σ_d w_{h,d} · M_d^{(h)}(p) / Σ_d w_{h,d}          // d ∈ commute, transit, schools, health, parks, daily, calm, afford, access, night
Serves_{p,t,h} = HHFit_{p,h} · suit[h][t] · Afford_{h,t}(p) · legalGate_{p,t}
```

- **"Who this place serves well":** the top 3 personas by `HHFit`, each with its two largest weighted contributors ("Short transit ride to Oakland (22 min) · 3 clinics within 1 km").
- **"Who this typology serves here":** the top 3 by `Serves`. When `Afford < 0.3`, show "Serves {persona} only with subsidy: needs $X/mo" (from pro forma).
- **Confidence:** reuse the §2.5 Monte Carlo. Add `t ~ U(0.85t, 1.2t)` for the travel-time ASSUMPTION.

### 5b. Underserved demand (neighborhood × household type)

```
Need_{n,h}    = CHAS count of type-h households in n with the type-relevant problem
                 small/large family, elderly (T7): ≤80% HAMFI and cost burden >30%
                 multigen proxy (T10): subfamily HH with >1 person/room
                 disability (T6): ambulatory or self-care limitation + ≥1 problem
NeedRate_{n,h}= Need / households_{n,h}
Supply_{n,h}  = renter units in n with suitable BR and rent ≤ RHUD(bin_h)  (T15C)   // plus vacant-for-rent T14B
Mismatch_{n,h}= suitable affordable units occupied by >100% HAMFI households (T15C) / Supply
Underserved_{n,h} = 0.4·pct(NeedRate) + 0.4·pct(Need) + 0.2·pct(1 − Supply/(Need+Supply))     // VALUE weights
```

Show a heat strip per neighborhood (one row per type) and "supply tight" when `Supply/Need < 0.25`. A typology that delivers the missing unit (for example 3+BR at ≤60% AMI for large families) gets a "fills a gap here" chip, and `HouseholdMatch` in methodology §2.3 is multiplied by `(1 + 0.5·Underserved_{n,h})` (VALUE). For seniors who are overhoused, the ADU/downsizing signal is `B25007 owners 65+` × the §0 bound share, shown as context only (ASSUMPTION). An exact figure needs PUMS.

### 5c. Config

```ts
export type PersonaId = "familyKids"|"singleParent"|"seniorInPlace"|"youngNoCar"|"multigen"
  |"disability"|"student"|"remoteWorker"|"shiftWorker"|"firstTimeBuyer";
export type Dim = "commute"|"transit"|"schools"|"health"|"parks"|"daily"|"calm"|"afford"|"access"|"night";
export type Typology = "adu"|"duplex"|"triplex"|"townhome"|"smallMf"|"midRise";
export interface Persona {
  id: PersonaId; label: string; persons: number; bedrooms: number; tenure: "rent"|"own"; amiPct: number;
  income: number; maxHousingCost: number; car: boolean; basket: "low"|"high"|"campus";
  commuteMode: "transit"|"best"|"transitNight"; weights: Record<Dim, number>;   // VALUE 0..5
  suit: Record<Typology, number>;                                              // VALUE 0..1
  chasType?: "smallFamily"|"largeFamily"|"elderlyFamily"|"elderlyNonFamily"|"other"; sources: string[];
}
const W = (c:number,tr:number,sc:number,he:number,pa:number,da:number,ca:number,af:number,ac:number,ni:number):Record<Dim,number> =>
  ({commute:c,transit:tr,schools:sc,health:he,parks:pa,daily:da,calm:ca,afford:af,access:ac,night:ni});
const S = (adu:number,duplex:number,triplex:number,townhome:number,smallMf:number,midRise:number) => ({adu,duplex,triplex,townhome,smallMf,midRise});
export const PERSONAS: Persona[] = [
 {id:"familyKids",label:"Family, school-age kids",persons:4,bedrooms:3,tenure:"rent",amiPct:80,income:88300,maxHousingCost:2208,car:true,basket:"high",commuteMode:"best",
  weights:W(3,1,5,2,4,3,4,4,1,0),suit:S(.1,.8,.6,1,.4,.3),chasType:"smallFamily",sources:["NAR2025Gen:Ex2-7","NAR2023CTPS"]},
 {id:"singleParent",label:"Single parent, 50% AMI",persons:3,bedrooms:2,tenure:"rent",amiPct:50,income:49700,maxHousingCost:1243,car:false,basket:"low",commuteMode:"transit",
  weights:W(4,4,4,3,3,4,3,5,1,1),suit:S(.3,.8,.8,.6,.9,.6),chasType:"smallFamily",sources:["CHAS:T7","ACS:B11005"]},
 {id:"seniorInPlace",label:"Senior aging in place / downsizing",persons:1,bedrooms:1,tenure:"own",amiPct:50,income:38650,maxHousingCost:966,car:false,basket:"high",commuteMode:"transit",
  weights:W(0,3,0,5,2,5,4,4,5,0),suit:S(1,.4,.4,.2,.7,.9),chasType:"elderlyNonFamily",sources:["AARP2024HCPS","NAR2025Gen:Ex2-7","HUD-AHS-Access"]},
 {id:"youngNoCar",label:"Young worker, no car",persons:1,bedrooms:1,tenure:"rent",amiPct:60,income:46380,maxHousingCost:1160,car:false,basket:"high",commuteMode:"transit",
  weights:W(4,5,0,1,2,4,2,5,0,3),suit:S(.7,.5,.6,.2,1,.9),chasType:"other",sources:["NAR2023CTPS","NAR2025Gen:Ex2-7","ACS:B25044"]},
 {id:"multigen",label:"Multigenerational family",persons:6,bedrooms:4,tenure:"rent",amiPct:60,income:76860,maxHousingCost:1922,car:true,basket:"low",commuteMode:"best",
  weights:W(3,3,4,4,3,3,3,5,3,1),suit:S(.8,1,.7,.8,.3,.2),chasType:"largeFamily",sources:["Pew2022Multigen","NAR2025Gen:Ex1-5","CHAS:T10"]},
 {id:"disability",label:"Person with a mobility disability",persons:1,bedrooms:1,tenure:"rent",amiPct:30,income:23200,maxHousingCost:580,car:false,basket:"low",commuteMode:"transit",
  weights:W(2,5,0,5,1,4,2,5,5,1),suit:S(.6,.3,.3,.1,.7,1),sources:["HUD-AHS-Access","CHAS:T6","ACS:B18101"]},
 {id:"student",label:"Student (shared)",persons:1,bedrooms:1,tenure:"rent",amiPct:30,income:23200,maxHousingCost:580,car:false,basket:"campus",commuteMode:"transit",
  weights:W(5,4,0,1,1,3,2,5,0,3),suit:S(.5,.7,.9,.4,.9,.6),sources:["VALUE"]},
 {id:"remoteWorker",label:"Remote-working couple",persons:2,bedrooms:2,tenure:"rent",amiPct:100,income:88400,maxHousingCost:2210,car:true,basket:"high",commuteMode:"best",
  weights:W(1,2,1,2,4,4,4,3,0,0),suit:S(.5,.8,.7,1,.7,.6),sources:["Pew2023Remote","ACS:B08301"]},
 {id:"shiftWorker",label:"Essential / shift worker",persons:2,bedrooms:2,tenure:"rent",amiPct:50,income:44200,maxHousingCost:1105,car:false,basket:"low",commuteMode:"transitNight",
  weights:W(5,3,1,2,1,3,2,5,0,5),suit:S(.6,.8,.8,.4,.9,.6),sources:["BLS-Flex-2017-18","LODES2023:SE01-02","PRT-GTFS"]},
 {id:"firstTimeBuyer",label:"First-time buyer",persons:3,bedrooms:3,tenure:"own",amiPct:80,income:79500,maxHousingCost:1988,car:true,basket:"high",commuteMode:"best",
  weights:W(3,2,3,1,3,3,4,5,0,0),suit:S(.2,.9,.5,1,.3,.2),chasType:"smallFamily",sources:["NAR2025Profile","NAR2025Gen:Ex2-7"]},
];
export const CAMPUS_BASKET = { oakland: 1 };  // Pitt/CMU; add Duquesne (Bluff) as its own center if needed
```

---

## 6. Suburban jobs without suburban parcels

- **Parcels stay City-only.** Suburban job centers are just *destinations*: 14 points (6 suburban) in `job_centers.json`, with WAC totals and wage mix, and a travel-time column in `tt_bg.json`. No suburban parcels, zoning or scoring are needed.
- Clip the OSM network to a bbox that covers Cranberry, the airport and Southpointe (above), so routes that leave the city are real. PRT GTFS includes the suburban routes (for example `28X` Airport Flyer, `G2` West Busway, `O1` Ross Flyer). It has **no stops near Cranberry (Butler Co.) or Southpointe (Washington Co.)**, which other operators serve and which aren't in our feed. Show those as "no PRT service; car or other operator" rather than as missing data.
- **County context (optional, cheap):** one choropleth of WAC jobs per tract for Allegheny plus Butler/Washington tracts that touch the centers. Use it only as a faint backdrop layer, with the label "Where jobs are (LODES 2023)". Also show a flow arc from the selected neighborhood to its top 5 destinations (LODES OD aggregated tract → center). Both are static JSON under 200 KB.
- In the UI, when the chosen workplace is suburban and transit time exceeds 75 min or there's no path, say so plainly ("No transit trip under 2 h, so car-dependent") rather than scoring 0 silently. That result is itself an equity finding: 53% of low-wage residents' jobs are outside the city.

---

## Sources (checked live 2026-09-26)

- LODES 8: [directory](https://lehd.ces.census.gov/data/lodes/LODES8/pa/), [tech doc 8.4](https://lehd.ces.census.gov/data/lodes/LODES8/LODESTechDoc8.4.pdf)
- [Census Reporter API](https://api.censusreporter.org/1.0/table/B25044); [2020 DHC PCT14 metadata](https://api.census.gov/data/2020/dec/dhc/groups/PCT14.json)
- [HUD CHAS](https://www.huduser.gov/portal/datasets/cp.html) and [data dictionary 2018–22](https://www.huduser.gov/portal/datasets/cp/CHAS-data-dictionary-18-22.xlsx)
- [UMN Access Across America: Transit 2024 Data](https://hdl.handle.net/11299/277775) (CC BY-NC 4.0); [AAA program page](https://access.umn.edu/ao-research/aaa)
- [r5py](https://r5py.readthedocs.io/) (JDK 21 per [installation docs](https://github.com/r5py/r5py)); [OpenTripPlanner](https://docs.opentripplanner.org/en/latest/); [Mapbox Matrix](https://docs.mapbox.com/api/navigation/matrix/) and [pricing](https://www.mapbox.com/pricing); [TravelTime pricing](https://traveltime.com/pricing); [OSRM demo policy](https://github.com/Project-OSRM/osrm-backend/wiki/Demo-server); [Geofabrik PA](https://download.geofabrik.de/north-america/us/pennsylvania.html)
- WPRDC: [PPS enrollment](https://data.wprdc.org/dataset/pittsburgh-public-schools-enrollment), [PPS feeder boundaries](https://data.wprdc.org/dataset/pittsburgh-public-schools-feeder-pattern-attendance-boundaries), [State of Aging survey](https://data.wprdc.org/dataset/state-of-aging-in-allegheny-county-survey); [Allegheny County AAA plan 2024–28](https://analytics.alleghenycounty.us/wp-content/uploads/2025/02/four-year-plan-2024-2028.pdf)
- Surveys: [NAR 2025 Generational Trends](https://cms.nar.realtor/sites/default/files/2025-03/2025-home-buyers-and-sellers-generational-trends-report-04-01-2025.pdf), [NAR 2023 CTPS](https://www.nar.realtor/sites/default/files/documents/2023-community-and-transportation-preferences-survey-slides-06-20-2023.pdf), [NAR 2025 Profile takeaways](https://www.nar.realtor/news/economists-outlook/top-10-takeaways-from-nars-2025-profile-of-home-buyers-and-sellers), [AARP 2024 HCPS](https://www.aarp.org/pri/topics/livable-communities/housing/2024-home-community-preferences/), [Pew multigenerational 2022](https://www.pewresearch.org/social-trends/2022/03/24/financial-issues-top-the-list-of-reasons-u-s-adults-live-in-multigenerational-homes/), [Pew remote work 2023](https://www.pewresearch.org/short-reads/2023/03/30/about-a-third-of-us-workers-who-can-work-from-home-do-so-all-the-time/), [HUD AHS accessibility](https://www.huduser.gov/portal/publications/mdrt/accessibility-america-housingStock.html), [BLS job flexibilities](https://www.bls.gov/news.release/flex2.nr0.htm) (bot wall on curl; opens in a browser)
