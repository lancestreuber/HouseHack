# Reinvestment Fund 2021 Allegheny County + City of Pittsburgh MVA: market types, indicators, DRR fields and definition

Accessed 2026-09-26. This file combines four primary sources, each noted inline:

- (a) WPRDC dataset `market-value-analysis-2021` (CKAN `package_show`), https://data.wprdc.org/dataset/market-value-analysis-2021
- (b) The MVA Executive Summary PDF and the MVA/DDR Data Dictionary XLSX from that dataset
- (c) The DRR shapefile `Pitts_Allegheny_DRR2021` (attributes inspected via the .dbf)
- (d) The Reinvestment Fund insight post (May 24, 2016) and the Pew Charitable Trusts report "Philadelphia's Changing Neighborhoods" (May 2016), endnote 9

The individual names on the steering committee have been omitted.

## (a) Dataset metadata (WPRDC)
- Title: "Housing Market Value Analysis 2021". Organization: Allegheny County. metadata_modified 2025-07-08.
- Notes (verbatim, abridged): "In 2021, Allegheny County Economic Development (ACED), in partnership with Urban Redevelopment Authority of Pittsburgh (URA), completed the a Market Value Analysis (MVA) for Allegheny County. This analysis services as both an update to previous MVA's commissioned separately by ACED and the URA and combines the MVA for the whole of Allegheny County (inclusive of the City of Pittsburgh). … uses Census block groups as the unit of analysis. … The data used covers the 2017-2019 period …"
- Resources:
  - MVA Executive Summary (PDF)
  - MVA Presentation (PDF, Dec 14, 2021, 56 pp)
  - MVA Geographic Files (ZIP)
  - **"DDR Geographic Data" ZIP** (`pitts_allegheny_drr2021.zip`; the resource name says "DDR" but the files are named DRR)
  - **"MVA/DDR Data Dictionary" XLSX**
  - ArcGIS webmap
  - Public info session recording
  - MVA GeoJSON

## (b) Executive Summary. Method
> "all market indicators were obtained directly from the County or other publicly available sources and geocoded to Census block groups." Indicators: residential sales 2017–2019 (price and variance; OPA via WPRDC); mortgage foreclosure filings 2017–2019 (Dept. of Court Records); parcel year built; parcel condition; vacant lot area; building violations (ACHD housing & community environment inspections); owner occupancy (ACS 2014–2018); subsidized housing units (HUD Picture of Subsidized Housing).

> "a statistical cluster analysis was conducted to identify areas (i.e., block groups) that share a common data profile. The cluster analysis segments block groups into clusters (in this case, a total of ten) … The cluster analysis results were also vetted by local experts."

> "13 (of 1,110) block groups were not assigned to a market type due to insufficient home sales data."

### Market types A–J (verbatim from the Executive Summary; the Data Dictionary has identical wording)
**Robust**
- "A" markets have the highest housing values, experience the largest level of new construction, have the highest owner occupancy levels, and experience little housing distress (such as residential vacancy and foreclosure).
- "B" markets have elevated housing values, experience substantial amounts of new construction, have more renters than owners, and experience little housing distress.
- "C" markets have above average housing values, experience about average levels of new construction, have the highest levels of owner occupancy, and experience little housing distress.

**Steady**
- "D" markets have average housing values, experience half the countywide average amount of new construction, have more renters than owners, experience average levels of foreclosure, and have low levels of vacant lots and poor or worse condition properties.
- "E" markets have slightly lower than average housing values, experience little new construction, have high levels of owner occupancy, have above average amounts of vacant land, and about average levels of foreclosure.
- "F" markets have slightly lower than average housing values, experience slightly above average amounts of new construction, have more owners than renters, and have high levels of renters with a subsidy.

**Transitional**
- "G" markets have below average housing values, experience little new construction, have more owners than renters, and experience above average levels of foreclosure and residential vacant land.
- "H" markets have housing values well below the countywide average, experience little new construction, have about even numbers of renters and owners, have the highest share of residential vacant land, and the highest levels of foreclosure.

**Stressed**
- "I" markets have the second lowest housing values, experience very little new construction, have the highest share of renters with a subsidy, experience the highest levels of building violations, and have elevated shares of poor or worse condition properties, vacant residential lot area, and foreclosure.
- "J" markets have the lowest housing values (although there is a substantial amount of variability in those prices), more renters than homeowners, the highest share of poor or worse condition properties, and elevated shares of building violations, vacant lots, and foreclosure.

Block groups (BGs) per type (Exec Summary Figure Two): A 76, B 113, C 185, D 100, E 196, F 24, G 190, H 122, I 30, J 42.

