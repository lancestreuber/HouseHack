# Groundwork PGH: Design (Track 3, 30-hour cut)

Revised Sat Sep 26, ~3pm ET, from two team whiteboards: the factor list, and the pane-layout sketch. This replaces the earlier Track 1+3 design. Git history holds the old version. The implementation plan (owners, files, milestones, tasks) is in [`/PLAN.md`](../../../PLAN.md).

## Context
- AI Horizons 2026 AI for Housing Hackathon, Track 3 (Housing Typology, Equity & Climate Matchmaker), City of Pittsburgh.
- **Budget: 30 wall-clock hours**, from Sat 2pm to Sun 8pm. Submissions close Sun 11:59pm, and we submit at 9pm.
- Judges score problem value, usability, a reliable demo, data/AI integrity (citations, uncertainty, no PII), actionability and continuation potential.
- Deliverables: a 3–5 min demo video, a public repo and the Google Form.
- **Guiding rule: demoability over coverage.** One flow must work flawlessly on real data. Every factor we can't source well in about 1 hour gets cut, not faked.

## The product: two ways in
1. **Explore (parcel → what to build).** Click a parcel and see its **considerations**: each factor scored, with a comment, a warning where one applies, and a source. The parcel gets **one unbiased Parcel Score**, which uses **the user's weight for each consideration**. The six **typology cards** show how well the parcel suits each housing type, and **Jev** judges that fit.
2. **Find (what I want to build → which parcels).** You say "I want to build senior housing", optionally add a purpose ("near a clinic, for people who can't drive"), and choose a scope: the city, a neighborhood, or your favorites. The algorithm shortlists legal, big-enough parcels. **Jev** then scores each one for that purpose and returns a confidence. The result is a ranked list on the map.
3. **Compare favorites** *(low priority, end goal).* Star parcels into a set for a purpose. Jev picks which parcel best fits the purpose and gives a probability for each.

### Who decides what
| Layer | What it decides | Why |
|---|---|---|
| **Algorithm** (deterministic, `packages/scoring`) | Consideration scores, the **Parcel Score** (user weights), **legality** per typology, shortlists | Transparent and reproducible. The same inputs always give the same output. Legality is never left to AI. |
| **Jev** (TypeSafe, a typed decision model) | **How good a parcel is for purpose X**: typology fit (a score with a confidence) in Explore, ranking in Find, and a choice among favorites in Compare | Weighs each typology's *demands* against the facts. For example, senior housing needs air quality, health access and flat ground. Returns calibrated probabilities instead of text, so it can't hallucinate prose. |
| **People** | Weights, purpose, final pick | "We suggest; people decide." |

No Claude and no free-text generation. All user-facing wording is templated from facts.

## Demo story: "Homewood CDC wants to know which vacant lots fit what housing"
1. **Explore.** The map opens on Pittsburgh with the Demand choropleth. Search "Homewood" and turn on **city-owned lots**.
2. Click a lot. The right pane lists its considerations like a set of review comments:
   - ✓ Transit: 180 m to a bus stop
   - ⚠ Slope: 40% of the lot is on ≥25% slope
   - ! Landslide-prone area

   The Parcel Score is 64. The bottom pane shows 6 typology cards with Jev fit numbers.
3. Click the **Senior housing** card. Its demands (air, health access, slope, transit) light up in the considerations pane. Jev says "Fair, 71% confident", and the notes explain which demand fails.
4. Drag the **Air** weight up. The Parcel Score and the map recolor instantly (algorithm only).
5. **Find.** Switch to "I want to build… **senior housing** in Homewood". A shortlist of 10 parcels appears, ranked by Jev fit with confidence, and each one is highlighted on the map.
6. *(If built)* Star three of them, then **Compare for senior housing**. Jev's choice probabilities appear as a bar per parcel.
7. **Print** the report. Open **Methodology**: it covers sources, dates, weights, "Algorithm vs. Jev", and "what this tool can't tell you".

