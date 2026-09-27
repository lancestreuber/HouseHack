# Sweep: Local construction $/sf from City of Pittsburgh permit valuations

**Round 9** · 2026-09-27 · single research subagent

> Tags: **[read]** = fetched and read the primary source, or queried the endpoint and inspected the response, this session; **[skimmed]** = search snippets or a secondary source only; **[found]** = known to exist, not opened. Every number below comes from our own computation on two WPRDC bulk dumps pulled 2026-09-27. Reproduce with [`admin/scripts/permit_cost_per_sf.py`](../admin/scripts/permit_cost_per_sf.py) (stdlib Python; the dumps are not stored in the repo). Nothing here claims what other teams will build. Not financial advice.

---

## TL;DR

- **What the data says:** For 220 City of Pittsburgh 1–2 family new-construction permits (issued 2019–2024) with a usable assessed finished living area, **declared permit value per finished sq ft has a median of $104. The IQR is $79–$133 and p10/p90 are $57/$152.** Detached single-family: median $105 (n=173). Attached/townhouse: $86 (n=37). Two-family: $125 (n=9).
- **That is below every practitioner range from the hackathon SMEs**, including the $150/sf production-builder figure. The p90 ($152) barely reaches it, and nothing gets near $200–250 (city SF infill) or $325–375 (vertical).
- **Inference: permit valuations understate true cost by a lot.** For the same parcels, a later arm's-length sale (n=63) had a **median sale price of $284/sf**, and the **declared permit value was a median 0.31× the sale price** (IQR 0.26–0.40). If hard cost were near the SMEs' $200–250/sf, that ratio would be about 0.7–0.9. **Do not use permit $/sf as a hard-cost input.** At most it is a floor, or a relative signal across years and types.
- **Vertical-only or with site work?** The data cannot say for sure. Descriptions name the building ("single-family dwelling with integral garage", "including foundation, walls, doors and finishes"), and PLI has separate Land Operations and Storm Water permit types. Our inference is that the value is **mostly vertical and understated**, not all-in with site work.
- **Coverage is thin where it matters most.** 2025–26 permits have almost no usable sq ft (1 of 65), because new buildings are not yet assessed. Multifamily is **0 of 42**, because apartment parcels carry no FINISHEDLIVINGAREA. `work_description` never contains a sq ft figure (0 hits).

---

## 1. Method

**Permits** (`pli-permits`, resource `f4d1177a-f597-4c32-8cbf-7885f56253f6`, bulk dump, 65,378 rows) [read]:
1. `work_type` upper-cased = `NEW CONSTRUCTION`. This unions the pre-2025 `NEW CONSTRUCTION` with the 2025+ `New Construction`. We then kept `permit_type` ∈ {`BUILDING`, `Building & Development Application`}, which drops trade permits (electrical, mechanical) that repeat the same job. **1,091 permits.**
2. We kept permits flagged `Residential` (564), plus permits flagged `Commercial` whose description names dwellings and no obvious non-residential use (145). Many townhouse and apartment jobs are flagged Commercial.
3. We dropped non-dwelling or partial-scope work: foundation-only, retaining walls, sheds, detached garages, temporary structures, "foundations through level 2", and similar (−80). We also dropped value ≤ 0 (−2). **627 permits.**
4. Building type came from a regex on the description: detached SF, attached SF/townhouse, two-family, multifamily 3–19 / 20+ / unit count n/a, plus a modular flag. The regex is heuristic. Spot-checks agreed, but it was not hand-coded.
5. **Multiple permits per parcel:** 24 parcels had >1 qualifying permit (180 permits).
   - **16 parcels with ≥3 permits (164 permits) are group developments on one parent parcel.** Examples are a 46-unit townhouse group and phases of a public-housing redevelopment, with one permit per unit or building. The parent parcel's assessed area cannot be attributed to a unit, so we **excluded** these from $/sf and list them separately (§4).
   - The 8 parcels with exactly 2 permits (re-permits or completion permits) keep the higher value. **455 permits.**

**Assessments** (resource `65855e14-549e-4992-b5be-d629afc676fa`, bulk dump) [read]. We joined `parcel_num` = `PARID`. Sq ft = `FINISHEDLIVINGAREA`, used only if `YEARBLT` ≥ issue year − 1. Otherwise the assessment describes a demolished predecessor or a lot that has not been reassessed. We read no owner or mailing-address fields.

| step | permits |
|---|---|
| deduplicated dwelling permits | 455 |
| no assessment match (new/split parcel ID) | −50 |
| matched, FINISHEDLIVINGAREA empty or 0 (vacant-land record, or apartment/commercial parcel) | −158 |
| matched, YEARBLT predates permit | −10 |
| usable sq ft (all from assessment; description parsing found none) | 237 |
| dropped $/sf < $30 | −17 |
| dropped $/sf > $1,000 | 0 |
| **final analytic sample** | **220 (48% of 455)** |

