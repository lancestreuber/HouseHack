# SME feedback vs. what we built: gap analysis

**Date:** 2026-09-27. **Source:** the whole of Slack `#housing-sme-help` (AIHorizonsHack workspace), including all 8 threads, read on 2026-09-27 `[read]`.
**Compared against:**
- `origin/main` @ `e25d3eb`: the scoring code in `apps/web/src/lib/pillars/`, `packages/api/src/typology/`, `packages/api/src/chat/`
- `lance-research` @ `3daf2c4`: `research/`

People are cited by role, per `research/CLAUDE.md`. Everything the SMEs said here is practitioner opinion given in chat. None of it is a published source.

---

## 0. TL;DR

1. **Financial feasibility is the biggest gap.** Three different SMEs said the first question a developer asks is whether the project *pencils*: vertical construction cost against market value. They check this before zoning and before any variance. Our app has no cost, rent or pro-forma logic at all, and the chat explicitly refuses cost questions.
2. **Our deal-killers get averaged away.**
   - SMEs called undermining and environmental conditions "up-front deal killers." In our config, undermining is a *flag-only* gate with cap 100 and 1 of 10 Site weight. At 100% undermined, the Overall moves about 2%.
   - Hazard gates cap only the Site pillar, which is then geometric-averaged with four other pillars.
   - The typology tiles ignore hazards completely: a floodway lot can show "100 By right".
3. **The SMEs handed us a scoring frame, and we aren't using it.** No score is prescribed. Their suggestion is red/yellow/green, where each color is a *meaning*:
   - **Red:** not developable
   - **Yellow:** needs a variance or a subsidy
   - **Green:** developable at market as-is

   Our colors are arbitrary cutoffs (70/45), plus a gradient on the tiles and relative bins on the map. That makes four color systems, none of which means anything to a user.
4. **Required deliverables are missing:** there is no `limitations.md` and no persistent "decision support, not advice" disclaimer. The organizers confirmed that stating limitations is fine, and that synthetic data is fine if it's disclosed.
5. **Three chat bugs** make the chat's numbers disagree with the panel (§4).

The SMEs also gave us cover for scope: *"a tool that executes really well on one dimension (like zoning constraints) could be better than a tool that executes poorly on multiple."* So either option is defensible. **(a)** Add a light, clearly labelled pencil check. **(b)** State plainly that we did zoning, site and fit well and left finance out on purpose. What isn't defensible is our current state: the colors *look* like a verdict, but finance and deal-killers are silently absent from them.


## Status update (2026-09-27, branch `lance-verdict`, local commits, not pushed)

| Item | Status | Commit |
|---|---|---|
| TL;DR 2: deal-killers averaged away | **Done.** Floodway, sliver-lot and mine gates now multiply the Overall (×0.2/0.6, ×0.3, ×0.9). Mines are no longer flag-only (Site cap 70). Mines were kept mild because 43,001 of 142,365 City parcels (30%) are over mapped mines and the layer has no depth of cover. | `6f1fbf5` |
| TL;DR 3 / P1: red-yellow-green verdict | **Done.** Per-typology verdict from pass/fail checks, on the tiles and in a "Can it be built?" panel section. | `6f1fbf5` |
| P1-2: pencil check | **Done (rough screen).** Tract resale price (houses) or capitalized rent (2+ units) vs. SME cost presets, with editable $/sf and site cost. Feeds the verdict and the chat. | `dc23a11`, `9ce00f8` |
| P2-1: legal factor uses the easiest type | **Done.** "Zoning factor for" picker; the default is unchanged. | `56e88d9` |
| P2-2: hazard gates diluted by the geometric mean | **Done** via the hazard multiplier. The Overall hexes were rebuilt. | `6f1fbf5`, `dc23a11` |
| P2-3: dimensional hardship | **Done.** Lot width minus the §903.03 interior side setbacks; under 14 ft buildable → yellow. | `b44f936` |
| P2-4: steep gate at ≥74% | **Done.** Now ≥50%, Site cap 50. Capped parcels went from 12,877 to 24,395. | `d508723` |
| P2-5: weights nudge the physical rating | **Done.** Weights removed from the site-fit model. | `3648387` |
| P2-6: missing data looks fine | **Done.** Missing hazard data → "unknown"; Overall shows data coverage (amber below 80%: 6,129 parcels). | `171f77e` |
| P2-7: variance time as cost | **Partly done.** Each pathway reason carries its approval clock plus the 120–200 day permit median. Not yet converted to dollars. | `2dc279e` |
| §4 bug 1 (`[object Object]`) and bug 2 (chat re-score) | **Already fixed on main** before this branch. | — |
| §4 bug 3 (`def.parcel_score`) | **Not a bug.** It describes the demo Homewood report's own consideration-score model (`chat-launcher.tsx`), not the pillar score. This doc was wrong. | — |
| P0-1/P0-2: `limitations.md`, persistent disclaimer | **Not done.** The verdict and pencil sections carry a "decision support only" line, but there is still no `limitations.md`. | — |

