# Environmental overlays (Chapter 906) and Ch. 915 standards

**Type:** policy
**One line:** The steep-slope (SS-O), landslide-prone (LS-O), undermined (UM-O) and floodplain (FP-O) overlay districts in Chapter 906, plus the general slope and tree rules in §915.02.
**Why we care:** Pittsburgh's hills make these the most common site-level blockers after zoning. Some add months of Planning Commission review; floodway and shallow undermining are close to no-build.
**Last checked:** 2026-09-26

⚠ **Correction:** earlier notes put these rules in Chapter 915. They are the **Chapter 906 overlay districts**. Ch. 915 holds the general environmental performance standards. See the corrections log in [../README.md](../README.md).

⚠ **Tag caveat for this whole node:** eCode360, elaws and Municode all blocked or timed out for the approval-pathway sweep. The Chapter 906 and 915 text summarized here was read in full on the **zoneomics.com mirror**, not in eCode360. The sweep marked these rules verified, but under the domain rule a mirror is a lead, so every code rule below is **`[skimmed]`** until re-read in eCode360. How current the zoneomics copy is, is unknown.

⚠ **Partial upgrade** *(corrected 2026-09-26 per docs/04-critique.md row 11)*. The critique read §906.05 and §906.08 on eCode360 in a real browser on 2026-09-26. Two rules are now **`[read]`** (eCode360, accessed 2026-09-26):
- **SS-O Planning Commission review (§906.08.C.1, C.3):** "all uses and structures permitted in the base underlying district shall be reviewed and approved by the Planning Commission", with at least 21 days' notice of the hearing.
- **UM-O (§906.05.B.2–3):** a single-unit dwelling may be approved with more than 100 ft of overburden and no known subsidence history; under "Other Development Prohibited", nothing else is approved for zoning until a site investigation shows the site is reasonably safe.

The **50 ft ridgeline/base setback** and the **FP-O floodway rule** were not confirmed by the critique and stay **`[skimmed]`** (a saved eCode360 transcription of Ch. 906 now exists in `sources/` and appears to contain both; not yet cross-checked against this node).

## The overlays

