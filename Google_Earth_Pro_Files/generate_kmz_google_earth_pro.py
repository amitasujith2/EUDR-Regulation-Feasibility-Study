import pandas as pd
import simplekml
import zipfile
import ast

# Load the CSV file
file_path = 'farmer_data_deforestation_alerts_summary.csv'
df = pd.read_csv(file_path)

# Create a KML object
kml = simplekml.Kml()

# Iterate over each row in the DataFrame and add a point or polygon to the KML
for index, row in df.iterrows():
    location = ast.literal_eval(row['Location'])
    
    if isinstance(location[0], list):  # It's a polygon
        pol = kml.newpolygon(
            name=row['Supplier Name'],
            description=f"Quantity: {row['Quantity (kg)']}\n"
                        f"Product Type: {row['Product Type']}\n"
                        f"Nominal Confidence Alerts: {row['Nominal Confidence Alerts']}\n"
                        f"High Confidence Alerts: {row['High Confidence Alerts']}\n"
                        f"Highest Confidence Alerts: {row['Highest Confidence Alerts']}\n"
                        f"Total Alerts: {row['Total Alerts']}\n"
                        f"Overall Confidence %: {row['Overall Confidence %']}\n"
                        f"Deforestation Driver: {row.get('Deforestation Driver', 'N/A')}\n"
                        f"Land Cover Class: {row.get('Land_Cover_Class', 'N/A')}",
            outerboundaryis=location
        )
        pol.style.linestyle.color = simplekml.Color.red  # Set the border color
        pol.style.linestyle.width = 2  # Set the border width
        pol.style.polystyle.fill = 0  # Set fill to 0 to make it transparent
    else:  # It's a point
        pnt = kml.newpoint(
            name=row['Supplier Name'],
            description=f"Quantity: {row['Quantity (kg)']}\n"
                        f"Product Type: {row['Product Type']}\n"
                        f"Nominal Confidence Alerts: {row['Nominal Confidence Alerts']}\n"
                        f"High Confidence Alerts: {row['High Confidence Alerts']}\n"
                        f"Highest Confidence Alerts: {row['Highest Confidence Alerts']}\n"
                        f"Total Alerts: {row['Total Alerts']}\n"
                        f"Overall Confidence %: {row['Overall Confidence %']}\n"
                        f"Deforestation Driver: {row.get('Deforestation Driver', 'N/A')}\n"
                        f"Land Cover Class: {row.get('Land_Cover_Class', 'N/A')}",
            coords=[(location[1], location[0])]
        )

# Save the KML file
kml_file = 'farmer_data_deforestation_alerts.kml'
kml.save(kml_file)

# Compress the KML file into a KMZ file
kmz_file = 'farmer_data_deforestation_alerts.kmz'
with zipfile.ZipFile(kmz_file, 'w', zipfile.ZIP_DEFLATED) as kmz:
    kmz.write(kml_file)

print(f"KML file saved as {kml_file}")
print(f"KMZ file saved as {kmz_file}")