### New findings from building the pencil check

- **Permit valuations understate cost.** 307 new 1–2 unit City permits (2019–26, `pgh_new_residential_permits_classified.csv`) joined to WPRDC assessment `FINISHEDLIVINGAREA` (living area assessed after the build) give a **median $101/sf** (2023+: $129/sf). Those homes later resold at a **median 2.7× their permit value**. So research item 1 ("local $/sf from permits") gives a floor, not a cost estimate. Use the SME ranges instead. `[read]`, queried 2026-09-27.
- **New-build resale value.** The 36 of those homes with a VALID SALE after the permit resold at a **median $285/sf** (p25 $237, p75 $356). It ranges from about $140 (Larimer, Hazelwood) to $625 (Upper Lawrenceville). Tract resale medians and ACS rents describe existing stock, so the pencil check leans toward "doesn't pencil". The UI says this.
- **Citywide at the defaults** (vacant or occupied parcels), house: 11% pencil at market, 45% below the old 50% floor. The red floor was set at 35% coverage, which gives red for 16% of houses, 36% of duplexes and 11% of apartments.

---

## 1. What the SMEs said (the facts we're comparing against)

| # | Point | Who (role) |
|---|---|---|
| S1 | No prescribed Development Ease scoring system. Design whatever is intuitive. Suggestion: **Red** = not developable (zoning, financial, topography). **Yellow** = could be developable but needs variances or financial subsidy. **Green** = easily developable as-is, likely with existing market conditions. | Organizer / Pro-Housing Pittsburgh SME |
| S2 | Crucial question: financial feasibility, using comparable rents and values from rental comps and sales data. Enough comps in similar neighborhoods is key. | City of Pittsburgh SME |
| S3 | For any parcel, the hard parts are (1) what zoning allows, and (2) what will pencil: revenue from sales, rents and subsidies exceeding costs by enough to attract investors and lenders. The inputs are comps, hard costs and soft costs. | Pro-Housing SME |
| S4 | "Ideally both financial and zoning feasibility." But one dimension done really well beats many done poorly. | Pro-Housing SME |
| S5 | **Cost exceeding market value is the biggest challenge.** Developers check whether it pencils *before* deciding to pursue a zoning variance. | Practitioner SME (TH) |
| S6 | Vertical construction cost, excluding site work: **$325–375/sf**. "Not sure a reliable public source exists locally." | Practitioner SME (TH) |
| S7 | City single-family infill: **$200–250/sf**, varying by builder scale. High-volume production builders imply about **$150/sf**. Sources: county/city building permits, NAHB, RS Means. | Housing Innovation Alliance SME |
| S8 | Site costs in the City: **$25k–50k per single unit** (water/sewer taps, grading, sidewalks, landscaping). They depend on utility depth and location, soil condition, and over-excavation or backfill. Many vacant City lots have demolished houses folded into the old basement. | Practitioner SME (TH) |
| S9 | Steep slope, floodplain and undermined areas add material cost. **Undermining and environmental conditions can be up-front deal killers.** | Practitioner SME (TH) |
| S10 | Hardest to know without spending money on due diligence: environmental remediation, soils and foundations, and the location and condition of water and sewer lines. | Practitioner SME (TH) |
| S11 | Two 10 ft setbacks on a 24 ft lot leave a 4 ft building. That is a clear hardship and the variance should be granted, **but the time and expense of the variance process make these lots hard to develop.** | Practitioner SME (TH) |
| S12 | The tool should do the follow-up work. If confirming feasibility needs a pro forma, the tool should build it. Cost/sf and rent/sf are reasonable inputs. **Rent varies significantly by location within the City.** | Pro-Housing SME |
| S13 | Thresholds (e.g. a 1.15 coverage ratio) are our choice but must be "clear and intuitive." A user-assumption calculator is fine "depending on how useful or misleading you make it." What gap financing depends on "can vary wildly." | Pro-Housing SME |
| S14 | No parcel lookup tool exists for Pittsburgh. Rescope is similar but California-only. A report comparing two scopes on the same parcel "doesn't exist" and is "reasonable." Example: the Bloomfield ShurSave redevelopment. | Pro-Housing SME |
| S15 | Missing or paid data: list it in `limitations.md`. Synthetic or fake data is OK if documented. The demo must still work, because if the product is unusable there is nothing to judge. Prefer open, public data. | Organizers |
| S16 | Position all tools as decision support, not binding legal, financial or zoning advice. | Organizers (pinned post) |

