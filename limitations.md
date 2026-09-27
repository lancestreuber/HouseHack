# Limitations

**Yinzone is decision support. It is not legal, financial or zoning advice.** It helps you see where housing could go in Pittsburgh and what stands in the way. Before you act on anything it shows, check zoning with the City's Zoning Administrator, check the site with a professional, and check the numbers with a lender or developer.

The app says this next to every result: in the parcel panel, the housing-types panel, under the chat box, in the map's attribution line, and at the top of `/resources`.

This file lists what the tool doesn't do, what it assumes, and where its data is weak. The app's `/resources` page has the full method: every equation, weight, source and assumption. This file was checked against the code on `main` at `3fcff72` on 2026-09-27. If the code changes, this file has to change with it.

---

## 1. What the tool does not assess

**Whether a project pencils.** This is the biggest gap. The tool has no construction costs, land prices, achievable rents or sale prices, and no financing or subsidy logic. The hackathon's housing experts said the first question a developer asks is whether revenue will cover cost, before zoning or any variance. The scores tell you where housing *fits*. They do not tell you whether it would make money. The chat assistant says it can't answer cost questions.

For context only, these are the ranges the experts gave in the event's Slack. They are practitioner opinion, not a published source, and the tool does not use them:
- Vertical construction cost: $150/sf (high-volume production builder), $200–250/sf (City single-family infill), $325–375/sf (another practitioner's estimate).
- Site work: $25k–50k per unit in the City.

**Things that need paid due diligence.** None of these are in any score:
- Environmental contamination and brownfields. We have no PA DEP Act 2 or activity-and-use-limitation layer. The experts named contamination as an up-front deal-killer.
- Soils, foundations, and demolition debris buried in old basements on vacant lots.
- The location, depth, condition and capacity of water and sewer lines. Capacity is not public, so the tool treats it as **unknown, not bad**.

**Other things not covered:** school quality, tornado risk, and a project's odds of approval. Crime and race never enter any score, on purpose.

## 2. Where the tool applies

- **Zoning legality covers the City of Pittsburgh only**: its 56 zoning districts. Mount Oliver Borough, an enclave inside the City, is marked as outside City jurisdiction. The rest of Allegheny County's municipalities have their own codes, which are not encoded. Map layers are county-wide, but legal pathways are not.
- **Pillar scores cover City parcels** (about 142,000, from the City's `ParcelsPublic` layer). Parcels elsewhere in the county show map data but no score.
- **The site-fit check reads only five residential districts** (R1D, R1A, R2, R3, RM). Everywhere else it returns "unknown" rather than guessing (`packages/api/src/typology/site-fit.ts`). The housing-type tiles use the full 57-district table.

## 3. Zoning is a simplified reading

- Legal pathways are our transcription of the Zoning Code use table (§911.02), the dimensional standards (§903.03, minimum lot sizes after the May 2025 reform) and the procedures in Ch. 922, read on eCode360 on 2026-09-26. Overlay districts, conditions attached to a use, and site-plan review are summarized, not fully applied.
- **Setbacks are not checked.** The tool compares lot area to the district minimum, not lot width to the required side setbacks. A 24 ft lot with two 10 ft setbacks, the experts' own example of a lot that needs a variance, would pass.
- **The rules are changing.** Bill 2025-1545 (ADUs) and Bill 2026-0834 were pending as of this build, and a full zoning rewrite is planned. The tool shows the code as read on 2026-09-26.
- **Zoning Board approval rates overstate how easy approval is.** The "likelihood" in the housing-type score is the share of 2023–26 Zoning Board decisions that were approved in each base district. It has three biases:
  - It counts only decisions posted on the City's site. Withdrawn and abandoned applications are missing.
  - Only projects whose sponsors thought they would pencil reach the Board, so the cases are already filtered.
  - It pools all kinds of relief, not rezonings specifically.

  A high rate also doesn't mean the process is cheap. The experts stressed that variances are usually granted but slow and costly, and the tool does not model that time or cost.

## 4. Choices we made (value judgments, not data)

Every one of these is a choice we made, and a different reasonable choice would change the results. Most are editable in `apps/web/src/lib/pillars/pillars.config.json`, and the pillar weights are editable in the app's Weights popover.

| Choice | Current value |
|---|---|
| Pillar weights | All 1 by default. Presets (family, older adult, climate-first, affordability-first, market-first) give other sets. |
| How pillars combine | Weighted geometric mean, so one strong pillar can only partly offset a weak one. Arithmetic is a toggle. Scores are floored at 1. |
| Missing data | Missing indicators are dropped and the other weights renormalized. A pillar without enough data counts as that pillar's City 25th-percentile score. |
| Zoning multiplier on the overall score | By right ×1.0, Zoning Administrator exception ×0.98, special exception ×0.94, conditional use ×0.92, not permitted ×0.2 (×0.35 within 30 m of a district that allows it), unknown district ×0.8. It uses the easiest pathway among five mainstream housing types, not the type you're looking at. |
| Site-availability multiplier | Vacant or parking ×1.0, occupied building ×0.9, large building ×0.7, institution ×0.6, condo unit ×0.5, park, cemetery, rail or right-of-way ×0.05. |
| Housing-type tile score | By right 100, ZA exception 85, special exception 60, conditional use 40, not permitted 5–35 (depends on how close a permitting district is and the Board approval rate; 0.7 where there are no local cases). |
| Hazard caps on Site Feasibility | For example, half the lot in the floodway caps Site at 5, and mostly 25%+ slope caps it at 50. Undermining and lead service lines only flag; they don't cap. |
| Score colors | Green ≥ 70, yellow ≥ 45, red below. These are cutoffs we picked. They don't mean "developable" or "not developable". |
| Site-fit review flag | Confidence below 0.3 (0.2 for a detached house), tuned on observed answers. |

## 5. Known weaknesses in how the scores behave

These are open as of `3fcff72`:

- **Hazards can be averaged away.** Hazard caps lower only the Site Feasibility pillar, which is then combined with four other pillars. A floodway lot can still get a middling overall score.
- **Undermining barely moves the score.** It is a warning, not a cap, even though the code requires a mine investigation before multi-unit housing over mapped mines.
- **The steep-slope cap fires only when about three-quarters of the lot is 25%+ slope.** Below that, slope only costs weighted points.
- **The housing-type tiles show the legal pathway only.** A floodway lot can read "100, by right". Hazards appear in the pillar panel and in the alerts, not on the tile number.
- **Missing data can look fine.** Renormalizing and imputing keeps a parcel scoreable, but the result can look healthier than the evidence supports. The panel shows data coverage for each pillar.
- **Your weights are passed to the site-fit model** as a note that may nudge a borderline rating. A physical judgment shouldn't depend on preferences.

## 6. Data

- **Vintages differ.** Sources range from pooled 2015–20 health data to live camera feeds. Each map layer shows its own as-of date.
- **Area averages are not the lot.** Tract, block-group and ZIP indicators are assigned to every parcel inside that area.
- **Many public layers are stale or quirky.** We found and handled these:
  - ACHD's "open" food-facility list includes closed businesses. We keep only facilities inspected in the last ~2 years.
  - Rite Aid (closed Sept 2025) still appears in NPPES. Removed.
  - Blood-lead 2021–24 columns have no published definition. We use only 2015–20.
  - County sales for 2018–19 have too few "valid sale" codes. We use 2020 as the baseline.
  - City incident-level police data ends in Nov 2023. Crime isn't scored anyway.
  - Special-use census tracts (98xxxx) have unstable percent changes. Blanked below ~100 households.
  - ZIP-based filters leak across the county line. Everything is clipped to the county.
- **Some data is modeled, not measured:** EPA EJScreen air quality, which is an emissions and exposure proxy (EPA took EJScreen offline in 2025; we read a public mirror), HUD Location Affordability, DOE LEAD energy burden, and FEMA risk ratings.
- **Crowd-mapped data:** license-plate-reader locations come from OpenStreetMap volunteers (DeFlock), not an official inventory.
- **Paid data we don't have:** RS Means construction costs, MLS comps and CoStar rents. Zillow ZORI is used only as ZIP-level context.

The full catalog of 134 datasets, with endpoints, vintages and licenses, is on the `/resources` page.

## 7. Synthetic data

- **The floating chat on pages other than the map** has no parcel, so it only explains how Yinzone works (the score, pillars, zoning and site factors, tile scores and site fit), from the same config the scorer uses. It uses no mock data.
- Everything on the map and in the parcel panels is real public data.

## 8. AI components

- **Site fit** comes from Jev, a third-party "System One" decision model reached through OpenRouter. It returns a rating on a four-level rubric (Cannot fit → Comfortable fit) with probabilities and a confidence.
  - **What it sees:** lot area, the width × depth of the lot's bounding rectangle, the zoning code and minimum lot size, the share of the lot in each hazard, and your weight settings.
  - **What it doesn't see:** setbacks, buildings on the lot, topography beyond those shares, neighbors, street access, utilities, photos.
  - It never decides legality. We have **not validated its ratings against ground truth**. If it fails or isn't configured, the app says so instead of inventing a number.
- **The chat** uses Google Gemini (free-tier "flash-lite" models).
  - It sees only what the panels show for the selected parcel: scores, breakdowns, typology tiles with Jev's site fit, alerts and zoning. It can't see the map's other layers.
  - What-if answers are computed, never estimated: weight changes and presets by the same formula as the scorer, rezoning and vacant-land scenarios by the scorer itself. Other what-ifs get "not computed".
  - Replies must cite facts. Any sentence with a number not found in those facts is removed.
  - It can re-run the scoring formula with new weights. It never produces a score of its own.
  - It can still word things poorly or leave things out. Treat it as an explainer, not a source.

## 9. Not verified

- **Nobody has tested the tool with its intended users** (developers, nonprofits, residents). The scoring was shaped by public methods (OECD/JRC composite-indicator guidance, the UN HDI, CalEnviroScreen, CTCAC opportunity maps) and by hackathon expert feedback. It has not been calibrated against real project outcomes.
- **Weight-sensitivity ranges** show how much a score depends on the weights. They say nothing about whether the underlying data is right.
