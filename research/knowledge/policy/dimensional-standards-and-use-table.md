# Dimensional standards and residential use table

**Type:** policy
**One line:** The residential site standards in §903.03 (lot size, setbacks, height) and the residential rows of the §911.02 use table, as they read in eCode360 on 2026-09-26.
**Why we care:** These are the by-right envelope and unit-count ceilings. Anything a parcel cannot meet here becomes a variance or special exception, which is the slowest part of the [approval pathway](approval-pathway.md).
**Last checked:** 2026-09-26

## Structure of the residential districts

- Residential zoning combines five **Use Subdistricts** (R1D, R1A, R2, R3, RM) with five **Development Subdistricts** (VL, L, M, H, VH). The GIS district code (field `zon_new`) carries both, e.g. `R1D-M`, `RM-H`. `[read]` per the zoning sweep's live GIS queries ([r1 zoning sweep](../../sweeps/r1-zoning-data-code-and-reforms.md)).
- Site standards are in **§903.03**. Contextual setbacks and heights are allowed under §925.06–.07. Chapter 915 (environmental standards) and Chapter 916 (residential compatibility, H/VH) add constraints ([eCode360 §903.03 transcription](../../sources/ecode360-2026-09-26-pittsburgh-903-03-dimensional-standards.md)) `[read]`.
- `H` in the GIS is a base district (Hillside), not an overlay (65 polygons) `[read]` ([r1 zoning sweep](../../sweeps/r1-zoning-data-code-and-reforms.md)).

## §903.03 dimensional standards `[read]`

Source: eCode360 §903.03, "as amended Ord. No. 10-2025 eff. 5-7-2025", read in a real browser on 2026-09-26. All distances in feet, lot sizes in square feet. ⚠ The critique re-checked these values against the live page on 2026-09-26 and they match. The files in `sources/` are an agent's reformatted transcriptions, not verbatim captures; the §911.02 residential columns below were transcribed once and not re-verified *(corrected 2026-09-26 per docs/04-critique.md row 7)*.

| Standard | VL | L | M | H | VH |
|---|---|---|---|---|---|
| Min lot size | 6,000 | 3,000 | 2,400 | 1,200 | none |
| Front setback R1D/R1A/R2/R3 | 30 | 30 | 30 | 15 | 5 |
| Front setback RM | 30 | 25 | 25 | 25 | 25 |
| Rear setback R1D/R1A/R2/R3 | 30 | 30 | 30 | 15 | 15 |
| Rear setback RM | 30 | 25 | 25 | 25 | 25 |
| Exterior side R1D/R1A/R2/R3 | 30 | 30 | 30 | 15 | 5 |
| Exterior side RM | 30 | 30 | 25 | 25 | 25 |
| Interior side R1D/R2/R3 | 5 one side + 10 other | 5 | 5 | 5 | 5 |
| Interior side R1A | 5 | 5 | 5 | 5 | 5 |
| Interior side RM | 30 | 25 | 10 | 10 | 10 |
| Max height R1D/R1A/R2/R3 | 40 ft / 3 stories | 40/3 | 40/3 | 40/3 | 40/3 |
| Max height RM | 40/3 | 40/3 | 55/4 | 85/9 | 180 ft |

- A party-wall (attached) lot has an interior side yard of 0 `[read]`.
- **No FAR.** The residential table has no floor-area ratio; the envelope comes from lot size, setbacks and height only (see the corrections log in [../README.md](../README.md)).
- ⚠ **No lot-area-per-unit in §903.03** *(corrected 2026-09-26 per docs/04-critique.md row 6)*. §903.03 on eCode360 (read 2026-09-26, and re-checked by the critique) has **no lot-area-per-unit row** and no FAR row. Whether any such requirement survives elsewhere in Title Nine is **unchecked**. The earlier claim that Ord. 10-2025 "eliminated lot-area-per-unit in all residential districts" rested on the 2024-12-10 PC draft PDF, the same PDF whose strikethrough caused a logged correction; the Legistar title of Bill 2025-1579 says only "to reduce required minimum lot sizes". The June 2026 PC redline of Bill 2025-1545 still contains "minimum lot size per unit" language in its ADU section (possibly struck; text extraction cannot tell). Old values per the PC draft (2024-12-10) `[read]`: VL 8,000 / L 3,000 / M 1,800 / H 750 / VH 400 sf per unit ([PC draft PDF](https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/planning-commission/draft-minimum-lot-size-legislation_pc-hearing-and-action_2024-12-10.pdf)). Within §903.03, density in a residential district is capped by the use table's unit ceiling and the envelope.
- **Minimum lot width:** not found in these tables. Whether one exists is unverified (see Open questions).

