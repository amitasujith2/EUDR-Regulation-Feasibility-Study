# ForestGuard: EUDR Deforestation Project

This project aims to help Phlo Systems comply with the new EU Deforestation Regulation (EUDR), set to be implemented on December 30, 2024. The main goal of the regulation is to promote the consumption of 'deforestation-free' products. 

This feasibility study leverages the powers of Global Forest Watch (GFW) and Google Earth Engine (GEE) to determine if geo-coordinate data is sufficient to provide evidence of deforestation. The benefits of Integrated Deforestation Alerts over Individual alert systems are also discussed.

## Features

- Fetch integrated deforestation alerts from GFW API from 3 satellite datasets ( GLAD-L, GLAD-S2 and RADD).
- Analyse the benefits of integrated deforestation alerts over individual alerts.
- Integrate alert datasets on GEE based on 2 rulesets.
- Upload and process deforestation alert data on GEE for Satellite image visualisatoin.
- Calculate and visualize NDVI (Normalized Difference Vegetation Index) for measuring accurancy and reliability.
- Interactive visualization dashboard using Dash

## Files

### Jupyter Notebooks
1. [ForestGuard: EUDR Deforestation Project.ipynb](ForestGuard: EUDR Deforestation Project.ipynb): This notebook provides the main analysis for the ForestGuard project, leveraging GFW and GEE to analyze deforestation alerts and their implications for compliance with EUDR.
2. Google_Earth_Engine.ipynb: This notebook is used for interacting with Google Earth Engine, including fetching and processing satellite data, calculating NDVI, and analyzing deforestation alerts.
3. Integrated_Alerts_Benefits.ipynb.zip: A zipped notebook that explores the benefits of integrated alerts for detecting deforestation. This analysis helps in understanding the effectiveness of different alert systems and their integration.

## Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/yourusername/yourproject.git
    cd yourproject
    ```

2. Create a virtual environment and activate it:
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
    ```

3. Install the required packages:
    ```bash
    pip install -r requirements.txt
    ```

4. Set up your Google Earth Engine credentials by saving your service account key JSON file and setting the `GOOGLE_APPLICATION_CREDENTIALS` environment variable:
    ```bash
    export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/service-account-file.json"
    ```

## Usage

Run the dashboard:
```bash
python dashboard_dash.py

## LICENSE

This project is licensed under the MIT License. See the LICENSE file for more details.