Median sale price by 2016 type, 2016→2021 (Figure Three). The Exec Summary gives two tables, "Allegheny County MVA on the left, City of Pittsburgh MVA on the right". City values:
- A $404k→$481k
- B $228k→$295k
- C $135k→$199k
- D $122k→$164k
- E $75k→$146k (+96%)
- F $65k→$79k
- G $37k→$53k
- H $20k→$35k
- I $10k→$26k

### MVA field names (Data Dictionary, "MVA" sheet)
| Field | Label |
|---|---|
| geoid | Block Group Identifier |
| MVA21 | Market Value Analysis 2021 Market Type |
| MSP1719 | Median Sales Price 2017-2019 |
| VSP1719 | Sales Price Variance 2017-2019 |
| PHHOO | Percent Owner Occupied Housing Units ACS 2015-2019 |
| PROSubHH | Percent of rental units that receive a subsidy |
| pforc1719 | Foreclosure filings (2017-2019) as a percent of owner occupancy |
| pcond_flag | Percent of parcels in poor or worse condition |
| PViolAddress | Percent of Residential Parcels with Housing Inspection Violations |
| PNRofRCnt | Percent of residential parcels built 2016- 2019 |
| PVacLot | Percent of residential area that is part of a vacant lot |

(Note: the dictionary's description text says ACS 2014-2018 in one place and 2015-2019 in another.)

### DRR field names (Data Dictionary, "DRR" sheet), verbatim labels
- `Geoid`: "Census Block Group Identifier with "a" or "b" as a suffix for split block groups"
- `CRSxxxx`: "The count of residential sales for each two-year period."
- `MSPxxxx`: "Block group median sales price for each two-year period."
- `DRRxxxx`: "Displacement Risk Ratio for each two-year period."
- `MSPxxxxC`, `DRRxxxxC`: category (for mapping purposes) for each two-year period
- `dCRS1419`, `PdCRS1419`: change / % change in the number of residential sales from 2014/2015 to 2018/2019
- `PdMSP1419` (+C): % change in median sales price 2014/2015 to 2018/2019
- `dDRR1419` (+C): "Change in the Displacement Risk Ratio from 2014/2015-2018/2019."
- DRR legend classes: "Below avg", 0.0–0.5, 0.5–1.0, 1.0–1.5, 1.5–2.0, 2.0–2.5, 2.5–3.0, "3.0 or Above". DRR-change classes run from −1.5 to −1 up to "1.5 or Above".

**The dictionary does not give the DRR formula.**

## (c) DRR shapefile inspection (our query, 2026-09-26)
- 1,100 records. Periods: 1415, 1516, 1617, 1718, 1819, 1920. That makes six overlapping two-year windows, the last being 2019–2020.
- Categories for DRR1819: "Below Countywide Ave" 618; 0.0–0.5 206; 0.5–1.0 80; 1.0–1.5 47; 1.5–2.0 26; 2.0–2.5 25; 2.5–3.0 19; "3.0 or Above" 32; "Insufficient Data" 47.
- Values range from about −1.8 to about +18. The median is about −0.1 to −0.2 in every period. About 59% of valid BGs in 1819 are below 0.
- Observation (inference): within a period, every DRR value shares the same trailing decimal digits (e.g. …182 / …818 in DRR1819). That is consistent with a single constant (a countywide value) being subtracted from each BG's ratio.

## (d) Published DRR definition (Reinvestment Fund / Pew)
Reinvestment Fund insight, "Measuring displacement risk in gentrifying neighborhoods" (May 24, 2016), verbatim:
> "The DRR compares changing residential sales prices over time with the inflation-adjusted median income of residents at a fixed starting point. The ratio is a test of whether the typical household living there at the outset could afford to buy a home there at a later time. A score over 3.0 is considered unaffordable, and a negative value, which can result from the index's adjustment for citywide price trends, indicates deep affordability."

Pew, "Philadelphia's Changing Neighborhoods" (May 2016), endnote 9, verbatim:
> "To calculate the index, Reinvestment Fund tracks changing residential sales prices in an area over time in relation to the inflation-adjusted median income of area residents at the starting point, the year 2000 in this case. The citywide values are then subtracted to remove the influence of broader trends, resulting in index values for some tracts that were less than zero. In real estate economics, there is a rule of thumb that buyers can afford homes priced at 2.5 to three times their annual incomes."

Pew, figure note:
> "The affordability index compares the median residential sales price in a census tract over time to the median household income (inflation-adjusted) in that tract in the year 2000."

**Not found in any primary source for the 2021 Allegheny run:**
- the base year and income source (ACS vintage)
- the exact inflation index
- whether the countywide term is a ratio of medians or a median of ratios
- the minimum sales count threshold
