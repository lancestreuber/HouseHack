# Displacement and equity

**Type:** track3
**One line:** The displacement and equity data available for Pittsburgh (MVA 2021, the Displacement Risk Ratio, UDP), what is missing from each, and the framing risk of a "densify here" ranking.
**Why we care:** "Displacement risk" is one of the seven axes the brief names. It is also the axis where a naive weighted score can produce a harmful recommendation that looks objective.
**Last checked:** 2026-09-26

## Data

### Pittsburgh / Allegheny Market Value Analysis 2021 (Reinvestment Fund)

- Public on WPRDC under **CC0** (dataset `market-value-analysis-2021`) `[read]`.
- GeoJSON has **1,114 block groups**, field `MVA21` with values **A–J plus NC** (10 market types plus not-classified).
- The executive summary describes the groups as **Robust, Steady, Transitional and Stressed**.
- The MVA summary says **Black residents are more likely to live in Transitional markets** (checked this session per the data sweep).
- Stakeholder recognition: the prior-art sweep notes the MVA is something Pittsburgh stakeholders already know, which may matter more than a from-scratch index. That is the sweep's judgment, not evidence about judges.

### Displacement Risk Ratio (DRR)

- Same WPRDC dataset, separate shapefile `pitts_allegheny_drr2021.zip` `[read]`.
- One DRR per **block group** for each 2-year window, **2014/15 through 2019/20**; 1,100 records.
- For 2019/20, the category field reads **"Insufficient Data" for 92** of them.
- **The data dictionary names the DRR but does not give its formula.** We cannot say what it measures beyond its name. Do not describe its method in the pitch until the formula is found.
- Most recent window ends 2019/20, i.e. before any post-2020 market change.

### Urban Displacement Project (UDP)

- GitHub repo `urban-displacement/displacement-typologies` sorts tracts into 8 displacement/gentrification stages from ACS and Zillow data `[read]`.
- **No Pittsburgh output in the repo** (it has Atlanta, Chicago, Cleveland, Denver and others). **GPL-3.0; last push 2023.**
- One blog claims UDP has a Pittsburgh map. **Not checked.**
- Whether GPL-3.0 code is acceptable under hackathon rules is open; reimplementing the method is the alternative.

### Pittsburgh Neighborhood Project

- A UDP-style gentrification analysis of Allegheny tracts, 2000 to 2015–19 `[read]`. It found East End and Northside tracts gentrified, with poor Black residents most affected. An ArcGIS map exists; a raw-data download was not confirmed.
- Useful as a local check on whatever displacement layer we use.

### Related policy facts (checked)

- **Mandatory inclusionary zoning** would stay in Lawrenceville, Oakland, Polish Hill and Bloomfield under Bill 2025-1545, per WESA `[read]`. See [inclusionary zoning](../policy/inclusionary-zoning-and-bonus.md).

### Prior art for scoring

- ZoneMind (Code4City @ NYU, Apr 2026) gives each affected parcel a 0–10 displacement score `[read]` (repo). The prior-art sweep found displacement is otherwise usually scored at **tract** level (UDP), not per parcel or per typology.

## Background knowledge, unverified

The data sweep lists these as **"not checked (background knowledge)"**. They are `[found]` at best and must stay flagged. Confirm with sources before any of it appears in the pitch:

- The Hill District's history of urban-renewal displacement.
- Gentrification in East Liberty and Lawrenceville.
- Disinvestment and vacancy in Homewood.

## The framing risk

