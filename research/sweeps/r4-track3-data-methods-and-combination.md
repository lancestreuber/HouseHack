# Sweep: Track 3 data, methods, and Track 1 + 3 combination options

**Round 4** · 2026-09-26 · single research subagent, web search and fetch plus live endpoint probes

> Archived at full fidelity, exactly as the agent reported it. The agent's own tags apply. Note: the packet's one-track rule was verified separately by the lead researcher, who read the packet text directly: *"Challenge track: Which of the three you're entering"*. Treat these claims as leads, and check the paper and the corrections log before citing.

---

**Track 1 + Track 3 combination research, Pittsburgh (as of Sept 26, 2026)**

I couldn't check the packet itself. The repo README has no packet text, only "Track and approach TBD." So the "pick ONE track" point below rests on your quote of the submission form.

## 1. Track 3 data: checked by fetching or querying today

| Need | Source and access | What I found |
|---|---|---|
| Cost burden by income and tenure | HUD CHAS tract file (summary level 140): `https://www.huduser.gov/PORTAL/datasets/cp/2018thru2022-140-csv.zip` | Newest release is 2018–2022 ACS, published Dec 23, 2025. The zip is 226 MB and unpacks to 1.26 GB across 24 tables. Table8 has **394 Allegheny tracts** (2020 tract IDs). **curl gets an empty body unless you send a browser User-Agent and Referer.** 2019–2023 returns 404. There is also a CHAS API that needs a token. |
| ACS | The Census API **does need a key now.** A keyless request redirects to `missing_key.html` with the header `X-DataWebAPI-KeyError: 1`. | **Keyless alternative:** the city's ArcGIS layer `Tracts2020_Pgh_CommunityNeed` (128 city tracts). It already includes 2022 ACS fields (median rent, home value and income, poverty, no-vehicle rate), 2020 race shares, a z-scored "Level of Need", and an Opportunity Atlas field `incomeKids_OpportunityAtlas`. `Equity_Map` (128 tracts) has race, income, education and language scores. |
| Displacement risk | **The Pittsburgh MVA is public** under CC0 on WPRDC (`market-value-analysis-2021`). The GeoJSON has 1,114 block groups, field `MVA21` with values A–J plus NC. The executive summary describes the groups as Robust, Steady, Transitional and Stressed. | The same dataset has a separate shapefile `pitts_allegheny_drr2021.zip` with a **Displacement Risk Ratio (DRR)** per block group for each 2-year window, 2014/15 to 2019/20. It has 1,100 records. The 2019/20 category field reads "Insufficient Data" for 92 of them. The data dictionary names the DRR but doesn't give the formula. |
| Urban Displacement Project | GitHub repo `urban-displacement/displacement-typologies` | **No Pittsburgh output in the repo.** It has Atlanta, Chicago, Cleveland, Denver and others. One blog says UDP has a Pittsburgh map (not checked). |
| Climate hazard | FEMA National Risk Index, tract service: `services.arcgis.com/XG15cJAlne2vxtgt/.../National_Risk_Index_Census_Tracts/FeatureServer/0` | Filtering on `STCOFIPS='42003'` returns 394 tracts. Version is "December 2025". There are per-hazard ratings, e.g. `IFLD_RISKR` (inland flood), `LNDS_RISKR` (landslide), `HWAV_RISKR` (heat wave). **Two caveats:** (a) the overall risk score grows with the value of exposed buildings, so downtown tract 020100 rates "Very High"; (b) `RESL_SCORE` was 87.17 for all three tracts I sampled, which suggests a county-level value. Use the city's landslide, undermining and flood layers at parcel scale instead. |
| Tree canopy | City layers `Tree_Coverage_Percent_by_Census_Block` (7,453 blocks, field `PercCover`) and a per-neighborhood version | Found and queried. |
| Transit | PRT GTFS: `https://www.rideprt.org/developerresources/GTFS.zip` (22.5 MB). The city also has a `HighFrequencyTransit` layer (742 stops with weekday, Saturday and Sunday trip counts). | Feed calendar runs 2026-06-28 to 2026-10-24, so it covers the event. |
| Jobs access | LODES8 PA files for 2023 exist (`pa_wac_S000_JT00_2023.csv.gz`, `pa_od_main_JT00_2023.csv.gz`) | EPA Smart Location Database MapServer responds. It has 30 layers, including distance to transit, jobs within 45 minutes by transit, and share of zero-car households. |
| Opportunity | Opportunity Atlas: `https://www2.census.gov/ces/opportunity/tract_outcomes_simple.csv` (34 MB) | Columns checked, e.g. `kfr_pooled_pooled_p25` plus standard errors. **Uses 2010 tracts**, so it needs a crosswalk. The Child Opportunity Index site returned 403 to curl. |
| H+T Index (CNT) | Download page | **Needs free registration** with a reCAPTCHA. Do it before the build starts or skip it. |
| RCO boundaries | City layer `PGHWebRCO` (45 polygons) | **The layer includes contacts' names, emails and phone numbers.** Request only `organization_name` and geometry to meet the no-PII rule. |

