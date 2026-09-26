# Round 1 review: Housing Need & Displacement Risk pillar (`afford`), equity lens

Reviewer scope: `afford` pillar in `apps/web/src/lib/pillars/pillars.config.json` (config as of 2026-09-26, branch `lance-pillars`), scorer `src/lib/pillars/score.ts`. No code or config was edited.

Evidence tags: **[read]** = I opened the source and read the relevant passage. **[skimmed]** = I saw only a search-result summary or snippet, not the full text. **[computed]** = I computed it this session from repo data (scripts are in the session scratchpad, not the repo). **[unverified]** = from general knowledge, not checked this session.

How I got the numbers:
- `bun scripts/pillars/explain-parcel.ts` for 17 review parcels plus 9 I added.
- A neighborhood roll-up of all 142k city parcels, using `parcel-indicators.json` + `score.ts`, joined to the neighborhood and tract fields in `.cache/pillars/parcel-centroids.csv`.
- A race proxy: CDC SVI "racial & ethnic minority" percentile from `equity-svi-coi.geojson`. This counts all people of color, not Black residents specifically. Treat it as a proxy.
- HOLC grades from `holc-1937.geojson`.

---

## 0. Bottom line

Three findings drive everything else:

1. **The displacement sub-score is effectively one indicator: nominal tract price change, 2020–21 → 2024–25.** It correlates r = 0.94 with that indicator and r = 0.85 with the whole pillar [computed; the diagnostics output agrees]. That indicator rates the cheap, mostly Black Hilltop (Knoxville, Beltzhoover, Allentown), Garfield, Hazelwood, East Hills and Spring Hill as "surging". It rates the places where displacement already happened (Lawrenceville, East Liberty, Polish Hill) as "stable/mild". The repo's other displacement measure, the Reinvestment Fund DRR, says the reverse (DRR > 3 = "unaffordable" in Lower Lawrenceville 5.4, Upper Lawrenceville 4.1, East Liberty 3.35, Polish Hill 3.2; DRR ≈ −1 = deeply affordable in Knoxville and Beltzhoover). The two displacement indicators are *negatively* correlated with each other (r = −0.35 after normalization) [computed].
2. **The need sub-score half-measures "how expensive is the market", not "how much need is there".** `rent_vs_ami` and H+T (4 of 8 weight) score high where rents are high. As a result, Homewood, the Hill District, Garfield and the Hilltop get the phrase *"Fairly affordable already: less need for new affordable homes"*. That is false for places with the city's lowest incomes, and it stigmatizes. Mean need is higher in HOLC "A" areas (49) than in HOLC "D" areas (36) [computed].
3. **Combining need (↑) and displacement (↓) produces the nonsense the brief feared, and a racial gradient.** Across 86 neighborhoods, Spearman ρ(minority share, afford pillar) = −0.29 and ρ(minority share, overall) = −0.37 [computed]. The median minority percentile of the 15 lowest-scoring neighborhoods on this pillar is 73, versus 56 for the top 15. Removing the market-level need indicators and the displacement penalty turns the afford correlation positive (+0.07 to +0.40, depending on the need fix) and reduces the overall correlation to −0.15 [computed].

Research on the causal claim behind the "displacement lowers the score" rule points the other way for new supply:
- Asquith, Mast & Reed (REStat 2023): new large buildings in low-income areas *lower* nearby rents by about 6% [skimmed, abstract].
- Pennington (2021): new construction cuts nearby renters' displacement risk by 17% [skimmed, abstract].

And in Pittsburgh, the community response to displacement pressure is to *build* income-restricted housing early (Hazelwood Initiative, Heinz Endowments) and to require it (inclusionary zoning in Lawrenceville, Bloomfield, Polish Hill, Oakland). The pillar tells users the opposite.

---

## 1. Per-parcel table

Scores are 0–100, where 100 = good place to build. "Need" = sub `affordability` (100 = greatest need). "Disp" = sub `displacement` (100 = low risk). Raw values are in parentheses.