---

## 2. Changes needed in the app (ordered by priority for tonight's deadline)

### P0: cheap, high-value, do before submission

**P0-1. Write `limitations.md`** (S15, S16). Nothing exists (verified: no such file on main). It should cover:
- **Finance.** Either "not assessed," or, if P1-1 ships, its assumptions and cost-range sources.
- **Not assessed, needs due diligence** (S10): soils, environmental and brownfield contamination (we have no DEP Act 2/AUL layer), utility line condition and depth, and demolition debris in old basements.
- **Legal.** This is a simplified reading of §911.02, and it only covers R1D/R1A/R2/R3/RM (`gateFor`, `packages/api/src/typology/site-fit.ts:137-176`). Other districts return "unknown."
- **ZBA approval rates are biased upward.** They are conditioned on projects whose sponsors thought they penciled (S5), and withdrawals are missing. A high approval rate does not mean the process is cheap (S11).
- **All multipliers and weights are value judgments.** List them: pathway scores, availability multipliers, the 70/45 colour cutoffs, confidence thresholds.
- **The site-fit model is an LLM rating.** Say what it sees and what it doesn't.

**P0-2. Add a persistent disclaimer to the UI** (S16). Today the only disclaimers are the §911.02 "verify with the Zoning Administrator" line (`apps/web/src/components/map/pillars-panel.tsx:438-441`) and a chat reply that only fires on buy/build questions (`packages/api/src/chat/prompt.ts:20`). Add one fixed line to the parcel panel footer.

**P0-3. Make undermining a real gate** (S9). `pillars.config.json` has the Site gate `site_undermined_share below 51` → **cap 100**, i.e. flag-only. The code (UM-O) already prohibits multi-unit pending a mine investigation (research BRIEFING, the UM-O line). Two changes:
- Cap the Site pillar hard for multi-unit types.
- Surface it as a red flag on the typology tiles for everything except single-unit.

The lead-service-line gate can stay flag-only. It's a real cost, but not a deal-killer.

**P0-4. Stop the typology tiles showing a clean verdict on hazardous lots.** The big tile number is legal pathway only (`typology-panel.tsx:21-28`), so a floodway lot reads "100 By right." At minimum, overlay a hazard badge whenever any Site gate with cap < 100 fires.

**P0-5. Fix the chat bugs** (§4). They're small and make the demo look broken if a judge asks the chat about a score.

### P1: the red / yellow / green verdict (S1, S13)

Replace "Overall ≥70 green / ≥45 yellow" (`pillars-panel.tsx:140-145`) with a **categorical verdict per typology**. It is computed from gates, never from the weighted score:

| Verdict | Rule (proposal) |
|---|---|
| 🔴 Red | Not permitted and no nearby permitting district; *or* floodway ≥ half the lot; *or* undermined + multi-unit; *or* sliver lot; *or* site-fit "Cannot fit"; *or* (if P1-2 ships) value/cost below ~0.8 at the *low* cost assumption. |
| 🟡 Yellow | Needs a special exception, a conditional use or a variance (including a *dimensional* hardship, see P2-3); *or* steep slope, landslide or floodplain gate fired (added cost plus a geotech study); *or* (if P1-2 ships) pencils only with subsidy. |
| 🟢 Green | By right or ZA, no hazard gate fired, site fit "Fits" or better, and (if P1-2 ships) pencils at market. |
| ⚪ Unknown | The district is outside `gateFor` coverage, or a key input is missing. We don't impute. "Unknown ≠ bad" (`research/CLAUDE.md`). |

