// Define the path to your shapefile asset
var shapefileAssetPath = 'projects/ee-sujithamita/assets/output_shapefile';

// Define the path to the provided dataset
var providedDatasetPath = 'projects/ee-sujithamita/assets/protected_areas_world';

// Import the shapefile
var shapefileAsset = ee.FeatureCollection(shapefileAssetPath);

// Import the provided dataset
var providedDataset = ee.FeatureCollection(providedDatasetPath);

// Define visualization parameters for the shapefile
var shapefileVisParams = {
  color: 'blue'
};

// Define visualization parameters for the provided dataset
var providedDatasetVisParams = {
  color: 'white'
};

// Visualize the shapefile
Map.addLayer(shapefileAsset.style(shapefileVisParams), {}, 'Shapefile Layer');

// Visualize the provided dataset
Map.addLayer(providedDataset.style(providedDatasetVisParams), {}, 'Protected Areas Layer');

// Center the map on the shapefile
Map.centerObject(shapefileAsset);

// Print the feature collection to the console for inspection
print('Shapefile Feature Collection:', shapefileAsset);
print('Protected Areas Feature Collection:', providedDataset);




/*
  Lisence and citation:
  The code is licensed under a Creative Commons Attribution 4.0 International License (CC BY 4.0). 
  Attribution using the following citation is required:
  
  Johannes Reiche, Johannes Balling, Amy Hudson Pickens, Robert N Masolele, Anika Berger, Mikaela J Weisse, Daniel Mannarino, Yaqing Gou, Bart Slagter, 
  Gennadii Donchyts, Sarah Carter (2024): Integrating satellite–based forest disturbance alerts improves detection timeliness and confidence
  Environmental Research Letters. 10.1088/1748-9326/ad2d82 
  
  Authors: Johannes Reiche, Robert N Masolele, Gennadii Donchyts with support from Daniel Wiell (FAO Sepal)
  
  Contact email: johannes.reiche@wur.nl
  Version date: 2024-03-30
*/

/*
  Example combining RADD, GLAD-L and GLAD-S2 forest disturbance alerts following the rulesets (and spatial neighborhood option) presented in Reiche et al. (2024).
  
  Description of Ruleset-1 and 2:
  Ruleset-1 (the ruleset applied by the GFW integrated alerts): assigns the highest confidence to disturbances detected by at least two alert systems at the same location, regardless of the original alert's confidence level. Even if two alert products exhibit low confidence, the integrated alert is marked with the highest confidence. Disturbances detected by a single alert system retain their original confidence level (either low or high). Ruleset-1 is applied to generate the Global Forest Watch integrated alert. 
  Ruleset-2 represents a more conservative approach to reaching highest confidence. In this case, highest confidence level is assigned for forest disturbances detected by three alert systems (with at least low confidence) or by two alert systems with high confidence. In situations of either two low confidence alerts or one low and one high confidence alerts, this would only be considered high confidence, rather than highest confidence, as according to Ruleset-1. 
  
  Some attention points for RADD, GLAD-L and GLAD-S2 alerts:
  - The forest baseline maps applied by the different alerting systems vary. 
  - The starting dates of the different alerting systems vary
  
  Options to add additional or different alert products:
  - Adding other alert products requires adding a conversion function. See the alert_integration script for example code.
*/

var alertFunctions = require('users/nrtwur/alert_integration:alert_integration')

Map.setOptions('SATELLITE')
Map.setCenter(-1.0232, 7.9465, 6)

var alertVisParams = {
    bands: 'Alert',
    min: 2,
    max: 4,
    palette: ['4BA5FF', 'FF0000', '600000']
}


// Access RADD alert dataset (more info: http://radd-alert.wur.nl)
var RADD_Original = ee.ImageCollection(ee.ImageCollection('projects/radar-wur/raddalert/v1').filterMetadata('layer', 'contains', 'alert')).mosaic()
var RADD_forest_baseline = ee.ImageCollection(ee.ImageCollection('projects/radar-wur/raddalert/v1').filterMetadata('layer', 'contains', 'forest_baseline')).mosaic()


// Access GLAD-Landsat alert dataset (more info: https://glad.umd.edu/dataset/glad-forest-alerts)
var GLAD_L_Original = ee.ImageCollection('projects/glad/alert/2021final').select(['conf21', 'alertDate21']).mosaic()
                          .addBands(ee.ImageCollection('projects/glad/alert/2022final').select(['conf22', 'alertDate22']).mosaic())
                          .addBands(ee.ImageCollection("projects/glad/alert/UpdResult").select(['conf23', 'alertDate23','conf24', 'alertDate24']).mosaic());
