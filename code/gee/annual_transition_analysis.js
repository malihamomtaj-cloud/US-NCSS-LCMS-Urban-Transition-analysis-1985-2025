// ANNUAL NCSS PEDON - LCMS URBAN TRANSITION ANALYSIS
// United States, 1985-2025
// This script identifies annual land-use transitions to Developed at historical NCSS pedon locations.
// Examples:
//   transitionYear = 1986 analyzes 1985 -> 1986
//   transitionYear = 2005 analyzes 2004 -> 2005
//   transitionYear = 2025 analyzes 2024 -> 2025
// Coverage:
//   1986-2024: CONUS + Alaska + Hawaii + Puerto Rico/USVI
//   2025:      CONUS only
//
// Input NCSS asset:
//   projects/ee-malihamomtaj/assets/NCSS_prepared_national
// LCMS:
//   CONUS:  Product Version 2025-11
//   AK/HI/PRUSVI: v2024-10
//
// Important:
// This is an annual transition-event analysis. A location may
// appear in more than one year if LCMS classification changes
// repeatedly through time.
// This script creates:
// 1. LCMS transition map layer
// 2. All NCSS pedon point layer
// 3. Changed NCSS pedon point layer
// 4. CSV export with state_name and county_name columns

// Change only these two values to get pedons transition to developed record for the respective year.

var transitionYear = 2021;
var exportFileName = 'US_NCSS_changed_pedons_2020_to_2021';

// AUTOMATIC YEAR SETTINGS
var previousYear = transitionYear - 1;
var transitionPeriod = previousYear + '-' + transitionYear;
var transitionPeriodWords = previousYear + ' to ' + transitionYear;

var referenceYear = 2025;

// LCMS v2024-10 ends in 2024 for AK, HI, and PRUSVI.
// Therefore, the 2025 transition run uses CONUS only.
var includeOCONUS = transitionYear <= 2024;

var analysisScale = 30;
var tileScale = 16;

// NCSS PEDON POINTS
var pedons = ee.FeatureCollection(
  'projects/ee-malihamomtaj/assets/NCSS_prepared_national'
);

print('First NCSS pedon');
print(pedons.first());

print('Total NCSS pedons');
print(pedons.size());

// STATE AND COUNTY BOUNDARIES

var states = ee.FeatureCollection('TIGER/2018/States');
var counties = ee.FeatureCollection('TIGER/2018/Counties');

// LCMS DATASETS
// LCMS 2025-11 for CONUS only.
var lcms2025 = ee.ImageCollection(
  'projects/gtac-data-publish/assets/LCMS/Product_Version/2025-11'
);

// LCMS 2024-10 for Alaska, Hawaii, and PRUSVI.
var lcms2024 = ee.ImageCollection(
  'USFS/GTAC/LCMS/v2024-10'
);

print('LCMS 2025 study areas');
print(lcms2025.aggregate_histogram('study_area'));

print('LCMS 2025 years');
print(lcms2025.aggregate_histogram('year'));

print('LCMS 2024 collection');
print(lcms2024);

// TRANSITION NAMES AND COLORS

// LCMS Land_Use class codes:
// 1 = Agriculture
// 2 = Developed
// 3 = Forest
// 4 = Other
// 5 = Rangeland or Pasture
// 6 = Non-Processing Area Mask

// Transition codes:
// 1 = Agriculture to Developed
// 2 = Forest to Developed
// 3 = Rangeland or Pasture to Developed
// 4 = Other to Developed

var transitionLabels = ee.Dictionary({
  '1': 'Agriculture to Developed',
  '2': 'Forest to Developed',
  '3': 'Rangeland or Pasture to Developed',
  '4': 'Other to Developed'
});

var transitionPalette = [
  '#ff4c4c', // Agriculture to Developed
  '#6aa84f', // Forest to Developed
  '#674ea7', // Rangeland/Pasture to Developed
  '#741b47'  // Other to Developed
];

//  SPLIT NATIONAL PEDONS INTO SMALLER REGIONS

function pointsInsideBox(
  collection,
  minimumLongitude,
  maximumLongitude,
  minimumLatitude,
  maximumLatitude
) {
  return collection
    .filter(ee.Filter.gte('longitude', minimumLongitude))
    .filter(ee.Filter.lt('longitude', maximumLongitude))
    .filter(ee.Filter.gte('latitude', minimumLatitude))
    .filter(ee.Filter.lt('latitude', maximumLatitude));
}


