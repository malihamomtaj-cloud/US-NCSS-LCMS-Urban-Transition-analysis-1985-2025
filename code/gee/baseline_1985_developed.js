// 1985 LCMS BASELINE-DEVELOPED NCSS PEDONS
// United States
//
// Purpose:
// Identify NCSS pedon locations already classified as Developed
// in the first LCMS year, 1985.
//
// These records are handled separately from annual transitions because their exact development year predates or is unresolved by the LCMS time series.
// Output: US_NCSS_pedons_developed_in_1985.csv

// NCSS dataset
var pedons = ee.FeatureCollection(
  'projects/ee-malihamomtaj/assets/NCSS_prepared_national'
);

// LCMS dataset

// CONUS
var lcms2025 = ee.ImageCollection(
  'projects/gtac-data-publish/assets/LCMS/Product_Version/2025-11'
);

// Alaska, Hawaii, PR/USVI
var lcms2024 = ee.ImageCollection( 'USFS/GTAC/LCMS/v2024-10');


// Helper function for pedon regions
function pointsInsideBox(
  collection,
  minLon,
  maxLon,
  minLat,
  maxLat
) {

  return collection
    .filter(ee.Filter.gte('longitude', minLon))
    .filter(ee.Filter.lt('longitude', maxLon))
    .filter(ee.Filter.gte('latitude', minLat))
    .filter(ee.Filter.lt('latitude', maxLat));
}

// Split pedons by LCMS coverage 
var conus = pointsInsideBox(pedons, -125, -66, 24, 50);

var alaskaMain = pointsInsideBox(pedons, -180, -129, 50, 73);
var alaskaAleutians = pointsInsideBox(pedons, 170, 180, 50, 73);
var hawaii = pointsInsideBox(pedons, -161, -154, 18, 23);
var prusvi = pointsInsideBox(pedons, -68.2, -64.4, 17.5, 18.8);


// Region geometries for LCMS 2024
var alaskaRegion = ee.Geometry.Rectangle([-180, 50, -129, 73], null, false);

var alaskaAleutiansRegion = ee.Geometry.Rectangle([170, 50, 180, 73], null, false);

var hawaiiRegion = ee.Geometry.Rectangle( [-161, 18, -154, 23], null, false);

var prusviRegion = ee.Geometry.Rectangle( [-68.2, 17.5, -64.4, 18.8], null, false);

// Get LCMS 1985 land use


// CONUS
var conus1985 = ee.Image(
  lcms2025
    .filter(ee.Filter.eq('study_area', 'CONUS'))
    .filter(ee.Filter.eq('year', 1985))
    .first()
).select('Land_Use');


// OCONUS helper
function get1985OCONUS(region) {

  return lcms2024
    .filterDate('1985-01-01', '1986-01-01')
    .filterBounds(region)
    .select('Land_Use')
    .mosaic()
    .clip(region);
}


var alaska1985 =
  get1985OCONUS(alaskaRegion);

var alaskaAleutians1985 =
  get1985OCONUS(alaskaAleutiansRegion);

var hawaii1985 =
  get1985OCONUS(hawaiiRegion);

var prusvi1985 =
  get1985OCONUS(prusviRegion);


// Find pedons classified as developed in 1985
function findBaselineDeveloped(
  image,
  pedonCollection,
  regionName,
  lcmsVersion
) {

  var sampled = image.sampleRegions({
    collection: pedonCollection,
    scale: 30,
    geometries: true,
    tileScale: 16
  });


  // LCMS Land_Use code 2 = Developed
  var developed = sampled
    .filter(ee.Filter.eq('Land_Use', 2))
    .map(function(feature) {

      var sampleYear =
        ee.Number(feature.get('Yearlabel'));

      var sampledBefore1985 =
        sampleYear.lt(1985);

      return feature.set({

        baseline_year: 1985,

        baseline_land_use:
          'Developed',

        baseline_developed:
          1,

        sampled_before_1985:
          sampledBefore1985,

        region_group:
          regionName,

        lcms_version:
          lcmsVersion
      });
    });

  return developed;
}


// For all regions
var baselineDeveloped =
  findBaselineDeveloped(
    conus1985,
    conus,
    'CONUS',
    'v2025-11'
  )
  .merge(
    findBaselineDeveloped(
      alaska1985,
      alaskaMain,
      'Alaska Main',
      'v2024-10'
    )
  )
  .merge(
    findBaselineDeveloped(
      alaskaAleutians1985,
      alaskaAleutians,
      'Alaska Aleutians',
      'v2024-10'
    )
  )
  .merge(
    findBaselineDeveloped(
      hawaii1985,
      hawaii,
      'Hawaii',
      'v2024-10'
    )
  )
  .merge(
    findBaselineDeveloped(
      prusvi1985,
      prusvi,
      'Puerto Rico and U.S. Virgin Islands',
      'v2024-10'
    )
  );


// Print results
print(
  'Pedons classified as Developed in 1985',
  baselineDeveloped.size()
);

print(
  '1985-developed pedons sampled before 1985',
  baselineDeveloped
    .filter(ee.Filter.eq(
      'sampled_before_1985',
      1
    ))
    .size()
);

print(
  'Baseline-developed pedons preview',
  baselineDeveloped.limit(20)
);


// Export all NCSS pedons already developed in 1985

var exportColumns = [
  'upedonid',
  'peiid',
  'pedon_key',
  'site_key',
  'usiteid',

  'Yearlabel',
  'year_source',

  'baseline_year',
  'baseline_land_use',
  'baseline_developed',
  'sampled_before_1985',

  'region_group',
  'lcms_version',

  'samp_classdate',
  'site_obsdate',

  'TAXORDER',
  'TAXSUBORDER',
  'GREATGROUP',
  'SUBGROUP',
  'PARTICLESIZE',

  'latitude',
  'longitude',

  'state_key',
  'county_key'
];


var cleanExport =
  baselineDeveloped
    .select(exportColumns)
    .map(function(feature) {
      return feature.setGeometry(null);
    });


Export.table.toDrive({

  collection: cleanExport,

  description:
    'US_NCSS_pedons_developed_in_1985',

  fileNamePrefix:
    'US_NCSS_pedons_developed_in_1985',

  fileFormat: 'CSV',

  selectors: exportColumns
});

// Export only developed pedons sampled before 1985
var pre1985Sampled = baselineDeveloped
  .filter(ee.Filter.eq('sampled_before_1985', 1))
  .select(exportColumns)
  .map(function(feature) {
    return feature.setGeometry(null);
  });

Export.table.toDrive({

  collection: pre1985Sampled,

  description:
    'US_NCSS_1985_developed_sampled_before_1985',

  fileNamePrefix:
    'US_NCSS_1985_developed_sampled_before_1985',

  fileFormat: 'CSV',

  selectors: exportColumns
});

