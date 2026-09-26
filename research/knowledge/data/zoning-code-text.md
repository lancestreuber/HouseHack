# Zoning code text (Pittsburgh Title Nine)

**Type:** data
**One line:** Where the Pittsburgh Zoning Code text lives, which copies can be fetched by machine, and what has been transcribed into tables so far.
**Why we care:** A score can only be source-grounded if every rule it applies cites a section. The code is hard to scrape and is being amended while we work, so we hand-transcribe the tables we need and date them.
**Last checked:** 2026-09-26

## Where the text is, and what blocks access

| Copy | Status from here | Tag |
|---|---|---|
| eCode360 (`https://ecode360.com/45474194` = Ch. 903) | **Cloudflare 403** to curl and WebFetch; loads in a real browser. The GIS `municode` field links here. The normal section page's text extraction returns only a chapter's first section; the **print view** (`https://ecode360.com/print/PI6865?guid=<id>`) returns the full section with its history line *(updated 2026-09-26, round 5)*. JavaScript was blocked partway through the round-5 session and full-text search did not load | `[read]` via browser for §903.03, §911.02, and (round 5) §906.02/.04/.05/.08, §914.02/.04/.07, §915.01/.02, §922.04/.06–.10 |
| Municode library (`library.municode.com/pa/pittsburgh/...`) | JavaScript single-page app; not scraped | `[found]` |
| `pittsburgh-pa.elaws.us` (mirror) | timed out | `[inaccessible]` |
| pittsburghpa.gov PDFs (bill drafts, handouts) | 403 to curl (Akamai); WebFetch downloaded them, text via `pdftotext` | `[read]` |
| zoneomics.com/code/pittsburgh-PA (ch. 1–9) | curl-able, read in full by one sweep; **currency unverified**. Commercial mirror, so a lead only. Round 5 found the mirror-based KB claims for Ch. 906/914/915/922 mostly correct, but it had missed the deemed-denial defaults, the AAPP decider split and the tree-replacement ratio *(updated 2026-09-26, round 5)* | `[skimmed]` |

Per the [knowledge README](../README.md) domain rule, a rule is `[skimmed]` until read in eCode360 or a dated City document; where the mirror and the code disagree, the code wins.

## Structure (as read)
- Residential districts = five Use Subdistricts (R1D, R1A, R2, R3, RM) × five Development Subdistricts (VL, L, M, H, VH). `zon_new` in GIS encodes both, e.g. `R1D-M`.
- Site standards: **§903.03.A–E**. Contextual setbacks/heights: §925.06–.07. General environmental performance standards: **Ch. 915**. Residential compatibility: Ch. 916 (H/VH).
- **Steep slope, landslide, undermined and floodplain rules are Ch. 906 overlays** (SS-O §906.08, LS-O §906.04, UM-O §906.05, FP-O §906.02), not Ch. 915. ⚠ See the corrections log and [environmental overlays](../policy/environmental-overlays-ch906.md).
- §903.03 residential districts have **no FAR**. ⚠ (corrections log)

## Transcribed: §903.03 dimensional standards `[read]`
From eCode360 as amended by Ord. No. 10-2025, eff. 5-7-2025, fetched via real browser ([source note](../../sources/ecode360-2026-09-26-pittsburgh-903-03-dimensional-standards.md)).

| Standard | VL | L | M | H | VH |
|---|---|---|---|---|---|
| Min lot size | 6,000 sf | 3,000 | 2,400 | 1,200 | none |
| Front setback R1D/R1A/R2/R3 | 30 | 30 | 30 | 15 | 5 |
| Front setback RM | 30 | 25 | 25 | 25 | 25 |
| Rear setback R1D/R1A/R2/R3 | 30 | 30 | 30 | 15 | 15 |
| Rear setback RM | 30 | 25 | 25 | 25 | 25 |
| Ext. side R1D/R1A/R2/R3 | 30 | 30 | 30 | 15 | 5 |
| Ext. side RM | 30 | 30 | 25 | 25 | 25 |
| Int. side R1D/R2/R3 | 5 one side + 10 other | 5 | 5 | 5 | 5 |
| Int. side R1A | 5 | 5 | 5 | 5 | 5 |
| Int. side RM | 30 | 25 | 10 | 10 | 10 |
| Max height R1D/R1A/R2/R3 | 40 ft / 3 st | 40/3 | 40/3 | 40/3 | 40/3 |
| Max height RM | 40/3 | 40/3 | 55/4 | 85/9 | 180 ft |

