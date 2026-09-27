# Commercial, research and open-source tools

**Type:** landscape
**One line:** Existing products, research models and open repos that do parcel zoning lookup, envelopes, pro formas, likelihood models or policy simulation, with licenses.
**Why we care:** Parcel lookup plus zoning summary is the baseline everywhere; knowing what exists tells us what is table stakes, what has a precedent, and what code we may legally reuse.
**Last checked:** 2026-09-26

Most commercial entries below come from search snippets or marketing pages (`[skimmed]`). Coverage claims such as "covers Pittsburgh" are the vendors' own.

## Commercial parcel and zoning products

| Tool | What it does (per source) | Pittsburgh? | Price | Tag |
|---|---|---|---|---|
| [Zoneomics](https://www.zoneomics.com/zoning-maps/pennsylvania/pittsburgh) | Pittsburgh page lists zone codes, setbacks, height, coverage, density, lot dimensions, uses, parking, 24-hour zoning reports. Claims 23,500+ cities; supplies zoning data inside TestFit and Autodesk Forma ([TestFit integration](https://www.testfit.io/integrations-zoneomics) `[skimmed]`) | Yes; an [Allegheny County page](https://www.zoneomics.com/zoning-maps/pennsylvania/allegheny-county) also exists `[skimmed]` | Subscription / "contact us", no rates | `[read]` |
| [Rescope](https://www.rescope.co/) | Address → a per-parcel rule table (district, setbacks, height, FAR, coverage, uses as Permitted/Conditional/Prohibited, overlays), with **red/orange/green flags**, "every rule cited to source", and a claimed "30s go/no-go". Uncertainty is handled only by citations plus "confirm with the planning department". No pro forma is visible. The SME called it the closest analogue (S14). Case studies look templated; unverified. → [r9 sweep](../../sweeps/r9-sme-pointed-resources.md), [excerpt](../../sources/rescope-2026-09-27-site-claims.md) | **No**: claims 5 California jurisdictions | Not stated | `[read]` (marketing site only; product not tried) |
| [Regrid](https://app.regrid.com/store/us/pa/allegheny) | Sells Allegheny County parcels with a "Standardized Zoning" schema | Yes | Per county/state/nation | `[skimmed]` |
| [Deepblocks](https://buildingtech.pro/tools/deepblocks) | Per-parcel development capacity | Not stated | Snippet: $99–$5,999/month, no free tier | `[skimmed]` |
| [Gridics / ZoneIQ](https://gridics.com/zoneiq/) | Zoning and massing, sold mainly to cities | Not stated | Municipal contracts, no public prices | `[skimmed]` |
| TestFit | Site yield and feasibility; uses Zoneomics data | Via Zoneomics | Not found | `[skimmed]` (no own URL in sweep) |
| [Symbium](https://www.govtech.com/biz/Symbium-Opens-Service-for-Analyzing-Zoning-Building-Codes.html) | "Computational law" zoning rules; carries an "outside company, may not be accurate" disclaimer | Mostly California | Not found | `[skimmed]` |
| [Archistar](https://www.archistar.ai/aiprecheck/) | AI plan pre-checks (Austin, LA); markets lot combining in Australia ([blog](https://www.archistar.ai/blog/combining-two-lots-for-development-the-three-steps/)) | Not stated | Not found | `[skimmed]` |
| [Envelope.city](https://www.siqizhu.net/envelope-city/) | NYC envelope and air-rights site search | NYC | Not found | `[skimmed]` |
| [MapCraft](https://mapcraft.io/) | Commercial parcel feasibility; partnered on Terner SB 9 model | Not stated | Not found | `[skimmed]` |
| PermitFlow | Permit paperwork; reportedly plans AI timeline prediction (marketing claim) | Not stated | Not found | `[skimmed]` |
| Searchland (UK) | Planning approval rates by area | UK | Not found | `[skimmed]` |

**CivCheck (AI permit pre-screening).** A Seattle study found completeness checks 87% accurate and code-compliance checks 92%; Seattle concluded coverage mattered more than accuracy and recommended automating completeness checks only. Honolulu and LA County reportedly run CivCheck and Archistar in production ([Seattle Innovation Hub](https://innovation-hub.seattle.gov/2026/06/17/ai-construction-permitting-seattle-civcheck-study/) `[skimmed]`; the sweep says it checked this "in this session" but does not say it read the full page).

**The gap the round-1 sweep describes** (its inference, not a vendor fact): the commercial tools target private developers chasing market-rate yield; none found combined a free public-sector tool, source-cited flags, Pittsburgh-specific constraints (landslide slopes, tangled title, the 2025 reform, IZ overlay) and program-tied financing assumptions ([r1 sweep](../../sweeps/r1-prior-art-proforma-and-practitioner-barriers.md)).

## Research models and public calculators

- **[Terner Center Housing Development Dashboard](https://ternercenter.berkeley.edu/development-calculator-dashboard/)** `[read]`: free beta calculator estimating the probability a project gets built from IRR. Inputs: target return, land cost, rents/prices, affordability requirements, height, parking, permitting time, discretionary approvals. Defaults set for north Oakland, CA. Closest analog to a Track 1 pro forma.
- **[Terner "Making It Pencil" / interactive tool](https://www.ternercenter.app/demystifying-development-math)** `[skimmed]`.
- **[Terner Housing Policy Simulator](https://www.ternerlabs.org/terner-housing-policy-simulator-full-methodology)** `[read]`: scores up to 60 hypothetical projects per parcel, estimates development probability, and exposes levers (parking, zoning, fees, economic scenario). Typologies are low-, mid- and high-rise only. Code availability not stated.
- **[Terner / MapCraft SB 9 parcel feasibility model](https://ternercenter.berkeley.edu/research-and-policy/duplexes-lot-split-sb-9/)** `[skimmed]`.
- **Housing Element likelihood models (backtests against permits):** LA regression on 2015–19 permits ([Terner](https://ternercenter.berkeley.edu/research-and-policy/stronger-housing-element-los-angeles/) `[skimmed]`; LA appendix PDF returned 403); SF logistic regression ([Appendix B2](https://sfplanning.s3.amazonaws.com/archives/sfhousingelement.org/files/AppendixB2.pdf) `[skimmed]`); [UCLA Lewis RHNAmaps](https://lewis.ucla.edu/RHNAmaps) `[read]`.
- **[National Zoning Atlas, Pennsylvania](https://www.zoningatlas.org/pennsylvania)** `[read]`: actively mapping the Pittsburgh metro; "Zoning Report: Pittsburgh" due fall 2026. Download availability unconfirmed. Could be a source, a partner, or an overlap on the zoning layer.
- **Scenario and suitability platforms (mostly Track 3):** [ArcGIS Urban suitability](https://doc.arcgis.com/en/urban/latest/help/help-suitability.htm) `[skimmed]` (0–10 rescale, weighted sum, scenario switcher; proprietary); [CommunityViz Scenario 360](https://communityviz.city-explained.com/communityviz/s360webhelp4-3/getting_started/about_scenario_360_decision_tools.htm) `[skimmed]` (live re-weighting; proprietary); [Envision Tomorrow](http://envisiontomorrow.org/building-prototypes) `[skimmed]` (prototype + ROI spreadsheet, described as open access, license unconfirmed); [ABAG Middle Housing Feasibility Tool](https://abag.ca.gov/our-work/housing/regional-housing-technical-assistance/peer-cohorts-work-groups/middle-housing) `[read]` (password-protected, Bay Area only); [Opticos Missing Middle collection](https://opticosdesign.com/the-missing-middle-housing-collection/) `[skimmed]` (proprietary). See [typology prototypes](../track3/typology-prototypes.md).

## Open-source repos and licenses

License, stars and last push were read from the GitHub API on 2026-09-26 unless noted.

| Repo | What it does | License | Last push | Reuse |
|---|---|---|---|---|
| [hoffmanap/housingstrategy](https://github.com/hoffmanap/housingstrategy) `[read]` | El Paso parcel-level policy simulator: ADU, lot split, missing middle, parking toggles; conservative vs upper-bound figures; runs in the browser | MIT | 2026-09-21 | Code reusable with README credit |
| [UDST/developer](https://github.com/UDST/developer) `[read]` | UrbanSim square-foot pro forma | BSD-3-Clause | last commit 2021-10-19; last push 2023-08-07 | Code reusable with README credit |
| [CrepuscularCremini/MissingMiddleHousingAnalysis](https://github.com/CrepuscularCremini/MissingMiddleHousingAnalysis) `[read]` | Parcel geometry checks (ADU fits, new build fits, conversion). README says it ignores regulations | MIT | 2022-12-13 | Code reusable |
| [prohousingpgh/pittsburgh_iz](https://github.com/prohousingpgh/pittsburgh_iz) `[read]` | See [Pittsburgh civic tools](pittsburgh-civic-tools.md) | CC BY-NC 4.0 (GitHub API reports NOASSERTION; LICENSE file and README say CC BY-NC 4.0) | 2025-01-27 | Data with attribution, non-commercial |
| [YIMBYdata/housing-elements](https://github.com/YIMBYdata/housing-elements) `[read]` | Matches CA site inventories to 2015–19 permits by APN and spatial buffer | None | 2022-06-20 | Method/ideas only |
| [MisterClean/building-viz](https://github.com/MisterClean/building-viz) `[read]` | Browser 3D envelope for missing-middle types, Compare mode, shareable scenario URLs | None | 2026-02-08 | Ideas only |
| [urban-displacement/displacement-typologies](https://github.com/urban-displacement/displacement-typologies) `[read]` | Tract displacement/gentrification typology | GPL-3.0 | 2023-08-20 | Copyleft; reimplement method or accept GPL |
| [CalthorpeAnalytics/urbanfootprint](https://github.com/CalthorpeAnalytics/urbanfootprint) `[read]` | v1.5 scenario platform, "Place Types" | GPL-3.0 | 2018-06-08 | Copyleft, abandoned |
| [skysolutionsllc/zoning-feasibility-tool](https://github.com/skysolutionsllc/zoning-feasibility-tool), [Snehasish3000/ParcelAlpha](https://github.com/Snehasish3000/ParcelAlpha) `[skimmed]` | Examples of many small 2026 "AI zoning feasibility" repos, 0–1 stars | Not checked | Not checked | Not checked |

Hackathon repos (UpZone, ZoneMind) are in [hackathon precedents](hackathon-precedents.md). Pittsburgh repos (WPRDC) are in [Pittsburgh civic tools](pittsburgh-civic-tools.md).

⚠ Minor discrepancy: the round-3 sweep gave UDST/developer's "last commit 2021." The API shows the last commit 2021-10-19 but a last push of 2023-08-07. Both are consistent; "last commit" is the relevant one.

## Open questions
- Does UrbanForm, LandTech, Envelope or PermitFlow cover Pittsburgh in depth? The round-1 sweep flagged these from general knowledge only and did not verify.
- NYC ZoLa, Philadelphia Atlas and UrbanFootprint (current commercial) as parcel-lookup analogs were cited from general knowledge, not fetched.
- Is National Zoning Atlas Pittsburgh data downloadable, and when exactly does its report publish?
- Does Zoneomics's Pittsburgh data reflect the May 2025 lot-size amendments? See [dimensional standards](../policy/dimensional-standards-and-use-table.md).
- Is GPL-3.0 code acceptable under the hackathon rules? The packet only says to list third-party code in the README.

## Connects to
- [Hackathon precedents](hackathon-precedents.md): what hackathon teams built with similar ideas
- [Pittsburgh civic tools](pittsburgh-civic-tools.md): local data explorers
- [Pro forma](../methods/pro-forma.md): Terner dashboard, UDST/developer
- [Backtest and calibration](../methods/backtest-and-calibration.md): Housing Element likelihood models, YIMBYdata
- [Score design options](../methods/score-design-options.md): weighted-sum and scenario patterns
- [Typology prototypes](../track3/typology-prototypes.md): Opticos, ABAG, Envision Tomorrow
- [Displacement and equity](../track3/displacement-and-equity.md): UDP typologies
- [Rules and deliverables](../challenge/rules-and-deliverables.md): third-party code must be listed in the README
- [Landscape README](README.md): the common / less common / not found summary

## Sources
- [Zoneomics Pittsburgh](https://www.zoneomics.com/zoning-maps/pennsylvania/pittsburgh) `[read]` *(accessed 2026-09-26)*
- [Zoneomics Allegheny County](https://www.zoneomics.com/zoning-maps/pennsylvania/allegheny-county) `[skimmed]` *(accessed 2026-09-26)*
- [TestFit–Zoneomics integration](https://www.testfit.io/integrations-zoneomics) `[skimmed]` *(accessed 2026-09-26)*
- [Regrid Allegheny store](https://app.regrid.com/store/us/pa/allegheny) `[skimmed]` *(accessed 2026-09-26)*
- [Deepblocks listing](https://buildingtech.pro/tools/deepblocks) `[skimmed]` *(accessed 2026-09-26)*
- [Gridics ZoneIQ](https://gridics.com/zoneiq/) `[skimmed]` *(accessed 2026-09-26)*
- [Symbium (GovTech)](https://www.govtech.com/biz/Symbium-Opens-Service-for-Analyzing-Zoning-Building-Codes.html) `[skimmed]` *(accessed 2026-09-26)*
- [Archistar AI PreCheck](https://www.archistar.ai/aiprecheck/) `[skimmed]` *(accessed 2026-09-26)*
- [Archistar lot combining blog](https://www.archistar.ai/blog/combining-two-lots-for-development-the-three-steps/) `[skimmed]` *(accessed 2026-09-26)*
- [Envelope.city](https://www.siqizhu.net/envelope-city/) `[skimmed]` *(accessed 2026-09-26)*
- [MapCraft](https://mapcraft.io/) `[skimmed]` *(accessed 2026-09-26)*
- [Seattle CivCheck study](https://innovation-hub.seattle.gov/2026/06/17/ai-construction-permitting-seattle-civcheck-study/) `[skimmed]` *(accessed 2026-09-26)*
- [Terner Development Calculator Dashboard](https://ternercenter.berkeley.edu/development-calculator-dashboard/) `[read]` *(accessed 2026-09-26)*
- [Terner Making It Pencil](https://www.ternercenter.app/demystifying-development-math) `[skimmed]` *(accessed 2026-09-26)*
- [Terner Housing Policy Simulator methodology](https://www.ternerlabs.org/terner-housing-policy-simulator-full-methodology) `[read]` *(accessed 2026-09-26)*
- [Terner SB 9 model](https://ternercenter.berkeley.edu/research-and-policy/duplexes-lot-split-sb-9/) `[skimmed]` *(accessed 2026-09-26)*
- [Terner, LA Housing Element](https://ternercenter.berkeley.edu/research-and-policy/stronger-housing-element-los-angeles/) `[skimmed]` *(accessed 2026-09-26)*
- [SF Housing Element Appendix B2](https://sfplanning.s3.amazonaws.com/archives/sfhousingelement.org/files/AppendixB2.pdf) `[skimmed]` *(accessed 2026-09-26)*
- [UCLA Lewis RHNAmaps](https://lewis.ucla.edu/RHNAmaps) `[read]` *(accessed 2026-09-26)*
- [National Zoning Atlas, Pennsylvania](https://www.zoningatlas.org/pennsylvania) `[read]` *(accessed 2026-09-26)*
- [ArcGIS Urban suitability](https://doc.arcgis.com/en/urban/latest/help/help-suitability.htm) `[skimmed]` *(accessed 2026-09-26)*
- [CommunityViz Scenario 360](https://communityviz.city-explained.com/communityviz/s360webhelp4-3/getting_started/about_scenario_360_decision_tools.htm) `[skimmed]` *(accessed 2026-09-26)*
- [Envision Tomorrow prototypes](http://envisiontomorrow.org/building-prototypes) `[skimmed]` *(accessed 2026-09-26)*
- [ABAG Middle Housing](https://abag.ca.gov/our-work/housing/regional-housing-technical-assistance/peer-cohorts-work-groups/middle-housing) `[read]` *(accessed 2026-09-26)*
- [Opticos Missing Middle collection](https://opticosdesign.com/the-missing-middle-housing-collection/) `[skimmed]` *(accessed 2026-09-26)*
- GitHub repos (license/push via GitHub API): [hoffmanap/housingstrategy](https://github.com/hoffmanap/housingstrategy), [UDST/developer](https://github.com/UDST/developer), [CrepuscularCremini/MissingMiddleHousingAnalysis](https://github.com/CrepuscularCremini/MissingMiddleHousingAnalysis), [prohousingpgh/pittsburgh_iz](https://github.com/prohousingpgh/pittsburgh_iz), [YIMBYdata/housing-elements](https://github.com/YIMBYdata/housing-elements), [MisterClean/building-viz](https://github.com/MisterClean/building-viz), [urban-displacement/displacement-typologies](https://github.com/urban-displacement/displacement-typologies), [CalthorpeAnalytics/urbanfootprint](https://github.com/CalthorpeAnalytics/urbanfootprint) `[read]` *(accessed 2026-09-26)*
- [skysolutionsllc/zoning-feasibility-tool](https://github.com/skysolutionsllc/zoning-feasibility-tool), [Snehasish3000/ParcelAlpha](https://github.com/Snehasish3000/ParcelAlpha) `[skimmed]` *(accessed 2026-09-26)*
- Sweep: [../../sweeps/r1-prior-art-proforma-and-practitioner-barriers.md](../../sweeps/r1-prior-art-proforma-and-practitioner-barriers.md)
- Sweep: [../../sweeps/r3-reality-check-existing-tools.md](../../sweeps/r3-reality-check-existing-tools.md)
- Sweep: [../../sweeps/r3-alternative-framings.md](../../sweeps/r3-alternative-framings.md)
- Sweep: [../../sweeps/r4-track3-prior-art-and-hackathons.md](../../sweeps/r4-track3-prior-art-and-hackathons.md)
