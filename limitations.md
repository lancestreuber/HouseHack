# Limitations

**Yinzone is decision support. It is not legal, financial or zoning advice.** It helps you see where housing could go in Pittsburgh and what stands in the way. Before you act on anything it shows, check zoning with the City's Zoning Administrator, check the site with a professional, and check the numbers with a lender or developer.

The app says this next to every result: in the parcel panel, the housing-types panel, under the chat box, in the map's attribution line, and at the top of `/resources`.

This file lists what the tool doesn't do, what it assumes, and where its data is weak. The app's `/resources` page has the full method: every equation, weight, source and assumption. This file was checked against the code on branch `lance-verdict` (rebased on `main` at `d7b987b`) on 2026-09-27. If the code changes, this file has to change with it.

---

## 1. What the tool does not assess

**Whether a project pencils, beyond a rough screen.** The hackathon's housing experts said the first question a developer asks is whether revenue will cover cost, before zoning or any variance. The tool now runs a first screen per housing type, the "Does it pencil?" check. It is not a pro forma:
- **Cost** uses the experts' ranges, which are practitioner opinion given in the event's Slack, not a published source:
  - $150/sf (high-volume production builder)
  - $225/sf (default, the middle of $200–250/sf for City single-family infill)
  - $350/sf (another practitioner's $325–375/sf)
  - plus $37.5k of site work per building (their $25k–50k range), and $30k more on a mostly steep lot.
- **Our own assumptions:** 15% soft costs, a 10% margin, and ×103 to turn monthly rent into value.
- **Value** is the census tract's median resale price for houses, and capitalized block-group rent for 2+ units. Both describe *existing* homes, which sell and rent for less than new ones. City new-build sales run about $370–390/sf, against about $180/sf for all valid sales, roughly 2×. Only 15 of 90 neighborhoods have 5+ new-build comps in 5 years, so no new-build premium is applied. Block-group ACS rents are also noisy: 48 of 265 City block groups have a coefficient of variation above 30%. So the check leans toward "doesn't pencil". Read that as the appraisal-gap risk, not a verdict on a project.
- **Not modeled:** land cost, financing terms, subsidy programs and their per-unit limits, and construction-time carrying costs.
- **Permit data can't stand in for cost.** Permit valuations for new City 1–2 family homes have a median of $104/sf (n=220), and the declared value is a median 0.31× the same homes' later sale price (`research/sweeps/r9-permit-cost-per-sf.md`).

**Things that need paid due diligence.** None of these are in any score:
- Environmental contamination and brownfields. PA DEP Act 2 and activity-and-use-limitation records exist, but only as coarse points with no parcel ID and no cleanup status. They could support at most a "cleanup record within 100 m, verify" flag, which would hit about 1–1.5% of vacant parcels. That flag is not built, and absence of a record doesn't mean a site is clean. The experts named contamination as an up-front deal-killer.
- Soils, foundations, and demolition debris buried in old basements on vacant lots. City demolition rules since 2021 require only a broken slab and clean fill, and 170 demolition permits from 2024–26 say the foundation walls remain. About 94% of vacant City lots have no demolition record at all, so the tool can't flag this.
- The location, depth, condition and capacity of water and sewer lines. Capacity is not public, so the tool treats it as **unknown, not bad**.

**Other things not covered:** school quality, tornado risk, and a project's odds of approval. Crime and race never enter any score, on purpose.

## 2. Where the tool applies

- **Zoning legality covers the City of Pittsburgh only**: its 56 zoning districts. Mount Oliver Borough, an enclave inside the City, is marked as outside City jurisdiction. The rest of Allegheny County's municipalities have their own codes, which are not encoded. Map layers are county-wide, but legal pathways are not.
- **Pillar scores cover City parcels** (about 142,000, from the City's `ParcelsPublic` layer). Parcels elsewhere in the county show map data but no score.
- **The site-fit check reads only five residential districts** (R1D, R1A, R2, R3, RM). Everywhere else it returns "unknown" rather than guessing (`packages/api/src/typology/site-fit.ts`). The housing-type tiles use the full 57-district table.

## 3. Zoning is a simplified reading

- Legal pathways are our transcription of the Zoning Code use table (§911.02), the dimensional standards (§903.03, minimum lot sizes after the May 2025 reform) and the procedures in Ch. 922, read on eCode360 on 2026-09-26. Overlay districts, conditions attached to a use, and site-plan review are summarized, not fully applied.
- **Setbacks are checked only roughly.** The verdict subtracts the §903.03 interior side setbacks from the lot width and flags a likely variance below 14 ft of buildable width. That catches the experts' own example: a 24 ft RM-M lot leaves 4 ft. Lot width is the short side of the lot's bounding rectangle, so irregular lots are approximate. Corner-lot exterior setbacks, front and rear setbacks, and contextual setbacks (§925.06) are not checked.
- **Height, floor-area ratio and lot area per unit are not checked.** The verdict checks use, overlays, side setbacks and minimum lot size. We ran it on the Pro-Housing Pittsburgh "You Can't Build That Here" buildings. It calls all 6 residential-district apartment cases red for use, but it misses the cases blocked by height or FAR, such as Carson Towers (LNC) and the Clark Building (GT-C), which read yellow. Those 6 cases are a regression test (`typology-meta.test.ts`).
- **The rules are changing.** Bill 2025-1545 (ADUs) and Bill 2026-0834 were pending as of this build, and a full zoning rewrite is planned. The tool shows the code as read on 2026-09-26.
- **Zoning Board approval rates overstate how easy approval is.** The "likelihood" in the housing-type score is the share of 2023–26 Zoning Board decisions that were approved in each base district. It has three biases:
  - It counts only decisions posted on the City's site. Withdrawn and abandoned applications are missing.
  - Only projects whose sponsors thought they would pencil reach the Board, so the cases are already filtered.
  - It pools all kinds of relief, not rezonings specifically.

  Approval also isn't guaranteed. In November 2023 the Board denied the height variances for the Bloomfield ShurSave redevelopment (4401 Liberty Ave), calling height a policy question for Council. For 21 Lanark St, the variances were granted, then reversed in court, adding about $120k and at least a year.

  A high rate also doesn't mean the process is cheap. The experts stressed that variances are usually granted but slow and costly. The verdict shows each pathway's approval clock and the 120–200 day permit median, but it doesn't turn that time into dollars.

## 4. Choices we made (value judgments, not data)

Every one of these is a choice we made, and a different reasonable choice would change the results. Most are editable in `apps/web/src/lib/pillars/pillars.config.json`, and the pillar weights are editable in the app's Weights popover.

| Choice | Current value |
|---|---|
| Pillar weights | All 1 by default. Presets (family, older adult, climate-first, affordability-first, market-first) give other sets. |
| How pillars combine | Weighted geometric mean, so one strong pillar can only partly offset a weak one. Arithmetic is a toggle. Scores are floored at 1. |
| Missing data | Missing indicators are dropped and the other weights renormalized. A pillar without enough data counts as that pillar's City 25th-percentile score. |
| Zoning multiplier on the overall score | By right ×1.0, Zoning Administrator exception ×0.98, special exception ×0.94, conditional use ×0.92, not permitted ×0.2 (×0.35 within 30 m of a district that allows it), unknown district ×0.8. By default it uses the easiest pathway among five mainstream housing types. The parcel panel's "zoning factor for" picker switches it to one type. |
| Site-availability multiplier | Vacant or parking ×1.0, occupied building ×0.9, large building ×0.7, institution ×0.6, condo unit ×0.5, park, cemetery, rail or right-of-way ×0.05. |
| Housing-type tile score | By right 100, ZA exception 85, special exception 60, conditional use 40, not permitted 5–35 (depends on how close a permitting district is and the Board approval rate; 0.7 where there are no local cases). |
| Hazard caps on Site Feasibility | Half the lot in the floodway caps Site at 5 (any part: 40). Half or more at 25%+ slope caps it at 50, half landslide-prone at 54, both together at 45, half over mapped mines at 70, and a sliver lot at 30. Lead service lines only flag. |
| Deal-killer multiplier on the overall score | Half floodway ×0.2, part floodway ×0.6, sliver lot ×0.3, mines ×0.9; the lowest applies. Mines are mild because about 30% of City parcels (43,001) are over mapped mines and the layer has no depth of cover. |
| Verdict (red / yellow / green) | The worst reason decides. Red: not permitted with no similar district that allows it; half or more floodway; sliver lot; park, rail or right-of-way; "cannot fit"; or the pencil check's "doesn't pencil". Yellow: a hearing; a nearby-density rezoning; partial floodway, floodplain, slope, landslide or mines; a narrow lot after setbacks; a tight fit; tight or subsidy-dependent finances. Unknown outranks green. |
| Pencil-check bands | Pencils if value ≥ cost plus margin. Tight if it pencils only at $150/sf. Needs subsidy if value covers ≥35% of that. Otherwise it doesn't pencil. At the defaults, "doesn't pencil" covers about 16% of vacant or occupied parcels for a house, 36% for a duplex and 11% for apartments. The gap is shown beside URA's per-unit caps ($130k for-sale new construction, $75k rental at 30% AMI) for scale. A stricter rule, red whenever the gap exceeds the cap, would make about 63% of houses red; we didn't use it because the values understate new-build prices. |
| Minimum building width | 14 ft after interior side setbacks. |
| Score colors | Green ≥ 70, yellow ≥ 45, red below. These are cutoffs we picked. On the pillar scores they mean "better or worse place", not "developable". The verdict's red, yellow and green, which carry text labels, are the developability answer. |
| Site-fit review flag | Confidence below 0.3 (0.2 for a detached house), tuned on observed answers. |

## 5. Known weaknesses in how the scores behave

Fixed on `lance-verdict`:
- Deal-killer hazards now multiply the overall score instead of being averaged away.
- Undermining now caps Site Feasibility and multiplies the overall score.
- The steep-slope cap now fires at half the lot, not three-quarters.
- The housing-type tiles lead with the verdict, so a floodway lot no longer reads as a clean "100, by right".
- Missing hazard data makes the verdict "unknown", and the overall card shows data coverage.
- Your weights are no longer sent to the site-fit model.

Still open:
- **The overall score is still a blend.** The verdict is the answer to "can it be built?". The overall score answers "how good a place is this?", and a red-verdict lot can still have a middling overall score. The map hexes show the overall score, not the verdict.
- **Mines are treated mildly** (yellow, ×0.9). The layer can't tell a 30 ft mine from a 300 ft one.
- **The pencil check is pessimistic in weak markets** (see §1), and it ignores land cost, which pushes it the other way.
- **Physical fit is still only a model's opinion.** A "cannot fit" rating turns the verdict red. The rating has not been checked against ground truth.

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
- **Paid data we don't have:** RS Means construction costs, MLS comps and CoStar rents. Zillow ZORI is used only as ZIP-level context. The pencil check uses County sales (valid residential sales 2024–25 by tract, blank under 10 sales) and ACS rents instead.

The full catalog of 134 datasets, with endpoints, vintages and licenses, is on the `/resources` page.

## 7. Synthetic data

- **The floating chat on pages other than the map** has no parcel, so it only explains how Yinzone works (the score, pillars, zoning and site factors, tile scores and site fit), from the same config the scorer uses. It uses no mock data.
- Everything on the map and in the parcel panels is real public data.

## 8. AI components

- **Site fit** comes from Jev, a third-party "System One" decision model reached through OpenRouter. It returns a rating on a four-level rubric (Cannot fit → Comfortable fit) with probabilities and a confidence.
  - **What it sees:** lot area, the width × depth of the lot's bounding rectangle, the zoning code and minimum lot size, and the share of the lot in each hazard. It does not see your weight settings.
  - **What it doesn't see:** setbacks, buildings on the lot, topography beyond those shares, neighbors, street access, utilities, photos.
  - It never decides legality. We have **not validated its ratings against ground truth**. If it fails or isn't configured, the app says so instead of inventing a number.
- **The chat** uses Google Gemini (free-tier "flash-lite" models).
  - It sees only what the panels show for the selected parcel: scores, breakdowns, typology tiles with Jev's site fit, the verdicts and pencil check, alerts and zoning. It can't see the map's other layers.
  - What-if answers are computed, never estimated: weight changes and presets by the same formula as the scorer, rezoning and vacant-land scenarios by the scorer itself. Other what-ifs get "not computed".
  - Replies must cite facts. Any sentence with a number not found in those facts is removed.
  - It can re-run the scoring formula with new weights. It never produces a score of its own.
  - It can still word things poorly or leave things out. Treat it as an explainer, not a source.

## 9. Not verified

- **Nobody has tested the tool with its intended users** (developers, nonprofits, residents). The scoring was shaped by public methods (OECD/JRC composite-indicator guidance, the UN HDI, CalEnviroScreen, CTCAC opportunity maps) and by hackathon expert feedback. It has not been calibrated against real project outcomes.
- **Weight-sensitivity ranges** show how much a score depends on the weights. They say nothing about whether the underlying data is right.
