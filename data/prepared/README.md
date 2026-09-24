# Prepared NCSS Pedon Dataset

This folder contains the analysis-ready National Cooperative Soil Survey (NCSS)
pedon dataset used as the spatial soil input for the U.S. LCMS land-use
transition analysis.

## File

`NCSS_prepared_national.csv`

## Records

53,728 NCSS pedon records.

## Purpose

The prepared dataset standardizes the NCSS information required for annual
intersection with the Landscape Change Monitoring System (LCMS) land-use data.

The dataset includes pedon identifiers, observation year, soil taxonomy,
geographic coordinates, and state/county identifiers.

## Observation year

`Yearlabel` represents the historical pedon observation year used in the
transition analysis.

`site_obsdate` was used as the primary source of the observation year.
`samp_classdate` was used as a fallback when an observation date was not
available.

`year_source` records which date field supplied the year.

## Spatial information

Pedon locations are represented by:

- `latitude`
- `longitude`

These coordinates were also used to construct point geometries in
Google Earth Engine.

## Soil taxonomy

The analysis-ready taxonomy fields are:

- `TAXORDER`
- `TAXSUBORDER`
- `GREATGROUP`
- `SUBGROUP`
- `PARTICLESIZE`

## Identifiers

`pedon_key` is retained as the NCSS record identifier.

`upedonid` is also retained for pedon identification but should not be assumed
to be unique across all records.

## Google Earth Engine asset used in the analysis

`projects/ee-malihamomtaj/assets/NCSS_prepared_national`

## Original data source

The original National Cooperative Soil Survey (NCSS) Soil Characterization
data used in this project were downloaded from the USDA Natural Resources
Conservation Service (NRCS), Kellogg Soil Survey Laboratory (KSSL) Lab Data Mart:

## Original data source

The original National Cooperative Soil Survey (NCSS) Soil Characterization
data used in this project were downloaded from the USDA Natural Resources
Conservation Service (NRCS), Kellogg Soil Survey Laboratory (KSSL) Lab Data Mart:

https://ncsslabdatamart.sc.egov.usda.gov/querypage.aspx

The Lab Data Mart provides access to the NCSS Soil Characterization Database,
including downloadable pedon and associated soil characterization data.


## Reproducibility note

This dataset was prepared from the original NCSS pedon data to simplify and standardize its use in Google Earth Engine for the national LCMS land-use transition analysis.
