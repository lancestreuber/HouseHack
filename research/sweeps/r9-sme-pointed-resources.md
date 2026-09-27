# Sweep: Resources the hackathon SMEs pointed us to

**Round 9** · 2026-09-27 · single research subagent

> Tags: **[read]** = fetched and read the primary page or its full text this session (for the video, the auto-generated caption transcript); **[skimmed]** = search snippet, fetch-tool summary, or a secondary source's reading; **[found]** = known to exist, not opened. Per the domain rule in `knowledge/README.md`, **zoning rule values quoted from advocacy posts stay leads until they are checked on eCode360**. Nothing here says what other teams will build. People are cited by role.

The request came from [SME feedback gap analysis](../knowledge/build-plan/sme-feedback-gap-analysis.md), items S13 and S14 and research item 6.

---

## TL;DR

- **The "You Can't Build That Here" series has 17 entries** (2023-10-25 → 2026-06-09): 16 City buildings (one of them Downtown, GT-C) and one out-of-City contrast (Homestead's Waterfront). Every City entry names an address, district, lot size and the rules that block rebuilding; 14 of the 17 also give a parcel ID. **This is a ready-made set of demo test cases** (table below). We checked the district of 16 addresses against the live `PGHWebZoning` layer today, and **15 of 16 match the post**. The 16th, 7 N Commons, did not geocode, so it is unchecked.
- ⚠ **15 of the 17 posts predate the 5/7/2025 minimum-lot-size reform (Ord. 10-2025).** Their lot-size and lot-area-per-unit numbers (e.g. R1D-L 5,000 sf, "1,800 sf per unit") are the **old** values. A tool run today should give a *different* answer on the lot-size row for several cases, while use, height, setbacks and parking still block. That makes them good regression tests for "does the tool use the current code?"
- **Rescope (CA-only)** presents feasibility as a **per-parcel regulatory report**: address → district, setbacks, height, FAR, lot coverage, uses (Permitted / Conditional / Prohibited), overlays, and **red / orange / green flags**, with "every rule cited to source". It claims a "30s go/no-go". Its only uncertainty handling is **citations plus "confirm with the planning department"**. **No pro forma** is visible on the public site. It claims 5 CA jurisdictions. Marketing only `[read]`; product not tried.
- **Bloomfield ShurSave (4401 Liberty Ave, LNC)** is the cleanest "two scopes on one parcel" case. The **by-right scope** was 3 stories / 45 ft in LNC. The **proposed scope** was 5–6 stories with 248 apartments (25 IZ units at 50% AMI), a grocery and retail. The developer said "financing required" six stories. On 2023-11-07 the ZBA **denied the height and residential-compatibility variances**, calling height "policy-making … for the governing body", and **granted the grocery special exception**. The developer appealed on 2023-12-06, then **abandoned the plans by 2024-07**; the site went to its grocery affiliate. We did not find a court outcome. Scope history: ~190 units / 4 stories in 2021, 248 units / 6 stories in 2023. A 2021 **rezoning** of a rear residential strip to LNC was sought as a separate Council-track change.
- **ACTION-Housing talk (2024-04-11, 71 min) was transcribed from YouTube auto-captions** `[read]`. Local LIHTC mechanics: hard/soft about 70/30. About 2 years from application to groundbreaking (≈6 mo to apply, ≈6 mo to award, ≈12 mo design), then 16–18 months to build. A record **23 sources** on one deal. The example is a 35-unit project where the sponsor put in about $1M of its own money and **deferred its whole ≈$1.5M developer fee** to close the gap. Pittsburgh won 6 of 33 PA 9% awards in the last round (about 3 is typical), producing **361 units statewide**. Pro-Housing Pittsburgh reads the talk's slide as **$16M / 35 units ≈ $460K per unit** `[skimmed]`.
- **We found no Pro-Housing Pittsburgh post with a construction-cost breakdown or a small-infill pro forma** in its 51 blog posts. The only cost numbers are: ≈$400–500K per unit (IZ post, citing the ACTION deal), ≈$30K per structured parking space, and a $25/sf payment-in-lieu under the proposed AHBP amendment.

---

## 1. Pro-Housing Pittsburgh, "You Can't Build That Here" (YCBTH)

**What it is.** A blog series in which each post takes an existing, well-liked building and shows it could not legally be rebuilt under today's code. The index page is https://www.prohousingpgh.org/ycbth. A WebFetch of that page showed only one entry, because it is JS-rendered. The raw HTML listed **17 post links**. Each post was pulled as Squarespace JSON (`?format=json`) and read in full `[read]` (excerpts: [sources/prohousingpgh-2026-09-27-ycbth-series-excerpts.md](../sources/prohousingpgh-2026-09-27-ycbth-series-excerpts.md)). The blog's own listing has the same 17 posts.

**How to read it.**
- These are **existing buildings, not proposals**. The "proposed" column below is "rebuild what stands there". The one exception is Lanark St, which describes a real affordable-housing application that went through the ZBA and the courts.
- The **rule values are the authors' reading of the code at the time of writing**. They are leads, `[skimmed]` as code, until checked against eCode360. Our own `[read]` code table is in [dimensional standards](../knowledge/policy/dimensional-standards-and-use-table.md). ⚠ Known drift since Ord. 10-2025: the minimum lot sizes are now **L 3,000 / M 2,400 / H 1,200 / VH none**, and the **lot-area-per-unit row was deleted**. The posts use the older values: L 5,000, M 3,200, H 1,800, VH 1,200 for the minimum lot; per-unit L 3,000, M 1,800. The posts are also internally inconsistent about L (Woodlawn says R2-L needs "3,000 sf per unit"; Park View Flats says R2-L needs a "minimum lot size of 5000"). The old table had both a minimum lot and a per-unit row, which is probably the reason (our inference).
- **Parking at 1 space per unit** is cited throughout. Bill 2025-1545 would eliminate parking minimums, and its vote status is unknown to us (see [reforms in flux](../knowledge/policy/reforms-in-flux-2025-2026.md)). A demo should show the parking row as "depends on pending bill", not as a settled blocker.
- The 2024 attached-housing bill ("Houses can touch", referenced in the 1703 Broadway post) may have changed the "attached in a detached zone" blocker. **Unchecked.**

**Current district check.** Addresses were geocoded with the Census geocoder, then point-queried against `PGHWebZoning/FeatureServer/0` (`zon_new`) on 2026-09-27 `[read]`. The GIS layer's own staleness caveats apply (see [zoning GIS](../knowledge/data/zoning-gis.md)).

### YCBTH test-case table

"Blocks" lists what the post says prevents a by-right rebuild. ✔ = the post's district matches the live GIS today. `*` = the lot-size or per-unit figure predates Ord. 10-2025 and needs recomputing under current §903.03.

| # | Date | Address (neighborhood) | Parcel (post) | District (post / GIS today) | Lot (sf) | Existing (the "proposal") | By right, per post | Blocking rules cited | Outcome / note |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 2023-10-25 | 5176 Margaret Morrison St (Squirrel Hill N.) | 53-C-93 | R2-L ✔ | 5,529 | 4 st., 11 apts + 1 commercial, 11,982 sf | 1 SF house ≈2,250 sf, 15 ft wide | 3,000 sf/unit*; setbacks 30 front/rear/ext. side, 5 int.; 40 ft/3 st.; 1 pkg/unit; commercial use | Existing nonconforming |
| 2 | 2023-11-08 | 732-734 S Millvale Ave (Bloomfield) | 51-J-37 | R2-M ✔ | 11,700 | 24 apts, 4 st., ≈32,000 sf, no parking | 3 duplexes on 3 lots, ≈4,500 sf total | 2-unit cap; min lot 3,200* + 1,800/unit*; setbacks 30/30/30, 5; 40 ft/3 st.; 1 pkg/unit | Existing nonconforming |
| 3 | 2023-11-22 | 21 Lanark St (Fineview) | 21-C-213 | R1D-H ✔ | 1,800 (20×90) | 1900 rowhouse, 1,992 sf, attached, no setbacks | 10×60 ft footprint, detached, 1 pkg | setbacks 15 front/rear/ext., 5 int.; min lot 1,800*; detached-only; 1 pkg | **Real case:** nonprofit + CLT applied 6/2022 for 8 affordable homes on Lanark St; ZBA granted variances 3/2023; neighbors sued 4/2023; Common Pleas reversed 9/2023; the sponsor estimated **+$120K and ≥1 year** (WESA, quoted in post) |
| 4 | 2023-12-06 | 1137 N Highland Ave, "The Eaglemoor" (Highland Park) | 82-M-167 | R1D-L ✔ | 16,543 | 21 apts, 3 bldgs, ≈30,000 sf | 3 SF houses after subdivision | single-unit use; min lot 5,000*; setbacks 30/30/30, 5; 40 ft/3 st.; 1 pkg/unit | Existing nonconforming |
| 5 | 2023-12-20 | 612 Hillsboro St, "Hillsboro Plaza" (Sheraden) | 42-S-36 | LNC ✔ | 32,287 | 8 st., 73 senior units, 54,800 sf (FAR 1.69) | ≤3 st./45 ft | **Height only.** FAR 2:1 ok; senior housing may use a Parking Demand Analysis (§914.02.B) | Useful as a "single binding constraint" case |
| 6 | 2024-01-03 | 873 Boggs Ave, "Palm Garden Apts" (Mt. Washington) | 15-N-75 | P (Parks) ✔ | ≈98,000 | 3 bldgs, 54 units, 3.5 st. | single-family only by right | use (multi-unit not permitted in P); >3 stories; FAR 1:1, setbacks, 3,200 min lot* not binding; 1 pkg/unit (next to a T station) | Post cites the Irish Centre P-district fight |
| 7 | 2024-01-17 | 2117 E Carson St, "Carson Towers" (South Side Flats) | 12-F-372, 12-F-365 | LNC ✔ | 42,240 | former hospital, 5–6 st., FAR >4 | ≤45 ft, FAR 2 | FAR 2:1; height 45 ft; **§916.02.B.1 residential compatibility** (<50 ft from R1A → 40 ft/3 st.); **§922.04.E Site Plan Review** ($750 + $50 fee, up to 30 days) | Good case for compatibility and site-plan rules |
| 8 | 2024-01-31 | 500 Tripoli St, "School House Apts" (East Allegheny) | 23-M-196 | R1A-VH ✔ | ≈48,000 | 77 units, 4 st., ≈120,000 sf | ≈40 attached SF lots | single-unit use; min lot 1,200* (**now none**); 40 ft/3 st.; setbacks 5 front, 15 rear (contextual via §925.06) | Lot-size blocker is gone post-reform; use + height remain |
| 9 | 2024-02-14 | 7 N Commons, "Park View Three" (Allegheny Center) | 23-R-30 | UNC (post); GIS **unchecked** (geocode failed) | ≈87,000 | 11 st., ≈210 units, ≈190,000 sf | 3 st./45 ft; 4 st./60 ft within 1,500 ft of a major transit facility; 8 st./85 ft by special exception | height; FAR 3:1 (4:1 near transit); 1 pkg/unit (a twin on the 42,000 sf lot next door fails FAR + parking) | Transit-overlay test case |
| 10 | 2024-02-28 | 1703 Broadway Ave (Beechview) | 35-K-192 | R1D-H ✔ | 9,020 (triangular) | 12 apts, 3 st., attached, no parking | ≈5 SF houses | use (multi-unit); attached in a detached district; 15 ft front/rear; 12 pkg; min lot 1,800* | On the Red Line |
| 11 | 2024-04-25 | 555-575 S Negley Ave, "Dover Gables" (Shadyside) | 51-M-343 (N half, R1A-VH); 84-J-59 (S half) | RM-M ✔ (575, S half) | S half 30,719 | 40 townhouses; S half 20 rentals | S half ≈17 units by lot area; ≈8 by parking | rear setback 25 ft (has ≤15); 1,800 sf/unit* (36,000 needed); 1 pkg/unit (8 of 20) | Split-zoned site; next to Negley busway station |
| 12 | 2024-07-03 | 1401 N St Clair St, "Park View Flats" (Highland Park) | not given | R2-L ✔ | 7,450 | 4 st., 16 two-bed apts | 2 units | 2-unit cap; min lot 5,000* (so no split); setbacks 30/30/30; 40 ft/3 st. | Existing nonconforming |
| 13 | 2024-07-17 | 1727 Bedford Ave, "August Wilson House" (Hill District) | 9-S-36 | RM-M ✔ | 9,732 now (orig. 2,767) | 1880s 3-st. mixed use: grocery + apts | nothing on the original lot | min lot 3,200*; front 25, int. side 10; grocery not permitted in RM-M; 1,800 sf/unit*; 1 pkg/unit | Lot consolidation changed the answer |
| 14 | 2024-07-31 | 3525 Beechwood Blvd (Greenfield) | 88-B-44 | R2-M ✔ | 5,007 (40×125) | 2-st. fourplex | duplex | 2-unit cap; 1,800 sf/unit*; front 30 (has ≤20); 5 ft side (33 ft bldg on 40 ft lot); 1 pkg/unit | Classic "missing middle" case |
| 15 | 2024-12-15 | 100 N Linden Ave, "H.G. Imhoff House" (Point Breeze) | not given | R1D-L ✔ | 9,164 | 3 st., 10 apts | 1 SF house | single-unit use; 3,000 sf/unit*; rear 30; 10 pkg | Post says only one house on the block conforms |
| 16 | 2026-04-26 | 717 Liberty Ave, "Clark Building" (Downtown) | 1-D-66 | GT-C ✔ | 16,181 | 23–25 st., ≈291,000 sf, ≈200 residents | FAR ≤10 | FAR 10 (has >17) | Post also cites a recent ZBA **denial** of a FAR-10 variance at 17th & Penn (Strip) `[skimmed]`, a candidate ZBA case to look up |
| 17 | 2026-06-09 | The Waterfront, Homestead / West Homestead (outside City) | not given | Waterfront Development District (borough) | ≈3 ac | 250 new apartments on a former restaurant parking lot | by right there | WDD: parking min(1/bedroom, 1.5/unit); 7 st./84 ft; setbacks 30 roads/rail, 25 river, 0 other | Contrast case: "nearest City equivalent is probably RM-H" |

**Candidate demo uses (our inference).**
- **#5 Hillsboro Plaza** and **#16 Clark** each fail on exactly one rule (height; FAR). They are clean "why not" explanations.
- **#8 School House** and **#4 Eaglemoor** show the 2025 reform changing one row while others still block. They test whether the tool uses the current code.
- **#7 Carson Towers** exercises the rules most tools skip: Ch. 916 compatibility and §922.04.E site plan review.
- **#11 Dover Gables** is split-zoned. It tests multi-parcel and multi-district handling.
- **#3 Lanark St** is the only case with a real application, a ZBA grant, a court reversal and a cost/delay number. It pairs with the variance-risk framing in [ZBA decisions](../knowledge/data/zba-decisions.md).

---

## 2. Rescope (rescope.co)

`[read]` for the public pages (curl of static HTML, 2026-09-27; excerpts: [sources/rescope-2026-09-27-site-claims.md](../sources/rescope-2026-09-27-site-claims.md)). The product itself was **not** tried: it needs an account, and coverage is California only.

- **Inputs:** an address, APN or coordinates. Separate parcels can be merged with "Combine Parcels". There is a separate plan-upload flow (PDF, DWG, DXF, RVT) for code-checking drawings.
- **Outputs:** zoning designation and overlays; allowed uses split into **Permitted (by-right) / Conditional (CUP) / Prohibited**; development standards "calculated for your specific parcel" (setbacks, height, lot coverage, FAR, parking); for developers, "maximum buildable area, unit count, and parking"; "Entitlement Risk Assessment" (variances or conditional uses needed); "Market Comparables: See what's been approved nearby"; exportable PDF / share link; an API on paid tiers.
- **Verdict style:** a **"go/no-go"** headline ("30s go/no-go answer") plus **traffic-light flags**: red = problem, orange = needs review, green = compliant. The hero mock-up shows a "Compliance 94.7 %" score and a "Violations 3" count. That is a sample UI; how the score is computed is not stated.
- **Uncertainty handling:** citations ("every rule comes back with its source citation so you can verify it") and a disclaimer ("We recommend confirming critical decisions with the local planning department"). The docs claim conditional-use pages show "typical approval requirements and timelines based on historical data". That is the only probabilistic or precedent element, and it is unverified.
- **Pro forma:** **none on the public site.** It is a regulatory-feasibility tool. "Investment Memos" are described as zoning reports formatted for investors.
- **Coverage and claims:** "Los Angeles (city and county), San Diego (city and county), and San Jose today". The same page's CTA says "any parcel in the US", which contradicts it. No pricing page (`/pricing` 404s); first analysis free.
- ⚠ **Honesty markers.** The blog, case-study and testimonial content reads as templated. It uses generic author names and a "Westfield Development Group … 80% time savings" case, and one name appears both as a blog author and as a testimonial VP at a different firm. Treat all performance numbers ("60% reduction in permit rejections", "500+ projects monthly") as **unverified marketing**. The docs reference `app.rescope.ai` while the site links `app.rescope.co`.
- **Take-away for us (inference):** the SME's pointer holds up. The closest analogue's core is **parcel → cited rule table → flag colours → go/no-go**, with no finance and no quantified uncertainty. Two things it does not show publicly are comparing two scopes on one parcel and a pro forma, which are the gaps the SMEs raised (S12–S14).

---

## 3. Bloomfield ShurSave (4401 Liberty Ave): the "two scopes" worked example

All `[read]` unless tagged. Excerpts: [sources/wesa-2026-09-27-bloomfield-shursave-excerpts.md](../sources/wesa-2026-09-27-bloomfield-shursave-excerpts.md).

**Site.** 4401 Liberty Ave, Bloomfield, at the Bloomfield Bridge (Liberty Ave / Ella St / Howley St / Gangwish St). The assessment records (WPRDC `65855e14-…`, queried 2026-09-27) show **four parcels at 4401 Liberty: 0049S00125000000 (40,733 sf, supermarket), 0049S00128000000 (16,024 sf), 0049S00106000000 (6,552 sf, vacant commercial) and 0049S00136000000 (2,268 sf)**. That totals about 65,600 sf (≈1.5 ac). All four sold together on 2020-01-15 for $5,780,040. The news gives "nearly 2 acres", so additional parcels may be in the assemblage (**unchecked**). Live GIS at the address point: **LNC** `[read]`. Bloomfield is inside the IZ overlay.

**Timeline.**
- 2018: a prior developer proposed 237 market-rate apartments without the grocery. There was large community opposition and it withdrew in late 2018.
- 2019: BDC and ACTION-Housing produced the Bloomfield Central Gateway guidelines.
- 2020: Echo Realty bought the site (≈$6M); the store reopened as Community Market.
- **2021-11**: "Bloomfield Square", ≈190 apartments, 4 stories, 10% affordable, underground parking. The same meeting sought support for **rezoning a residential strip at the rear to LNC**, a map amendment on the Council track, to allow parking access.
- **2023-07-12**: the scope grew to **248 apartments** (25 IZ units: 6 studio, 13 1BR, 6 2BR at ≈50% AMI), a grocery, ≈10,000 sf retail and a plaza. ZBA hearing set for 8/10/2023, then Planning Commission. "Echo Realty wants to build six stories in an area where zoning rules permit only three."
- **2023-11-07: ZBA decision.** Denied the **height variance** (5–6 stories vs. 3 stories / 45 ft) and the **residential compatibility standards variance**: height "is policy-making and for the governing body to decide", and "the variances requested are not the minimum that would afford relief". **Granted the special exception for the grocery use.** (The reasoning is from our fetch tool's summary of WESA 11-07 `[skimmed]`. The quote is corroborated verbatim in WESA 11-21 `[read]`.)
- 2023-11-21: WESA reported that "Echo said the financing required a structure that would be six stories tall". The City's chief economic development officer: "There is only but so far that the zoning board can go … It's law."
- **2023-12-06**: appeal to the Allegheny County Court of Common Pleas, arguing site "topography and soil conditions" hardship (from our fetch tool's summary of WESA 12-06 `[skimmed]`).
- **2024-07-24**: plans dropped; the site was transferred to the affiliate Giant Eagle, which will keep running Community Market. BDC: "no housing will be added at this time".
- **We found no court ruling** on the appeal (searched 2026-09-27). A Post-Gazette 2024-03-15 item ("Save Bloomfield", PressReader) is `[found]`.

**The two scopes (for a "compare scopes" report).**

| | By right (LNC, per news) | Proposed 2023 |
|---|---|---|
| Height | 3 stories / 45 ft | 5 stories (grocery side), 4 over retail (Ella side); "six stories" in WESA |
| Units | not stated in coverage; bounded by LNC FAR 2:1 per the YCBTH #5/#7 reading `[skimmed]` | 248 (25 IZ) |
| Relief | none | height variance + residential-compatibility variance (denied); grocery special exception (granted) |
| Developer's stated reason | — | financing needs six stories; site soils and topography costs |

**Why it matters for a tool (inference).** The decisive fact was **not** a rule the parcel failed on paper. It was the **kind of relief**: the ZBA treated a 2× height request as policy (Council's job, via rezoning or a text amendment), not a variance. A "compare two scopes" feature should therefore label each scope with its **pathway** (by right / variance / special exception / Council map or text amendment), not only pass/fail. It should also flag Ch. 916 residential compatibility, which was part of the denied relief here. Compare Pro-Housing's #7 Carson Towers entry.

---

## 4. ACTION-Housing talk to Pro-Housing Pittsburgh: how gap financing works locally

**Found and transcribed.** "Building Affordable Housing by Action Housing | Pro-Housing Pittsburgh", https://www.youtube.com/watch?v=vJ0ReB26gVA. It is 71 min, uploaded 2024-04-16, and records the 2024-04-11 general meeting ([event page](https://www.prohousingpgh.org/events/speaker-04-11-2024) `[read]`). The speaker is ACTION-Housing's Senior Development Officer. We read the auto-generated caption transcript `[read]`. **The slides were not visible**, so slide-only dollar figures are missing. Excerpts with timestamps: [sources/prohousingpgh-2026-09-27-action-housing-talk-transcript-excerpts.md](../sources/prohousingpgh-2026-09-27-action-housing-talk-transcript-excerpts.md).

**The worked deal.** A two-building, **35-unit**, 100% ≤60% AMI LIHTC project on Penn Ave at the Lawrenceville gateway. The unit mix is 31 one-bedroom, 3 two-bedroom and 1 three-bedroom, in about 50,000 sf (speaker unsure). Construction started August 2019 and it opened in 2021. It took about 7 years end to end, "most of it in about a three-year period". The speaker would have preferred **one building, 1–2 stories taller**, because two buildings duplicate costs; the community process shaped the result.

**Mechanics as stated.**
- **Cost structure:** hard/soft ≈ **70/30**. Soft costs include professional fees, **syndication costs, construction interest, lease-up, and large PHFA-mandated reserves** (rent and operating reserves), plus the developer fee (≈$1.5M on this deal). Hard cost per sf is "pretty close" to market rate. The premium comes from reserves, syndication, environmental requirements and funding strings. Example: **RACP** brings state prevailing wage ("maybe 20% on your labor") and Buy-American rules.
- **Sources on this deal:** LIHTC equity (via syndicator NEF), **URA**, **PHFA** (several programs), **FHLB Pittsburgh AHP**, foundations. Then, to cover environmental and COVID overruns, an **ACTION sponsor loan of ≈$1M** and **the whole ≈$1.5M developer fee deferred**. The soft loans are "not really loans that ever get paid back". They are repaid only as a share of cash flow (25%, 50% or all of it) through the partnership's waterfall.
- **Number of sources:** the record is **23 on one deal**. Our existing practitioner node records 11–13 as typical from another local nonprofit ([practitioners](../knowledge/stakeholders/practitioners.md)).
- **The gap, quantified one way:** a HUD rent-comparability study put the difference between affordable and market rents for this building at **≈$580,000/yr**, "the money that typically would go towards debt service".
- **Per-unit TDC:** not spoken. Pro-Housing Pittsburgh's IZ post reads the talk's sources slide (it links t=2779s) as **"$16 million, or approximately $460k per unit"** `[skimmed]`, a secondary reading of a slide we have not seen.
- **Tax-credit equity:** the allocation was $1.2M/yr × 10 years, with pricing ranging from $0.91 to $1.06 per credit dollar. ⚠ The ASR says the deal "generated just under $1,700,000 in equity". That cannot be squared with a $12M credit stream, so it was probably ≈$11.7M. **Unverified.** If it was ≈$11.7M against $16M, LIHTC equity was about 73% of TDC (our arithmetic on two unverified figures).
- **Timelines:** ≈6 months to prepare a 9% application, ≈6 months to award, ≈12 months of A&E, which puts groundbreaking about 2 years after starting. Construction then takes **16–18 months**. There is a 10-year credit period and a 15-year compliance period.
- **Competition and capacity:** PA credit is $2.75 per capita, ≈$35.5M in 2023. The last round had **73 applications and 33 awards statewide**. The City won **6 awards** (≈3 is typical) and the County 2 more, **361 units in total (320 low-income)**. An application costs ≈$50–75K in hard pre-development. ACTION estimates ≈80% success. It files at most 2 per round (one City, one County).
- **Parking:** "every single project we build parking that doesn't get used". About half of tenants have cars. Required parking changes location choice more than unit count; the LIHTC "sweet spot" size sets scale.
- **2023 LIHTC 60% AMI limits (Pittsburgh), as spoken:** ≈$42K for 1 person and ≈$60K for 4 persons. Cross-check against HUD tables before use.

**Relevance to S13 ("gap financing can vary wildly").** The talk supports the SME. Gap closure here depended on unforeseen overruns and the sponsor's own balance sheet: a deferred fee plus a sponsor loan. A tool can **name the source stack** (LIHTC 9%/4%, URA/HOF, PHFA, FHLB AHP, RACP, foundations, deferred fee) and show a **gap = TDC − supportable debt − equity** with user inputs. It should not predict which sources a project wins (our inference).

---

## 5. Pro-Housing Pittsburgh posts on construction costs or pro formas

We listed all **51 blog posts** via Squarespace JSON pagination (2023-10 → 2026-08) `[read]`, then pulled and grepped 15 policy posts for cost terms. **No post gives a construction-cost breakdown or a small-infill pro forma.** Cost-relevant items:

- [Policy – Inclusionary Zoning](https://www.prohousingpgh.org/blog/policy-inclusionary-zoning) (2024-04-28) `[read]`: "each affordable unit … costs the same to build as a market rate unit - around $400k-$500k for the typical unit", citing the ACTION deal ($16M / 35 units ≈ $460K). It also says "typical affordable units sell for approximately $150k", which gives a claimed $250–300K loss per IZ unit. That is advocacy arithmetic, and the "sell" framing sits oddly with rental IZ.
- [Policy – Parking Mandates](https://www.prohousingpgh.org/blog/policy-parking-mandates) (2024-03-07) `[read]`: "a single parking space in a structured parking garage can cost around $30k to construct". It cites a vendor PDF ("Parking Structure Cost Outlook for 2022", `[found]`), so this is not a Pittsburgh-specific study.
- [The IZ Compromise](https://www.prohousingpgh.org/blog/affordable-housing-bonus-program) (2025-10-15) `[read]`: describes proposed Bill 2025-1545 amendments creating a voluntary **Affordable Housing Bonus Program**: a payment-in-lieu of **$25/sf of residential GFA**, "Enhanced LERTA ($425k/year)", 3 performance points, density relief, and a 20-year affordability term. The amendment status is **unknown**. Check against [inclusionary zoning](../knowledge/policy/inclusionary-zoning-and-bonus.md) before use.
- [Policy – Allow Single Staircase Buildings](https://www.prohousingpgh.org/blog/policy-stairs) (2025-03-26) `[read]`: a qualitative cost argument. A second stair wastes ≈7% of floor area on small lots. No $ figures.
- Other posts (Broad Upzoning, Minimum Lot Sizes, Perils of Block-by-Block Rezoning, LOOP, Bridge to the Future, Five Principles) have no cost or pro forma content.
- Pro-Housing's IZ study repo (`prohousingpgh/pittsburgh_iz`) is already covered in [Pittsburgh civic tools](../knowledge/landscape/pittsburgh-civic-tools.md).
- **Different method next:** local $/sf still needs the permit-valuation ÷ living-area query in the gap analysis's research item 1. Pro-Housing's blog is not that source.

---

## Open questions
- Does the attached-housing bill that "Houses can touch" supported (2024) remove the "attached in a detached district" blocker for YCBTH #3 and #10? Its ordinance number and status were not checked.
- Did Common Pleas ever rule on the ShurSave appeal, or was it withdrawn? Which parcels beyond the four at 4401 Liberty were in the assemblage, and what zoning is on the rear strip that was proposed for LNC?
- What is on the ACTION talk's sources-and-uses slide (the actual source amounts and TDC)? Slides were not captured; the equity figure is ASR-ambiguous.
- Which ZBA case is the "FAR of 10" denial at 17th & Penn (Strip) that the Clark Building post cites? It is a candidate for [ZBA decisions](../knowledge/data/zba-decisions.md).
- Park View Three (7 N Commons) needs a GIS district check by parcel ID (23-R-30) rather than by geocode.

## Sources
- Pro-Housing Pittsburgh, YCBTH index, https://www.prohousingpgh.org/ycbth `[read]` (raw HTML link list) *(accessed 2026-09-27)*
- The 17 YCBTH posts, each `[read]` in full via `?format=json` *(accessed 2026-09-27)*: [Woodlawn](https://www.prohousingpgh.org/blog/you-cant-build-that-here-woodlawn-apartments), [732-734 S Millvale](https://www.prohousingpgh.org/blog/you-cant-build-that-here-732-734-s-millvale), [21 Lanark](https://www.prohousingpgh.org/blog/you-cant-build-that-here-21-lanark-st), [Eaglemoor](https://www.prohousingpgh.org/blog/you-cant-build-that-here-the-eaglemoor), [Hillsboro Plaza](https://www.prohousingpgh.org/blog/you-cant-build-that-here-hillsboro-plaza), [Palm Garden](https://www.prohousingpgh.org/blog/you-cant-build-that-here-palm-garden-apartments), [Carson Towers](https://www.prohousingpgh.org/blog/w5ixwolawwyko9xzir1pgx4i7pjcpe), [School House](https://www.prohousingpgh.org/blog/you-cant-build-that-here-the-school-house-apartments), [Park View Three](https://www.prohousingpgh.org/blog/you-cant-build-that-here-park-view-three), [1703 Broadway](https://www.prohousingpgh.org/blog/a-hrefhttpswwwprohousingpghorgblogyou-cant-build-that-here-park-view-threeyou-cant-build-that-here-a1703-broadway), [Dover Gables](https://www.prohousingpgh.org/blog/you-cant-build-that-here-dover-gables), [Park View Flats](https://www.prohousingpgh.org/blog/you-cant-build-that-park-view-flats), [August Wilson House](https://www.prohousingpgh.org/blog/you-cant-build-that-here-august-wilson-house), [3525 Beechwood](https://www.prohousingpgh.org/blog/you-cant-build-that-here-3525-beechwood-blvd), [100 N Linden](https://www.prohousingpgh.org/blog/you-cant-build-that-here-100-n-linden-ave), [Clark Building](https://www.prohousingpgh.org/blog/you-cant-build-that-clark-building), [You Can Build That, Just Not Here](https://www.prohousingpgh.org/blog/you-can-build-that-just-not-here)
- City zoning layer `PGHWebZoning/FeatureServer/0`, point queries for 16 addresses `[read]` *(accessed 2026-09-27)*; Census geocoder `[read]` *(accessed 2026-09-27)*
- WPRDC property assessments, resource `65855e14-549e-4992-b5be-d629afc676fa`, Liberty Ave 15224 filter `[read]` *(accessed 2026-09-27)*
- Rescope: [home](https://www.rescope.co/), [Rezone](https://www.rescope.co/products/rezone), [documentation](https://www.rescope.co/resources/documentation), [developers](https://www.rescope.co/solutions/developers), [about](https://www.rescope.co/company/about), [case studies](https://www.rescope.co/resources/case-studies), [blog](https://www.rescope.co/resources/blog) `[read]`; [FAQ](https://www.rescope.co/resources/faq) `[skimmed]` (questions only, answers not in the HTML) *(accessed 2026-09-27)*
- [WESA 2021-11-02, Giant Eagle, apartments and retail planned](https://www.wesanews.org/development-transportation/2021-11-02/a-giant-eagle-apartments-and-retail-are-planned-for-a-crucial-corner-in-bloomfield) `[read]` *(accessed 2026-09-27)*
- [WESA 2023-07-12, ShurSave developer gears up for approvals](https://www.wesanews.org/development-transportation/2023-07-12/bloomfield-shursave-development-city-approval-process) `[read]` *(accessed 2026-09-27)*
- [WESA 2023-11-07, Development plans for the former Bloomfield ShurSave hit a snag](https://www.wesanews.org/development-transportation/2023-11-07/development-plans-for-the-former-bloomfield-shursave-hit-a-snag) `[skimmed]` (fetch-tool summary) *(accessed 2026-09-27)*
- [NEXTpittsburgh 2023-11-07, Bloomfield development plans stalled](https://nextpittsburgh.com/city-design/bloomfield-development-plans-stalled-after-zoning-variance-is-denied/) `[read]` *(accessed 2026-09-27)*
- [BDC, ZBA decision regarding Echo Realty proposal](https://bloomfieldpgh.org/zba-decision-regarding-echo-realty-proposal-for-bloomfield-shursave-site/) `[skimmed]` (fetch-tool summary; dated 2023-11-06 per that summary) *(accessed 2026-09-27)*
- [WESA 2023-11-21, calls for zoning reform mount](https://www.wesanews.org/development-transportation/2023-11-21/after-high-profile-projects-rejected-calls-for-zoning-reform-mount-in-pittsburgh) `[read]` *(accessed 2026-09-27)*
- [WESA 2023-12-06, developer appeals ZBA rejection](https://www.wesanews.org/development-transportation/2023-12-06/bloomfield-shursave-developer-zoning-appeal-housing) `[skimmed]` (fetch-tool summary) *(accessed 2026-09-27)*
- [NEXTpittsburgh 2024-07-24, plans scrapped as Giant Eagle takes over site](https://nextpittsburgh.com/city-design/affordable-housing-plans-in-bloomfield-scrapped/) `[read]` *(accessed 2026-09-27)*
- [TribLIVE, developer calls zoning rejection "arbitrary"](https://triblive.com/local/community-market-developer-calls-zoning-rejection-for-bloomfield-site-arbitrary/) `[found]`; [Post-Gazette 2024-03-15 "Save Bloomfield" (PressReader)](https://www.pressreader.com/usa/pittsburgh-post-gazette/20240315/281788519038811) `[found]`
- [YouTube: Building Affordable Housing by Action Housing](https://www.youtube.com/watch?v=vJ0ReB26gVA) `[read]` (auto-caption transcript; slides not seen) *(accessed 2026-09-27)*; [event page](https://www.prohousingpgh.org/events/speaker-04-11-2024) `[read]` *(accessed 2026-09-27)*
- Pro-Housing Pittsburgh blog index (51 posts via `?format=json`) `[read]`; [Policy – Inclusionary Zoning](https://www.prohousingpgh.org/blog/policy-inclusionary-zoning), [Policy – Parking Mandates](https://www.prohousingpgh.org/blog/policy-parking-mandates), [The IZ Compromise](https://www.prohousingpgh.org/blog/affordable-housing-bonus-program), [Policy – Single Stair](https://www.prohousingpgh.org/blog/policy-stairs) `[read]` *(accessed 2026-09-27)*
- Saved excerpts: [ycbth](../sources/prohousingpgh-2026-09-27-ycbth-series-excerpts.md), [ACTION talk](../sources/prohousingpgh-2026-09-27-action-housing-talk-transcript-excerpts.md), [Rescope](../sources/rescope-2026-09-27-site-claims.md), [ShurSave news](../sources/wesa-2026-09-27-bloomfield-shursave-excerpts.md)
