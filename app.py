from flask import Flask, request, jsonify
import requests
import os
from flask_cors import CORS  # Add CORS support

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

API_KEY = "5b3ce3597851110001cf6248131fee57310748b9a61e299dcee2bc23"  # Replace with your key

charging_stations = [
    {"name": "Galeria Malta", "coordinates": [16.9656, 52.4064]},
    {"name": "Stary Browar", "coordinates": [16.9252, 52.4025]},
    # ... (other stations)
]

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/recommend', methods=['POST'])
def recommend():
    data = request.get_json()
    user_lon, user_lat = data['lon'], data['lat']
    
    # ... (existing recommendation logic) ...
    return jsonify(sorted_stations)

@app.route('/route', methods=['POST'])  # Strictly POST
def route():
    data = request.get_json()
    try:
        start = data['start']  # [lon, lat]
        end = data['end']      # [lon, lat]
        
        # Validate coordinates
        for coord in [*start, *end]:
            if not isinstance(coord, (int, float)):
                raise ValueError("Coordinates must be numbers")

        headers = {
            'Authorization': API_KEY,
            'Accept': 'application/json'
        }
        body = {
            "coordinates": [start, end],
            "format": "geojson"  # Request GeoJSON for simpler parsing
        }

        response = requests.post(
            'https://api.openrouteservice.org/v2/directions/driving-car',
            json=body,
            headers=headers
        )
        return jsonify(response.json())
    
    except Exception as e:
        return jsonify({"error": str(e)}), 400

if __name__ == "__main__":
    app.run(debug=True)