// CONUS groups.
var conusWest1 = pointsInsideBox(pedons, -125, -115, 24, 50);
var conusWest2 = pointsInsideBox(pedons, -115, -105, 24, 50);
var conusCentral1 = pointsInsideBox(pedons, -105, -95, 24, 50);
var conusCentral2 = pointsInsideBox(pedons, -95, -85, 24, 50);
var conusEast1 = pointsInsideBox(pedons, -85, -75, 24, 50);
var conusEast2 = pointsInsideBox(pedons, -75, -66, 24, 50);

// Alaska.
var alaskaMain = pointsInsideBox(pedons, -180, -129, 50, 73);
var alaskaAleutians = pointsInsideBox(pedons, 170, 180.1, 50, 73);

// Hawaii.
var hawaiiPedons = pointsInsideBox(pedons, -161, -154, 18, 23);

// Puerto Rico and U.S. Virgin Islands.
var prusviPedons = pointsInsideBox(pedons, -68.2, -64.4, 17.5, 18.8);

// REGION GEOMETRIES FOR LCMS 2024
var alaskaRegion = ee.Geometry.Rectangle(
  [-180, 50, -129, 73],
  null,
  false
);

var alaskaAleutiansRegion = ee.Geometry.Rectangle(
  [170, 50, 180.1, 73],
  null,
  false
);

var hawaiiRegion = ee.Geometry.Rectangle(
  [-161, 18, -154, 23],
  null,
  false
);

var prusviRegion = ee.Geometry.Rectangle(
  [-68.2, 17.5, -64.4, 18.8],
  null,
  false
);

// FUNCTION TO GET LCMS 2025 LAND USE FOR CONUS

function getLCMS2025LandUse(studyArea, year) {

  var image = ee.Image(
    lcms2025
      .filter(ee.Filter.eq('study_area', studyArea))
      .filter(ee.Filter.eq('year', year))
      .first()
  );

  return image.select('Land_Use').toByte();
}

// FUNCTION TO GET LCMS 2024 LAND USE BY REGION

function getLCMS2024LandUse(region, year) {

  var startDate = ee.Date.fromYMD(year, 1, 1);
  var endDate = startDate.advance(1, 'year');

  var image = lcms2024
    .filterDate(startDate, endDate)
    .filterBounds(region)
    .select('Land_Use')
    .mosaic()
    .clip(region)
    .toByte();

  return image;
}


// CHECK THAT LCMS IMAGES EXIST

/*print('CONUS previous year image, LCMS 2025');
print(
  lcms2025
    .filter(ee.Filter.eq('study_area', 'CONUS'))
    .filter(ee.Filter.eq('year', previousYear))
    .first()
);

print('CONUS transition year image, LCMS 2025');
print(
  lcms2025
    .filter(ee.Filter.eq('study_area', 'CONUS'))
    .filter(ee.Filter.eq('year', transitionYear))
    .first()
);

if (includeOCONUS) {

  print('AK previous year image count, LCMS 2024');
  print(
    lcms2024
      .filterDate(previousYear + '-01-01', transitionYear + '-01-01')
      .filterBounds(alaskaRegion)
      .size()
  );

  print('AK transition year image count, LCMS 2024');
  print(
    lcms2024
      .filterDate(transitionYear + '-01-01', (transitionYear + 1) + '-01-01')
      .filterBounds(alaskaRegion)
      .size()
  );

  print('HI previous year image count, LCMS 2024');
  print(
    lcms2024
      .filterDate(previousYear + '-01-01', transitionYear + '-01-01')
      .filterBounds(hawaiiRegion)
      .size()
  );

  print('HI transition year image count, LCMS 2024');
  print(
    lcms2024
      .filterDate(transitionYear + '-01-01', (transitionYear + 1) + '-01-01')
      .filterBounds(hawaiiRegion)
      .size()
  );

  print('PRUSVI previous year image count, LCMS 2024');
  print(
    lcms2024
      .filterDate(previousYear + '-01-01', transitionYear + '-01-01')
      .filterBounds(prusviRegion)
      .size()
  );

  print('PRUSVI transition year image count, LCMS 2024');
  print(
    lcms2024
      .filterDate(transitionYear + '-01-01', (transitionYear + 1) + '-01-01')
      .filterBounds(prusviRegion)
      .size()
  );
}*/


// 12. FUNCTION TO CREATE DEVELOPED TRANSITION IMAGE

