# Legal feasibility datasets

**Type:** data
**One line:** Our coded datasets on how legally hard it is to build each housing type in each City zoning district: the pathway the code requires, plus historical permits, ZBA decisions, Council actions and existing senior/care sites.
**Why we care:** This is the feasibility axis for Track 3. It answers questions like "senior housing is legally easier than apartments here", and it is what the map's "Legal feasibility" layers and the Site Feasibility pillar read.
**Last checked:** 2026-09-26

This is working research, not legal advice. Files, schemas and rebuild scripts: [`../../datasets/legal-feasibility/README.md`](../../datasets/legal-feasibility/README.md).

## What exists `[read]`

| Dataset | Size | Key finding (with n) |
|---|---|---|
| Typology × district pathway matrix | 57 `zon_new` × 16 uses = 912 cells | In R1D/R1A/R2, apartments are **not permitted**, while Housing for the Elderly (Limited) and Community Homes are a **ZBA special exception** and small personal care homes are an **Administrator Exception**. 43 cells are unresolved (`unknown`) |
| New residential permits 2019–2026 | 1,088 | Only 4 of 124 permits for 4+ units are in R1/R2/R3/H districts. 38 of 42 two-unit permits in R1D/R1A are conversions. Median days to issue is about 120–200 for every type with n ≥ 20 |
| ZBA decisions 2023–2026 | 476 (262 housing) | 85% of relief approved (n=470). Unit cases 82% (n=101). Use variances 22 of 30. Rates are biased upward because withdrawals are invisible. ⚠ Second bias: only projects that already pencil reach the ZBA (SME, 2026-09-27, [gap analysis](../build-plan/sme-feedback-gap-analysis.md)) |
| Council land-use actions 2000–2026 | 284 (183 geocoded) | Conditional uses: 22 of 22 adopted since 2015, 18 of them "Passed pursuant to Case Law". Site rezonings: 42 of 49 adopted since 2015, none defeated, median 123 days |
| Planning Commission motions 2020–2025 | 223 (56 housing) | 47 housing approvals, 0 denials. A lower bound; months are missing |
| Existing senior / care sites | 124 points (~101 sites) | 27 sit in R1D/R1A/R2, where apartments are not permitted |
| 800 ft care-facility spacing | 24 buffers | Assisted living and personal care must be 800 ft from similar facilities (§911.04.A.66, .95). Partial coverage |

## What it means (inference)

- The binding constraint is mostly the **use table**, not the boards: when a housing request reaches a hearing, it usually wins. Apartments in single-family districts are blocked because the code does not list them, which forces a use variance or a rezoning.
- **Senior and care housing has a legal path almost everywhere residential; apartments do not.**

## Open questions and conflicts

- ⚠ **Deemed decisions:** the City code says a missed deadline is a deemed **denial**, but PA MPC §908(9)/§913.2(b)(2) say deemed **approval**. Unresolved. → [approval pathway](../policy/approval-pathway.md), [MPC excerpt](../../sources/pa-dced-2003-01-mpc-908-913-2-deemed-approval.md)
- ADUs are not a listed use today. The 2018 Garfield overlay appears to have lapsed (unconfirmed). Bill 2025-1545 would allow up to 2 per residential lot.
- Grandview Public Realm group-use rows cite obsolete district names (RT-3/RTS-3), so they stay `unknown`.
- Everything uses **today's** zoning. Bills 2025-1545 and 2026-0834 would change cells.

## Connects to

- [Dimensional standards and use table](../policy/dimensional-standards-and-use-table.md): the §911.02 source of the matrix
- [Approval pathway](../policy/approval-pathway.md): what each pathway involves
- [ZBA decisions](zba-decisions.md): the earlier 90-decision 2026 sample
- [Permits and outcomes](permits-and-outcomes.md): the permit endpoints
- [Typology prototypes](../track3/typology-prototypes.md)

## Sources

- All files in [`../../datasets/legal-feasibility/`](../../datasets/legal-feasibility/), each with an `.md` listing exact endpoints and queries `[read]` *(accessed 2026-09-26)*
- [eCode360 §911.02](https://ecode360.com/45476524) and district chapters 908–910 `[read]` *(accessed 2026-09-26)*
- [Pittsburgh Legistar web API](https://webapi.legistar.com/v1/pittsburgh/matters) `[read]` *(accessed 2026-09-26)*
- [OneStopPGH OSPI_H](https://pghbridgis.pittsburghpa.gov/hosting/rest/services/Hosted/OSPI_H/FeatureServer/0) `[read]` *(accessed 2026-09-26)*
- ZBA decision PDFs on pittsburghpa.gov and the Wayback Machine `[read]` *(accessed 2026-09-26)*
- [PA MPC, DCED 17th ed. (2003)](https://www.dep.state.pa.us/hosting/growingsmarter/MPCode%5B1%5D.pdf) `[read]` *(accessed 2026-09-26)*
