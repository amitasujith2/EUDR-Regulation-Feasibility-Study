import dash
from dash import dcc, html
from dash.dependencies import Input, Output
import plotly.express as px
import pandas as pd
import folium

# Load the data
file_path = 'farmer_data_deforestation_alerts_summary.csv'
data = pd.read_csv(file_path)

# Convert the 'Production Date' column to datetime
data['Production Date'] = pd.to_datetime(data['Production Date'], format='%d/%m/%y')

# Initialize the Dash app
app = dash.Dash(__name__)

# Define the layout of the app
app.layout = html.Div([
    html.H1('Deforestation Alerts Dashboard'),
    dcc.Graph(id='total-alerts-over-time'),
    dcc.Graph(id='total-alerts-by-product-type'),
    dcc.Graph(id='alerts-by-deforestation-driver'),
    dcc.Graph(id='overall-confidence-by-product-type'),
    html.Iframe(id='folium-map', srcDoc=open('map_with_layers.html', 'r').read(), width='100%', height='600')
])

# Define callbacks to update the graphs based on the data
@app.callback(
    Output('total-alerts-over-time', 'figure'),
    Input('total-alerts-over-time', 'id')
)
def update_total_alerts_over_time(_):
    date_alerts = data.groupby('Production Date')['Total Alerts'].sum().reset_index()
    fig = px.line(date_alerts, x='Production Date', y='Total Alerts', title='Total Deforestation Alerts Over Time')
    return fig

@app.callback(
    Output('total-alerts-by-product-type', 'figure'),
    Input('total-alerts-by-product-type', 'id')
)
def update_total_alerts_by_product_type(_):
    product_alerts = data.groupby('Product Type')['Total Alerts'].sum().reset_index()
    fig = px.bar(product_alerts, x='Product Type', y='Total Alerts', title='Total Deforestation Alerts by Product Type')
    return fig

@app.callback(
    Output('alerts-by-deforestation-driver', 'figure'),
    Input('alerts-by-deforestation-driver', 'id')
)
def update_alerts_by_deforestation_driver(_):
    driver_alerts = data.groupby('Deforestation Driver')['Total Alerts'].sum().reset_index()
    fig = px.pie(driver_alerts, names='Deforestation Driver', values='Total Alerts', title='Deforestation Alerts by Driver')
    return fig

@app.callback(
    Output('overall-confidence-by-product-type', 'figure'),
    Input('overall-confidence-by-product-type', 'id')
)
def update_overall_confidence_by_product_type(_):
    confidence_data = data.groupby('Product Type')['Overall Confidence %'].mean().reset_index()
    fig = px.bar(confidence_data, x='Product Type', y='Overall Confidence %', title='Overall Confidence Percentage by Product Type')
    return fig

# Run the app
if __name__ == '__main__':
    app.run_server(debug=True)