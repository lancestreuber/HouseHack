# Landscape and prior art

Everything here is evidence we found. Not finding an example is not proof that one doesn't exist. Our Devpost coverage is weak because Devpost blocks scripted search. We make no claims about what other teams will build.

**[V]** = we fetched it. **[S]** = search snippet or marketing only.

## Common / baseline
- **Parcel lookup + zoning summary + plain-language "what can I build here".**
  - Commercial: Gridics [S], Zoneomics (covers Allegheny County) [S], Deepblocks [S], Symbium [S], Envelope [S].
  - Hackathon projects: "Zone In" (AEC Tech Chicago 2025) [V]; Seattle Pactathon 3rd place "PreAssess" [V].
  - Many small 2026 GitHub repos.
- **Zoning envelope / 3D massing.** UpZone (AEC Tech 2024 winner) [V] and TestFit [S].
- **Pro forma calculators.**
  - Terner "Making It Pencil" [S].
  - `UDST/developer` (BSD-3) [V].
- **RAG chat over zoning code or permits.** Several hackathon entries (Seattle, NJ, Devpost) [V/S].
- **Environmental overlay flags.** A standard feature of commercial tools [S].

## Exists but less common
- **Backtesting against permits.**
  - LA and SF Housing Element likelihood models [S].
  - `YIMBYdata/housing-elements` (no license) [V].
  - UCLA RHNA maps [V].
  - `prohousingpgh/pittsburgh_iz`: 109 buildings with 20+ units, with approval dates, CC BY-NC [V].
- **Approval timeline prediction.**
  - **Seattle 2025 Pactathon 1st place, "Permit Predictor"**, forecast duration and review rounds with confidence scores [V].
  - Commercial claims (PermitFlow) [S].
- **Policy-lever simulator.**
  - `hoffmanap/housingstrategy`: El Paso, MIT license, pushed 2026-09-21, runs in the browser [V].
  - Terner / MapCraft SB 9 model [S].
- **Lot assembly.** Archistar markets it (Australia) [S].
- **Uncertainty ranges.** Permit Predictor; the El Paso tool's conservative vs upper-bound figures [V].

## Found no example (this search only)
- A Pittsburgh-specific development score.
- ZBA or variance outcome prediction.
- LiDAR-derived slope inside a housing feasibility score.
- Scoring city-owned lots for assemblage.
- An ease score by typology.

## Pittsburgh regional tools (data explorers, not scorers)
- WPRDC Parcels n'at / Property Dashboard
- `WPRDC/wprdc-apps` (AGPL-3.0)
- SpaceRAT
- City ETHOS Lot Suitability (vacant-lot reuse, Dec 2024)
- OneStopPGH Insights
- Allegheny County Landslide Portal
- Lots to Love
- PublicSource Board Explorer

## Other participants' public material (facts only)
- **`het-sheth/ai-housing-hackathon-wiki`** (created 2026-09-26).
  - Research wiki with the organizer data catalog CSV, the brief PDFs, and a long ChatGPT research document.
  - That document's Track 1 advice overlaps with ours: show sub-scores rather than one number; keep "bad" separate from "unknown"; label observed / derived / assumption / unverified; add a "next action"; use historical permits as priors; demo three parcel archetypes (easy, deceptive, physically feasible but can't be financed).
- **`Run-Disc/HomeSignal`**: "permit observatory," empty at the time we checked.
- **Takeaway:** at least one other participant is reasoning along similar lines. Ideas like these are easy for anyone to reach.

## Reusable (license-clean, credit in README)
- **Code or patterns we can reuse:**
  - El Paso simulator (MIT).
  - `UDST/developer` (BSD-3).
- **Data or ideas only, not code:**
  - Pro-Housing Pittsburgh CSV (non-commercial).
  - YIMBYdata (no license).