From the data sweep (the agent's judgment, which we find persuasive but have not tested against our own data): a "densify here" ranking that rewards high need, good transit and cheap vacant land **will tend to land in exactly the Transitional and Stressed Black neighborhoods**, the places at risk of displacement. The MVA finding above (Black residents more likely in Transitional markets) is the checked part of that argument.

## Mitigation options

These are the sweep's proposals, presented as options. They are not mutually exclusive.

| Option | What it does | Tradeoff |
|---|---|---|
| **Displacement as a separate warning, not a weight** | DRR/MVA shown as a flag alongside the ranking; cannot be traded away by moving other sliders | Meets the "can't average away harm" concern. But the brief lists displacement as something to "compare", and some users may want it weighted. Choosing warning-vs-weight is itself a value judgment, and should be labelled so. |
| **Who benefits / who is harmed per scenario** | Each scenario states its distributional effects in words | Needs data we mostly lack at parcel level; risk of hand-waving |
| **High DRR + high fit → "consult" not "build"** | Triggers "consult the RCO and consider anti-displacement tools (community land trust, inclusionary zoning, rent-restricted units)" instead of a plain recommendation | Uses the RCO layer (request only org name + geometry — the layer contains PII; see [indicators](indicators-and-data.md)) |
| **Never output "this neighborhood should get X"** | Tool describes options and tradeoffs, not prescriptions | Aligns with the brief's "rather than declare a single objectively correct neighborhood or housing type" |
| **List the gaps** | DRR is 2019/20; CHAS is 2018–22; the tool knows nothing about community plans, lived experience or ownership intent | Honest; costs nothing |

## Open questions

- The DRR formula (Reinvestment Fund might answer).
- Whether UDP has a Pittsburgh map, and whether GPL-3.0 code is allowed.
- Which of MVA or a UDP-style typology judges and stakeholders would weigh more heavily as a baseline.
- How to handle the 92 "Insufficient Data" block groups: show as unknown, not as low risk.
- Sources for the three background-knowledge items above.

## Connects to

- [Indicators and data](indicators-and-data.md): full source table and geography levels
- [Brief and requirements](brief-and-requirements.md): displacement is one of the seven named axes
- [Combining with Track 1](combining-with-track1.md): where the warning sits relative to Track 1 gates
- [Market and affordability](../data/market-and-affordability.md): AMI and rent context for affordability gaps
- [Inclusionary zoning and bonus](../policy/inclusionary-zoning-and-bonus.md): an anti-displacement tool the tool could point to
- [Score design options](../methods/score-design-options.md): warnings vs. weights vs. gates
- [Framings](../landscape/framings.md): how the pitch is worded
- [City of Pittsburgh](../stakeholders/city-of-pittsburgh.md) and [Land Bank](../stakeholders/land-bank.md): who acts on vacant lots in these areas

## Sources

- [WPRDC Market Value Analysis 2021](https://data.wprdc.org/dataset/market-value-analysis-2021) `[read]` *(accessed 2026-09-26)*: MVA GeoJSON, DRR shapefile, data dictionary, executive summary
- [Urban Displacement Project typologies repo](https://github.com/urban-displacement/displacement-typologies) `[read]` *(accessed 2026-09-26)*: no Pittsburgh output; GPL-3.0
- [Pittsburgh Neighborhood Project: gentrification and displacement](https://pittsburghneighborhoodproject.blog/2021/03/01/gentrification-and-displacement-in-pittsburgh/) `[read]` *(accessed 2026-09-26)*: local UDP-style analysis
- [WESA: Planning Commission and inclusionary zoning](https://www.wesanews.org/development-transportation/2026-06-03/pittsburgh-planning-commission-vountary-inclusionary-zoning) `[read]` *(accessed 2026-09-26)*: IZ areas under Bill 2025-1545
- [ZoneMind repo](https://github.com/William7042/ZoneMInd) `[read]` *(accessed 2026-09-26)*: per-parcel displacement score precedent
- UDP Pittsburgh map (claimed by a blog) `[found]` *(accessed 2026-09-26)*: not opened; URL not recorded
- Sweep: [../../sweeps/r4-track3-data-methods-and-combination.md](../../sweeps/r4-track3-data-methods-and-combination.md) `[read]` *(accessed 2026-09-26)*: section 4, equity framing and mitigations
- Sweep: [../../sweeps/r4-track3-prior-art-and-hackathons.md](../../sweeps/r4-track3-prior-art-and-hackathons.md) `[read]` *(accessed 2026-09-26)*: UDP, Pittsburgh Neighborhood Project, ZoneMind
