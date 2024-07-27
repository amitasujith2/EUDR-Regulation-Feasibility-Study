import pandas as pd
import random
import string

# Function to generate random geolocation coordinates
def generate_random_coordinates():
    return f"[{round(random.uniform(-10, 10), 6)}, {round(random.uniform(-10, 10), 6)}]"

# Function to generate a random date
def generate_random_date():
    year = random.choice(range(2010, 2024))
    month = random.choice(range(1, 13))
    day = random.choice(range(1, 29))
    return f"{year}-{month:02d}-{day:02d}"

# Function to generate random names and addresses
def generate_random_name():
    return ''.join(random.choices(string.ascii_uppercase + string.ascii_lowercase, k=8))

def generate_random_address():
    return ''.join(random.choices(string.ascii_uppercase + string.ascii_lowercase + string.digits, k=12))

# List of product types and corresponding trade names
product_types = [
    {"type": "cattle", "trade_name": "Beef"},
    {"type": "cocoa", "trade_name": "Cocoa Beans"},
    {"type": "coffee", "trade_name": "Coffee Beans"},
    {"type": "palm oil", "trade_name": "Palm Oil"},
    {"type": "rubber", "trade_name": "Natural Rubber"},
    {"type": "soya", "trade_name": "Soybeans"},
    {"type": "wood", "trade_name": "Timber", "scientific_name": "Tectona grandis"}
]

# Create sample data
data = {
    'Product Type': [],
    'Trade Name': [],
    'Scientific Name': [],
    'Quantity (kg)': [random.randint(100, 1000) for _ in range(25)],
    'Country of Production': ['Ghana' for _ in range(25)],
    'Geolocation of Plots': [generate_random_coordinates() for _ in range(25)],
    'Production Date': [generate_random_date() for _ in range(25)],
    'Supplier Name': [generate_random_name() for _ in range(25)],
    'Supplier Address': [generate_random_address() for _ in range(25)],
    'Supplier Email': [f"supplier{random.randint(1,100)}@example.com" for _ in range(25)],
    'Customer Name': ['Kwame Akumape' for _ in range(25)],
    'Customer Address': [generate_random_address() for _ in range(25)],
    'Customer Email': [f"customer{random.randint(1,100)}@example.com" for _ in range(25)]
}

for _ in range(25):
    product = random.choice(product_types)
    data['Product Type'].append(product['type'])
    data['Trade Name'].append(product['trade_name'])
    if product['type'] == 'wood':
        data['Scientific Name'].append(product['scientific_name'])
    else:
        data['Scientific Name'].append("")

# Convert to DataFrame
df = pd.DataFrame(data)

# Save to CSV
file_path = 'farmer_data.csv'
df.to_csv(file_path, index=False)

print(f"CSV file '{file_path}' generated successfully.")