Keep the 0–100 Overall and the pillars as the *ranking and matchmaker* layer (the Track 3 story). The verdict answers "can this be built?", and the pillars answer "is this a good place for it, for whom?" Each verdict must list the reasons that fired it. This also resolves the 4-colour-system confusion: the verdict owns red, yellow and green, and the rankings use a neutral ramp.

This fits our research. `score-design-options.md` already argues "never average a FAIL away," and `research/pillars/aggregation-standards.md:19` says hard constraints should be "masks outside the weighted sum." The code doesn't do that yet.

### P1-2: a light "does it pencil?" check (S2–S8, S12, S13)

This is optional under S4, but it's the SMEs' #1 question. The inputs already exist; they just aren't wired together. Minimum version:
- **Revenue per unit:** block-group ACS median home value / median rent. These are already map overlays in `overlays/housing-costs.ts` but aren't joined to parcels. Where possible, add new-construction sales comps (sales code 16 × assessment sq ft; the plan is in `research/knowledge/methods/pro-forma.md` L59-62).
- **Cost per unit:**
  - typology unit size × **$/sf as a range, not a point**: low $150 (production builder), mid $200–250, high $325–375 (S6, S7)
  - plus **$25–50k site work per unit** (S8)
  - plus hazard adders for slope, landslide and floodplain (S9). These have no SME number; research has only "$30–80k hillside" from a builder blog.
- **Output:** value ÷ cost at the low, mid and high assumptions, mapped to the verdict: pencils at market / pencils only with subsidy (→ Yellow) / doesn't pencil even at low cost (→ Red).
- **Show the assumptions and let the user edit them** (S12, S13). Label every number with its source (e.g. "practitioner estimate, hackathon SME, 2026-09-27"). No DSCR or LIHTC modelling this weekend; "gap financing can vary wildly" (S13).

Then **unlock the chat** to explain the pencil check. Today `def.limits` in `packages/api/src/chat/definitions.ts` says the chat "can't tell you about building costs."

### P2: algorithm changes to consider

- **P2-1. Legal multiplier uses the *easiest* of 5 types** (`score.ts:139-144`). A parcel where only a single-family house is by-right gets ×1.0 even for a user looking for apartments. The multiplier should depend on the selected typology or preset.
- **P2-2. Hazard gates only cap Site, then get geometric-averaged.** A floodway lot with Site = 5 can still land in the yellow Overall band. Once the verdict exists (P1) this matters less, but the Overall should also stop looking healthy on red-verdict lots, e.g. by applying the verdict as a mask on the map.
- **P2-3. Dimensional hardship isn't computed.** `site-fit.ts:117,160` checks only minimum lot area. The SME's exact example, a 24 ft lot with two 10 ft setbacks, would pass. We already compute lot width (PostGIS oriented envelope). Compare width against the district's required side setbacks from §903.03 (`research/sources/ecode360-2026-09-26-pittsburgh-903-03-dimensional-standards.md`) and flag "buildable width < X ft → variance likely needed (Yellow)."
- **P2-4. Steep-slope gate fires only at ≥74% steep** (`below: 26`). A lot that is 70% steep only loses weighted points. Lower the threshold, or feed slope into the cost adder in P1-2.
- **P2-5. User weights are passed into the site-fit LLM to "nudge borderline" ratings** (`site-fit.ts:285`). This lets value preferences soften a physical judgment. Keep physical fit weight-free.
- **P2-6. Missing data looks fine.** Missing indicators are renormalized away and a missing pillar is imputed at City p25. The verdict should say "Unknown" instead, and the panel should show coverage prominently.
- **P2-7. Treat variance time as a cost, not just a probability** (S11). ZBA pathways currently cost only ×0.94/×0.92. If P1-2 ships, add a carrying-cost months adder per pathway, using the timeline data in `datasets/legal-feasibility/`, not yet on main.

---

## 3. Research follow-ups

### Open questions the SMEs answered (update `docs/03-open-questions.md` and BRIEFING)