| PIN | Neighborhood | Pillar | Need (phrase) | Disp (phrase) | Key raw drivers | Reality verdict | Evidence |
|---|---|---|---|---|---|---|---|
| 0174K00352000000 | Homewood South | 65.3 | 30.5 "Fairly affordable already" | 100 "Prices are stable" | price chg −54% on 5→7 sales; rent 0.58× 50%-AMI rent | **Wrong on both.** Low rents reflect very low incomes, vacancy and subsidy, not low need. A −54% median on 12 sales is noise or disinvestment, not "stability". The sales-count blanking the config promises (n<10 → blank) is not implemented. Recent news: speculation and investor evictions in Homewood. | [PublicSource Homewood vacant properties](https://www.publicsource.org/homewood-vacant-properties-revitalization-efforts-pittsburgh/) [skimmed]; [New Pittsburgh Courier 2025, eviction after Rising Tide purchase](https://newpittsburghcourier.com/2025/10/28/with-scores-of-new-homes-planned-homewood-sees-citations-funding-hurdles-and-eviction/) [skimmed]; tract sales CSV [computed] |
| 0175H00123000000 | Homewood South | 71.6 | 43.3 "moderate need" | 100 "stable" | same tract sales | Same problem. The pillar's high score comes from the price-collapse artifact. | as above |
| 0174B00325000000 (added) | Homewood North | 36.9 | 36.9 "moderate need" | — (missing: 0 sales in 2020–21) | DRR 98/100 | Need understated. Displacement is blank, so the pillar is need only; that is acceptable. Homewood North is "Black exodus unrelated to gentrification" per the Pittsburgh Neighborhood Project. | [Pittsburgh Neighborhood Project 2010–2020](https://pittsburghneighborhoodproject.blog/2022/01/10/segregation-and-change-in-pittsburgh-neighborhoods-assessing-decennial-census-population-data-from-2010-to-2020/) [skimmed] |
| 0010G00069000000 (added) | Middle Hill | 55.7 | 18.8 "Fairly affordable already" | 92.7 "stable" | price chg −15.6% on 3→5 sales; low-income burden 41% (17/100) | **Need badly wrong.** The Hill has deep poverty and a large subsidized stock (subsidized tenants pay about 30% of income, so they don't show as "burdened"). The displacement score comes from 8 sales. The Hill is the city's defining displacement history, and the Lower Hill/Bedford redevelopment is active. | [PublicSource: Hill District holding on through displacement](https://www.publicsource.org/hill-district-displacement-development/) [skimmed]; [Bedford Dwellings transformation](https://www.publicsource.org/pittsburgh-affordable-housing-bedford-dwellings-authority-hacp-choice-neighborhoods/) [skimmed] |
| 0124N00365000000 | Larimer | 57.8 | 47.3 "moderate need" | 68.3 "Mild" | low-income burden 75% (80), rent burden 78.5% (86), but rent_vs_ami 14 and H+T 4 | Need understated: the two burden measures say severe; the market-level indicators pull it to "moderate". Price change comes from 7→8 sales. Larimer/Choice Neighborhoods and East Liberty spillover are real pressures. | [URA Larimer/East Liberty Choice](https://www.ura.org/pages/larimer-east-liberty-choice-neighborhood-initiative) [skimmed]; [PublicSource Larimer history](https://www.publicsource.org/we-deserve-it-larimer-residents-reflect-on-the-neighborhoods-history-and-the-long-fight-for-redevelopment/) [skimmed] |
| 0083B00066000000 | East Liberty | 44.6 | 27.9 "Fairly affordable already" | 61.3 "Mild" | DRR 3.35 (3/100, weight 0.5); price chg +14.5% (90) | **Wrong.** East Liberty is Pittsburgh's canonical displacement case (East Mall and Penn Plaza; lost 1,362 Black residents 2010–20, −34%). DRR > 3 is Reinvestment Fund's "unaffordable" line, but price growth has plateaued after the wave, so the tool says "mild". | [Pittsburgh Neighborhood Project](https://pittsburghneighborhoodproject.blog/2022/01/10/segregation-and-change-in-pittsburgh-neighborhoods-assessing-decennial-census-population-data-from-2010-to-2020/) [skimmed]; [Reinvestment Fund DRR definition](https://www.reinvestment.com/insights/measuring-displacement-risk-in-gentrifying-neighborhoods/) [skimmed; also quoted in per-pillar-methods.md] |
| 0080D00162000000 (added) | Upper Lawrenceville | 59.1 | 47.4 "moderate" | 70.9 "Mild" | DRR 4.08 (2/100); price chg +0.1% (97); ACS rent burden 6.4% (block group, implausible) | **Displacement wrong.** Lawrenceville is the city's best-documented gentrification case (families pushed to Millvale, Etna, Penn Hills). It has the city's first CLT and is under inclusionary zoning *because* of displacement pressure. | [Lawrenceville United](http://www.lunited.org/affordable-housing/) [skimmed]; [2021 MVA exec summary: "very large increases… in East End… Lawrenceville"](https://www.alleghenycounty.us/files/assets/county/v/1/government/economic-development/documents/housing/2021-mva-executive-summary.pdf) [read] |
| 0049J00089040900 | Lower Lawrenceville | 59.2 | 48.8 "moderate" | 69.6 "Mild" | DRR 5.43 (1/100); price +4.8% (95) | Same. Stancil (U. Minnesota) counts about 3,000 lower-income residents displaced across Downtown, the Strip and Lower Lawrenceville, 2000–16. | [PublicSource on Stancil study](https://www.publicsource.org/new-white-flight-and-suburban-displacement-study-looks-beyond-gentrification-in-the-pittsburgh-region/) [read] |
| 0026J00063000000 (added) | Polish Hill | 55.9 | 34.9 "Fairly affordable already" | 77.0 "stable" | DRR 3.24 (3/100); price +4.8% (95) on 11→9 sales | Displacement understated. NCRC lists Polish Hill as gentrifying, and it is in the city's IZ overlay. | [IZ overlay: Bloomfield & Polish Hill](https://engage.pittsburghpa.gov/izodx) [skimmed]; [Capital-Star on NCRC gentrification list](https://penncapital-star.com/civil-rights-social-justice/how-rising-rents-and-renovations-have-displaced-pittsburghers-and-added-to-the-citys-ongoing-issues-with-gentrification/) [skimmed] |
| 0050L00076000000 (added) | Garfield | 20.2 | 18.9 "Fairly affordable already" | 21.4 "Prices are surging: new building here risks pushing people out" | price +141% (107.8k→260k, 10→24 sales); DRR 1.92 | Direction of the displacement signal is plausible (the Penn Ave gentrification front). **The consequence is wrong**: the pillar puts Garfield near the bottom as a place to build, when this is where income-restricted homes do the most anti-displacement work. Need is understated (large subsidized stock). | [Capital-Star/NCRC list includes Garfield](https://penncapital-star.com/civil-rights-social-justice/how-rising-rents-and-renovations-have-displaced-pittsburghers-and-added-to-the-citys-ongoing-issues-with-gentrification/) [skimmed] |
| 0056C00129000000 | Hazelwood | 23.6 | 37.5 "moderate" | 9.8 "surging… risks pushing people out" | price +151% (69k→173k, 15→18 sales); DRR −0.09 | Pressure is real (Hazelwood Green; a NY firm bought 18 properties; Heinz estimates 200–250 households at risk). But the local strategy is to **build affordable now, before values rise**. The pillar says the opposite. | [Post-Gazette: "Where are these folks supposed to go?"](https://newsinteractive.post-gazette.com/where-are-these-folks-supposed-to-go-hazelwood-renewal-comes-with-fears-of-displacement/) [skimmed] |
| 0014J00014000000 (added) | Knoxville | 23.4 | 33.3 "Fairly affordable already" | 13.6 "surging" | price +142% (47.5k→115k); DRR −0.97 (81); rent growth ZIP 15210 +35%; ACS rent burden **0%** (block-group noise) | Partly right: Hilltop investor buying is real (about half of recent sales to investors), and ZIP 15210 has the county's highest eviction filing rate in our data (14.7/100; weight 0). Overstated: homes still sell at $115k, and Reinvestment Fund notes the biggest proportional rises were in Stressed markets that remain "affordable to households at approximately one-third the… county median income". Need is understated (the 0% burden is an ACS artifact). | [2021 MVA exec summary](https://www.alleghenycounty.us/files/assets/county/v/1/government/economic-development/documents/housing/2021-mva-executive-summary.pdf) [read]; [UCSUR Hilltop Housing Market Analysis](https://ucsur.pitt.edu/sites/default/files/Center%20reports/2013/Hilltop%20Report%20Final%20July%2010%202013.pdf) [skimmed] |
| 0015L00046000000 (added) | Beltzhoover | 30.8 | 35.3 "moderate" | 26.3 "surging" | price +51% (105k→158k); DRR −1.18 (86) | Same as Knoxville. The "surging… pushing people out" phrase overclaims. The dominant risk here is eviction and investor churn, not new construction. | [City Paper: Hilltop housing stock](https://www.pghcitypaper.com/news/home-remodel-hilltop-neighborhoods-work-to-change-public-perception-of-their-housing-stock-1683315) [skimmed] |
| 0047K00076000000 | Spring Hill-City View | 22.7 | 25.4 "Fairly affordable already" | 20.0 "surging" | price +136% (82.5k→195k, 15→17 sales) | A 17-sale median is volatile, and a few flips or new builds move it. Low confidence in "surging". Need understated. | tract sales CSV [computed] |
| 0035N00192000000 | Beechview | 31.0 | 21.5 "Fairly affordable already" | 40.4 "rising" | price +48%; DRR −0.93 | Plausible pressure (Latino immigrant hub, rising prices) but moderate. Need low on every indicator; plausible. | no external source checked [unverified] |
| 0004L00301000000 | Mount Washington | 34.6 | 42.6 | 26.7 "surging" | price +53% | NCRC lists parts of Mt. Washington as gentrifying. "Surging" is defensible. | [Capital-Star/NCRC](https://penncapital-star.com/civil-rights-social-justice/how-rising-rents-and-renovations-have-displaced-pittsburghers-and-added-to-the-citys-ongoing-issues-with-gentrification/) [skimmed] |
| 0096C00022000000 | Brookline | 36.3 | 34.9 | 37.8 "rising" | price +41% | Reasonable. | — |
| 0138E00098000000 | Overbrook | 27.6 | 34.3 | 21.0 "surging" | price +78% | Plausibly overstated. A working-class, mostly white area, not a known displacement hotspot [unverified]. | — |
| 0012F00071000000 | South Side Flats | 70.9 | 62.1 "Many renters are stretched" | 79.7 "stable" | DRR 2.54 (4/100); student-heavy low-income burden 80.6% | Need inflated by students (CHAS counts student households as low-income cost-burdened; general knowledge [unverified]). Displacement understated (South Side gentrified in the 1990s–2000s). | — |
| 0052L00036050100 | Squirrel Hill North (condo) | 72.9 | 72.8 "clear need" | 73.1 "Mild" | low-income burden 86% (92), rent 1.68× (74) | **Wrong for equity purposes.** One of the city's most affluent areas (tract medians $560k–$813k) scores in the top 5% on "need", because of grad students plus high market rents. It outranks Homewood, the Hill and Garfield. | tract sales CSV [computed] |
| 0088G00062000000 (added) | Squirrel Hill South | 53.4 | 36.4 | 70.4 | | Fine. | — |
| 0052D00141001100 | Shadyside | 61.7 | 38.6 | 84.9 "stable" | DRR −1.75 (block group); tract prices $605k–$780k | Plausible for a high-cost area with no vulnerable population. It shows that "displacement risk" here carries no vulnerability test. | — |
| 0126H00145000000 (added) | Point Breeze | 38.8 | 36.5 | 41.0 "rising" | price +35% ($575k→$785k) | An affluent area rated "watch for displacement". Without a vulnerability screen, rising prices in rich areas count as displacement risk. UDP would call this "Stable/Advanced Exclusive", not at-risk. | [UDP methodology](https://www.urbandisplacement.org/wp-content/uploads/2021/07/udp_replication_project_methodology_10.16.2020-converted.pdf) [read via per-pillar-methods.md] |
| 0002A00127110800 | Downtown | 69.5 | 40.4 | 98.7 "stable" | price −8.5% (condo slump) | NCRC and Stancil both name Downtown as a displacement area (2000s–2010s). The current flat prices reflect the office/condo slump. "Stable" is defensible for *current* pressure. | [PublicSource/Stancil](https://www.publicsource.org/new-white-flight-and-suburban-displacement-study-looks-beyond-gentrification-in-the-pittsburgh-region/) [read] |
| 0075F00310000000, 0045N00357000000 | Marshall-Shadeland (govt/industrial) | — | — | — | all afford indicators missing | Correctly unscored. | — |

### Neighborhood roll-up (mean of parcel scores) [computed]

| Neighborhood | Minority pctile | Pillar now | Need now | Disp now | Need, revised* | "Affordable mode"** |
|---|---|---|---|---|---|---|
| Homewood West | 96 | 25 | 22 | 28 | 56 | 61 |
| Homewood North | 93 | 34 | 35 | 27 | 65 | 67 |
| Homewood South | 94 | 66 | 35 | 96 | 70 | 48 |
| Middle Hill | 95 | 57 | 21 | 93 | 57 | 40 |
| Bedford Dwellings | 99 | 27 | 27 | — | 68 | 68 |
| East Hills | 92 | 29 | 46 | 13 | 79 | 82 |
| Larimer | 88 | 59 | 49 | 69 | 88 | 69 |
| Garfield | 81 | 25 | 28 | 23 | 50 | 59 |
| Knoxville | 73 | 30 | 46 | 14 | 60 | 69 |
| Beltzhoover | 71 | 31 | 38 | 25 | 64 | 68 |
| Hazelwood | 69 | 46 | 43 | 48 | 80 | 71 |
| East Liberty | 65 | 34 | 32 | 36 | 53 | 57 |
| Upper Lawrenceville | 25 | 64 | 58 | 71 | 60 | 49 |
| Lower Lawrenceville | 30 | 56 | 41 | 70 | 36 | 34 |
| Polish Hill | 26 | 53 | 35 | 71 | 68 | 55 |
| Squirrel Hill North | 45 | 58 | 60 | 56 | 63 | 57 |
| Point Breeze | 29 | 42 | 47 | 38 | 56 | 58 |
| South Oakland | 50 | 50 | 53 | 48 | 90 | 77 |

\* Revised need = low-income renter burden (w2) + **ELI renter share** (CHAS `renter_le30/renter_hh`, county tract percentile, w2) + rent burden (w1) + energy burden (w1). `rent_vs_ami` and H+T are dropped.
\*\* Affordable mode = (2 × revised need + displacement *pressure*) / 3, where pressure = 100 − current disp. The Lawrenceville values stay low only because the current displacement measure misses Lawrenceville; see §2.2.

Caveat on the revised need: it inflates student areas (South Oakland 90). §3 R2 covers the mitigation.

---

## 2. Systematic problems, ranked by impact

### 2.1 Displacement pressure lowers "good place to build" for all housing types (highest impact: steering)

- **Mechanism.** The overall score is a geometric mean, so a 20–30 on this pillar drags the overall score hard. Garfield, Hazelwood, Knoxville, Beltzhoover, East Hills, Spring Hill and Allentown all sit at 20–31, mostly because of displacement.
- **Why it's wrong.**
  - (a) For **income-restricted** housing, displacement pressure is the strongest reason to build there. Pittsburgh's IZ applies exactly in the gentrifying neighborhoods [skimmed: [PublicSource IZ](https://www.publicsource.org/inclusionary-zoning-pittsburgh-city-planning-commission-votes-council-mayor-gainey/)]. The Hazelwood strategy is "build affordable before values rise" [skimmed]. Portland's Bates typology, which the team cites, was built to *target* anti-displacement investment to susceptible and early-stage tracts, not to avoid them [read, per per-pillar-methods.md].
  - (b) For **market-rate** housing, the best causal evidence finds new supply lowers nearby rents and displacement ([Asquith, Mast & Reed 2023](https://direct.mit.edu/rest/article-abstract/105/2/359/100977/Local-Effects-of-Large-New-Apartment-Buildings-in) [skimmed]; [Pennington 2021](https://ssrn.com/abstract=3867764) [skimmed]). Pennington also finds a hyperlocal demand effect (renovations; richer residents within 100 m), so the evidence is not one-sided. The real direct-displacement harm is **demolishing occupied housing**, which is a parcel fact (vacant vs occupied), not a tract price trend.
- **Equity result.** Neighborhood ρ(minority, overall) = −0.37 now vs −0.15 with the fixes [computed]. That is a moderate, not overwhelming, gradient, and other pillars (demand) also contribute. But this pillar is the one that labels Black neighborhoods "surging… risks pushing people out" and "fairly affordable already". It is HOLC-style steering by a different route: the "risk" of investment is used as a reason to withhold it.

### 2.2 Displacement ≈ one noisy, mis-specified indicator (high)

- `afford_price_growth` has weight 2 of 3.5. ZORI rent growth is ZIP-level and missing in Homewood ZIPs. DRR has weight 0.5. The sub-score correlates r = 0.94 with price growth [computed].
- **Bug.** The rationale says "tracts with fewer than 10 sales in a pool are blank". Nothing in `build-indicators.ts` or `tract_sales.py` enforces that; the `low_n_flag` column is ignored. Affected:

  | Tract | Neighborhood | Sales (2020–21 → 2024–25) | Price change | Score |
  |---|---|---|---|---|
  | 130800 | Homewood South | 5 → 7 | −54% | 100 |
  | 050100 | Middle Hill | 3 → 5 | −16% | 100 |
  | 111500 | East Liberty | 5 → 14 | **+321%** | 1 |
  | 120900 | Larimer | 7 → 8 | | |
  | 080700 | Friendship | 5 → 6 | | |
  | 140500 | Point Breeze North | 7 → 20 | | |

- **Nominal % change from a low base is not a displacement measure.** Reinvestment Fund says so directly for Pittsburgh: Stressed markets had "the most dramatic proportionate rise" yet transact at prices "affordable to households at approximately one-third the… county median income" [read, 2021 MVA exec summary]. DRR exists to fix this by comparing prices to incumbent incomes.
- **Timing.** Price growth measures the *current* wave. It misses completed or advanced gentrification (Lawrenceville, East Liberty, Polish Hill, South Side), where DRR > 3.
- **No vulnerability screen.** UDP and Bates both require a vulnerable population (low income, renters, no BA, people of color) *and* market change. The team's own methods doc recommended exactly this ("Publish the type label, not a fake continuous number"), and the implementation diverged. So Point Breeze and Squirrel Hill price rises count as displacement risk.

### 2.3 "Need" mixes two constructs; half of it measures market expensiveness (high)

- `rent_vs_ami` (w2) and H+T (w2) score high where rents are high. In `rent_vs_ami` the zero point is 0.8× ($994), so every low-rent neighborhood scores 0. H+T for a median-income family barely varies inside the city (raw 45–56% → 0–37 on the 45→75 scale), so it acts like a near-constant that pulls every need score down.
- Correlations: `rent_vs_ami` vs `energy_burden` r = −0.21; H+T vs `lowinc_burden` r = −0.04 [computed]. These are not measuring the same thing. The JRC "weak" flags are **real signals of construct incoherence**, not just noise.
- **CHAS/ACS burden understates need where housing is subsidized.** Subsidized tenants pay about 30% of income, so the Hill, Homewood, Garfield and Bedford/Terrace Village look "not burdened". It overstates need in student areas (Squirrel Hill N, Oakland, South Side). [General knowledge about CHAS treatment of students and subsidy: unverified this session.]
- **ACS block-group MOE ignored.** Knoxville rent burden 0% and Upper Lawrenceville 6.4% are implausible. `housing-costs.geojson` carries `*_unreliable` flags for rent and income but not for `rent_burden_pct`, and none are used.
- **Result.** Mean need is 49 in HOLC-A areas vs 36 in HOLC-D [computed], and "Fairly affordable already" is shown in the Hill, Homewood, Garfield and East Liberty.

### 2.4 Equal 1:1 sub-score weighting lets one indicator be half the pillar (medium-high)

Need has 5 indicators. Displacement has in practice 1–2, and often one: for Homewood South the only live displacement input is price growth. `min_coverage` 0.5 is by weight, so price growth alone (2/3.5 = 57%) passes. A single tract median from 12 sales then decides 50% of the pillar.

### 2.5 Phrases are inaccurate and some stigmatize (medium)

- *"Fairly affordable already: less need for new affordable homes."* This appears in the neighborhoods with the lowest incomes in the city. Low rent ≠ affordable when incomes are lower still. It reads as "this place doesn't need help".
- *"Prices are surging: new building here risks pushing people out."* This is a causal claim the evidence doesn't support for new supply, and it's reversed for affordable housing. On the Hilltop it describes $47k→$115k.
- *"Prices are stable: little displacement pressure."* This is shown for a −54% price collapse (Homewood South). A price collapse signals disinvestment, not stability.
- Pillar phrase <35: *"Either housing is already fairly affordable or displacement risk is high."* It can't tell the user which, and both halves are often wrong.
- Label confusion: the sub-score is called "Displacement risk" but 100 = *low* risk.

### 2.6 Cross-pillar double-count of rent growth (low-medium)

`demand_rent_growth` (ZORI 12-month, +) and `afford_rent_growth_5yr` (ZORI 5-year, −) are the same ZIP series with opposite signs. The overlap is partial, and the net effect is opaque to users.

### 2.7 Evictions at weight 0 (low, but it's the most direct displacement measure)

This was correctly de-weighted for being ZIP-level and noisy. But it is the one observed displacement *event* measure: ZIP 15210 (Hilltop) at 14.7 filings per 100 renter households is the worst in the data. It should appear as a context flag.

---

## 3. Concrete recommended changes to `pillars.config.json`

Ordered by expected impact. "No code" means the current scorer supports it as-is.

**R1. Take displacement out of the default score; show it as a flag.** No code needed for the minimal version.
- `pillars[afford].subscores[displacement].weight: 1 → 0`.
- Add flag-only gates to `afford`. Gates use normalized values, and `cap: 100` means the gate never changes the score:
  ```json
  "gates": [
    {"indicator": "afford_price_growth", "below": 15, "cap": 100,
     "flag": "Fast home-price growth nearby: prioritize income-restricted homes and tenant protections"},
    {"indicator": "afford_displacement_ratio", "below": 10, "cap": 100,
     "flag": "Homes here are no longer affordable to long-time residents (Reinvestment Fund DRR > ~3)"}
  ]
  ```
- Rename the pillar label to "Housing Need", and move "displacement pressure" into a displayed flag or typology.
- *Why:* §2.1. *Effect:* neighborhood ρ(minority, overall) goes from −0.37 to about −0.15 (the simulated variant also changed need). Garfield, Hazelwood, Knoxville, Beltzhoover and East Hills stop being penalized for being places where people fear displacement.

**R2. Rebuild "need" around households, not market rents.** Needs one new indicator built by `build-indicators.ts`; the data is already in `chas-cost-burden.geojson`.
- `afford_rent_vs_ami.weight: 2 → 0`. Move it to demand or context: high rent is a *market-feasibility* signal.
- `afford_housing_transport.weight: 2 → 0.5`, or 0. It is near-constant inside the city.
- `afford_lowinc_renter_burden.weight: 2 → 3`.
- **Add `afford_eli_renter_share`** (CHAS `renter_le30 / renter_hh`, tract, percentile, higher = more need, w 2). It captures deep poverty whether or not rent is subsidized.
- Optionally add `renter_le30_severe_pct` (already in the overlay, w 1).
- Keep `energy_burden` at w 1.
- **Student mitigation:** blank or halve ELI share and low-income burden in tracts where ACS college enrollment among adults is above ~40% (ACS B14007). That needs one ACS pull. If there's no time, add a known-limitation note on Oakland, Squirrel Hill N and South Side.
- *Effect* [computed, without the student fix]:

  | Neighborhood | Need now | Need revised |
  |---|---|---|
  | Homewood West | 22 | 56 |
  | Middle Hill | 21 | 57 |
  | Bedford Dwellings | 27 | 68 |
  | Knoxville | 46 | 60 |
  | Garfield | 28 | 50 |
  | Lower Lawrenceville | 41 | 36 |

  ρ(minority, need) goes from −0.10 to +0.40. Mean need in HOLC-D areas is no longer below HOLC-A areas. The simulated burden-only variant gives D 54 vs A 64; A areas are still inflated by students, so the student fix matters.

**R3. Fix the price-growth indicator, or demote it.**
- **Bug fix:** implement the stated n ≥ 10 per pool rule. Blank the value when `low_n_flag` contains `pooled_2021<10` or `pooled_2425<10`. This is in the build script, not config. Alternatively, add `"min_n": 10` to the source block and have the build honor it.
- Change weights: `afford_price_growth.weight: 2 → 1`; `afford_displacement_ratio.weight: 0.5 → 2`. DRR is dated (2019/20) but conceptually correct, and it matches the documented Pittsburgh cases. Price growth should update the timing, not define the construct.
- Better (needs code): make price growth *level-aware*: 2024–25 median price ÷ (3 × tract median income, 2020). This is a DRR-style update from the sales data the team already has. It stops $47k→$115k from reading as "surging".
- *Effect:* Lawrenceville, East Liberty, Polish Hill and South Side move toward "high pressure". The Hilltop moves toward moderate. Homewood South and Middle Hill stop getting 100 from 8–12 sales.

**R4. If displacement stays inside the pillar (the team's call), change the weighting and add a vulnerability screen.**
- `subscores: need 2, displacement 1`.
- Add a per-sub-score minimum *count* of indicators. For example, `"min_indicators": 2` on the displacement sub-score, so a single tract median can't be 50% of the pillar. This needs a small scorer change.
- Apply displacement only where a UDP/Bates vulnerability test passes (≥ 2 of: above-county-median % low-income, % renters, % without BA, % people of color). Race must be only a *descriptor that makes protection apply*, never a penalty; that is the methods doc's own rule. Elsewhere (Point Breeze, Squirrel Hill, Shadyside), rising prices are not displacement risk.

**R5. Make displacement housing-type-dependent** (the right end state; needs scorer support, similar to `legal.typologies`).
- Add `"direction_by_typology"` to the displacement sub-score:
  - `income_restricted` (≤ 60/80% AMI, CLT, LIHTC, public housing): pressure **raises** the score (priority to build there).
  - `market_rate`: weight 0, plus a flag recommending IZ-style set-asides.
  - Any typology on a parcel with **occupied** residential units: a direct-displacement flag, or a cap if demolition is implied. `usedesc` and `Vacant` are already in `parcels.geojson`.
- Update presets: `affordability_first` should use the income-restricted direction. `market_first` keeps displacement at 0.
- *Effect:* my simulated "affordable mode" puts East Hills 82, Hazelwood 71, Knoxville 69, Larimer 69 and Homewood North 67 near the top. Downtown (32) and Lower Lawrenceville (34) score low; the latter only until R3 fixes its displacement read.

**R6. Rewrite the phrases.** These are drop-in replacements.

`affordability` (need):
| min | Current | Proposed |
|---|---|---|
| 75 | "Housing costs are a real burden here: new affordable homes are badly needed." | "Severe need: many low-income renters here pay more than they can afford." |
| 55 | "Many renters are stretched: clear need for affordable homes." | "Clear need: many renters here are cost-burdened." |
| 35 | "Somewhat affordable: moderate need." | "Moderate need by these measures." |
| 0 | "Fairly affordable already: less need for new affordable homes." | "Lower measured cost burden than most of the county. Subsidized housing and small samples can hide need." |

`displacement` (if kept as a scored sub-score):
| min | Current | Proposed |
|---|---|---|
| 75 | "Prices are stable: little displacement pressure." | "Prices flat or falling: little market pressure. Falling prices can also mean disinvestment." |
| 55 | "Mild price pressure." | "Mild price pressure." (keep) |
| 35 | "Prices are rising: watch for displacement." | "Prices rising faster than most of the county." |
| 0 | "Prices are surging: new building here risks pushing people out." | "Strong price pressure on current residents. Income-restricted homes and tenant protections matter most here." |

`afford` pillar:
| min | Current | Proposed |
|---|---|---|
| 0 | "Either housing is already fairly affordable or displacement risk is high." | Show the two sub-score phrases instead of one blended sentence. |

- Rename the sub-score label "Displacement risk" → "Market pressure on residents (100 = low)".
- Update `direction_note` to say displacement pressure is scored as a *flag*, or with a typology-dependent direction, and why (cite Asquith et al. 2023 and Pennington 2021, plus the Pittsburgh IZ geography).

**R7. Honor ACS reliability.** Treat block-group `rent_burden_pct` as missing when `renter_households` < 100, or when the tract/BG MOE flag is set. That needs a `"min_denominator"` or `"unreliable_property"` option in the source block, which is a build change. Or move `rent_burden` to tract geography. *Effect:* removes the Knoxville 0% and Upper Lawrenceville 6.4% artifacts.

**R8. Evictions as context.** Keep weight 0, but add a flag gate: `{"indicator":"afford_evictions","below":15,"cap":100,"flag":"High eviction filing rate in this ZIP (Eviction Lab 2025)"}`.

**R9. Diagnostics.** Add a check that flags pairs of indicators *in the same sub-score* with r < −0.2 (DRR vs price growth is −0.35). A "weak vs pillar" label hides a sign conflict.

---

## 4. Direct answers to the review questions

- **Do scores match reality?** Need: no. It is systematically low in the poorest Black neighborhoods and high in affluent student areas. Displacement: half right. It catches the *current* wave (Garfield, Hazelwood, Hilltop investor buying) but misses advanced gentrification (Lawrenceville, East Liberty, Polish Hill), and it turns tiny-sample price swings into "stable" or "surging".
- **Does combining need ↑ and displacement ↓ create nonsense?** Yes. Garfield has real gentrification pressure and a large low-income population, and it scores 20/100 on this pillar. Hazelwood, where the local strategy is "build affordable now", scores 24.
- **Equal weighting?** No. Displacement is effectively one indicator; if it is kept, weight need 2:1 and require ≥ 2 displacement indicators.
- **HOLC-style steering?** The pillar measurably pushes scores down in high-minority neighborhoods (ρ −0.29 pillar, −0.37 overall), and it does so with language implying these places don't need affordable homes or shouldn't get new building. The HOLC-grade overall means (A 65.5, B 57.2, C 55.8, D 57.3) show a weaker, non-monotonic pattern, so I would not claim a clean HOLC replication. Toward displacement hotspots: it does *not* steer toward them for the wrong reason; it steers *away* from early-stage hotspots, which is the wrong response for affordable housing.
- **Is the weak JRC correlation a real problem?** Yes. For need, it reflects two constructs (market cost vs household burden). For displacement, the two main measures disagree in sign.
- **Flag or type-dependent?** Both. A flag in the default score (R1), and typology-dependent direction as the end state (R5), with a direct-displacement flag for occupied parcels.

## 5. Limits of this review

- The race proxy is SVI minority percentile, not % Black.
- Neighborhood figures are parcel-weighted means, so large-lot or parcel-dense areas weigh more.
- The "revised need" and "affordable mode" numbers are simulations with ad-hoc weights, meant to show direction, not final values.
- I did not open the Pew/Reinvestment Fund DRR formula report. I did not find a UDP typology map for Pittsburgh; UDP's published metros don't appear to include Pittsburgh [skimmed].
- Most news sources were read only as search snippets [skimmed]. The 2021 MVA exec summary and the PublicSource/Stancil piece were read [read].