var gfc = ee.Image('UMD/hansen/global_forest_change_2023_v1_11')
var GLAD_L_forest_baseline = gfc.select('treecover2000').gte(10).or(gfc.select('gain').eq(1)).and(gfc.select('lossyear').unmask().lt(14).or(gfc.select('lossyear').unmask().gte(21))).selfMask()


// Access GLAD-Sentinel-2 alert dataset (more info: https://glad.umd.edu/dataset/glad-forest-alerts)
var GLAD_S2_Original = ee.Image("projects/glad/S2alert/alert").rename('Alert').addBands(ee.Image("projects/glad/S2alert/alertDate").rename('Date'))
var GLAD_S2_forest_baseline = ee.ImageCollection('UMD/GLAD/PRIMARY_HUMID_TROPICAL_FORESTS/v1').mosaic().where(gfc.select('lossyear').unmask().gt(0).or(gfc.select('lossyear').unmask().gte(19)),0).selfMask().updateMask(ee.Image("projects/glad/S2alert/obsDate"))


// Reformat the datasets to include common alert levels (low and high confidence alerts) and standardize the date format.
var RADD = alertFunctions.convertRADD(RADD_Original)
var GLAD_L = alertFunctions.convertGLAD_L([GLAD_L_Original]) 
var GLAD_S2 = alertFunctions.convertGLAD_S2(GLAD_S2_Original)

// Forest baseline layers
Map.addLayer(RADD_forest_baseline, {palette:['black'], opacity: 0.3},'RADD forest baseline',false)
Map.addLayer(GLAD_L_forest_baseline, {palette:['black'], opacity: 0.3},'GLAD_L forest baseline',false)
Map.addLayer(GLAD_S2_forest_baseline, {palette:['black'], opacity: 0.3},'GLAD_S2 forest baseline',false)


// Deforestation alerts
Map.addLayer(RADD, alertVisParams, 'RADD', false)
Map.addLayer(GLAD_L, alertVisParams, 'GLAD_L', false)
Map.addLayer(GLAD_S2, alertVisParams, 'GLAD_S2', false)


// Run integration call function | The derived output is the integrated alert with alert confidence level and first date of detection

// Pixel-based integration (without considering the spatial neighborhood)
var ruleset1 = alertFunctions.integrateAlerts({
    alerts: [RADD, GLAD_L, GLAD_S2], // alert datesets to be integrated
    ruleset: 'r1', // ruleset
    confidence_levels: [2, 3, 4] // confidence level format (low, high, highest)
})
var ruleset2 = alertFunctions.integrateAlerts({
    alerts: [RADD, GLAD_L, GLAD_S2],
    ruleset: 'r2',
    confidence_levels: [2, 3, 4] 
})

Map.addLayer(ruleset1, alertVisParams, 'Integrated alert (Ruleset-1)', true)
Map.addLayer(ruleset2, alertVisParams, 'Integrated alert (Ruleset-2)', false)

// Convert to integrated alert to other date formats (YYDOY, fractional year)
var ruleset1_YYDOYdateFormat = alertFunctions.convertDatesToYYDOY_Format(ruleset1)
Map.addLayer(ruleset1_YYDOYdateFormat, { bands: 'Date', min: 19000, max: 25000, palette: ['black', 'white'] }, 'Integrated alert (Ruleset-1) (YYDOY)', false)

var ruleset1_FractionalYear = alertFunctions.convertDatesToFractionalYear(ruleset1)
Map.addLayer(ruleset1_FractionalYear, { bands: 'Date', min: 2019, max: 2025, palette: ['black', 'white'] }, 'Integrated alert (Ruleset-1) (Fractional year)', false)


// Pixel-based integration with considering spatial neighborhood
var ruleset1 = alertFunctions.integrateAlerts({
    alerts: [RADD, GLAD_L, GLAD_S2],
    ruleset: 'r1',
    buffer_size: 100, // Spatial neighborhood buffer in meters
    temporal_buffer: 180, // Maximum number of days to allow neighboring alert pixels to have incluence
    confidence_levels: [2, 3, 4] 
})

Map.addLayer(ruleset1, alertVisParams, 'Integrated alert (Ruleset-1) [100m buffer]', false)


// Show legends
var palettes = require('users/gena/packages:palettes')

palettes.showPalette('Alert', alertVisParams.palette, [100, 5], true)
print('2 - low confidence')
print('3 - high confidence')
print('4 - highest confidence')

palettes.showPalette('Date', ['black', 'white'], [100, 5])
print('2020 - 2024')

palettes.showPalette('Forest baseline', ['grey'], [100, 5])



