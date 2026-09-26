# Zoning code text (Pittsburgh Title Nine)

**Type:** data
**One line:** Where the Pittsburgh Zoning Code text lives, which copies can be fetched by machine, and what has been transcribed into tables so far.
**Why we care:** A score can only be source-grounded if every rule it applies cites a section. The code is hard to scrape and is being amended while we work, so we hand-transcribe the tables we need and date them.
**Last checked:** 2026-09-26

## Where the text is, and what blocks access

| Copy | Status from here | Tag |
|---|---|---|
| eCode360 (`https://ecode360.com/45474194` = Ch. 903) | **Cloudflare 403** to curl and WebFetch; loads in a real browser. The GIS `municode` field links here | `[read]` via browser for §903.03 and §911.02 |
| Municode library (`library.municode.com/pa/pittsburgh/...`) | JavaScript single-page app; not scraped | `[found]` |
| `pittsburgh-pa.elaws.us` (mirror) | timed out | `[inaccessible]` |
| pittsburghpa.gov PDFs (bill drafts, handouts) | 403 to curl (Akamai); WebFetch downloaded them, text via `pdftotext` | `[read]` |
| zoneomics.com/code/pittsburgh-PA (ch. 1–9) | curl-able, read in full by one sweep; **currency unverified**. Commercial mirror, so a lead only | `[skimmed]` |

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

Party-wall attached → interior side 0. ⚠ §903.03 on eCode360 has no lot-area-per-unit row (confirmed live by the critique, 2026-09-26); whether any such requirement survives elsewhere in Title Nine is unchecked, and the Legistar title of the 2025 bill mentions only minimum lot sizes *(corrected 2026-09-26 per docs/04-critique.md row 6)*.

⚠ An earlier reading of the Planning Commission PDF draft (2024-12-10) inferred old→new values from strikethrough/underline order and was ambiguous for VH; the live eCode360 text above supersedes it (corrections log).

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

**Caveat in the source note:** column alignment past RM needs re-verification (merged header cells); R1D–RM are reliable. Multi-unit is also P in several non-residential districts (the r1 sweep, from Bill 2024-0701's July 2024 attachment, lists NDO, LNC, NDI, UNC).

Note: the r1 sweep, reading Bill 2024-0701's table, had Assisted Living A as S in R1D and R1A too; the live eCode360 transcription shows blank there. We follow the eCode360 transcription, subject to the alignment caveat.

## Not yet transcribed
Ch. 906 overlays, Ch. 914 parking, §922 review procedures, Ch. 915, Ch. 916, §925. Several were read in the approval sweep from zoneomics or City handouts; see the policy nodes.

## Open questions
- Does a minimum lot width exist in §903.03? Not found in the tables read (unverified).
- Re-verify §911.02 columns past RM against the rendered table.
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
- Transcription notes: [../../sources/ecode360-2026-09-26-pittsburgh-903-03-dimensional-standards.md](../../sources/ecode360-2026-09-26-pittsburgh-903-03-dimensional-standards.md), [../../sources/ecode360-2026-09-26-pittsburgh-911-02-use-table-residential.md](../../sources/ecode360-2026-09-26-pittsburgh-911-02-use-table-residential.md)
- [PC draft minimum lot size legislation, 2024-12-10 (PDF)](https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/planning-commission/draft-minimum-lot-size-legislation_pc-hearing-and-action_2024-12-10.pdf) `[read]` *(accessed 2026-09-26)*: old/new values, superseded by eCode360
- [Council bill draft 2024-0701 (PDF)](https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/planning-commission/council-bill-draft-legislation-2024-0701.pdf) `[read]` *(accessed 2026-09-26)*: July 2024 use table
- Municode library `library.municode.com/pa/pittsburgh` `[found]` *(accessed 2026-09-26)*: JS app
- `pittsburgh-pa.elaws.us` `[inaccessible]` *(accessed 2026-09-26)*: timed out
- [zoneomics code mirror](https://www.zoneomics.com/code/pittsburgh-PA) `[skimmed]` *(accessed 2026-09-26)*: full text read by a sweep, but a non-authoritative mirror of unknown currency
- [Pittsburgh Zoning Code page (organizer catalog URL)](https://pittsburghpa.gov/dcp/zoning-code) `[found]` *(accessed 2026-09-26)*
- Sweep: [../../sweeps/r1-zoning-data-code-and-reforms.md](../../sweeps/r1-zoning-data-code-and-reforms.md)
- Sweep: [../../sweeps/r2-approval-pathway-and-timelines.md](../../sweeps/r2-approval-pathway-and-timelines.md)
- [Adversarial critique](../../docs/04-critique.md) — rows 6, 8, 10