Party-wall attached → interior side 0. ⚠ §903.03 on eCode360 has no lot-area-per-unit row (confirmed live by the critique, 2026-09-26) *(corrected 2026-09-26 per docs/04-critique.md row 6)*. The Ord. 10-2025 matter text on Legistar shows that row **deleted** for all subdistricts and the Ch. 926 density definitions made "Reserved" `[read]` *(updated 2026-09-26, round 5; [saved text](../../sources/pittsburgh-legistar-2026-09-26-zoning-bills-1545-0834-1579.md))*. Whether any per-unit requirement survives elsewhere in Title Nine is still unchecked.

⚠ An earlier reading of the Planning Commission PDF draft (2024-12-10) inferred old→new values from strikethrough/underline order and was ambiguous for VH; the live eCode360 text above supersedes it (corrections log). The enacted ordinance text shows the old VH minimum as 1,200 sf *(updated 2026-09-26, round 5)*.

## Transcribed: §911.02 use table (residential rows) `[read]`
From eCode360 `https://ecode360.com/45476524`, fetched via browser ([source note](../../sources/ecode360-2026-09-26-pittsburgh-911-02-use-table-residential.md)). P = by right, A = Administrator Exception, S = Special Exception, C = Conditional Use, blank = not permitted.

| Use | R1D | R1A | R2 | R3 | RM |
|---|---|---|---|---|---|
| Single-unit detached | P | P | P | P | P |
| Single-unit attached | P/S | P | P | P | P |
| Two-unit | | | P | P | P |
| Three-unit | | | | P | P |
| Multi-unit (4+) | | | | | P |
| Assisted living A | | | S | S | S |
| Community home | S | S | S | S | S |
| Personal care residence (small) | A | A | A | A | A |

✅ **Column alignment verified** *(updated 2026-09-26, round 5)* `[read]`: the source note's column order matches a screenshot of the rendered print view; the header groups are Residential / Mixed Use (10) / Special (P, H, EMI) / DT (GT, blank) / RIV (5), and seven rows were checked cell by cell ([sweep](../../sweeps/r5-ecode360-reread-ch906-914-915-922.md)). The old "past RM unreliable" caveat is removed. Multi-unit is P in NDO, LNC, NDI, UNC, UC-MU, R-MU, GT and RIV-RM/MU/NS/IMU; S in UI; A in UC-E and EMI; not permitted in HC, GI, P or **H**. In H, single-unit detached is A. See [dimensional standards](../policy/dimensional-standards-and-use-table.md).

Note: the r1 sweep, reading Bill 2024-0701's table, had Assisted Living A as S in R1D and R1A too; the live eCode360 transcription (now verified) shows blank there. We follow eCode360.

## Saved verbatim (round 5) `[read]` *(updated 2026-09-26, round 5)*
- Ch. 906 (§906.02, .04, .05, .08): [../../sources/ecode360-2026-09-26-pittsburgh-906-environmental-overlays.md](../../sources/ecode360-2026-09-26-pittsburgh-906-environmental-overlays.md) → [overlays](../policy/environmental-overlays-ch906.md)
- Ch. 914 (§914.02.A Parking Schedule A residential rows, §914.04, §914.07 excerpts): [../../sources/ecode360-2026-09-26-pittsburgh-914-parking.md](../../sources/ecode360-2026-09-26-pittsburgh-914-parking.md) → [parking](../policy/parking.md)
- Ch. 915 (§915.01, §915.02 in full): [../../sources/ecode360-2026-09-26-pittsburgh-915-environmental-performance.md](../../sources/ecode360-2026-09-26-pittsburgh-915-environmental-performance.md)
- Ch. 922 (§922.04, .06, .07, .08, .09, .10): [../../sources/ecode360-2026-09-26-pittsburgh-922-procedures.md](../../sources/ecode360-2026-09-26-pittsburgh-922-procedures.md) → [approval pathway](../policy/approval-pathway.md)

## Not yet transcribed
§914.05 bicycle parking, §906.03/.06/.07, Ch. 916, Ch. 921, §925, the district chapters that set PDP thresholds, and the Subdivision Regulations' Hillside Development Standards (required by LS-O).

