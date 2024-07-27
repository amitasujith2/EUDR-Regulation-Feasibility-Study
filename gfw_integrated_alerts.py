import requests
import json
import pandas as pd
import ast

# Your API key
api_key = '4ed4bf29-31a1-4d87-86e2-084282c5cfae'

# Read the CSV file
file_path = 'farmer_data.csv'
df = pd.read_csv(file_path)

# Function to create GeoJSON polygon from coordinates
def create_geojson_polygon(coordinates):
    return {
        "type": "Polygon",
        "coordinates": [coordinates]
    }

# Initialize a list to store results
results = []

# Iterate over each row in the DataFrame
for index, row in df.iterrows():
    # Parse the Location column to get the coordinates
    coordinates = ast.literal_eval(row['Location'])
    
    # Create GeoJSON polygon for the current coordinates
    geometry = create_geojson_polygon(coordinates)

    # Define the SQL query with the date range for 2020 onwards
    sql_query = """
    SELECT
        longitude,
        latitude,
        gfw_integrated_alerts__date AS date,
        gfw_integrated_alerts__confidence AS confidence,
        tsc_tree_cover_loss_drivers__driver AS deforestation_driver,
        esa_land_cover_2015__class AS land_cover_class
    FROM
        results
    WHERE
        gfw_integrated_alerts__date >= '2020-01-01'
    """

    # Define the payload
    payload = {
        "geometry": geometry,
        "sql": sql_query
    }

    # Define the URL
    url = 'https://data-api.globalforestwatch.org/dataset/gfw_integrated_alerts/latest/query'

    # Define the headers
    headers = {
        'x-api-key': api_key,
        'Content-Type': 'application/json'
    }

    # Send the POST request
    response = requests.post(url, headers=headers, data=json.dumps(payload))

    # Check if the request was successful
    if response.status_code == 200:
        data = response.json()
        nominal_confidence_alerts = sum(1 for alert in data['data'] if alert['confidence'] == 'nominal')
        high_confidence_alerts = sum(1 for alert in data['data'] if alert['confidence'] == 'high')
        highest_confidence_alerts = sum(1 for alert in data['data'] if alert['confidence'] == 'highest')
        
        total_alerts = nominal_confidence_alerts + high_confidence_alerts + highest_confidence_alerts
        
        # Calculate a weighted deforestation confidence percentage
        weighted_confidence = (
            (nominal_confidence_alerts * 1) +
            (high_confidence_alerts * 2) +
            (highest_confidence_alerts * 3)
        )
        
        if total_alerts > 0:
            overall_confidence_percentage = (weighted_confidence / (total_alerts * 3)) * 100
        else:
            overall_confidence_percentage = 0
        
        result = {
            "Product Type": row['Product Type'],
            "Trade Name": row['Trade Name'],
            "Scientific Name": row['Scientific Name'] if 'Scientific Name' in row else "",
            "Quantity (kg)": row['Quantity (kg)'],
            "Country of Production": row['Country of Production'],
            "Location": row['Location'],
            "Production Date": row['Production Date'],
            "Supplier Name": row['Supplier Name'],
            "Supplier Address": row['Supplier Address'],
            "Supplier Email": row['Supplier Email'],
            "Trader Name": row['Trader Name'],
            "Trader Address": row['Trader Address'],
            "Trader Email": row['Trader Email'],
            "Nominal Confidence Alerts": nominal_confidence_alerts,
            "High Confidence Alerts": high_confidence_alerts,
            "Highest Confidence Alerts": highest_confidence_alerts,
            "Total Alerts": total_alerts,
            "Overall Confidence %": overall_confidence_percentage
        }
        
        # Check if deforestation driver is present in the data
        if any('deforestation_driver' in alert for alert in data['data']):
            driver_mapping = {
                1: "Commodity-driven deforestation",
                2: "Shifting agriculture",
                3: "Forestry",
                4: "Wildfire",
                5: "Urbanization"
            }
            deforestation_drivers = set()
            for alert in data['data']:
                if 'deforestation_driver' in alert:
                    deforestation_driver = driver_mapping.get(alert['deforestation_driver'], alert['deforestation_driver'])
                    deforestation_drivers.add(str(deforestation_driver))
            
            result['Deforestation Driver'] = ', '.join(deforestation_drivers)
        
        # Add other columns to the result if they exist
        for key in ['land_cover_class']:
            if any(key in alert for alert in data['data']):
                result[key.replace('gfw_integrated_alerts__', '').replace('umd_', '').replace('__', ' ').title().replace(' ', '_')] = ', '.join(
                    set(str(alert[key]) for alert in data['data'] if key in alert)
                )

        results.append(result)

# Create a DataFrame from the results
results_df = pd.DataFrame(results)

# Save the results to a CSV file
output_file = 'farmer_data_deforestation_alerts_summary.csv'
results_df.to_csv(output_file, index=False)

# Print the DataFrame
print(results_df)


