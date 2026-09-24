# Combined NCSS-LCMS Results

This folder contains the combined results from the national NCSS-LCMS
land-use transition analysis.

## Annual transition events

`US_NCSS_all_developed_changed_pedons_1985_to_2025.csv`

This dataset combines annual transitions from non-developed land uses
to Developed at NCSS pedon locations.

The transition classes are:

- Agriculture to Developed
- Forest to Developed
- Rangeland or Pasture to Developed
- Other to Developed

The combined dataset contains 2,499 annual transition events associated
with 1,746 unique NCSS pedon IDs.

A pedon may occur in more than one year because each pair of consecutive
LCMS years was evaluated independently. Therefore, the 2,499 records represent transition events rather than
2,499 unique pedons.

## 1985 baseline-developed pedons

`US_NCSS_pedons_developed_in_1985.csv`

A separate baseline analysis identified 2,922 NCSS records whose LCMS
pixel was classified as Developed in 1985.

Of these, 764 records were sampled before 1985.

Because the LCMS time series begins in 1985, the exact year of
development cannot be determined for these locations. These records are
therefore kept separate from the annual transition-event dataset.