**Outlier rule.** Drop $/sf < $30 or > $1,000. Below $30 is not a credible whole-house construction value in any year. The 17 dropped were: 11 townhouses in one 2020 group at $55,000 each (~$29/sf), and permits declared at $300, $5,000, $10,000, $35,000 and $50,000 (twice). These look like placeholder or partial-scope values. Nothing was above $1,000. The maximum was $274/sf.

The final sample is 206 Residential-flagged and 14 Commercial-flagged permits. By assessed use: 177 single family, 32 townhouse, 9 two family, 1 mobile home, 1 vacant land.

## 2. Results (data)

**All and by building type** ($/sf = declared `total_project_value` ÷ assessed `FINISHEDLIVINGAREA`)

| group | n | p10 | p25 | median | p75 | p90 | median value | median sq ft |
|---|---|---|---|---|---|---|---|---|
| **all** | 220 | 57 | 79 | **104** | 133 | 152 | $200,000 | 1,976 |
| single-family detached | 173 | 56 | 77 | 105 | 140 | 156 | $180,000 | 1,906 |
| single-family attached/townhouse | 37 | 70 | 80 | 86 | 103 | 135 | $200,000 | 1,993 |
| two-family | 9 | 92 | 111 | 125 | 125 | 126 | $275,000 | 2,200 |
| multifamily (units n/a) | 1 | – | – | 104 | – | – | $325,000 | 3,116 |
| modular (1–2 family) | 27 | 79 | 89 | 101 | 115 | 164 | $200,000 | 1,991 |
| site-built (1–2 family) | 192 | 56 | 75 | 104 | 136 | 152 | $175,000 | 1,973 |

**By issue year**

| year | deduped permits | final n | coverage | p10 | p25 | median | p75 | p90 |
|---|---|---|---|---|---|---|---|---|
| 2019 (from 2019-06) | 13 | 11 | 85% | 56 | 57 | 100 | 121 | 146 |
| 2020 | 77 | 46 | 60% | 63 | 77 | 99 | 129 | 142 |
| 2021 | 90 | 53 | 59% | 51 | 60 | 80 | 98 | 118 |
| 2022 | 56 | 23 | 41% | 70 | 101 | 104 | 124 | 167 |
| 2023 | 81 | 55 | 68% | 71 | 85 | 119 | 150 | 161 |
| 2024 | 73 | 31 | 42% | 105 | 127 | 131 | 146 | 148 |
| 2025 | 41 | 1 | 2% | – | – | 39 | – | – |
| 2026 (to 2026-09) | 24 | 0 | 0% | – | – | – | – | – |

**Coverage by building type:** detached SF 173/299 (58%), townhouse 37/95 (39%), two-family 9/19 (47%), **multifamily 1/42 (2%)**.

**Robustness**

| sample | n | p10 | p25 | median | p75 | p90 |
|---|---|---|---|---|---|---|
| all (as above) | 220 | 57 | 79 | 104 | 133 | 152 |
| cluster-collapsed: permits sharing year + neighborhood + identical value count as one | 104 | 56 | 78 | 103 | 133 | 156 |
| only non-round declared values (not a multiple of $5,000) | 19 | 80 | 93 | 119 | 138 | 143 |

The sample is **clustered by developer program**. Nine clusters have ≥5 identical-value permits. The largest is 26 Allentown homes in 2024, all declared at $175,000. That cluster alone is 26 of the 31 permits in 2024, so the **2024 "rise" to $131/sf reflects one program of small (~1,000–1,660 sf) homes, not market inflation**. Collapsing clusters leaves the overall median almost unchanged ($103).

**Declared-value heaping.** 326 of 627 dwelling permits (52%) are exact multiples of $25,000. The most common values are $200,000 (71), $150,000 (61) and $175,000 (50).

## 3. Cross-check against later sales (data, then inference)

For 63 permits in the final sample, the assessment's most recent sale fell after the permit issue date, was at least $50,000, and was coded `0` (valid sale, 21) or `16` ("no bldg asmt", 42). Code 16 is typical of new-construction sales before reassessment.

| measure (same 63 parcels) | p10 | p25 | median | p75 | p90 |
|---|---|---|---|---|---|
| declared permit $/sf | 51 | 58 | 84 | 101 | 139 |
| later sale price $/sf | 153 | 213 | **284** | 320 | 356 |
| declared value ÷ sale price | 0.16 | 0.26 | **0.31** | 0.40 | 0.68 |

**Inference.**
- A sale price includes land, soft costs, financing and margin, so hard cost should sit below it. The SMEs' city-infill $200–250/sf would be about 70–90% of a $284/sf sale price. The declared value is about 31%.
- Declared permit value therefore looks like **roughly a third to a half of plausible actual hard cost**. This is an inference from two independent public fields. It was not observed.
- The sale subset is itself selective: sold new builds, weighted to code-16 sales.

## 4. Group developments (excluded from $/sf; declared value per permit; 7 of 16 shown, full list printed by the script)