**Carbon numbers I checked:**
- **Operational energy, EIA RECS 2020, Table CE1.1 (I read the PDF), site energy per household:**
  - Single-family detached: 94.6 MMBtu
  - Single-family attached: 67.1
  - Apartment in a 2–4 unit building: 53.5
  - Apartment in a 5+ unit building: 33.7
  - Middle Atlantic average: 89.0
  - A search-engine summary quoted different figures (79.6, 54.1, and so on). Those were wrong, so don't copy numbers from search summaries.
- **Embodied carbon, Buildings & Cities (bc.668), Dublin, Ireland, stages A1–A5:**
  - Per m²: house 316 kgCO2e, duplex 396, apartment 437.
  - Site works add another 32% (houses), 19% (duplexes) and 12% (apartments).
  - **Per m², denser buildings have more embodied carbon.** Per unit or per bedroom the order can flip, because units are smaller and site works are shared. Say which unit you're using.
- **Driving (TRB Special Report 298, 2009):** doubling metro-wide residential density "might lower household VMT by about 5 to 12 percent," and possibly by 25% when combined with jobs and transit. That is a regional effect, not a per-parcel one. Present it as a range.

**Not checked:**
- Rankin et al. 2024 (J. Industrial Ecology, "Embodied GHG of missing middle"): the paywall returned 403. The search snippet says 5,540–39,600 kgCO2e per bedroom, and that multi-unit missing-middle buildings are lower per bedroom than single-family and mid/high-rise.
- NREL ResStock per-type numbers: not pulled.

## 2. How existing tools model "which housing type fits here"

- **Envision Tomorrow** (open; `envisiontomorrow.org/building-prototypes`, checked via search). A spreadsheet "Prototype Builder", a return-on-investment model, defines each building type by physical form (lot, footprint, stories, units, parking) and finances (cost per sq ft, rents or prices, land cost). It then asks whether that type "pencils out" under current zoning and the market.
- **UrbanFootprint, CommunityViz, Opticos Missing Middle, Terner Center:** from memory, not checked this session. They follow the same pattern: a library of building types, "paint" them onto places, then compute indicators.

**A method you could build in a weekend:**
1. For each type, record lot size and width needed, units, gross floor area, parking, cost per sq ft (label it an assumption), rent or price, RECS energy per unit, embodied carbon per m², and a driving-emissions range.
2. **Filter first.** The Track 1 zoning, slope and landslide rules decide which types are allowed at all. That part is factual.
3. **Then score the survivors** with multi-criteria analysis using weights the user sets. Every criterion carries a label (**"data"** or **"value judgment"**), a source, a vintage and an uncertainty band.
4. Show a **Pareto set**: the types no other type beats on every criterion. Then show how the ranking changes as weights move, e.g. "Duplex overtakes townhomes when climate weight exceeds 0.4." Preset weight profiles ("tenant advocate", "climate", "feasibility first") meet the "compare ≥2 scenarios" and "change weights" success criteria directly.

## 3. Combined concept and alternatives

**A. "Buildable → Fit" (per parcel).**
- **Track 1 layer:** legal and physical gates, the path to approval, friction, and a Development Ease Score.
- **Track 3 layer:** among the types that pass, score need (CHAS), displacement (DRR and MVA), access (GTFS, LODES, SLD), climate (NRI, canopy, RECS, embodied carbon), with sliders.
- **Shared data model:** parcel → block group → tract → RCO area. Zoning and constraints attach at parcel level. CHAS, NRI, Community Need and Opportunity Atlas attach at tract level. MVA and DRR attach at block-group level. Each parcel gets a list of type options, each with gate results, criterion scores, citations and labels.
- **Demo:** pick 2–3 parcels, e.g. city-owned vacant lots in different MVA groups. Compare the scenarios, move the weights, open "why it ranked this way" and "what's data vs. value."

**B. "Policy what-if" (a strong hook, checked this session).** Council Bill 2025-1545 covers citywide ADUs by right, removing parking minimums, and an Affordable Housing Bonus Program. The Planning Commission recommended it on June 2, 2026, and Council held a public hearing on **Sept 23, 2026**. I couldn't confirm whether Council has voted. Mandatory inclusionary zoning would stay in Lawrenceville, Oakland, Polish Hill and Bloomfield (WESA). A switch between "current code" and "Bill 1545 as proposed" shows which types become possible and how feasibility and fit change. Label it proposed, not law.

