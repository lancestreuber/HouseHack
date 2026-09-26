# Legal feasibility datasets (City of Pittsburgh)

**One line:** How legally hard it is to build each housing type in each zoning district. It has two sides: what the code says (the pathway), and what has actually happened (permits and board decisions).
**Scope:** City of Pittsburgh only. Mount Oliver Borough (`MTOBOR`) is an enclave in the City zoning layer and is not City jurisdiction.
**As of:** 2026-09-26. This is working research, not legal advice.

These are raw, coded facts. There are no composite scores and no weights; scoring belongs to the pillar work.

## Files

| File | What it is | Join key |
|---|---|---|
| `typology-district-matrix.csv` | Long table: one row per live `zon_new` × one of 16 residential uses in §911.02, with the P/A/S/C code, the `pathway` enum and `pathway_rank` | `zon_new` (exact string in `PGHWebZoning` and `pittsburgh-zoning.geojson`) |
| `typology-district-matrix-wide.csv` / `.json` | The same data, one row per district with one column per typology | `zon_new` |
| `pathways.csv` | What each pathway means: who decides, hearings, statutory clock, deemed-denial rule, fee, code section | `pathway` |
| `scripts/build_typology_matrix.py` | Rebuilds the matrix from the saved §911.02 transcription and a live distinct-`zon_new` query | – |


## Pathway enum (ordered)

`by_right` (0) < `za` (1, Administrator Exception) < `zbe_special_exception` (2, ZBA) < `conditional_use` (3, Planning Commission + Council) < `not_permitted` (4, only via a use variance or a rezoning). Districts not in §911.02 are filled from their own chapters (see `special-districts.md`).

## Typology ids

`typology` is our own id. `mat_typology_id` maps it to the app's ids (`sfd`, `townhome`, `duplex`, `apartments`, `senior`). `none` means the app has no matching id: triplex, assisted living A/B/C, personal care, community home, multi-suite (SRO) and interim housing.

⚠ Housing for the Elderly **Limited** and **General** both map to `senior`, but their permissions differ. Limited is S in every residential district; General is S only in R3 and RM. Use the stricter one, or pick one explicitly.

## Headline patterns (from the code, not from outcomes)

- In **R1D, R1A and R2**, apartments (4+ units) are **not permitted**, while Housing for the Elderly (Limited) and Community Homes are a **ZBA special exception**, and Personal Care Residence (Small) is **Administrator Exception** everywhere residential. Senior and group living has a legal path in single-family areas; apartments don't.
- **RM** is the only residential district where apartments are by right. Assisted Living Class C and Multi-Suite (Limited) are conditional uses there, the slowest pathway.
- **Hillside (H):** single-unit detached is an Administrator Exception and every multi-unit type is prohibited.
- In mixed-use districts (**UC-MU, UNC, R-MU, LNC, NDI, NDO, RIV-MU/RM/IMU, GT**), apartments are by right, and so are several senior and assisted-living uses.

## Caveats

- The matrix uses the district as mapped **today**. `P/S` (Single-Unit Attached in R1D) is coded as the more demanding `zbe_special_exception`; see §911.04A.69A.
- Column order for §911.02 was verified against a screenshot of the rendered table in round 5. See `../../knowledge/policy/dimensional-standards-and-use-table.md`.
- Pending **Bill 2025-1545** (ADUs by right, no parking minimums) and **Bill 2026-0834** (amends Ch. 922 procedures and more) would change cells. See `../../knowledge/policy/reforms-in-flux-2025-2026.md`.
- The use table is not the only gate. Dimensional standards (§903.03), overlays (Ch. 906), Site Plan Review at ≥4 units, and historic review all add steps. See `../../knowledge/policy/approval-pathway.md`.

## Other datasets in this folder

| Files | What | Map handoff |
|---|---|---|
| `special-district-residential-permissions.csv`, `special-districts.md`, `use-definitions.csv` | Residential permissions for the SP, AP/CP/RP, GPR, UPR and GT districts (merged into the matrix), the definition and threshold of each use, and ADU status | L1 v2 |
| `senior-and-group-housing.*` | 124 existing senior, assisted-living, personal-care, nursing and HUD/LIHTC/HACP senior sites (~101 distinct) with district pathways | L2 |
| `permits-new-residential.*`, `permits-by-typology-district.csv` | 1,088 new-residential permits, 2019–2026, by typology × district/neighborhood, with days to issue | L3 |
| `council-land-use-actions.*`, `planning-commission-actions-parsed.csv` | 284 Council rezonings, conditional uses and SP/PUD actions (Legistar, 2000–2026; 183 geocoded) and 223 Planning Commission motions (2020–2025) | L4 |
| `zba-decisions.*` | ZBA decisions over multiple years with outcomes by district × typology × relief type (in progress) | L5 |

Each dataset's `.md` has its method, exact queries, live counts, field dictionary and caveats.

Keys and gotchas:
- `zone_case` in `zba-decisions.csv` is **not unique**: six case numbers repeat across distinct decisions because of printing and OCR slips. Use `decision_pdf` as the key.
- Council and Planning Commission titles have individual owner names redacted (`scripts/redact_owner_names.py`).
- **Deemed decisions:** the City code says a missed deadline is a deemed denial, but PA MPC §908(9)/§913.2(b)(2) say deemed approval. This is unresolved; see `pathways.csv` and `../../sources/pa-dced-2003-01-mpc-908-913-2-deemed-approval.md`.

Matrix states beyond the ranked enum: `per_plan` (AP/CP/RP: uses are set by the site's approved plan), `not_city_jurisdiction` (MTOBOR), `unknown` (code unresolved).
