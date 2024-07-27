import geopandas as gpd
import simplekml
import zipfile
import os

# List of shapefile paths
shapefile_paths = [
    '/Users/amita/Desktop/WDPA_Jun2024_Public_shp_ghana/WDPA_Jun2024_Public_shp_0/WDPA_Jun2024_Public_shp-polygons.shp',
    '/Users/amita/Desktop/WDPA_Jun2024_Public_shp_ghana/WDPA_Jun2024_Public_shp_1/WDPA_Jun2024_Public_shp-polygons.shp',
    '/Users/amita/Desktop/WDPA_Jun2024_Public_shp_ghana/WDPA_Jun2024_Public_shp_2/WDPA_Jun2024_Public_shp-polygons.shp'
]

def convert_to_kml(gdf, output_path):
    kml = simplekml.Kml()
    for _, row in gdf.iterrows():
        if row.geometry.geom_type == 'Polygon':
            pol = kml.newpolygon(name=row.get('NAME', 'No Name'))
            pol.outerboundaryis.coords = [(coord[0], coord[1]) for coord in row.geometry.exterior.coords]
    kml.save(output_path)

def convert_to_kmz(kml_path, kmz_path):
    with zipfile.ZipFile(kmz_path, 'w', zipfile.ZIP_DEFLATED) as kmz:
        kmz.write(kml_path, os.path.basename(kml_path))

def process_shapefile(shapefile_path, kml_output, kmz_output):
    try:
        gdf = gpd.read_file(shapefile_path)
        convert_to_kml(gdf, kml_output)
        convert_to_kmz(kml_output, kmz_output)
        print(f"Shapefile {shapefile_path} converted to KML and KMZ successfully.")
    except Exception as e:
        print(f"Error reading shapefile {shapefile_path}: {e}")

# Loop through shapefile paths and process each one
for idx, shapefile in enumerate(shapefile_paths):
    kml_output = f'polygons_ghana_{idx}.kml'
    kmz_output = f'polygons_ghana_{idx}.kmz'
    process_shapefile(shapefile, kml_output, kmz_output)
