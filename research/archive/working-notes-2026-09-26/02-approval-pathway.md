# Pittsburgh approval pathway

**[V]** = read in a primary source or computed by us. **[S]** = secondary source or search snippet. **[U]** = unverified. This is working research, not legal advice. Confirm with City Planning or mentors.

Correction to earlier notes: the steep-slope, landslide, undermined and floodplain rules are the **Chapter 906 overlays** (SS-O, LS-O, UM-O, FP-O), not Chapter 915. Our code text for Chapters 906, 914, 915 and 922 comes partly from the zoneomics.com mirror, and how current that mirror is is [U]. Re-check against eCode360 in a browser.

## Steps and triggers

| Step | Trigger | Decides | Duration | Source |
|---|---|---|---|---|
| Zoning review (by-right) | Every building permit (BDA via OneStopPGH) | Zoning staff | See measured timelines below | |
| Site Plan Review §922.04 | Multi-unit ≥4 units; any construction in the H district; various lot-size / parking thresholds | Zoning Administrator (may refer to PC within 14 d) | [U] | [V] |
| Administrator Exception §922.08 | Listed minor relief | Zoning Administrator | Decision within 21 d of a complete application | [V] |
| Special Exception §922.07 / Variance §922.09 | Use listed as S in the use table; any dimensional or use noncompliance | ZBA | ≥21 d notice. Hearings on the first 3 Thursdays of the month. Decision ≤45 d after the record closes. **$400** fee. Approval valid 1 yr. | ZBA handout Dec 2024 [V] |
| Conditional Use §922.06 | Use listed as C | Planning Commission → City Council (7 of 9 votes if PC recommends denial) | Several months minimum | [V] |
| Project Development Plan §922.10 | District-specific. Snippet says ≥15,000 sf GFA | Planning Commission | [U] | applicability [V]; threshold [S] |
| SS-O Steep Slope §906.08 | Natural slope ≥25% | PC review; 50 ft setback from ridgeline/base | Hearing ≤60 d; decision ≤45 d | [V]. Whether SS-O is mapped citywide: [U] |
| LS-O Landslide §906.04 | In mapped LS-O with excavation, fill, or clearing | Zoning Administrator + PLI Building Chief; professional field investigation | [U] | [V] |
| UM-O Undermined §906.05 | New construction or enlargement | Zoning Administrator + Building Chief | [U] | [V] |
| FP-O Floodplain §906.02 | FEMA A/AE zone | Zoning + PLI floodplain permit | [U] | [V] |
| §915.02 environmental standards | Cut/fill slopes >25%; site >¼ acre needs a tree survey | Zoning Administrator | [U] | [V]. The "40% no-disturbance" rule seen in a snippet was **not** found in the text. |
| RCO Development Activities Meeting | Public hearing needed AND (≥2,400 sf, ≥4 units, ≥10 stalls, use variance, etc.) | RCO / City | ≥30 d before the first hearing | DCP page 5/5/26 [V/S] |
| Historic Review Commission | City historic district or landmark | HRC | Apply ≥13 business days before the hearing | $50 [S] |
| Stormwater (Ch. 1303) | ≥10,000 sf disturbance OR ≥5,000 sf new impervious | DCP / PLI / PWSA | [U] | [S] |
| PWSA Water & Sewer Use Application | More than 1 single-family unit, any subdivision or multi-unit | PWSA | [U] | [S] |
| DEP Sewage Facilities Planning Module | Most net-new-unit projects. No exemptions since 2011 because of the ALCOSAN consent decree. | PWSA, ALCOSAN, DCP, Law, Council, DEP | 3–6 months [S] | pgh2o.com [S] |
| ACCD Ch. 102 E&S / NPDES | ≥1 acre of disturbance | Allegheny County Conservation District | [U] | [S] |
| EZ Permit (pilot) | Single-scope residential work only. Excludes floodplain, historic, condemned. | PLI | 1 business day | [V]. Not applicable to new housing. |

**Detail on the geology and flood rows:**
- **UM-O (undermined):** a single-unit dwelling is OK with >100 ft of overburden and no subsidence history. Anything heavier, or with <100 ft of overburden, is prohibited until a site investigation shows the site is safe.
- **FP-O (floodplain):** the lowest floor must be at or above the regulatory flood elevation. In the **floodway**, there is no new construction without a no-rise analysis plus a DEP permit, which in practice means no building.

## Parking (Table 914.02.A) [V]

| Use | Minimum | Maximum |
|---|---|---|
| Single-unit detached | 1 per unit | 4 per unit |
| Single-unit attached | 0 | [U] |
| Two-, three- and multi-unit | 1 per unit | 2 per unit |

Reductions under §914.04:
- 100%: Downtown, SP-11, Uptown PRD, UC-E
- 50%: RIV, UC-MU, R-MU
- East Liberty and North Side reductions exclude residential.

Pending Bill 2025-1545 would remove parking minimums. Status as of 9/26 below.

## Measured timelines from OneStopPGH [V, computed by us]
There is no usable top-level application date. We used the dated steps in the `workflows` JSON: from the earliest step to "Issue Permit".

- **Zoning Development Review, 2019–24** (n=17,129): p25 9 d, **median 25 d**, p75 68 d, p90 168 d. The median is stable year to year. The series ends in mid-2024 (merged into BDA [inference]).
- **BDA, 2024–26:**

| Group | n issued | Median | p75 | p90 | Revision cycles | Notes |
|---|---|---|---|---|---|---|
| Residential alteration | 6,872 | 8 d | 34 d | 95 d | median 0 | |
| Residential new construction | 74 of 210 | **153 d** | 246 d | 340 d | **median 5** | **Right-censored:** 78 records are sitting in "Applicant Revisions", so the true median is longer. Mostly single-family (78), then three-unit (21) and two-family (5). |
| Commercial new construction | n=157 | 104 d | [U] | [U] | [U] | |

- These figures are consistent with PublicSource's reported drop from 27 to 11 days for BDA overall. The 2026 median is also biased down by censoring.
- ZBA approval rates: none published anywhere we found.

## Policy in flux (as of 2026-09-26)
- **Ord. 10-2025 (Bill 2025-1579), effective 5/7/2025 [V]:**
  - New minimum lot sizes: VL 6,000 / L 3,000 / M 2,400 / H 1,200 sq ft; VH has none.
  - Lot-area-per-unit requirement eliminated.
  - eCode360 already reflects this.
- **Bill 2025-1545** (ADUs by right citywide, no parking minimums, optional Affordable Housing Bonus):
  - PC recommended it 6/2/2026 [V].
  - Council hearing 9/23/2026 [V].
  - **No vote found as of 9/26.**
- **Bill 2026-0834, Phase I zoning amendment:** revised dimensional standards, simpler height rules, residential compatibility. Council hearing **Oct 13, 2026** [V].
- **Mayor O'Connor's March 2026 plan [V/S]:**
  - Phase I: triage by project size and complexity; the City runs public-input meetings instead of RCOs; "investigating AI technologies to review applications for missing info".
  - Phase II: full zoning rewrite tied to the 2050 comprehensive plan.
- **Inclusionary Zoning Overlay** (Lawrenceville, Bloomfield, Polish Hill, Oakland): 20+ units → 10% at 50% AMI, 35-year term. Still in effect.
- **Implication:** any rules engine should pin a code version and support scenarios such as "current" vs "if 2025-1545 passes".