## Open questions
- Does a minimum lot width exist in §903.03? Not found in the tables read (unverified).
- ~~Re-verify §911.02 columns past RM~~ done round 5.
- Where is the "40% slope no-disturbance" rule, if anywhere? Not in §906.08 or §915.01–.02; the full-code search did not load.
- Currency of the zoneomics mirror against eCode360.
- Bill 2026-0834 (Phase I amendment, Council hearing 10/13/26) would revise dimensional standards and height rules; the table above will need re-reading if it passes. ⚠ Per its Legistar title it also amends Ch. 906, 915, 921, 922, 911–913, 918–920 and 925–926 *(corrected 2026-09-26 per docs/04-critique.md row 8)*.
- Community Home: Bill 2024-0701 proposed S → C; the transcription shows S. ⚠ Legistar shows Bill 2024-0701 still **"In Standing Committee"**, so the change is not law *(corrected 2026-09-26 per docs/04-critique.md row 10)*.

## Connects to
- [Dimensional standards and use table](../policy/dimensional-standards-and-use-table.md): the policy reading of these tables
- [Environmental overlays Ch. 906](../policy/environmental-overlays-ch906.md)
- [Reforms in flux 2025–2026](../policy/reforms-in-flux-2025-2026.md)
- [Zoning GIS](zoning-gis.md): `municode` link field
- [LLM role](../methods/llm-role.md): section citation and retrieval
- [Municipal zoning outside the city](municipal-zoning-outside-city.md): other municipalities' codes are not transcribed

## Sources
- [eCode360 Ch. 903 (§903.03)](https://ecode360.com/45474194) `[read]` *(accessed 2026-09-26)*: via real browser; curl/WebFetch got Cloudflare 403
- [eCode360 §911.02 use table](https://ecode360.com/45476524) `[read]` *(accessed 2026-09-26)*: via browser
- eCode360 print views for §906, §914, §915, §922 and §911.02 (IDs listed in the sweep) `[read]` *(accessed 2026-09-26, round 5)*: verbatim saves listed above
- [Legistar, Bill 2025-1579 matter text (RTF)](https://webapi.legistar.com/v1/pittsburgh/matters/31538/texts/33085) `[read]` *(accessed 2026-09-26, round 5)*: saved at [../../sources/pittsburgh-legistar-2026-09-26-zoning-bills-1545-0834-1579.md](../../sources/pittsburgh-legistar-2026-09-26-zoning-bills-1545-0834-1579.md)
- Transcription notes: [../../sources/ecode360-2026-09-26-pittsburgh-903-03-dimensional-standards.md](../../sources/ecode360-2026-09-26-pittsburgh-903-03-dimensional-standards.md), [../../sources/ecode360-2026-09-26-pittsburgh-911-02-use-table-residential.md](../../sources/ecode360-2026-09-26-pittsburgh-911-02-use-table-residential.md)
- [PC draft minimum lot size legislation, 2024-12-10 (PDF)](https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/planning-commission/draft-minimum-lot-size-legislation_pc-hearing-and-action_2024-12-10.pdf) `[read]` *(accessed 2026-09-26)*: old/new values, superseded by eCode360
- [Council bill draft 2024-0701 (PDF)](https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/planning-commission/council-bill-draft-legislation-2024-0701.pdf) `[read]` *(accessed 2026-09-26)*: July 2024 use table
- Municode library `library.municode.com/pa/pittsburgh` `[found]` *(accessed 2026-09-26)*: JS app
- `pittsburgh-pa.elaws.us` `[inaccessible]` *(accessed 2026-09-26)*: timed out
- [zoneomics code mirror](https://www.zoneomics.com/code/pittsburgh-PA) `[skimmed]` *(accessed 2026-09-26)*: full text read by a sweep, but a non-authoritative mirror of unknown currency
- [Pittsburgh Zoning Code page (organizer catalog URL)](https://pittsburghpa.gov/dcp/zoning-code) `[found]` *(accessed 2026-09-26)*
- Sweep: [../../sweeps/r5-ecode360-reread-ch906-914-915-922.md](../../sweeps/r5-ecode360-reread-ch906-914-915-922.md)
- Sweep: [../../sweeps/r5-council-records-and-methodologies.md](../../sweeps/r5-council-records-and-methodologies.md)
- Sweep: [../../sweeps/r1-zoning-data-code-and-reforms.md](../../sweeps/r1-zoning-data-code-and-reforms.md)
- Sweep: [../../sweeps/r2-approval-pathway-and-timelines.md](../../sweeps/r2-approval-pathway-and-timelines.md)
- [Adversarial critique](../../docs/04-critique.md) — rows 6, 8, 10