## Typologies (6)
| Id | Name | Meaning | Legality (deterministic) | Demands (what Jev weighs; highlighted when the card is selected) |
|---|---|---|---|---|
| `sfd` | Classic neighborhood | Single-family detached | zoning-rules.md table | lot size, schools, parks, flat ground |
| `adu` | ADU | Backyard or garage unit on a lot with a house | Illegal everywhere today, so the card always shows "not allowed". A note says pending Bill 2025-1545 would allow ADUs by right. | existing structure, lot size, transit |
| `duplex` | Duplex | 2 units (triplex treated the same) | zoning-rules.md | lot size, transit, demand (small households) |
| `townhome` | Townhome | Attached rowhouses | zoning-rules.md. R1D is "uncertain" and gets flagged. | lot size, schools, flat ground |
| `apartments` | Apartments | 4+ units | zoning-rules.md | lot size, transit, shops, demand |
| `senior` | Senior housing | Age-friendly small multifamily | The more permissive of `duplex` and `apartments` | **air quality, hospital/fire, transit, flat ground, 65+ share** |

When a type is "not allowed", its card is greyed out and Jev is **not asked** about it. "Needs approval" shows a chip.

## Considerations (whiteboard mapping)
★ marks a factor starred on the whiteboard. Each consideration yields a 0–100 score, a severity, a one-line comment and a source.

| Consideration | Inputs (WPRDC slug unless noted) | Level |
|---|---|---|
| Lot size ★ | parcel geometry (`allegheny-county-parcel-boundaries1`, already in PostGIS) | parcel |
| Zoning ★ | `zoning` + `ZONING_RULES`. Score = how many typologies are by right. | parcel |
| Hazards ★ (landslide, flood, undermined) | `landslide-prone-areas`, `landslides`, `2014-fema-flood-zones`, `undermined-areas` | parcel |
| Slope | `25-or-greater-slope`: share of the parcel on ≥25% slope | parcel |
| Air quality ★ | `emissions-inventory`: criteria-pollutant tons/yr within 2 km, inverse-distance weighted | parcel |
| Transit ★ | `prt-of-allegheny-county-transit-stops`: distance | parcel |
| Parks & greenways | `parks1`, `greenways`: distance | parcel |
| Health & emergency ★ | `hospitals`, `pgh-fire-stations`: distance | parcel |
| Schools | `pittsburgh-public-school-locations`: distance (proximity only) | parcel |
| Shops *(Should)* | `allegheny-county-assets`: grocery/retail within 800 m | parcel |
| Demand | ACS neighborhood file (`Var_2023_Age_*`, `hhtype_*`, vacancy) + `pli-permits` in the last 3 years | neighborhood |

**Context rows** are shown but never scored: median income, median rent, nearest monitor's AQI, city-owned status.

**Not used, and stated on the methodology page:**
- **Crime:** the feed has been broken since 2025-10, and crime data carries equity bias. So the whiteboard's "Safety" card becomes **Hazards**.
- **Tornado:** no meaningful variation inside the city.
- **Water/sewer capacity:** not public.
- **School quality.**

### Severity (the review-comment model)
| Severity | Rule | Look |
|---|---|---|
| ✓ ok | score ≥ 70 | muted green dot |
| • consideration | 40–69 | amber dot |
| ! warning | < 40, or any hazard flag | red dot. Warnings also appear in **Notes**. |

