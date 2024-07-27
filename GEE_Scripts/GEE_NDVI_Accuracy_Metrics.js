// Define the path to your shapefile asset
var shapefileAssetPath = 'projects/ee-sujithamita/assets/output_shapefile';

// Import the shapefile
var shapefileAsset = ee.FeatureCollection(shapefileAssetPath);

// Define visualization parameters for the shapefile
var shapefileVisParams = {
  color: 'blue'
};

// Visualize the shapefile
Map.addLayer(shapefileAsset.style(shapefileVisParams), {}, 'Shapefile Layer');

// Center the map on the shapefile
Map.centerObject(shapefileAsset);

// Function to calculate NDVI
function calculateNDVI(image) {
  return image.normalizedDifference(['SR_B5', 'SR_B4']).rename('NDVI');
}

// Define time periods
var before = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
  .filterDate('2021-01-01', '2021-12-31')
  .filterBounds(shapefileAsset)
  .map(calculateNDVI)
  .median();

var after = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
  .filterDate('2024-01-01', '2024-12-31')
  .filterBounds(shapefileAsset)
  .map(calculateNDVI)
  .median();

// Compute NDVI difference
var ndviDifference = after.subtract(before).rename('NDVI_Difference');

// Define visualization parameters for NDVI
var ndviVisParams = {
  min: -0.5,
  max: 0.5,
  palette: ['red', 'white', 'green']
};

// Visualize NDVI difference
Map.addLayer(ndviDifference.clip(shapefileAsset), ndviVisParams, 'NDVI Difference');

// Access integrated alert datasets
var alertFunctions = require('users/nrtwur/alert_integration:alert_integration');

var alertVisParams = {
    bands: 'Alert',
    min: 2,
    max: 4,
    palette: ['4BA5FF', 'FF0000', '600000']
};

// Access RADD alert dataset
var RADD_Original = ee.ImageCollection(ee.ImageCollection('projects/radar-wur/raddalert/v1').filterMetadata('layer', 'contains', 'alert')).mosaic();
var RADD_forest_baseline = ee.ImageCollection(ee.ImageCollection('projects/radar-wur/raddalert/v1').filterMetadata('layer', 'contains', 'forest_baseline')).mosaic();

// Access GLAD-Landsat alert dataset
var GLAD_L_Original = ee.ImageCollection('projects/glad/alert/2021final').select(['conf21', 'alertDate21']).mosaic()
                          .addBands(ee.ImageCollection('projects/glad/alert/2022final').select(['conf22', 'alertDate22']).mosaic())
                          .addBands(ee.ImageCollection("projects/glad/alert/UpdResult").select(['conf24', 'alertDate24']).mosaic());
var gfc = ee.Image('UMD/hansen/global_forest_change_2023_v1_11');
var GLAD_L_forest_baseline = gfc.select('treecover2000').gte(10).or(gfc.select('gain').eq(1)).and(gfc.select('lossyear').unmask().lt(14).or(gfc.select('lossyear').unmask().gte(21))).selfMask();

// Access GLAD-Sentinel-2 alert dataset
var GLAD_S2_Original = ee.Image("projects/glad/S2alert/alert").rename('Alert').addBands(ee.Image("projects/glad/S2alert/alertDate").rename('Date'));
var GLAD_S2_forest_baseline = ee.ImageCollection('UMD/GLAD/PRIMARY_HUMID_TROPICAL_FORESTS/v1').mosaic().where(gfc.select('lossyear').unmask().gt(0).or(gfc.select('lossyear').unmask().gte(19)),0).selfMask().updateMask(ee.Image("projects/glad/S2alert/obsDate"));

// Reformat the datasets to include common alert levels (low and high confidence alerts) and standardize the date format.
var RADD = alertFunctions.convertRADD(RADD_Original);
var GLAD_L = alertFunctions.convertGLAD_L([GLAD_L_Original]);
var GLAD_S2 = alertFunctions.convertGLAD_S2(GLAD_S2_Original);

// Run integration call function
var integratedAlerts = alertFunctions.integrateAlerts({
    alerts: [RADD, GLAD_L, GLAD_S2], // alert datasets to be integrated
    ruleset: 'r1', // ruleset
    confidence_levels: [2, 3, 4] // confidence level format (low, high, highest)
});

// Visualize integrated alerts
Map.addLayer(integratedAlerts.clip(shapefileAsset), alertVisParams, 'Integrated Alerts');

// Define thresholds for detecting deforestation in NDVI difference and alerts
var ndviThreshold = -0.2;  // Example threshold for NDVI difference indicating deforestation
var alertThreshold = 3;    // Example threshold for high-confidence alerts

// Create binary masks for deforestation detection
var deforestationNDVI = ndviDifference.lt(ndviThreshold);
var highConfidenceAlerts = integratedAlerts.gte(alertThreshold);

// Calculate the intersection of both detections
var intersection = deforestationNDVI.and(highConfidenceAlerts);

