# U.S. NCSS-LCMS Urban Transition Analysis, 1985-2025

This repository contains a Google Earth Engine workflow for identifying annual
land-use transitions to Developed at historical USDA-NRCS National Cooperative
Soil Survey (NCSS) pedon locations across the United States.

The analysis links historical NCSS pedon observations with annual land-use data
from the U.S. Forest Service Landscape Change Monitoring System (LCMS).

## Objective

The purpose of this workflow is to identify historical NCSS pedon locations
that may be useful for repeat soil sampling and long-term monitoring of
soil change associated with urban development.

The analysis identifies annual transitions from:

- Agriculture to Developed
- Forest to Developed
- Rangeland or Pasture to Developed
- Other to Developed

Only NCSS pedons sampled before the detected land-use transition are retained
in the annual transition analysis.

## Study period

The LCMS analysis covers 1985-2025.

Annual transitions are evaluated beginning with:

1985 -> 1986

and ending with:

2024 -> 2025

Because the selected LCMS dataset for Alaska, Hawaii, and Puerto Rico/U.S.
Virgin Islands currently ends in 2024, the 2024 -> 2025 transition is evaluated
for CONUS only.

## Data sources

### NCSS Soil Characterization Data

Historical soil pedon data were obtained from the USDA Natural Resources
Conservation Service Kellogg Soil Survey Laboratory (KSSL) Lab Data Mart:

https://ncsslabdatamart.sc.egov.usda.gov/querypage.aspx

The original NCSS pedon data were prepared for use in Google Earth Engine.
The analysis-ready dataset contains 53,728 records and includes pedon
identifiers, observation year, soil taxonomy, geographic coordinates, and
state/county identifiers.

The prepared dataset is available in:

`data/prepared/NCSS_prepared_national.csv`

### Landscape Change Monitoring System

Annual land-use information was obtained from the U.S. Forest Service
Landscape Change Monitoring System (LCMS).

The analysis uses:

- CONUS: LCMS Product Version 2025-11
- Alaska: LCMS v2024-10
- Hawaii: LCMS v2024-10
- Puerto Rico/U.S. Virgin Islands: LCMS v2024-10

The LCMS Land_Use band was evaluated at 30-m spatial resolution.

## Annual transition analysis

For each pair of consecutive LCMS years, the workflow identifies NCSS pedon
locations whose LCMS pixel changed from a non-developed land use to Developed.

Each annual transition is analyzed independently.

Therefore, the same pedon may appear in more than one year if the LCMS
classification changes repeatedly through time.

The combined annual dataset contains:

- 2,499 annual transition events
- 1,746 unique NCSS pedon IDs

These values should not be interpreted as 2,499 unique pedons becoming
developed.

The combined result is available in:

`data/results/combined/US_NCSS_all_developed_changed_pedons_1985_to_2025.csv`

## 1985 baseline-developed pedons

A separate analysis was conducted for pedons already classified as Developed
in the first LCMS year, 1985.

This analysis identified:

- 2,922 NCSS records classified as Developed in 1985
- 764 of these records were sampled before 1985

Because the LCMS time series begins in 1985, the exact year of development
cannot be determined for these locations.

They are therefore treated separately from the annual transition-event dataset.

Files are available in:

`data/results/combined/US_NCSS_pedons_developed_in_1985.csv`

and

`data/results/combined/US_NCSS_1985_developed_sampled_before_1985.csv`

## Repository structure

```text
code/
└── gee/
    ├── annual_transition_analysis.js
    └── baseline_1985_developed.js

data/
├── prepared/
│   ├── README.md
│   └── NCSS_prepared_national.csv
│
└── results/
    └── combined/
        ├── README.md
        ├── US_NCSS_all_developed_changed_pedons_1985_to_2025.csv
        ├── US_NCSS_pedons_developed_in_1985.csv
        └── US_NCSS_1985_developed_sampled_before_1985.csv