## Algorithm (deterministic; the "unbiased" score)
- **Normalize.** Each consideration becomes a 0–100 score, using thresholds for distances and hazards and percentiles for emissions and neighborhood metrics. The table lives in `packages/scoring/src/considerations.ts` and is printed on the methodology page.
- **Parcel Score.** `Σ w_c × score_c / Σ w_c`, where `w_c` is **one user weight per consideration** (default 1, range 0–3). It is typology-agnostic, and it is the same formula for everyone.
- **Legality.** `ZONING_RULES[zon_new][typology]` gives by right, needs approval, not allowed, or uncertain.
- **Find shortlist.** First filter for legal (not `not_allowed`), lot ≥ the typology minimum, inside the scope. Then rank by Parcel Score reweighted by the typology's demand profile, and send the top 40 to Jev.
- **Fallback.** Without Jev, typology fit = the demand-profile-weighted mean of consideration scores. It is labeled "rule-based estimate".
- **Where it runs.** Consideration scores and the Parcel Score are computed **in the browser**, so sliders are instant. Jev runs on the server.

## Jev integration
- **Transport:** Cloudflare Workers AI REST `POST https://api.cloudflare.com/client/v4/accounts/{CF_ACCOUNT_ID}/ai/run/typesafe/jev`, with body `{ state, questions }`. The call uses plain `fetch`, so no new dependency. The context window is 32k tokens.
- **Question types:** `score` (2–10 ordered levels, with confidence), `choice` (closed option list, with per-option probabilities) and `noul` (probability that a statement is true).
- **State:** the parcel's facts JSON: id, label, value, unit, severity and source for each consideration, plus context rows and the neighborhood name. Never PII.
- **Explore call** (one per parcel, cached):
  - one `score` question per *legal* typology: `fit_<typology>`, 5 levels (poor, weak, fair, good, excellent), with instructions naming that typology's demands
  - a `noul` question `major_concern_<typology>`
- **Find call:** one `score` question for the requested typology + purpose, per shortlisted parcel. Fan out 40 calls in parallel with a concurrency of about 10.
- **Compare call:** one `choice` question across ≤6 favorites, where each option's description is that parcel's fact summary, plus one `score` per option.
- **Display:** the level, mapped to 0/25/50/75/100, plus the confidence ("Fair · 71%"). Confidence below 0.5 shows "uncertain". Each card lists **which demands pulled the fit down**. That list is deterministic (the demand considerations with a red or amber severity), so the card never shows AI-invented reasons.
- **Cache:** `jev_cache(key = sha1(pin | typology | purpose | rubric_version))` in Postgres. The demo parcels are precomputed.
- **Failure:** on a timeout (8 s) or a missing key, fall back to the rule-based estimate, with a label.

## Frontend: pane explorer (super minimal, dark)
The layout follows the whiteboard sketch: **resizable, collapsible panes**, using the shadcn `resizable` component.
```
┌──────────────────────────────────────┬───────────────────────┐
│ [Explore | Find]  ⌘K search   weights│ SCORE 64  ▸ weights   │
│                                      │ Considerations        │
│              MAP (parcel)            │ ! Hazards    landslide│
│   parcels colored by Parcel Score    │ ⚠ Slope      40% ≥25% │
│   selected = yellow outline          │ ✓ Transit    180 m    │
│                                      │ ✓ Health     1.1 km   │
│                                      │ ── Notes ───────────  │
│                                      │ ! Zoning: verify w/ ZA│
├──────────────────────────────────────┴───────────────────────┤
│ Evaluate typologies  (Explore)  /  Shortlist (Find)          │
│ [SFD 72] [Duplex 65] [Town 60] [Apts —] [Senior 50·71%] [ADU ✕]│
└──────────────────────────────────────────────────────────────┘
```
- **Grammarly model.**
  - The map/parcel is the *content*.
  - Considerations are *comments*: a dot, a name, a short value and one line of text, expanding to the source, as-of date and Evidence/Assumption label.
  - Notes are the *warnings and caveats*.