// Visualize the masks and intersection
Map.addLayer(deforestationNDVI.clip(shapefileAsset), {palette: ['red'], opacity: 0.5}, 'NDVI Deforestation');
Map.addLayer(highConfidenceAlerts.clip(shapefileAsset), {palette: ['blue'], opacity: 0.5}, 'High Confidence Alerts');
Map.addLayer(intersection.clip(shapefileAsset), {palette: ['purple'], opacity: 0.5}, 'Intersection');

// Print areas for inspection
print('Deforestation NDVI Area:', deforestationNDVI);
print('High Confidence Alerts Area:', highConfidenceAlerts);
print('Intersection Area:', intersection);

// Calculate the area of overlap and percentages
var deforestationNDVIArea = deforestationNDVI.reduceRegion({
  reducer: ee.Reducer.sum(),
  geometry: shapefileAsset,
  scale: 30,
  maxPixels: 1e13
});

var highConfidenceAlertsArea = highConfidenceAlerts.reduceRegion({
  reducer: ee.Reducer.sum(),
  geometry: shapefileAsset,
  scale: 30,
  maxPixels: 1e13
});

var intersectionArea = intersection.reduceRegion({
  reducer: ee.Reducer.sum(),
  geometry: shapefileAsset,
  scale: 30,
  maxPixels: 1e13
});

// Print the calculated areas
print('Deforestation NDVI Area (sq. meters):', deforestationNDVIArea);
print('High Confidence Alerts Area (sq. meters):', highConfidenceAlertsArea);
print('Intersection Area (sq. meters):', intersectionArea);

// Calculate the intersection of integrated alerts and NDVI difference
var intersection = integratedAlerts.and(ndviDifference);

// Calculate the area of integrated alerts
var integratedArea = integratedAlerts.multiply(ee.Image.pixelArea()).reduceRegion({
  reducer: ee.Reducer.sum(),
  geometry: shapefileAsset,
  scale: 30,
  maxPixels: 1e9
});

// Calculate the area of NDVI difference
var ndviArea = ndviDifference.multiply(ee.Image.pixelArea()).reduceRegion({
  reducer: ee.Reducer.sum(),
  geometry: shapefileAsset,
  scale: 30,
  maxPixels: 1e9
});

// Calculate the area of intersection
var intersectionArea = intersection.multiply(ee.Image.pixelArea()).reduceRegion({
  reducer: ee.Reducer.sum(),
  geometry: shapefileAsset,
  scale: 30,
  maxPixels: 1e9
});

// Print the areas
print('Area of Integrated Alerts (sq meters):', integratedArea);
print('Area of NDVI Difference (sq meters):', ndviArea);
print('Area of Intersection (sq meters):', intersectionArea);

// METRICS

// Calculate True Positives (TP): Intersection of high-confidence alerts and NDVI deforestation
var truePositives = intersection;

// Calculate False Positives (FP): High-confidence alerts that do not match NDVI deforestation
var falsePositives = highConfidenceAlerts.and(deforestationNDVI.not());

// Calculate False Negatives (FN): NDVI deforestation that do not match high-confidence alerts
var falseNegatives = deforestationNDVI.and(highConfidenceAlerts.not());

// Calculate True Negatives (TN): Area where neither method indicates deforestation
var trueNegatives = highConfidenceAlerts.not().and(deforestationNDVI.not());

// Function to calculate area for a specific band
function calculateArea(image, band) {
  return image.select(band).multiply(ee.Image.pixelArea()).reduceRegion({
    reducer: ee.Reducer.sum(),
    geometry: shapefileAsset,
    scale: 30,
    maxPixels: 1e9
  });
}

// Calculate areas for each metric for the "Alert" band
var tpArea = calculateArea(truePositives, 'Alert');
var fpArea = calculateArea(falsePositives, 'Alert');
var fnArea = calculateArea(falseNegatives, 'Alert');
var tnArea = calculateArea(trueNegatives, 'Alert');

// Print the areas for each metric
print('True Positives Area (sq meters):', tpArea);
print('False Positives Area (sq meters):', fpArea);
print('False Negatives Area (sq meters):', fnArea);
print('True Negatives Area (sq meters):', tnArea);

// Calculate Precision, Recall, F1 Score, and Accuracy
var tp = ee.Number(tpArea.get('Alert'));
var fp = ee.Number(fpArea.get('Alert'));
var fn = ee.Number(fnArea.get('Alert'));
var tn = ee.Number(tnArea.get('Alert'));

var precision = tp.divide(tp.add(fp));
var recall = tp.divide(tp.add(fn));
var f1Score = precision.multiply(recall).multiply(2).divide(precision.add(recall));
var accuracy = tp.add(tn).divide(tp.add(fp).add(fn).add(tn));

// Print performance metrics
print('Precision:', precision);
print('Recall:', recall);
print('F1 Score:', f1Score);
print('Accuracy:', accuracy);