function createTransitionImage(previousLandUse, currentLandUse) {

  var transition = previousLandUse
    .multiply(0)
    .rename('transition')
    .toByte();

  transition = transition.where(
    previousLandUse.eq(1).and(currentLandUse.eq(2)),
    1
  );

  transition = transition.where(
    previousLandUse.eq(3).and(currentLandUse.eq(2)),
    2
  );

  transition = transition.where(
    previousLandUse.eq(5).and(currentLandUse.eq(2)),
    3
  );

  transition = transition.where(
    previousLandUse.eq(4).and(currentLandUse.eq(2)),
    4
  );

  var validPixels = previousLandUse.mask()
    .and(currentLandUse.mask())
    .and(previousLandUse.neq(6))
    .and(currentLandUse.neq(6));

  return transition
    .updateMask(validPixels)
    .updateMask(transition.gt(0));
}

// CREATE TRANSITION IMAGES

// CONUS uses LCMS 2025.
var conusTransition = createTransitionImage(
  getLCMS2025LandUse('CONUS', previousYear),
  getLCMS2025LandUse('CONUS', transitionYear)
);

// These remain null for the 2025 CONUS-only run.
var alaskaTransition = null;
var alaskaAleutiansTransition = null;
var hawaiiTransition = null;
var prusviTransition = null;

if (includeOCONUS) {

  // Alaska uses LCMS 2024.
  alaskaTransition = createTransitionImage(
    getLCMS2024LandUse(alaskaRegion, previousYear),
    getLCMS2024LandUse(alaskaRegion, transitionYear)
  );

  alaskaAleutiansTransition = createTransitionImage(
    getLCMS2024LandUse(alaskaAleutiansRegion, previousYear),
    getLCMS2024LandUse(alaskaAleutiansRegion, transitionYear)
  );

  // Hawaii uses LCMS 2024.
  hawaiiTransition = createTransitionImage(
    getLCMS2024LandUse(hawaiiRegion, previousYear),
    getLCMS2024LandUse(hawaiiRegion, transitionYear)
  );

  // PRUSVI uses LCMS 2024.
  prusviTransition = createTransitionImage(
    getLCMS2024LandUse(prusviRegion, previousYear),
    getLCMS2024LandUse(prusviRegion, transitionYear)
  );
}


// ADD STATE AND COUNTY NAMES

function addLocationNames(feature) {

  feature = ee.Feature(feature);

  var point = feature.geometry();

  var stateFeature = states.filterBounds(point).first();
  var countyFeature = counties.filterBounds(point).first();

  return feature.set({
    state_name: ee.Algorithms.If(
      stateFeature,
      ee.Feature(stateFeature).get('NAME'),
      'Unknown'
    ),

    county_name: ee.Algorithms.If(
      countyFeature,
      ee.Feature(countyFeature).get('NAME'),
      'Unknown'
    )
  });
}

// ADD TIME-BASED INTERPRETATION COLUMNS

function addTimeColumns(feature) {

  feature = ee.Feature(feature);

  var sampleYear = ee.Number(feature.get('Yearlabel'));
  var transitionYr = ee.Number(feature.get('transitionYear'));

  var yearsBetweenSamplingAndDevelopment =
    transitionYr.subtract(sampleYear);

  // Time elapsed from development through 2025.
var timeSinceDevelopment2025 =
    ee.Number(referenceYear).subtract(transitionYr);

  var developmentAgeClass = ee.Algorithms.If(
    timeSinceDevelopment2025.lte(5),
    'Recent development, 0-5 years',
    ee.Algorithms.If(
      timeSinceDevelopment2025.lte(15),
      'Moderate development age, 6-15 years',
      ee.Algorithms.If(
        timeSinceDevelopment2025.lte(30),
        'Older development, 16-30 years',
        'Long-term developed, more than 30 years'
      )
    )
  );

  return feature.set({
    years_between_sampling_and_development:
      yearsBetweenSamplingAndDevelopment,

    time_since_development_2025:
      timeSinceDevelopment2025,

    development_age_class:
      developmentAgeClass
  });
}

// FIND CHANGED PEDONS IN ONE REGION

function findChangedPedons(
  transitionImage,
  groupPedons,
  regionGroup,
  lcmsStudyArea,
  lcmsVersion
) {

  var eligiblePedons = groupPedons.filter(
    ee.Filter.lt('Yearlabel', transitionYear)
  );

  var sampled = transitionImage.sampleRegions({
    collection: eligiblePedons,
    scale: analysisScale,
    geometries: true,
    tileScale: tileScale
  });

  var changedPedons = sampled.map(function(feature) {

    feature = ee.Feature(feature);

    var transitionCode = ee.Number(feature.get('transition')).toInt();

    var originalPedonPoint = ee.Geometry.Point([
      feature.get('longitude'),
      feature.get('latitude')
    ]);

    var outputFeature = ee.Feature(
      originalPedonPoint,
      feature.toDictionary()
    ).set({
      previousYear: previousYear,
      transitionYear: transitionYear,
      transitionPeriod: transitionPeriod,

      transitionName: transitionLabels.get(
        transitionCode.format()
      ),

      region_group: regionGroup,
      lcms_study_area: lcmsStudyArea,
      lcms_version: lcmsVersion
    });

    outputFeature = addLocationNames(outputFeature);
    outputFeature = addTimeColumns(outputFeature);

    return outputFeature;
  });

  return changedPedons;
}