- **Typology cards** (bottom pane) show a big number, the legal badge, Jev confidence and demand chips. Selecting a card **filters and highlights** its demands in the considerations pane and adds typology-specific notes.
- **Find mode** turns the bottom pane into the ranked **shortlist**: a row per parcel with address, Jev fit, confidence and a ☆ button. Hovering a row highlights the parcel on the map.
- **Weights** live in a popover from the score header: one slider per consideration, with a reset button. They are saved in the URL.
- **Visual system.**
  - Near-black background (`#0B0B0C`), 1px `#222` pane borders, no shadows, no card chrome inside panes.
  - Inter/DM Sans at 13px; tabular numbers for scores.
  - Color only for severity (green/amber/red at low saturation) and **yellow `#F2C230` for selection only**.
  - Carto dark basemap.
- **Mobile.** Panes stack in this order: map, typologies, considerations. The collapse toggles stay.

## Equity and integrity (what judges check)
- Income and rent are context only. Race and crime never enter any score.
- Every consideration shows its source link and as-of date.
- Zoning carries the note "Simplified interpretation. Verify with the Zoning Administrator."
- **AI boundaries are explicit:**
  - Jev never decides legality and never generates text.
  - Its confidence is always shown.
  - The rule-based fallback is labeled.
  - The methodology page explains algorithm vs. Jev.
- The methodology page includes a "What this tool can't tell you" section covering:
  - crime, tornado, water/sewer capacity, school quality
  - market feasibility and cost
  - that air quality is an emissions proxy
- No PII. Owner names are stripped at import and never sent to Jev.

## Stack (committed; no new frameworks)
- **Base:** `zoning-parcels` (now merged into `main`). It gives us:
  - Neon Postgres + PostGIS parcels
  - oRPC `parcels.getByBounds`
  - the `maplibre-gl` 6 map with the zoning layer and worker/Vite fixes
- Monorepo stays as scaffolded: bun + Turborepo, TanStack Start (`apps/web`), oRPC (`packages/api`), Drizzle (`packages/db`), shadcn/base-ui (`packages/ui`), Vercel.
- **One new package:** `packages/scoring` (pure TS, `bun test`), which also holds the Jev rubrics. Data scripts live in `packages/db/src/scripts/`.
- **New deps:** only the shadcn `resizable` component (react-resizable-panels). Jev uses `fetch`.
- **Env:** `CF_ACCOUNT_ID` and `CF_AI_TOKEN` (Workers AI). If the team's TypeSafe early-access key works, the lead may swap the transport; the questions and state stay the same.

## Priorities
1. **Must:**
   - Explore mode with algorithm considerations and the Parcel Score
   - weights, legality, typology cards (rule-based fit)
   - panes
   - city-owned layer
   - methodology
2. **Must, by M3:** Jev typology fit in Explore (with cache and fallback) and Find mode with the Jev shortlist.
3. **Should:** print, shops, AQI context, layer toggles.
4. **Low / end goal:** Jev Compare favorites.

## Explicitly cut
- Claude and any text generation: the brief, companion chat, "ask the map"
- ADU reform toggle
- Pro forma, personas, commute, satellite layers, 3D massing, Monte Carlo confidence
- Redlining, lead lines, Eviction Lab, displacement, Market Value Analysis
- Crime, tornado, water/sewer, school quality

## Verification
- `bun test` in `packages/scoring`, with golden cases:
  1. A flat R1D lot near a school: `sfd` is by right and `apartments` is not allowed.
  2. A landslide-prone steep parcel: a Hazards warning appears and the Parcel Score drops.
  3. Raising the Air weight changes the Parcel Score in the expected direction.
  4. ADU is `not_allowed` everywhere.
  5. With Jev mocked, a not-allowed typology is never sent to Jev.
- Jev: 3 demo parcels are precomputed and checked by eye to see whether the fits make sense. Removing the token triggers the labeled fallback.
- Three demo parcels are checked by hand against the city zoning map (Homewood city-owned lot, Lawrenceville, Beechview hillside).
- Deploy checks: `bun run check-types` and `bun run build`. Open the Vercel preview in a fresh browser with no login. It must be interactive in under 3 s.