| Open question | Answer from SMEs |
|---|---|
| #3 / BRIEFING unknown #3: where do small projects stall? | Cost exceeding market value comes first. Variances come after the deal pencils, and they are granted but slow and costly (S5, S11). This confirms "ZBA = delay, not denial" and adds that the delay costs money. |
| #7 / BRIEFING unknown #5: is a pro forma in scope? | "Ideally both" (S4). If the user has to build a pro forma, the tool should (S12). This contradicts our read that a pro forma was at most an optional extension (`knowledge/challenge/brief-and-judging.md` L43). Still open: what "approved affordability assumptions" means literally. |
| #11: will judges penalize stated limitations? | No. List them; synthetic data is fine if documented; the demo must work (S15). |
| Score structure (`knowledge/methods/score-design-options.md` L57-59) | No prescribed system; red/yellow/green suggested (S1). |
| `knowledge/methods/pro-forma.md` L77: a defensible hard cost/sf | Practitioner ranges $150 / $200–250 / $325–375 (S6, S7). The SMEs disagree, so show a range. No reliable local public source (S6). |
| #1: primary user (partial) | Developers and nonprofits doing financial feasibility (S2, S3). |

The SMEs gave no input on Track 3 axes (T3-1…T3-6), displacement/DRR, carbon, the Land Bank, or which code version to use. Those are still open.

### Corrections to existing research

- **Our cost assumption is not in the SMEs' consensus.** `track3/ideas-and-considerations.md` L31 assumes $250/sf, from a builder blog ($200–450, `pro-forma.md` L65). That is the top of one SME's range and well below the other's. Replace it with the range and SME attribution.
- **Site cost:** research has only "$30–80k hillside site work" (builder blog). Add the SME's $25–50k general City figure. Don't confuse it with the PWSA fee table (`sources/pgh2o-...` L76-85, $40–$340). Fees are trivial; the construction is what costs money.
- **ZBA approval rates (81–85%) carry a second selection bias:** only projects that already pencil reach the ZBA (S5). Note this wherever the rate is cited (`knowledge/data/legal-feasibility-datasets.md` L24, BRIEFING L95, ideas L82).
- **Main's `PLAN.md` L171-173 and the groundwork spec (L83-87, L152) describe older hazard scoring and exclude cost.** The pillar code supersedes them. Update or mark them superseded so no one builds from them.

### New research needed (in priority order)

> **Status 2026-09-27: all seven items were researched in round 9.** The open-question answers and corrections above have been applied to the nodes. Results:
> 1. **Permit $/sf:** median **$104/sf** (n = 220, 1–2 family). Declared value is 0.31× the later sale price, so it **understates**. Not a cost input. → [r9 permit sweep](../../sweeps/r9-permit-cost-per-sf.md)
> 2. **Comps:** only 15 of 90 neighborhoods have ≥5 new-build comps in 5 years. Use existing-stock sales, which are dense, plus a new-build premium. Rent varies 2.0× across City tracts (p10–p90), from ACS 2024 via keyless Census Reporter. → [r9 comps sweep](../../sweeps/r9-revenue-comps-sub-zip.md)
> 3. **NAHB 2024:** $162/sf ($149 without fees), which matches the $150 SME tier. The Pittsburgh RSMeans factor is 1.01 (2021). **No public source confirms $325–375.** URA budgets: $395k and $487k TDC/unit for small new builds. → [r9 cost sweep](../../sweeps/r9-cost-benchmarks-and-gap-finance.md)
> 4. **Brownfield:** DEP points, no parcel ID, no cleanup status. Use a buffer join as a "verify" flag only. → [r9 brownfield/demolition sweep](../../sweeps/r9-brownfield-and-demolition-layers.md)
> 5. **Demolition:** permits join 100%. City demolitions leave the foundation walls in place (confirmed in the permit text), but about 94% of vacant lots have no record. → same sweep
> 6. **SME-pointed resources:** YCBTH has 17 demo test cases. Rescope is a cited rule table with red/orange/green flags and no pro forma. ShurSave was a ZBA height *denial*. The ACTION-Housing talk covers 23 sources, ~2 years to groundbreaking and 70:30 hard:soft. → [r9 resources sweep](../../sweeps/r9-sme-pointed-resources.md). **Not done:** the `#resources-and-data` spreadsheet and the 4 Slack screenshots (need Slack access).
> 7. **PHFA DSCR** is **1.20** in the 2025 guidelines (PennHOMES + amortizing loan); 1.15 is from 2016/18. **URA caps:** RGP $75k/$50k/$35k per unit at 30/50/60% AMI, $2M per project; FSDP $130k per new unit.
> - **Not changed:** main's `PLAN.md` and the groundwork spec are on `main`, not this research branch. Mark them superseded there.

