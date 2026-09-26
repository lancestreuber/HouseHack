# Typology prototypes

**Type:** track3
**One line:** How to turn "duplex", "townhomes", "ADU" and the rest into comparable objects with parameters, and which of those parameters are observed data, legal gates, or our assumptions.
**Why we care:** The brief asks for a tool that compares "duplexes, townhomes, apartments, accessory units, and detached homes". Every number downstream (carbon, affordability, units) hangs off how each typology is defined.
**Last checked:** 2026-09-26

## The prototype-building method

**Envision Tomorrow** `[skimmed]` (checked via search only; the site pages returned empty, so its license is unconfirmed): a spreadsheet "Prototype Builder", a return-on-investment model, defines each building type by physical form (lot, footprint, stories, units, parking) and finances (cost per sq ft, rents or prices, land cost), then asks whether that type "pencils out" under current zoning and the market. All formulas sit in a visible spreadsheet linked to ArcGIS; prototypes combine into development types that are painted as scenarios ([data sweep](../../sweeps/r4-track3-data-methods-and-combination.md), [prior-art sweep](../../sweeps/r4-track3-prior-art-and-hackathons.md)).

Other tools reported to follow the same pattern (a library of building types, painted onto places, then indicators computed):

| Tool | What the sweeps found | Tag |
|---|---|---|
| UrbanFootprint v1.5 | "Place Types" / building types painted onto land. GPL-3.0; last push 2018; current product is commercial | `[read]` (repo) |
| Terner Housing Policy Simulator | Scores up to 60 hypothetical projects per parcel, estimates development probability, levers for parking, zoning, fees, economic scenario. **Typologies are low-, mid- and high-rise only**, no small missing-middle types, no equity/carbon/value weights | `[read]` (methodology page) |
| ABAG Middle Housing Feasibility Tool (ECONorthwest, Opticos) | Price estimates, viable lot sizes, max land cost per missing-middle type. Password-protected, Bay Area only | `[read]` (page) |
| Opticos Missing Middle kit | Prototypes plus a "test fit" process; proprietary | `[skimmed]` |
| CommunityViz Scenario 360 | Re-weight factors, results update live; proprietary | `[skimmed]` |
| ArcGIS Urban suitability | Each criterion rescaled 0–10, weighted sum, scenario switcher | `[skimmed]` |
| MisterClean/building-viz | Browser 3D envelope for missing-middle types, Compare mode, shareable scenario URLs; no license | `[read]` (repo) |
| CrepuscularCremini/MissingMiddleHousingAnalysis | Parcel geometry checks (ADU add, new build fit, conversion); README says it ignores regulations; MIT | `[read]` (repo) |
| CommunityViz, Opticos, Terner, UrbanFootprint "same pattern" claim | The data sweep states this "from memory, not checked this session" | `[found]` |

## Per-typology parameters

The data sweep's weekend method lists what each prototype needs. The label column is our classification of each parameter, following the brief's split of "observed evidence" vs. "policy choices, assumptions, and value judgments".

| Parameter | Label | Where it comes from |
|---|---|---|
| Permitted in this district (P / A / S / C / blank) | **Data (legal gate)** | §911.02 use table, below |
| Minimum lot size | **Data (legal gate)** | §903.03; see [dimensional standards](../policy/dimensional-standards-and-use-table.md) |
| Lot width needed | **Assumption** unless tied to a code dimension | Prototype design |
| Units per building | **Assumption** (design choice within the gate) | Prototype design |
| Gross floor area per unit | **Assumption** | Prototype design |
| Parking | **Data** where the code sets it; subject to reform | [Parking](../policy/parking.md) |
| Construction cost per sq ft | **Assumption** — the sweep says to label it so | [Pro forma](../methods/pro-forma.md) |
| Rent or sale price | **Assumption** anchored on market data | [Market and affordability](../data/market-and-affordability.md) |
| Operational energy per unit | **Data** (national survey, RECS 2020) applied by type | [Carbon](carbon-by-typology.md) |
| Embodied carbon per m² | **Data from elsewhere** (Dublin study) — transfer to Pittsburgh is an assumption | [Carbon](carbon-by-typology.md) |
| Driving-emissions effect | **Range, regional** (TRB SR 298), not per parcel | [Carbon](carbon-by-typology.md) |
| Normalization (per m², per unit, per resident) | **Value judgment** | [Carbon](carbon-by-typology.md) |
| Weights across criteria | **Value judgment** | [Score design](../methods/score-design-options.md) |

