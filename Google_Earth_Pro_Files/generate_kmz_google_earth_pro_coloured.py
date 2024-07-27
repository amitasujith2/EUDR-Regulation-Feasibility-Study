import pandas as pd
import simplekml
import zipfile
import ast

# Load the CSV file
file_path = 'farmer_data_deforestation_alerts_summary.csv'
df = pd.read_csv(file_path)

# Function to determine the predominant confidence level
def get_color(nominal_count, high_count, highest_count):
    if nominal_count >= high_count and nominal_count >= highest_count:
        return simplekml.Color.yellow
    elif high_count >= nominal_count and high_count >= highest_count:
        return simplekml.Color.orange
    else:
        return simplekml.Color.red

# Function to determine the border color based on the fill color
def get_border_color(fill_color):
    if fill_color == simplekml.Color.yellow:
        return simplekml.Color.changealphaint(200, simplekml.Color.rgb(204, 204, 0))  # Darker yellow
    elif fill_color == simplekml.Color.orange:
        return simplekml.Color.changealphaint(200, simplekml.Color.rgb(204, 102, 0))  # Darker orange
    elif fill_color == simplekml.Color.red:
        return simplekml.Color.changealphaint(200, simplekml.Color.rgb(153, 0, 0))    # Darker red

# Create a KML object
kml = simplekml.Kml()

# Iterate over each row in the DataFrame and add a point or polygon to the KML
for index, row in df.iterrows():
    location = ast.literal_eval(row['Location'])
    nominal_count = row['Nominal Confidence Alerts']
    high_count = row['High Confidence Alerts']
    highest_count = row['Highest Confidence Alerts']
    
    fill_color = get_color(nominal_count, high_count, highest_count)
    border_color = get_border_color(fill_color)
    
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
        pol.style.linestyle.color = border_color  # Set the border color
        pol.style.linestyle.width = 1  # Set the border width to be thin
        pol.style.polystyle.color = fill_color  # Set the fill color based on confidence level
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
kml_file = 'farmer_data_deforestation_alerts_coloured.kml'
kml.save(kml_file)

# Compress the KML file into a KMZ file
kmz_file = 'farmer_data_deforestation_alerts_coloured.kmz'
with zipfile.ZipFile(kmz_file, 'w', zipfile.ZIP_DEFLATED) as kmz:
    kmz.write(kml_file)

print(f"KML file saved as {kml_file}")
print(f"KMZ file saved as {kmz_file}")
