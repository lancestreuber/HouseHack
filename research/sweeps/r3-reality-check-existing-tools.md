# Sweep: Existing tools, repos, hackathon projects; common vs less common

**Round 3** · 2026-09-26 · single research subagent, web search and fetch plus live endpoint probes

> Archived at full fidelity, exactly as the agent reported it. Its tags are its own: some sweeps use [V]/[S]/[U] and some use [F]/[S]. The paper maps these onto `[read]` / `[skimmed]` / `[found]` / `[inaccessible]`. Local scratch paths have been replaced with `<scratch>`. Treat claims here as leads, and check the paper and the corrections log before citing.

---

## Reality check: what already exists for Track 1

**How to read the labels.** **[V]** means I fetched the page or repo myself today. **[S]** means I only saw a search-engine summary and did not open the page. Star counts and dates come from the GitHub API.

### Event facts that bear on reuse [V]
- **Packet** ([Google Doc](https://docs.google.com/document/d/1L-UYid6Q0JDRH3iy4cpqGIDlZNpJspok_rPxIsILbLQ)):
  - You may not bring your own prior code.
  - Third-party open-source code, libraries and datasets are allowed, but must be listed in the README.
  - Commit history must start at kickoff.
  - Judging criteria are Problem Value, User Fit, Technical Execution, Data & AI Integrity, Actionability and Continuation Potential. Data & AI Integrity explicitly asks about uncertainty and human-in-the-loop review.
  - A limitations statement is mandatory.
  - The packet says outright that "We don't have good data on X…" is scored as a strength.
- **Track 1 brief** ([page](https://ai-horizons-2026-ai-for-housing-hackathon.brandon831577.chatgpt.site/challenges/policy-to-permit.html)):
  - Input: a parcel ID, or several parcels to compare.
  - Output: a source-grounded Development Ease Score, a plain-language explanation of the barriers, and flags.
  - It names 4 data sources: the County Real Estate Portal, the city zoning code and map, PA DEP eMapPA, and city planning GIS.
  - One use case is comparing parcels for starter homes, which is close to your per-typology idea.
- **Organizers:**
  - There are no published judges, prior winners, or kickoff recording or slides that I could find.
  - This appears to be the first hackathon of its kind. The only organizer framing I found is "permitting or fragmented data" ([Technical.ly](https://technical.ly/workforce/ai-horizons-summit-pittsburgh-tackles-ai-safety-and-economic-impact/)).
  - Partners include City of Pittsburgh, PHFA, Pro-Housing Pittsburgh, Heinz Endowments and UCSUR.
- **Other public hackathon repos (facts only):**
  - [het-sheth/ai-housing-hackathon-wiki](https://github.com/het-sheth/ai-housing-hackathon-wiki) is a research wiki created today. It catalogs 60 datasets, including OneStopPGH permits, ZBA decisions, city-owned properties and PLI permits.
  - [Run-Disc/HomeSignal](https://github.com/Run-Disc/HomeSignal) is described as a "permit observatory" and is empty so far.

### (a) Common / baseline

1. **Parcel lookup, zoning summary and a plain-language "what can I build" report.** This is everywhere.
   - Commercial: Gridics / ZoneIQ ([link](https://gridics.com/zoneiq/)) [S], Zoneomics, which already covers Allegheny County ([link](https://www.zoneomics.com/zoning-maps/pennsylvania/allegheny-county)) [S], Deepblocks [S], Symbium [S], Envelope.city ([link](https://www.siqizhu.net/envelope-city/)) [S].
   - Hackathons: Zone In, Chicago 2025, "enter an address…what you can build" ([AEC Tech archive](https://www.aectech.us/hackathon-archive)) [V]. Seattle 3rd place "PreAssess", which turns code into checklists and shows setbacks and height ([link](https://innovation-hub.seattle.gov/2025/10/28/community-innovation-pactathon-permitting/)) [V].
   - GitHub: many tiny 2026 "AI zoning feasibility" repos with 0–1 stars, e.g. [skysolutionsllc/zoning-feasibility-tool](https://github.com/skysolutionsllc/zoning-feasibility-tool) and [Snehasish3000/ParcelAlpha](https://github.com/Snehasish3000/ParcelAlpha).
2. **Zoning envelope / 3D massing.**
   - [UpZone](https://www.aectech.us/hackathon-archive) (AEC Tech 2024 winner) [V].
   - [MisterClean/building-viz](https://github.com/MisterClean/building-viz): 2★, no license, so not safely reusable [V].
   - TestFit [S].
3. **Pro forma calculator.**
   - Terner Center "Making It Pencil" and its interactive tool ([link](https://www.ternercenter.app/demystifying-development-math)) [S].
   - UrbanSim sqft pro forma: [UDST/developer](https://github.com/UDST/developer), BSD-3, 3★, last commit 2021 [V].
4. **Chatbot or RAG over code and permits.** This is what the Seattle 2nd-place and NJ entries built [V], and several Devpost projects (PermitPilot, Seattle Pre-Permit AI) [S].
5. **Environmental overlays (flood, slope, landslide) as flags.** These are standard layers in commercial tools such as Archistar and TestFit [S].

### (b) Exists but less common

1. **Backtesting a development score against real permits.** This is established research practice, but I found no hackathon version.
   - [YIMBYdata/housing-elements](https://github.com/YIMBYdata/housing-elements) (Damerdji et al.): matches site inventories to 2015–19 permits by parcel number and by spatial buffer. 1★, **no license**, last commit 2022 [V].
   - [UCLA Lewis RHNAmaps](https://lewis.ucla.edu/RHNAmaps) [V].
   - LA's Housing Element regression on 2015–19 permits ([Terner](https://ternercenter.berkeley.edu/research-and-policy/stronger-housing-element-los-angeles/)) [S]. The LA appendix PDF returned 403 when I tried to fetch it.
   - SF's logistic-regression likelihood model, [Appendix B2](https://sfplanning.s3.amazonaws.com/archives/sfhousingelement.org/files/AppendixB2.pdf) [S].
   - **Pittsburgh precedent, closest to you:** [prohousingpgh/pittsburgh_iz](https://github.com/prohousingpgh/pittsburgh_iz) [V]. It has a hand-built CSV of every 20+-unit building in Pittsburgh since 2012, with zoning-accepted, zoning-approved and certificate-of-occupancy dates checked on Agency Counter. There are only 109 buildings, and it is licensed CC BY-NC. Pro-Housing Pittsburgh, which built it, is an event partner. It is a ready-made ground-truth and timeline seed, and it tells you the sample is small.
2. **Approval-timeline prediction.**
   - The Seattle 2025 **first-place** winner, "Permit Predictor", forecast permit duration and review rounds with confidence scores [V]. So timeline prediction plus uncertainty has already won a comparable hackathon.
   - Commercial: PermitFlow reportedly plans AI timeline prediction [S, unverified marketing claim]. Searchland (UK) shows planning approval rates by area [S].
3. **Policy-lever simulator.**
   - [hoffmanap/housingstrategy](https://github.com/hoffmanap/housingstrategy): El Paso parcel-level simulator with toggles for ADU, lot split, missing middle and parking reform, and conservative vs. upper-bound figures. MIT license, 0★, pushed 2026-09-21, runs entirely in the browser [V]. It is the most directly reusable pattern.
   - Terner / MapCraft SB 9 statewide parcel feasibility model ([link](https://ternercenter.berkeley.edu/research-and-policy/duplexes-lot-split-sb-9/)) [S].
   - MapCraft, commercial ([link](https://mapcraft.io/)) [S].
4. **Lot assembly (combining adjacent lots).** Archistar markets lot combining in Australia ([blog](https://www.archistar.ai/blog/combining-two-lots-for-development-the-three-steps/)) [S]. Envelope.city searches for sites with air-rights potential [S]. I saw no open-source or hackathon version.
5. **Uncertainty ranges on scores.** Permit Predictor and the El Paso tool's two-number output [V]. Research likelihood models report probabilities but not interval-style bands.

### (c) No example found
Not finding something is not proof it doesn't exist. My Devpost coverage is weak: Devpost's search blocked scripted requests, so I only saw what search engines index.

- A development score **for Pittsburgh or Allegheny County specifically**, public or commercial.
  - GitHub searches for Pittsburgh zoning, parcel, OneStopPGH and vacant-lot tools returned nothing relevant.
  - Existing regional tools are data explorers, not scorers: WPRDC Parcels n'at and the Property Dashboard, [WPRDC/wprdc-apps](https://github.com/WPRDC/wprdc-apps) (AGPL-3.0), and [SpaceRAT](https://github.com/WPRDC/SpaceRAT) [V].
- Approval-pathway timelines built from **OneStopPGH/PLI data** by project type. The IZ study is the only Pittsburgh timeline work I found.
- **Predicting variance or ZBA outcomes.** I found only fairness research ([Holy Cross thesis](https://crossworks.holycross.edu/context/honors/article/1733/viewcontent/Schimitsch_Thesis.pdf)) and Boston's ZBA tracker dataset [S].
- **LiDAR-derived slope** inside a housing feasibility score. It exists as survey and solar practice [S], but I found no tool. The only Pittsburgh landslide repo is a 1-file map sample [V].
- **Scoring city-owned lots for assembly.** Nothing found.
- A **per-typology score** (duplex vs. townhouse vs. small multifamily on the same parcel) is only partly present. El Paso does yield per policy lever, and Gridics/TestFit do massing, but I found no ease *score* broken out by typology.

### Reusable in 36 hours (license-clean)
- **Clean to use (with README credit):** El Paso simulator (MIT) and UDST/developer (BSD-3). Both are concept and code references.
- **NC or unlicensed — use for data, method or ideas only, not code:** the Pro-Housing Pittsburgh CSV (non-commercial; fine for a hackathon with attribution) and YIMBYdata (no license).
- **National Zoning Atlas:** it is actively mapping the Pittsburgh metro, and its "Zoning Report: Pittsburgh" is due fall 2026 ([link](https://www.zoningatlas.org/pennsylvania)) [V]. I could not confirm that its data is downloadable.

### Bottom line
Parcel lookup, zoning summary, envelope, pro forma and chatbot are the baseline. Backtesting, timeline prediction, the policy simulator and uncertainty bands have precedents but are uncommon. What stands out as new is doing them on Pittsburgh data. I found no example of variance prediction, LiDAR slope in a score, city-owned-lot assembly, or a per-typology ease score.
