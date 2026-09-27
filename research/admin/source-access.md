# Source access log

Some sources were blocked, and each one is recorded here with the specific blocker. **In this repo, a gap in the evidence is usually an access problem rather than proof that nothing exists.** Keep that distinction in the notes.

| Source | Blocker (2026-09-26) | Workaround used / available |
|---|---|---|
| eCode360 (Pittsburgh Zoning Code, Title Nine) | Cloudflare returns 403 to curl and WebFetch | **A real browser works.** We read §903.03 and §911.02 through Chrome and saved them to [`../sources/`](../sources/). Chapters 906, 914, 915 and 922 have so far only been read on the zoneomics.com mirror, so they are `[skimmed]` until re-read on eCode360. |
| Municode library (Pittsburgh) | JS single-page app; Pittsburgh is not in the Municode API's PA client list | Use eCode360 instead |
| elaws mirror (`pittsburgh-pa.elaws.us`) | Timeout | None needed |
| pittsburghpa.gov PDFs and pages | Akamai returns 403 to curl for some paths | WebFetch or a browser works. A ZBA decision scraper would need browser-like requests; this is untested. |
| WPRDC `datastore_search_sql` | Any query with a `WHERE` clause returns a CloudFront 403 | Use `datastore_search` with URL-encoded `filters`, or the bulk `/datastore/dump/<id>` CSV |
| Census Data API (ACS) | Keyless calls now redirect to `missing_key.html` | **Census Reporter's API is keyless** and serves current ACS tables by tract and block group: `https://api.censusreporter.org/1.0/data/show/latest?table_ids=B25064&geo_ids=<14000US… or 15000US…>` (ACS 2024 5-year, with MOE; verified 2026-09-27, [r9 comps sweep](../sweeps/r9-revenue-comps-sub-zip.md)). Or get a free key, or use the City's ArcGIS layers `Tracts2020_Pgh_CommunityNeed` / `ACS_DP04` (2020 vintage) |
| HUD USER API (income limits, FMR) | Returns "Unauthenticated" without a token | Use HUD's xlsx downloads, which may need a browser User-Agent (curl got an empty HTTP 202) |
| HUD CHAS zip | curl gets an empty body unless it sends a browser User-Agent and Referer | Send those headers |
| PASDA Allegheny MapServer mirror | "Application Error" | Use the County `gisdata.alleghenycounty.us` OPENDATA/Parcels service |
| County `OPENDATA/Buildings` | 404 | Use `EGIS/Buildings/MapServer/0` |
| Pittsburgh Land Bank website | Connection failed (curl code 000) | Use the City `ParcelsPublicCityVacant` layer's `inventory_type = PLB Transfer` |
| Devpost search | Blocks scripted requests | Use search-engine results only. **Coverage of hackathon projects is therefore weak.** |
| CNT H+T Index download | Needs free registration with reCAPTCHA | Register manually or skip it |
| Child Opportunity Index | 403 to curl | Use the Opportunity Atlas CSV instead (2010 tracts) |
| Rankin et al. 2024 (J. Industrial Ecology) | Paywall / 403 | Snippet only, so `[skimmed]` |
| LA Housing Element sites appendix PDF | 403 | Rely on secondary sources such as the Terner Center |
| Lenze et al. 2024 (ASCE J. Urban Planning & Development) | One sweep fetched the abstract; another could not find it | Abstract only, so `[skimmed]` |
| HUD LIHTC database | Accessible, but the latest real placed-in-service year is 2019 | Treat it as stale |
| OneStopPGH portal (interactive) | Not suited to bulk extraction | Use the `OSPI_H` FeatureServer instead (about 11 s per query) |
| Seattle Innovation Hub (PACT-athon post) | A re-fetch hit a Cloudflare challenge; earlier sweeps had read it | The earlier `[read]` stands on the r3 and r4 sweeps |
| Rankin et al. 2024 / Child Opportunity Index | 403 (paywall / bot block) | Recorded inline in the Track 3 nodes |
| Allegheny County HNA (organizer catalog URL `alleghenycounty.us/Services/Housing/Housing-Needs-Assessment`) | 404 (WebFetch) / 403 (curl). No such report was found by search. The County's EO 2026-1 orders its "first" HNA. | None. Treat the catalog entry as unverifiable. |
| Legistar (Pittsburgh City Council) | **Not blocked.** The web API answers without a key; an earlier "no Council records" claim was false | `https://webapi.legistar.com/v1/pittsburgh/matters` |
| USGS 3DEP ImageServer | About 1 in 4 `computeStatisticsHistograms` calls failed; a 4000×4000 export returned HTTP 500 | Retry; tile the city at about 1500² px |