## Use-table gates (Track 1 → Track 3)

Read from eCode360 §911.02 via browser on 2026-09-26 `[read]`. Key: **P** permitted by right, **A** Administrator Exception, **S** Special Exception, **C** Conditional Use, blank not permitted. **Only the R1D–RM columns are reliable**; column alignment past RM has merged header cells and needs re-verification against the rendered table.

| Use | R1D | R1A | R2 | R3 | RM | Standard |
|---|---|---|---|---|---|---|
| Single-Unit Detached Residential | P | P | P | P | P | §911.04A.69 |
| Single-Unit Attached Residential | P/S | P | P | P | P | §911.04A.69; §911.04A.69A |
| Two-Unit Residential | — | — | P | P | P | — |
| Three-Unit Residential | — | — | — | P | P | — |
| Multi-Unit Residential | — | — | — | — | P | §911.04A.85 |
| Housing for the Elderly (Limited) | S | S | S | S | S | §911.04A.35 |
| Housing for the Elderly (General) | — | — | — | S | S | §911.04A.35 |
| Personal Care Residence (Small) | A | A | A | A | A | §911.04A.95B |

What this means for the brief's typology list (our mapping of typology names to use-table rows, an inference):

- **Detached homes** → Single-Unit Detached: by right in all five residential districts.
- **Townhomes** → Single-Unit Attached: by right in R1A–RM; P/S in R1D.
- **Duplexes** → Two-Unit: R2, R3, RM only.
- **Triplexes** → Three-Unit: R3, RM only.
- **Apartments** → Multi-Unit: RM only among residential districts (and several mixed-use/other districts per the unreliable columns).
- **Senior housing** → Housing for the Elderly: Special Exception, never by right in R1D–RM.
- **Accessory units (ADUs)** → **not in the use-table extract we hold.** ⚠ The City's EngagePGH page (late 2024) proposed ADUs by right, up to 2 per lot, 1,000 sq ft max, no owner-occupancy requirement `[read]`; **those terms are stale** *(corrected 2026-09-26 per docs/04-critique.md row 26)*. Current ADU terms are in the **June 2, 2026 PC redline of Bill 2025-1545 on Legistar**: text extraction shows 1,000 sf, permitted on lots whose primary use is Residential, Community Center or Religious Assembly, 30 ft, exempt from Ch. 916; whether the per-lot count and owner-occupancy lines are struck needs a visual read. Council Bill 2025-1545 would make ADUs by right citywide; the Planning Commission recommended it June 2, 2026 ([data sweep](../../sweeps/r4-track3-data-methods-and-combination.md)). ⚠ Legistar (checked 2026-09-26): Bill 2025-1545 is **Held In Council**; public hearings 9/10/25 and 9/23/26; committee substitute and PC referral 10/15/25; PC report received 6/12/26; **no final vote** *(corrected 2026-09-26 per docs/04-critique.md row 9)*. Treat ADU legality as **proposed, not law**, until checked. See [reforms in flux](../policy/reforms-in-flux-2025-2026.md).

A/S/C are not "no". They are the approval pathway, which is a Track 1 output ([approval pathway](../policy/approval-pathway.md)). A tool can show them as a separate tier rather than filtering them out.

## Cut line

If Track 3 is behind at hour 16, the build sweep suggests shipping 3 typologies (ADU, duplex, small apartment) and 3 weights (feasibility, transit, displacement) ([build sweep](../../sweeps/r4-build-feasibility-on-team-stack.md)). Note ADU is the typology with the least settled legality above.

## Open questions

- Where ADUs sit in the current code (use-table row, accessory-use section) and whether Bill 2025-1545 passed.
- Column alignment of §911.02 beyond RM (mixed-use districts matter for apartments).
- Pittsburgh-specific construction cost per sq ft by type. Not sourced.
- Whether Envision Tomorrow's spreadsheet can actually be downloaded and reused (site pages returned empty).
- Which RECS category an ADU maps to. RECS has no ADU category.

## Connects to

