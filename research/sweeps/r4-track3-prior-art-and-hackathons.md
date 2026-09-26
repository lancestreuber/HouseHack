# Sweep: Track 3 prior art, related hackathons, other public repos

**Round 4** · 2026-09-26 · single research subagent, web search and fetch plus live endpoint probes

> Archived at full fidelity, exactly as the agent reported it. Its tags are its own: some sweeps use [V]/[S]/[U] and some use [F]/[S]. The paper maps these onto `[read]` / `[skimmed]` / `[found]` / `[inaccessible]`. Local scratch paths have been replaced with `<scratch>`. Treat claims here as leads, and check the paper and the corrections log before citing.

---

## Prior art for a combined Track 1 + Track 3 entry

Each source is marked with how I checked it: **[F]** means I fetched the page or repo myself. **[S]** means I only saw a search-result summary, so treat it as unverified.

### Prior art table

| Name | Type | What it does | Relevance to T1+T3 | Reusable? |
|---|---|---|---|---|
| **ZoneMind** (Code4City @ NYU, Apr 2026, 2nd place) [F] [site](https://www.code4city.com/), [repo](https://github.com/William7042/ZoneMInd) | Hackathon | You type a rezoning in plain English. Claude Haiku parses it, GeoPandas simulates it over about 70k Manhattan parcels (MapPLUTO), each affected parcel gets a 0–10 displacement score, and Claude Sonnet writes a policy brief. Built with Streamlit and PyDeck. | **Closest prior art I found to T3.** It covers upzoning, unit yield and displacement. It has no typology matching, no carbon and no adjustable weights. | Public code, no license |
| **Seattle PACT-athon** (Oct 2025) [F] [post](http://innovation-hub.seattle.gov/2025/10/28/community-innovation-pactathon-permitting/) | Hackathon | 1st place, Permit Predictor: predicts permit timelines with confidence scores. 2nd, a permit chatbot and dashboard. 3rd, PreAssess: RAG over the municipal code producing plain-language checklists. Judges praised "illuminate the process… as early as possible". The 3rd-place team said they spent 1.5 hours defining the problem and 30 minutes coding. | T1 only (permitting and code) | Tools named, no repos found |
| **UpZone** (AEC Tech NYC 2024, Best Breakout + Hacker's Choice) [F] [archive](https://www.aectech.us/hackathon-archive), [repo](https://github.com/ssajedi/upzone) | Hackathon | LLM plus spatial algorithms turn NYC zoning into a buildable 3D envelope that exports to Rhino | T1 (what fits on a lot) | Repo has no license |
| **Zone In** (AEC Tech Chicago 2025, Most Collaborative) [F] same archive | Hackathon | Enter an address, get a plain summary of what you can build under Chicago zoning | T1 | Unknown |
| **Anthill / PreVu** (AEC Tech 2025) [F] same archive | Hackathon | AI-assisted embodied-carbon analysis for structures and early design. Anthill won Best Overall in Chicago. | Carbon side of T3, but per building, not per typology per place | Unknown |
| **YIMBY AI** (Seattle Climate Hack, May 2025, $5k) [S] [GeekWire](https://www.geekwire.com/2025/yimby-ai-wins-seattle-climate-hackathon-with-idea-to-support-development-of-backyard-units/) | Hackathon | Helps homeowners picture ADUs or multifamily units on their lot, with regulatory info | Covers the ADU slice of T1/T3 | Unknown |
| **NJ AI affordability hackathon** (Jan 2026) [S] [NJBiz](https://njbmagazine.com/njb-news-now/nj-students-tackle-affordability-in-statewide-ai-hackathon/) | Hackathon | Winning team pitched "AI-powered zoning intelligence" and ML permitting | Pitch deck only | No |
| **Terner Housing Policy Simulator** [F] [methodology](https://www.ternerlabs.org/terner-housing-policy-simulator-full-methodology) | Research tool | Scores up to 60 hypothetical projects per parcel, estimates development probability, and lets you move levers: parking, zoning, fees, economic scenario. Typologies are low-, mid- and high-rise only. | Strong model for T1 feasibility and scenario comparison. It has no equity, carbon or value weights, and no small missing-middle types. | Code not public (methodology page doesn't say) |
| **Urban Displacement Project typologies** [F] [repo](https://github.com/urban-displacement/displacement-typologies) | Open code | Sorts census tracts into 8 displacement/gentrification stages using ACS and Zillow data | The displacement-risk layer for T3 | **GPL-3.0**. Last push was 2023. |
| **Pittsburgh Neighborhood Project** [F] [post](https://pittsburghneighborhoodproject.blog/2021/03/01/gentrification-and-displacement-in-pittsburgh/) | Local analysis | UDP-style gentrification analysis of Allegheny tracts, 2000 to 2015–19. Found East End and Northside tracts gentrified, with poor Black residents most affected. | Pittsburgh baseline and a way to check our displacement layer | ArcGIS map exists; raw data download not confirmed |
| **Pittsburgh/Allegheny MVA 2021** (Reinvestment Fund) [S] [WPRDC](https://data.wprdc.org/dataset/market-value-analysis-2021) | Local typology | Clusters block groups into 10 market types | A ready-made demand/market axis, and something Pittsburgh stakeholders already know | Open data on WPRDC |
| **UrbanFootprint v1.5** [F] [repo](https://github.com/CalthorpeAnalytics/urbanfootprint) | Scenario platform | "Place Types" or building types are painted onto land to produce scenario indicators | The typology-to-place idea is the same as T3 | **GPL-3.0**, abandoned (last push 2018). The current product is commercial. |
| **Envision Tomorrow** (Fregonese) [S] [site](http://envisiontomorrow.org/building-prototypes) | Scenario tool | Local building prototypes with an ROI model are combined into development types and painted as scenarios. All formulas sit in a visible spreadsheet linked to ArcGIS. | Best precedent for putting assumptions in view | Described as "open-access/open source". The site pages returned empty, so the license is unconfirmed. |
| **CommunityViz Scenario 360** [S] [help](https://communityviz.city-explained.com/communityviz/s360webhelp4-3/getting_started/about_scenario_360_decision_tools.htm) | ArcGIS add-in | Suitability analysis where you re-weight factors and results update live | The live re-weighting pattern for T3 | Proprietary. Now owned by Texas A&M AgriLife. |
| **ArcGIS Urban suitability** [S] [docs](https://doc.arcgis.com/en/urban/latest/help/help-suitability.htm) | Commercial | Each criterion rescaled to 0–10, then a weighted sum, with a scenario switcher to compare | The standard weighted-sum-plus-scenario-toggle interface | Proprietary |
| **ABAG Middle Housing Feasibility Tool** (ECONorthwest, Opticos) [F] [page](https://abag.ca.gov/our-work/housing/regional-housing-technical-assistance/peer-cohorts-work-groups/middle-housing) | Web tool | Price estimates, viable lot sizes and maximum land cost for each missing-middle type | Directly relevant to typology feasibility | Password-protected, Bay Area jurisdictions only |
| **Opticos Missing Middle kit** [S] [site](https://opticosdesign.com/the-missing-middle-housing-collection/) | Commercial catalog | Prototypes plus a "test fit" feasibility process | The typology vocabulary judges will probably expect | Proprietary |
| **CrepuscularCremini/MissingMiddleHousingAnalysis** [F] [repo](https://github.com/CrepuscularCremini/MissingMiddleHousingAnalysis) | Open code | Parcel-level geometric checks: can an ADU be added, can a new build fit, can a building be converted | Reusable T1 geometry logic. Its README says it ignores regulations. | **MIT** |
| **MisterClean/building-viz** (Feb 2026) [F] [repo](https://github.com/MisterClean/building-viz) | Open code | Browser 3D envelope for missing-middle types, with Compare mode and shareable scenario URLs | A model for the scenario-comparison interface | No license |
| **CNT H+T Index** [S] [download](https://htaindex.cnt.org/download/) | Data | Housing plus transportation cost by neighborhood | Affordability and access axis | Free download |
| **CoolClimate** [S] [API](https://coolclimate.berkeley.edu/api) | Data/API | Household carbon footprint by ZIP, including transport | Operational and transport carbon by place | Free API key, rate-limited |
| **BfCA EMBARC / BEAM** [F] [report](https://www.buildersforclimateaction.org/uploads/1/5/9/3/15931000/bfca_pbc-embarc_report-web.pdf) | Study + free tool | 503 as-built homes in the Greater Toronto/Hamilton area. Materials-only (A1–A3) carbon averaged 40 t CO2e per unit. Townhouses are lowest per unit, mostly because they are smaller. | Carbon priors by typology | BEAM is free |
| **Local Housing Solutions needs tool** [S] [link](https://www.localhousingsolutions.org/housing-needs-assessment/) | Data | Housing needs reports for every jurisdiction, built with PolicyMap | Demand context | Free to view |

The BfCA report has one finding that matters for T3. **Which typology ranks best on carbon per m² flips depending on how floor area is defined.** Measured by heated floor area, semi-detached homes are lowest. Measured by a municipal gross-area definition, townhouses are lowest. The report says policymakers "must weigh" which metric to use. That is a normalization choice (per m², per unit, per resident) and it is a value judgment, which is exactly the data-vs-values split T3 asks for.

### Other repos for this hackathon (created since 2026-09-01)

All of these were created 2026-09-26 unless noted:
- **lancestreuber/HouseHack**: this repo.
- **het-sheth/ai-housing-hackathon-wiki**: research wiki with a 60-entry data catalog. Its README says "No product design or stack is approved yet."
- **Run-Disc/HomeSignal**: Track 2, a Next.js observatory over Pittsburgh PLI permit data. It has code, tests and a LIMITATIONS doc.
- **papisho/buildwise-housing-hackathon**: Track 1 site screening for small developers. It is a Next.js scaffold described as "Phase 0".
- **Becky0713/whitestown-househack** (created Sept 17): a personal Indiana house-hack underwriting tool, unrelated.

GitHub search found nothing for "Development Ease Score", "typology matchmaker", "housing typology" or "Track 3 housing". Private repos and repos not yet pushed are invisible to search, so this is not a count of competitors.

### Pittsburgh context

- **Pittsburgh 2050 comp plan** [S]: WESA reported that in Dec 2025 City Council moved to freeze the consultant contracts (Sasaki, HR&A and others) ([WESA](https://www.wesa.fm/politics-government/2025-12-22/council-freeze-pittsburgh-comprehensive-plan)). Growth scenarios had been scheduled for Aug 2025 to Apr 2026. I found no published scenario or typology maps. [Pro-Housing Pittsburgh](https://www.prohousingpgh.org/blog/five-principles-for-a-more-complete-pittsburgh) criticizes the draft for labeling about half the city low- or no-growth.
- **ADUs** [F]: the [EngagePGH page](https://engage.pittsburghpa.gov/implementing-housing-needs-assessment/accessory-dwelling-units-adus) proposes ADUs by right, up to 2 per lot, 1,000 sq ft maximum, no owner-occupancy requirement. That page dates from late 2024. A search summary claims Planning Commission recommended citywide by-right ADUs in June 2026. **I could not confirm that.**
- **Oakland Plan** has a [missing-middle strategy](https://engage.pittsburghpa.gov/oakland/strategy-missing-middle-housing) [S].
- I found **no Pittsburgh-specific typology-matching or housing-scenario tool** from CMU, Pitt UCSUR or PCRG. That is based on limited searching and is not an exhaustive check.

### Patterns that recur

1. **Hackathon winners are narrow.** They take one parcel or address and answer one question: what can I build, how long will the permit take. The code-to-plain-language pattern (RAG, checklists) wins repeatedly on the T1 side.
2. **An LLM is the interface, a deterministic model does the numbers.** ZoneMind, UpZone and PreAssess all use the LLM to parse input or write narrative, while the actual numbers come from GIS or statistics.
3. **Professional tools share one interface:** a catalog of building prototypes, painted onto places, a weighted sum of criteria rescaled to 0–10, and a switcher to compare scenarios.
4. **Displacement is scored at tract level** (UDP typology), not per parcel or per typology.
5. **Judges reward framing the problem well.** Seattle's 3rd-place team said so directly.

### Gaps where I found no examples

- Nothing matches **typology to place across several axes at once**: demand, feasibility, affordability, displacement, infrastructure, opportunity and carbon.
- No hackathon project or open tool **explicitly separates data-driven results from value weights.** ArcGIS Urban and CommunityViz expose weights but don't label the split.
- **Marginal carbon by typology in a given location** (materials plus operations plus transport) was not combined with siting anywhere I looked. The carbon tools are either per building (BEAM, Anthill) or per household (CoolClimate).
- I found **no open, maintained, permissively licensed scenario engine.** UrbanFootprint and UDP are GPL-3.0 and inactive, and UpZone, ZoneMind and building-viz have no license.
- I found **no Pittsburgh parcel-level ease or typology tool.**

### Open questions

1. Will judges weigh the Pittsburgh MVA's 10 market types or UDP-style displacement typologies more heavily as the "demand" and "displacement" baselines? Using one that stakeholders already recognize may beat something built from scratch.
2. Should the carbon axis be presented as a *choice of metric* (per m², per unit, per resident), since BfCA shows that choice changes the ranking?
3. What is Pittsburgh's current ADU and missing-middle zoning as of 2026-09? The June 2026 claim is unverified and it changes T1 feasibility for ADUs and duplexes.
4. Is GPL-3.0 code (UDP) acceptable under the hackathon's rules and licensing, or should we reimplement the method?
5. Does merging T1 and T3 fit the judging rubric, given the tracks are judged separately? The wiki's [track comparison](https://github.com/het-sheth/ai-housing-hackathon-wiki/blob/main/wiki/tracks/comparison.md) says T3 requires at least two scenarios for a real place plus adjustable weights.

Scratch file: `<scratch>/bfca.txt` (text extracted from the BfCA report). No repo files were modified.