**C. Area level, not parcel level.** Neighborhood or tract type-mix scenarios for Track 3, with Track 1 feasibility rolled up as a supply constraint. This fits Track 3 more naturally but uses less of your parcel work.

**Where combining could hurt (my judgment):**
- The form asks for one track. Pick a primary track and frame the other as the input it needs. Option A reads as Track 3 using Track 1 as a physical-feasibility filter, or as Track 1 extended to "compare parcels for starter homes." Pick one and say it the same way in the pitch, README and form.
- Scope: two scoring systems in 39 hours. Cut the carbon detail to the three cited sources above rather than modelling it.
- Judges may be confused by two headline numbers (Ease Score and fit rank). Consider keeping Ease as a gate or tier and fit as the thing you rank.
- Geographic mismatches: 2010 vs. 2020 tracts, MVA block groups with a/b splits, city-only layers vs. county-wide ones.

## 4. Equity framing in Pittsburgh

**Checked this session:**
- Mandatory inclusionary-zoning areas are listed above.
- The MVA summary says Black residents are more likely to live in Transitional markets.
- DRR data exists at block-group level.

**Not checked (background knowledge):** the Hill District's history of urban-renewal displacement, East Liberty and Lawrenceville's gentrification, and Homewood's disinvestment and vacancy. Confirm with sources before putting any of it in the pitch.

**Framing risks:** A "densify here" ranking that scores high need, good transit and cheap vacant land will tend to land in exactly the Transitional and Stressed Black neighborhoods, i.e. the places at risk of displacement. Ways to reduce that risk:
- Treat displacement risk as a **separate warning, not a weight** that can be traded away.
- Show who benefits and who is harmed for each scenario.
- Make a high-DRR plus high-fit parcel trigger "consult the RCO and consider anti-displacement tools (community land trust, inclusionary zoning, rent-restricted units)" rather than a plain recommendation.
- Never output "this neighborhood should get X."
- List the gaps: the DRR is 2019/20 data, CHAS is 2018–22, and the tool knows nothing about community plans, lived experience or ownership intent.

## Open questions
1. The exact DRR formula (the data dictionary only names it). Reinvestment Fund might answer.
2. Whether Council has voted on Bill 2025-1545 since Sept 23.
3. The exact submission-form wording and whether judges score across tracks.
4. Whether the Child Opportunity Index or H+T are worth registering for, given that the city layer already includes an Opportunity Atlas field.

**Sources:**
- HUD CHAS: https://www.huduser.gov/portal/datasets/cp.html
- WPRDC MVA: https://data.wprdc.org/dataset/market-value-analysis-2021
- Pittsburgh ArcGIS services: https://services1.arcgis.com/YZCmUqbcsUpOKfj7/arcgis/rest/services
- FEMA NRI: https://hazards.fema.gov/nri/data-resources
- PRT developer resources: https://www.rideprt.org/business-center/developer-resources/
- LODES: https://lehd.ces.census.gov/data/lodes/LODES8/pa/
- EPA Smart Location Database: https://geodata.epa.gov/arcgis/rest/services/OA/SmartLocationDatabase/MapServer
- Opportunity Atlas: https://www2.census.gov/ces/opportunity/
- H+T Index: https://htaindex.cnt.org/download/
- RECS Table CE1.1: https://www.eia.gov/consumption/residential/data/2020/c&e/pdf/ce1.1.pdf
- Embodied carbon (Dublin): https://journal-buildingscities.org/articles/10.5334/bc.668
- Rankin 2024: https://onlinelibrary.wiley.com/doi/10.1111/jiec.13461
- TRB SR 298: https://nap.nationalacademies.org/catalog/12747
- Envision Tomorrow: http://envisiontomorrow.org/building-prototypes
- UDP repo: https://github.com/urban-displacement/displacement-typologies
- WESA, Planning Commission: https://www.wesanews.org/development-transportation/2026-06-03/pittsburgh-planning-commission-vountary-inclusionary-zoning
- Council hearing, Sept 23: https://www.pittsburghpa.gov/Business-Development/City-Planning/City-Planning-Meetings/Council-Public-Hearings/City-Council-Public-Hearing-September-23-2026

Downloads (CHAS zip, MVA GeoJSON, DRR shapefile, PRT GTFS, RECS PDFs) are in the scratchpad, `<scratch>`. No repo files were changed.