- [Dimensional standards and use table](../policy/dimensional-standards-and-use-table.md): lot sizes, setbacks, height; no FAR in residential districts
- [Approval pathway](../policy/approval-pathway.md): what A / S / C mean in practice
- [Reforms in flux](../policy/reforms-in-flux-2025-2026.md): Bill 2025-1545, ADUs, parking
- [Parking](../policy/parking.md): parking parameter
- [Pro forma](../methods/pro-forma.md): cost and rent assumptions
- [Carbon by typology](carbon-by-typology.md): energy and embodied parameters
- [Combining with Track 1](combining-with-track1.md): gates-then-score structure
- [Commercial tools](../landscape/commercial-tools.md): UrbanFootprint, CommunityViz, ArcGIS Urban
- [Hackathon precedents](../landscape/hackathon-precedents.md)

## Sources

- [Pittsburgh Code §911.02 Use Table (eCode360)](https://ecode360.com/45476524) `[read]` *(accessed 2026-09-26)*: fetched via browser; R1D–RM columns reliable, later columns need re-verification
- [Envision Tomorrow building prototypes](http://envisiontomorrow.org/building-prototypes) `[skimmed]` *(accessed 2026-09-26)*: checked via search; pages returned empty
- [Terner Housing Policy Simulator methodology](https://www.ternerlabs.org/terner-housing-policy-simulator-full-methodology) `[read]` *(accessed 2026-09-26)*: low/mid/high-rise typologies only
- [UrbanFootprint repo](https://github.com/CalthorpeAnalytics/urbanfootprint) `[read]` *(accessed 2026-09-26)*: GPL-3.0, last push 2018
- [ABAG middle housing tools](https://abag.ca.gov/our-work/housing/regional-housing-technical-assistance/peer-cohorts-work-groups/middle-housing) `[read]` *(accessed 2026-09-26)*: tool is password-protected
- [Opticos Missing Middle collection](https://opticosdesign.com/the-missing-middle-housing-collection/) `[skimmed]` *(accessed 2026-09-26)*: search summary
- [CommunityViz Scenario 360 help](https://communityviz.city-explained.com/communityviz/s360webhelp4-3/getting_started/about_scenario_360_decision_tools.htm) `[skimmed]` *(accessed 2026-09-26)*: search summary
- [ArcGIS Urban suitability docs](https://doc.arcgis.com/en/urban/latest/help/help-suitability.htm) `[skimmed]` *(accessed 2026-09-26)*: search summary
- [MisterClean/building-viz](https://github.com/MisterClean/building-viz) `[read]` *(accessed 2026-09-26)*: compare-mode UI precedent
- [CrepuscularCremini/MissingMiddleHousingAnalysis](https://github.com/CrepuscularCremini/MissingMiddleHousingAnalysis) `[read]` *(accessed 2026-09-26)*: MIT geometry checks
- [EngagePGH: Accessory Dwelling Units](https://engage.pittsburghpa.gov/implementing-housing-needs-assessment/accessory-dwelling-units-adus) `[read]` *(accessed 2026-09-26)*: late-2024 ADU proposal (⚠ stale)
- [Pittsburgh Legistar](https://pittsburgh.legistar.com/) `[read]` *(accessed 2026-09-26, via the critique's live check)*: Bill 2025-1545 status; June 2, 2026 PC redline `[skimmed]` (text extraction only)
- [City Council public hearing, Sept 23, 2026](https://www.pittsburghpa.gov/Business-Development/City-Planning/City-Planning-Meetings/Council-Public-Hearings/City-Council-Public-Hearing-September-23-2026) `[read]` *(accessed 2026-09-26)*: Bill 2025-1545 hearing
- Sweep: [../../sweeps/r4-track3-data-methods-and-combination.md](../../sweeps/r4-track3-data-methods-and-combination.md) `[read]` *(accessed 2026-09-26)*: weekend method, per-type parameters
- Sweep: [../../sweeps/r4-track3-prior-art-and-hackathons.md](../../sweeps/r4-track3-prior-art-and-hackathons.md) `[read]` *(accessed 2026-09-26)*: prior-art table
- Sweep: [../../sweeps/r4-build-feasibility-on-team-stack.md](../../sweeps/r4-build-feasibility-on-team-stack.md) `[read]` *(accessed 2026-09-26)*: H16 cut line
- [Adversarial critique](../../docs/04-critique.md) — rows 9, 26