// RUN EACH CONUS REGION

var resultsWest1 = findChangedPedons(
  conusTransition,
  conusWest1,
  'CONUS West 1',
  'CONUS',
  'v2025-11'
);

var resultsWest2 = findChangedPedons(
  conusTransition,
  conusWest2,
  'CONUS West 2',
  'CONUS',
  'v2025-11'
);

var resultsCentral1 = findChangedPedons(
  conusTransition,
  conusCentral1,
  'CONUS Central 1',
  'CONUS',
  'v2025-11'
);

var resultsCentral2 = findChangedPedons(
  conusTransition,
  conusCentral2,
  'CONUS Central 2',
  'CONUS',
  'v2025-11'
);

var resultsEast1 = findChangedPedons(
  conusTransition,
  conusEast1,
  'CONUS East 1',
  'CONUS',
  'v2025-11'
);

var resultsEast2 = findChangedPedons(
  conusTransition,
  conusEast2,
  'CONUS East 2',
  'CONUS',
  'v2025-11'
);


// MERGE CONUS RESULTS

var changedPedons = resultsWest1
  .merge(resultsWest2)
  .merge(resultsCentral1)
  .merge(resultsCentral2)
  .merge(resultsEast1)
  .merge(resultsEast2);


// RUN AND MERGE OCONUS RESULTS THROUGH 2024

if (includeOCONUS) {

  var resultsAlaskaMain = findChangedPedons(
    alaskaTransition,
    alaskaMain,
    'Alaska Main',
    'AK',
    'v2024-10'
  );

  var resultsAlaskaAleutians = findChangedPedons(
    alaskaAleutiansTransition,
    alaskaAleutians,
    'Alaska Aleutians',
    'AK',
    'v2024-10'
  );

  var resultsHawaii = findChangedPedons(
    hawaiiTransition,
    hawaiiPedons,
    'Hawaii',
    'HI',
    'v2024-10'
  );

  var resultsPRUSVI = findChangedPedons(
    prusviTransition,
    prusviPedons,
    'Puerto Rico and U.S. Virgin Islands',
    'PRUSVI',
    'v2024-10'
  );

  changedPedons = changedPedons
    .merge(resultsAlaskaMain)
    .merge(resultsAlaskaAleutians)
    .merge(resultsHawaii)
    .merge(resultsPRUSVI);
}


// PRINT RESULTS

print('Transition period');
print(transitionPeriod);

print('Changed pedons ' + transitionPeriodWords);
print(changedPedons);

print('Number of changed pedons ' + transitionPeriodWords);
print(changedPedons.size());

print('Changed pedons by transition type');
print(changedPedons.aggregate_histogram('transitionName'));

print('Changed pedons by state');
print(changedPedons.aggregate_histogram('state_name'));

print('Changed pedons by county');
print(changedPedons.aggregate_histogram('county_name'));

print('Changed pedons by tax order');
print(changedPedons.aggregate_histogram('TAXORDER'));

print('Changed pedons by great group');
print(changedPedons.aggregate_histogram('GREATGROUP'));

print('Changed pedons with TAXORDER filled');
print(changedPedons.filter(ee.Filter.neq('TAXORDER', '')).size());

print('Changed pedons with TAXORDER blank');
print(changedPedons.filter(ee.Filter.eq('TAXORDER', '')).size());

if (includeOCONUS) {
  print('Coverage: CONUS, Alaska, Hawaii, and PRUSVI');
} else {
  print('Coverage: CONUS only because LCMS v2024-10 ends in 2024');
}