| Overlay | Trigger | Who decides | What the text says (via mirror) | Added time |
|---|---|---|---|---|
| **SS-O Steep Slope §906.08** | Land with natural slope **≥25%** | **Planning Commission review for all development** ⚠ `[read]` eCode360 | 21-day notice ⚠ `[read]` eCode360; hearing within 60 days of a complete application; decision within 45 days. Standards include a **50 ft setback from the ridgeline or base** of the SS-O boundary `[skimmed]`. No outright ban. | +2–4 months (sweep estimate) |
| **LS-O Landslide-prone §906.04** | Parcel in mapped LS-O and the work involves excavation, fill or vegetation removal | Zoning Administrator (on a registered professional's field investigation); PLI Building Chief approves construction and land-operations plans | Evidence from a field investigation required | + geotech study, weeks (estimate) |
| **UM-O Undermined §906.05** | Parcel in UM-O, new construction or enlargement | Zoning Administrator plus Building Chief | **Single-unit dwelling allowed if >100 ft of overburden and no subsidence history.** Anything larger or heavier, or overburden <100 ft, is **prohibited until a site investigation shows it is safe** ("Other Development Prohibited"). ⚠ `[read]` eCode360 | + study |
| **FP-O Floodplain §906.02** | FEMA A/AE zone | Zoning plus a PLI Floodplain Permit | Lowest floor at or above the regulatory flood elevation. **Floodway: no new construction unless a hydraulic analysis shows no rise AND a DEP permit is issued.** The sweep reads this as effectively no-build. | + weeks |

Rows `[skimmed]` (zoneomics mirror) ([r2 approval sweep](../../sweeps/r2-approval-pathway-and-timelines.md)) except the cells marked ⚠ `[read]`, which were read on eCode360 on 2026-09-26 *(corrected 2026-09-26 per docs/04-critique.md row 11)*. ⚠ Bill 2026-0834 (Council hearing 10/13/26) would amend **Ch. 906**, so these rules may change *(corrected 2026-09-26 per docs/04-critique.md row 8)*.

- OneStopPGH holds **494 Floodplain Permit records** `[read]` (live query of the OSPI_H layer, [r2 approval sweep](../../sweeps/r2-approval-pathway-and-timelines.md)).
- Whether SS-O is actually **mapped** citywide, or is applied only from the 25%+ slope layer, is unverified.

## §915.02 environmental standards (all sites)

- Cut or fill slopes >25% need a geotechnical report and terracing.
- Retaining walls ≤10 ft.
- Tree survey if the site is >¼ acre (10,890 sf); replace trees ≥12" DBH.
- Decided by the Zoning Administrator.

`[skimmed]` (zoneomics mirror). A "40% no-disturbance / 30% max disturbance of 25–40% slopes" rule appeared in a search snippet but was **not** in the text the sweep read. Treat it as unverified.

## Related GIS layers (for mapping the triggers)

From live queries of the City FeatureServers `[read]` ([r1 zoning sweep](../../sweeps/r1-zoning-data-code-and-reforms.md)):

| Layer | Features | Key field |
|---|---|---|
| `PGHWebLandslideProne` | 37 | `landslideprone` = Yes |
| `PGHWebSlope25` | 1,714 | 25%+ slope |
| `PGHWebUndermined` | 47 | `undermined` |
| `PGHWebFEMA2014` | not counted | flood zones |

- Also on WPRDC: `landslide-prone-areas`, `25-or-greater-slope`, `undermined-areas`.
- The combined overlay layer `PGHWebZoningOverlays` also contains a Riparian Buffer entry in free text.
- Whether the GIS layers are the legal overlay boundaries or reference layers is not stated in the sources (inference risk; see Open questions).

## Why it matters in practice

- Landslides destroyed a home on Greenleaf St in 2018 and closed William St on Mount Washington; the William St fix is a roughly $10M FEMA-backed project `[skimmed]` ([PublicSource on landslides](https://www.publicsource.org/landslides-pittsburgh-mount-washington-federal-funds-mayor-gainey-traffic/), [WESA 2024-10-25](https://www.wesa.fm/development-transportation/2024-10-25/pittsburgh-landslides-flooding-insurance)).
- A builder blog puts hillside site work at $30K–80K extra `[skimmed]` ([r1 prior-art sweep](../../sweeps/r1-prior-art-proforma-and-practitioner-barriers.md)).
- The EZ Permit one-day track excludes floodplain parcels `[read]` ([approval pathway](approval-pathway.md)).

## Open questions

- Re-read §906.02 (floodway), §906.04, the §906.08 50 ft setback, and §915.02 in eCode360 (browser) to upgrade the remaining tags. §906.05 and the §906.08 PC-review rule are done.
- Is SS-O mapped as a distinct overlay, or triggered by measured slope on a site survey?
- Are `PGHWebLandslideProne` and `PGHWebUndermined` the legal LS-O / UM-O boundaries?
- Actual Planning Commission turnaround for SS-O cases: no measured data yet.
- Is FEMA 2014 the current effective flood map for the City?

## Connects to

- [Approval pathway](approval-pathway.md): these overlays as steps in the rules table
- [Dimensional standards and use table](dimensional-standards-and-use-table.md): the base envelope these add to
- [Environmental constraints data](../data/environmental-constraints.md): the layers and their gotchas
- [LiDAR slope](../data/lidar-slope.md): computing slope where the 25% layer is coarse
- [Track 3 carbon and climate](../track3/carbon-by-typology.md): climate risk overlap

## Sources

- [eCode360, Pittsburgh Code §906.05 UM-O](https://ecode360.com/45475244) `[read]` *(accessed 2026-09-26, read by the critique in a real browser)*: single-unit rule and "Other Development Prohibited"
- [eCode360, Pittsburgh Code §906.08 SS-O](https://ecode360.com/45475282) `[read]` *(accessed 2026-09-26, read by the critique in a real browser)*: Planning Commission review of all uses; 21-day notice
- [zoneomics.com Pittsburgh code mirror, Chapters 906 and 915](https://www.zoneomics.com/code/pittsburgh-PA) `[skimmed]` *(accessed 2026-09-26)*: full text read on a commercial mirror; currency unknown; not eCode360
- [City GIS FeatureServers (PGHWebLandslideProne, PGHWebSlope25, PGHWebUndermined, PGHWebFEMA2014)](https://services1.arcgis.com/YZCmUqbcsUpOKfj7/arcgis/rest/services/) `[read]` *(accessed 2026-09-26)*: feature counts from live queries
- [OneStopPGH OSPI_H FeatureServer](https://pghbridgis.pittsburghpa.gov/hosting/rest/services/Hosted/OSPI_H/FeatureServer/0) `[read]` *(accessed 2026-09-26)*: 494 floodplain permit records
- [PublicSource, landslides and Mount Washington](https://www.publicsource.org/landslides-pittsburgh-mount-washington-federal-funds-mayor-gainey-traffic/) `[skimmed]` *(accessed 2026-09-26)*
- [WESA, 2024-10-25, landslides and flooding insurance](https://www.wesa.fm/development-transportation/2024-10-25/pittsburgh-landslides-flooding-insurance) `[skimmed]` *(accessed 2026-09-26)*
- Sweep: [../../sweeps/r2-approval-pathway-and-timelines.md](../../sweeps/r2-approval-pathway-and-timelines.md)
- Sweep: [../../sweeps/r1-zoning-data-code-and-reforms.md](../../sweeps/r1-zoning-data-code-and-reforms.md)
- Sweep: [../../sweeps/r1-prior-art-proforma-and-practitioner-barriers.md](../../sweeps/r1-prior-art-proforma-and-practitioner-barriers.md)