| issue year(s) | what (from descriptions) | permits | median value/permit |
|---|---|---|---|
| 2022 | 1-story townhouse group on one parcel | 46 | $182,759 (identical on all) |
| 2025 | public-housing redevelopment phase (70 units, 8 buildings) | 22 | $267,316 (one master permit $14.7M) |
| 2022/2024 | 4-story townhouses | 19 | $150,000 |
| 2024 | 3-story SF-attached group of 5 plus buildings | 12 | $223,373 (one master $10.1M) |
| 2026 | townhouses | 12 | $276,559 |
| 2026 | redevelopment phase III (12-unit building plus unit permits at $1) | 10 | $1 (master $10.7M) |
| 2026 | 3-story townhomes | 4 | $337,052 |

Two things show up here. **Placeholder $1 values** appear on unit permits under a master permit. And **identical values repeat on every unit**, which suggests a per-model figure rather than a bid. Both are further reasons not to read permit value as cost.

## 5. Caveats

1. **Applicant-declared, fee-bearing.** The 2025 PLI fee schedule charges the residential base permit fee at **$6.00 per $1,000 of Construction Value** (min $130, max $8,000). Commercial is $7.00 per $1,000 (min $605, max $80,000) [read]. The schedule does not say how Construction Value is determined or checked. Whether PLI verifies it against ICC Building Valuation Data tables is **unverified**. The fee creates a mild incentive to understate; we infer this, but it is not documented.
2. **Denominator mismatch.** `FINISHEDLIVINGAREA` excludes unfinished basements and integral garages, which many of these designs have. Dividing by finished area *raises* $/sf relative to gross area, so the understatement against gross-sf SME figures is, if anything, larger.
3. **Survivorship.** Only permits whose building has been assessed get a sq ft. Buildings never built or not yet reassessed drop out. 2025–26 is effectively missing.
4. **No multifamily.** Apartment parcels have no FINISHEDLIVINGAREA and no description gives sq ft. Nothing here checks the $325–375/sf vertical figure. For that, we would need building gross area from another source, such as the City's `Development_Construction_Projects_v2` layer (see [permits and outcomes](../knowledge/data/permits-and-outcomes.md)), plan sets, or LiDAR footprints × stories.
5. **Classification is regex-based** and `commercial_or_residential` is inconsistent. Townhouse groups are often flagged Commercial.
6. **Dollars are nominal**, not inflation-adjusted.
7. **Scope:** City of Pittsburgh only (PLI jurisdiction), not the County's other 129 municipalities.

## 6. What to do with this (inference, for the pro forma)

- Keep the SME ranges as the hard-cost inputs, labeled "practitioner estimate". Show permit $/sf only as "what applicants declare to the City: median $104/sf, 2019–24", with the 0.31× sale-price ratio next to it. That makes the understatement visible instead of hidden.
- **What the data supports:** permit valuations cannot validate $200–250/sf. They are consistent with it only once they are treated as understating cost by 2–3×, and that factor is itself an estimate.

## Sources

- [WPRDC PLI permits, resource f4d1177a (bulk dump)](https://data.wprdc.org/datastore/dump/f4d1177a-f597-4c32-8cbf-7885f56253f6) `[read]` *(accessed 2026-09-27)*: 65,378 rows, 2019-06 to 2026-09. Fields used: `permit_id`, `permit_type`, `work_type`, `work_description`, `commercial_or_residential`, `total_project_value`, `issue_date`, `parcel_num`, `neighborhood`, `status`. The file also holds `owner_name`/`contractor_name`, which we did not read.
- [WPRDC Allegheny County property assessments, resource 65855e14 (bulk dump)](https://data.wprdc.org/datastore/dump/65855e14-549e-4992-b5be-d629afc676fa) `[read]` *(accessed 2026-09-27)*: `FINISHEDLIVINGAREA`, `YEARBLT`, `USEDESC`, `SALEPRICE`, `SALEDATE`, `SALECODE`/`SALEDESC`. The file includes owner mailing-address fields, which we did not read.
- [City of Pittsburgh PLI 2025 Fee Schedule (PDF, effective 1/1/2025)](https://www.pittsburghpa.gov/files/assets/city/v/1/pli/documents/fees/pli-fee-schedule-1-1-2025.pdf) `[read]` *(accessed 2026-09-27)*: base permit fee per $1,000 of Construction Value.
- [PLI Fee Calculator](https://www.pittsburghpa.gov/Business-Development/Permits-Licenses-and-Inspections/Fees/Fee-Calculator) `[found]` *(accessed 2026-09-27)*: might show how Construction Value is entered or derived; not opened.
- ICC Building Valuation Data tables `[found]` *(recalled; search result only, 2026-09-27)*: the national per-sf valuation table some jurisdictions use to check declared values. Pittsburgh's use of it is unverified.
- Analysis script: [`admin/scripts/permit_cost_per_sf.py`](../admin/scripts/permit_cost_per_sf.py). Input dump checksums (md5) on 2026-09-27: permits `6e0a31e25b368f310eb6a566780183e5`, assessments `b77a529fe2611d4496f912668061c4e0`. The live dumps change over time.
- Context: [pro forma](../knowledge/methods/pro-forma.md) (hard costs flagged as "the main gap"); [permits and outcomes](../knowledge/data/permits-and-outcomes.md) (the 2025 recode gotcha).