### What changed with Ord. 10-2025 (minimum lot size)

| Subdistrict | Before (sf) | After (sf, eCode360) |
|---|---|---|
| VL | 8,000 | 6,000 |
| L | 5,000 | 3,000 |
| M | 3,200 | 2,400 |
| H | 1,800 | 1,200 |
| VH | 1,200 or 1,800 (sources disagree) | none |

- Adopted May 2025, signed May 7, 2025 ([EngagePgh min lot size page](https://engage.pittsburghpa.gov/implementing-housing-needs-assessment/minimum-lot-size)) `[read]`. Legistar: Bill 2025-1579 Passed Finally 5/6/25, signed 5/7/25, Ord. 10 `[read]` (critique's check). The "after" column is confirmed by the live eCode360 text.
- ⚠ Sub-minimum lots are not necessarily unbuildable: **Ch. 921 (Nonconformities)** lot-of-record relief has not been read, and **Bill 2026-0834 would amend Ch. 921** *(corrected 2026-09-26 per docs/04-critique.md row 8)*. See [land availability](../data/land-availability-and-title.md) for how many available city lots fall below these minimums.
- **Contradiction, unresolved but immaterial:** the prior VH value. The PC draft PDF's strikethrough formatting is ambiguous (the zoning sweep read it as 1,200); EngagePgh gives 1,800 and a snippet gave 1,200 ([r1 prior-art sweep](../../sweeps/r1-prior-art-proforma-and-practitioner-barriers.md)). It only matters for backtesting against pre-May-2025 outcomes. The current value (none) is not in doubt. See the corrections log in [../README.md](../README.md).
- The City's own analysis found a "high preponderance of lots that did not meet current minimum lot size requirements" in low and very-low density zones. No published share of nonconforming lots was found `[read]` ([EngagePgh min lot size page](https://engage.pittsburghpa.gov/implementing-housing-needs-assessment/minimum-lot-size)).

## §911.02 use table, residential rows `[read]`

Legend: **P** permitted by right, **A** Administrator Exception, **S** Special Exception, **C** Conditional Use, blank = not permitted. Only the R1D–RM columns are reliable in our transcription; the column alignment past RM needs re-verification because the rendered header has merged cells ([eCode360 §911.02 transcription](../../sources/ecode360-2026-09-26-pittsburgh-911-02-use-table-residential.md)).

| Use | R1D | R1A | R2 | R3 | RM | Use standard |
|---|---|---|---|---|---|---|
| Single-Unit Detached | P | P | P | P | P | §911.04A.69 |
| Single-Unit Attached | P/S | P | P | P | P | §911.04A.69, .69A |
| Two-Unit | | | P | P | P | |
| Three-Unit | | | | P | P | |
| Multi-Unit (4+) | | | | | P | §911.04A.85 |
| Assisted Living Class A | | | S | S | S | §911.04A.66 |
| Assisted Living Class B | | | | | S | §911.04A.66 |
| Assisted Living Class C | | | | | C | §911.04A.66 |
| Community Home | S | S | S | S | S | §911.04A.84 |
| Housing for the Elderly (Limited) | S | S | S | S | S | §911.04A.35 |
| Housing for the Elderly (General) | | | | S | S | §911.04A.35 |
| Multi-Suite Residential (Limited) | | | | | C | §911.04A.41 |
| Personal Care Residence (Large) | | | S | S | S | §911.04A.95A |
| Personal Care Residence (Small) | A | A | A | A | A | §911.04A.95B |

- **By-right unit ceilings:** R1D and R1A = 1 unit; R2 = 2; R3 = 3; RM = no use-table ceiling. Outside the residential districts, the transcription shows Multi-Unit as P in NDO, LNC, NDI and UNC (among others), but those columns are the ones flagged for re-verification.
- Scoring implication (inference, from the zoning sweep): if a target unit count exceeds the district's P ceiling, the project needs a use variance or a rezoning, and goes to the ZBA ([approval pathway](approval-pathway.md)).

### Where the older bill text and the live code disagree

The zoning sweep first read the use table from the attachment to Bill 2024-0701 (July 2024) `[read]` ([Bill 2024-0701 draft](https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/planning-commission/council-bill-draft-legislation-2024-0701.pdf)). Per the domain rule, **the eCode360 text wins**.

- **Assisted Living Class A:** the 2024-0701 attachment was summarized as S in R1D, R1A, R2, R3 and RM. The live eCode360 row shows it blank (not permitted) in R1D and R1A, S in R2, R3 and RM.
- **Community Home:** 2024-0701 proposed changing it from S to C in residential districts. eCode360 on 2026-09-26 still shows S in all five residential districts, so that change is not reflected in the code text we read. ⚠ Legistar shows **Bill 2024-0701 still "In Standing Committee"**: it has not been adopted, and the S→C change is not law *(corrected 2026-09-26 per docs/04-critique.md row 10)*.

## Open questions

- Is there a minimum lot width for residential districts anywhere in Title Nine?
- Column alignment for the non-residential districts in §911.02 (NDO onward) needs a re-read against the rendered table.
- How does Ch. 916 residential compatibility change the envelope in H/VH, and how often do contextual setbacks (§925.06–.07) apply?
- Bill 2026-0834 (Phase I amendment, Council hearing 10/13/26; Held In Council per Legistar) "revises dimensional standards" and "simplifies height rules". ⚠ Its Legistar title shows a much wider scope: Ch. 906, 915, 921, 922, 911–913, 918–920 and 925–926 *(corrected 2026-09-26 per docs/04-critique.md row 8)*. Which cells in the table above would change? See [reforms in flux](reforms-in-flux-2025-2026.md).
- Does any lot-area-per-unit requirement survive elsewhere in Title Nine (outside §903.03)?
- Bill 2025-1545 would allow ADUs by right citywide. How an ADU interacts with the one-unit ceiling in R1D/R1A is unknown until the bill text is adopted. Current ADU terms are in the June 2, 2026 PC redline on Legistar, which needs a visual read.

## Connects to

- [Approval pathway](approval-pathway.md): what happens when a project doesn't fit this table
- [Environmental overlays (Ch. 906)](environmental-overlays-ch906.md): overlays that add review on top of the base standards
- [Parking](parking.md): the other common dimensional-noncompliance trigger
- [Reforms in flux](reforms-in-flux-2025-2026.md): which of these numbers are about to change
- [Zoning GIS](../data/zoning-gis.md): the `zon_new` field that selects a row and column
- [Zoning code text](../data/zoning-code-text.md): access to eCode360 and the mirrors
- [Score design options](../methods/score-design-options.md): envelope formula (no FAR)
- [Practitioners](../stakeholders/practitioners.md): nonconforming and irregular lots as a cited barrier

## Sources

- [eCode360, Pittsburgh Code §903.03](https://ecode360.com/45474194) `[read]` *(accessed 2026-09-26)*: live dimensional table as amended by Ord. 10-2025; transcription at [../../sources/ecode360-2026-09-26-pittsburgh-903-03-dimensional-standards.md](../../sources/ecode360-2026-09-26-pittsburgh-903-03-dimensional-standards.md)
- [eCode360, Pittsburgh Code §911.02 Use Table](https://ecode360.com/45476524) `[read]` *(accessed 2026-09-26)*: residential use rows; transcription at [../../sources/ecode360-2026-09-26-pittsburgh-911-02-use-table-residential.md](../../sources/ecode360-2026-09-26-pittsburgh-911-02-use-table-residential.md)
- [Planning Commission draft, minimum lot size legislation, 2024-12-10](https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/planning-commission/draft-minimum-lot-size-legislation_pc-hearing-and-action_2024-12-10.pdf) `[read]` *(accessed 2026-09-26)*: old lot-area-per-unit values; old/new ambiguous because of strikethrough
- [Council bill draft 2024-0701](https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/planning-commission/council-bill-draft-legislation-2024-0701.pdf) `[read]` *(accessed 2026-09-26)*: use table as of July 2024; superseded by eCode360 where they differ
- [EngagePgh, minimum lot size](https://engage.pittsburghpa.gov/implementing-housing-needs-assessment/minimum-lot-size) `[read]` *(accessed 2026-09-26)*: before/after table, nonconforming-lot finding
- [Post-Gazette, 2025-05-06, minimum lot size vote](https://www.post-gazette.com/news/politics-local/2025/05/06/pittsburgh-housing-zoning-lots-gainey/stories/202505060064) `[skimmed]` *(accessed 2026-09-26)*: adoption date and vote
- [Pittsburgh Legistar](https://pittsburgh.legistar.com/) and [web API](https://webapi.legistar.com/v1/pittsburgh/matters) `[read]` *(accessed 2026-09-26, via the critique's live check)*: Bills 2025-1579, 2024-0701 and 2026-0834 status and titles
- Sweep: [../../sweeps/r1-zoning-data-code-and-reforms.md](../../sweeps/r1-zoning-data-code-and-reforms.md)
- Sweep: [../../sweeps/r1-prior-art-proforma-and-practitioner-barriers.md](../../sweeps/r1-prior-art-proforma-and-practitioner-barriers.md)
- [Adversarial critique](../../docs/04-critique.md) — rows 6, 7, 8, 10