1. **Local $/sf from permits** (S7). WPRDC `pli-permits.total_project_value` ÷ assessment `FINISHEDLIVINGAREA` for recent new single-family and small multi-family builds. This gives a *local, citable* distribution to check the SME ranges against. Nobody has done it. Beware: permit valuations are known to understate.
2. **Revenue comps at sub-ZIP geography** (S2, S12). New-construction sales (code 16) per neighborhood or block group; ZORI/ZHVI only as a fallback, since rent varies within the City.
3. **NAHB Cost of Constructing a Home and RS Means Pittsburgh city cost index** (S7). Neither appears anywhere in the research. RS Means is paid, so NAHB's ratio breakdown plus a public city-index figure may be enough.
4. **Environmental/brownfield layer** (S9, S10). DEP Act 2/AUL sites were researched (`sweeps/r2-deeper-data-sources.md` L67) but never built. This is the SMEs' other named deal-killer.
5. **Demolition history as a site-cost signal** (S8). Can City demolition permits or the condemned/demolished list flag lots with basement debris?
6. **Resources the SMEs pointed to that we haven't read:**
   - Pro-Housing Pittsburgh "You Can't Build That Here" series: https://www.prohousingpgh.org/ycbth. Worked examples of how zoning constrains real parcels, useful as demo test cases.
   - Rescope, https://www.rescope.co/. The closest analogue, CA-only. Check how it presents feasibility.
   - WESA 2023-11-07, Bloomfield ShurSave development snag. A worked example for the "compare two scopes" idea (S14).
   - ACTION-Housing talk to Pro-Housing Pittsburgh on building affordable housing (YouTube, about 1 hr; the link is in Slack, truncated in our capture). How gap financing actually works locally (S13).
   - `#resources-and-data` data-source spreadsheet. Confirm whether it's the organizer catalog we already have (`knowledge/data/organizer-data-catalog.md`).
   - 4 screenshots in the Pro-Housing SME's reply of 2026-09-26 12:41 PM, in the Track 1 "Development Feasibility Navigator" thread. Images only; not captured.
7. **Not researched at all:** the PHFA 1.15 coverage ratio (DSCR), and gap-financing per-unit caps (URA HOF, etc.). This is low priority for this weekend (S13: "can vary wildly").

---

## 4. Bugs found during the comparison (verified in code)

1. **The chat receives `[object Object]` for pillar warnings.** `apps/web/src/components/chat/parcel-context.ts:38` interpolates a `Flag` object (`{text, capped}`, `score.ts:29`) into a string. It also says "so this pillar is capped" even for flag-only gates (cap 100). Fix: use `f.text` and branch on `f.capped`.
2. **The chat's re-score disagrees with the panel.** `parcel-context.ts:156-164` and `chat/rescore.ts:9-19` use the published default weights instead of the user's weights. They skip missing pillars instead of imputing p25, and they omit the legal and availability multipliers. So the chat's "before" number can differ from the Overall on screen.
3. **Stale definition.** `packages/api/src/chat/facts.ts:138` says the Parcel Score "is the average of the consideration scores." It's actually a weighted geometric mean × legal × availability multipliers.

---

## 5. Already aligned (no change needed)

- **Decision-support framing and the limitations requirement** are in research (`knowledge/challenge/rules-and-deliverables.md` L74, L89). They're just not in the app yet (P0-1, P0-2).
- **Hazard layer coverage** (slope, landslide, undermined, flood) matches what the SMEs listed. Only contamination is missing.
- **Legal/zoning depth:** the typology × district pathways, ZBA rates and rezoning closeness are exactly the "zoning done well" dimension S4 endorses.
- **"Unknown ≠ bad" for utilities** matches S10.
- **Setbacks are the most-varied section in our ZBA sample,** consistent with S11's example.
- **Editable, labelled assumptions** (`pro-forma.md` L68) match S12/S13.
- **Comps approach** (WPRDC sales + Zillow) matches S2/S3.
- **"No parcel feasibility tool exists for Pittsburgh"** (S14) supports the premise.