// EXPORT CSV TO GOOGLE DRIVE
var exportColumns = [
  'upedonid',
  'peiid',
  'pedon_key',
  'site_key',
  'usiteid',

  'Yearlabel',
  'year_source',
  'previousYear',
  'transitionYear',
  'transitionPeriod',
  'years_between_sampling_and_development',
  'time_since_development_2025',
  'development_age_class',
  'transition',
  'transitionName',

  'state_name',
  'county_name',
  'region_group',
  'lcms_study_area',
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

var cleanCSV = changedPedons.select(exportColumns);

var cleanCSVNoGeometry = cleanCSV.map(function(feature) {
  return feature.setGeometry(null);
});

print('CSV preview without geometry');
print(cleanCSVNoGeometry.limit(20));

Export.table.toDrive({
  collection: cleanCSVNoGeometry,
  description: exportFileName,
  fileNamePrefix: exportFileName,
  fileFormat: 'CSV',
  selectors: exportColumns
});

// MAP DISPLAY

Map.setCenter(-98, 39, 4);

var transitionVis = {
  min: 1,
  max: 4,
  palette: transitionPalette
};

Map.addLayer(
  conusTransition,
  transitionVis,
  'LCMS Transition ' + transitionPeriodWords + ', CONUS, v2025-11'
);

if (includeOCONUS) {

  Map.addLayer(
    alaskaTransition,
    transitionVis,
    'LCMS Transition ' + transitionPeriodWords + ', Alaska Main, v2024-10'
  );

  Map.addLayer(
    alaskaAleutiansTransition,
    transitionVis,
    'LCMS Transition ' + transitionPeriodWords + ', Alaska Aleutians, v2024-10'
  );

  Map.addLayer(
    hawaiiTransition,
    transitionVis,
    'LCMS Transition ' + transitionPeriodWords + ', Hawaii, v2024-10'
  );

  Map.addLayer(
    prusviTransition,
    transitionVis,
    'LCMS Transition ' + transitionPeriodWords + ', PRUSVI, v2024-10'
  );
}

Map.addLayer(
  pedons.style({
    color: '000000',
    pointSize: 2,
    pointShape: 'circle'
  }),
  {},
  'All NCSS Pedons'
);


// STYLE CHANGED PEDONS BY TRANSITION TYPE

function styleChangedPedons(feature) {

  var transitionCode = ee.Number(feature.get('transition'));

  var color = ee.Algorithms.If(
    transitionCode.eq(1),
    '#ff4c4c',
    ee.Algorithms.If(
      transitionCode.eq(2),
      '#6aa84f',
      ee.Algorithms.If(
        transitionCode.eq(3),
        '#674ea7',
        '#741b47'
      )
    )
  );

  return feature.set({
    style: {
      color: color,
      pointSize: 7,
      pointShape: 'circle',
      width: 1
    }
  });
}

var styledChangedPedons = changedPedons.map(styleChangedPedons);

Map.addLayer(
  styledChangedPedons.style({
    styleProperty: 'style'
  }),
  {},
  'Changed NCSS Pedons ' + transitionPeriodWords
);

// ADD PEDON ID LABELS TO CHANGED POINTS

// Third-party Earth Engine package for drawing text.
/*var text = require('users/gena/packages:text');

// Only label records that contain an upedonid.
var pedonsForLabels = changedPedons.filter(
  ee.Filter.notNull(['upedonid'])
);

// Controls the geographic size of the text.
// Reduce this number for smaller labels.
var labelScale = 150;

var pedonLabelImages = pedonsForLabels
  .toList(pedonsForLabels.size())
  .map(function(item) {

    var feature = ee.Feature(item);
    var pedonID = ee.String(feature.get('upedonid'));

    return text.draw(
      pedonID,
      feature.geometry(),
      labelScale,
      {
        fontSize: 12,
        textColor: '000000',
        outlineColor: 'ffffff',
        outlineWidth: 2,
        outlineOpacity: 1
      }
    );
  });

var pedonIDLabels = ee.ImageCollection
  .fromImages(pedonLabelImages)
  .mosaic();

Map.addLayer(
  pedonIDLabels,
  {},
  'Changed Pedon IDs',
  false
);*/


// ADD LEGEND

var legend = ui.Panel({
  style: {
    position: 'bottom-right',
    padding: '8px 15px',
    backgroundColor: 'white'
  }
});

legend.add(ui.Label({
  value: transitionPeriodWords + ' Developed Transitions',
  style: {
    fontWeight: 'bold',
    fontSize: '14px',
    margin: '0 0 6px 0'
  }
}));

function addLegendRow(color, name) {

  var colorBox = ui.Label({
    style: {
      backgroundColor: color,
      padding: '8px',
      margin: '0 6px 4px 0'
    }
  });

  var description = ui.Label({
    value: name,
    style: {
      margin: '0 0 4px 0'
    }
  });

  var row = ui.Panel({
    widgets: [colorBox, description],
    layout: ui.Panel.Layout.Flow('horizontal')
  });

  legend.add(row);
}

addLegendRow('#ff4c4c', 'Agriculture to Developed');
addLegendRow('#6aa84f', 'Forest to Developed');
addLegendRow('#674ea7', 'Rangeland or Pasture to Developed');
addLegendRow('#741b47', 'Other to Developed');

Map.add(legend);
