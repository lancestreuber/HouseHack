# AI Hackathon for Housing — Public Data Catalog: "Read Me" and "Brief Source Map" tabs

Source: https://docs.google.com/spreadsheets/d/19CKyt1kansUZ3VGOAOBihYYxNFuitx5VTkzOiEy4iXA (the organizer-provided spreadsheet, exported as xlsx on 2026-09-26). The "Data Catalog" tab is saved alongside this file as `organizers-2026-09-26-public-data-catalog.csv` (60 rows). Its contents are identical in dataset names to the copy found earlier in a participant's public repo.

## Read Me (verbatim)

| Topic | Text |
|---|---|
| Purpose | A curated starting point for Pittsburgh and Allegheny County hackathon teams. It prioritizes sources that can support parcel feasibility, permitting, housing-market observatories, typology matching, equity, and climate analysis. |
| Core vs. Useful | Core sources are likely to support a central prototype workflow. Useful sources add context, validation, or specialized features. |
| Public does not mean unrestricted | Review the terms, attribution requirements, API limits, and licenses before downloading, redistributing, or publishing derived data. |
| Private-company public data | Zillow, Redfin, and Realtor.com rows refer to their public aggregate research datasets—not listing-level feeds, property APIs, or permission to scrape their consumer websites. |
| Geographic joins | Prefer stable identifiers: parcel ID for local property records and Census GEOID/FIPS for statistical geography. Keep a crosswalk when vintages differ. |
| Quality rule | Record the download date, source vintage, field definitions, missingness, revisions, and any transformations. Never let an AI-generated answer outrank an authoritative rule or source record. |
| Privacy rule | Do not publish person-level tenant, applicant, mortgage, or household data. Aggregate, suppress small cells, and document consent for contributed data. |

## Brief Source Map (verbatim)

| Problem brief | Start with these core sources | High-value additions |
|---|---|---|
| Development Feasibility & Pro Forma Navigator | County assessments, sales and parcels; Pittsburgh zoning code/map; PLI permits; OneStopPGH; FEMA flood layer; steep slopes; undermined areas | PASDA/USGS elevation and imagery; BLS PPI; HUD income limits/FMR; Zillow, Redfin and Realtor.com aggregate markets |
| Policy-to-Permit Navigator | Pittsburgh zoning code; PLI permits; OneStopPGH; ZBA decisions; municipal codes | Violations; condemned properties; cross-jurisdiction county GIS; historical permits |
| Housing Production, Rents & Household Flow Observatory | PLI permits; ACS; Decennial Census; CHAS; county sales; Zillow ZORI/ZHVI; Redfin; Realtor.com | USPS vacancy; LIHTC/NHPD; HMDA; LODES; Redfin migration; 311 |
| Housing Typology, Equity & Climate Matchmaker | ACS; CHAS; parcels/land use/zoning; PRT GTFS; LAI; FEMA; slopes; ResStock | Opportunity Atlas; EPA EJScreen; NLCD; NOAA; schools; market-demand datasets |

**Note (our inference, unverified):** the map lists a fourth brief, "Policy-to-Permit Navigator", which is not among the three tracks on the event site. The Track 1 page's URL slug is `challenges/policy-to-permit.html`, but its title is "Development Feasibility & Pro Forma Navigator". This suggests the Policy-to-Permit brief was merged into Track 1, so ZBA decisions, municipal codes and violations may be in scope for Track 1. Confirm with the organizers.
