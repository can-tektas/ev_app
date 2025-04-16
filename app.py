from flask import Flask, jsonify, request
import requests

app = Flask(__name__)

# Simüle edilmiş şarj istasyonları
stations = [
    {"id": 1, "name": "Station A", "lat": 52.4029, "lon": 16.9192, "rating": 4.2},
    {"id": 2, "name": "Station B", "lat": 52.4387, "lon": 16.9342, "rating": 3.9},
    {"id": 3, "name": "Station C", "lat": 52.4064, "lon": 16.9656, "rating": 4.5},
    {"id": 4, "name": "Station D", "lat": 52.4111, "lon": 16.9413, "rating": 3.7},
    {"id": 5, "name": "Station E", "lat": 52.4025, "lon": 16.9252, "rating": 4.8}
]

# OpenRouteService API anahtarı
API_KEY = '5b3ce3597851110001cf6248131fee57310748b9a61e299dcee2bc23'  # <-- Buraya kendi API anahtarını koy

# Şarj istasyonlarını döner
@app.route('/stations', methods=['GET'])
def get_stations():
    return jsonify(stations)

# Başlangıç ve bitiş koordinatlarına göre rota döner
@app.route('/route', methods=['GET'])
def route():
    try:
        start_lon = float(request.args.get("start_lon"))
        start_lat = float(request.args.get("start_lat"))
        end_lon = float(request.args.get("end_lon"))
        end_lat = float(request.args.get("end_lat"))

        headers = {
            'Authorization': API_KEY,
            'Accept': 'application/json'
        }

        body = {
            "coordinates": [[start_lon, start_lat], [end_lon, end_lat]],
            "geometry_format": "geojson"
        }

        response = requests.post('https://api.openrouteservice.org/v2/directions/driving-car',
                                 json=body, headers=headers)

        if response.status_code == 200:
            return jsonify(response.json())
        else:
            return jsonify({
                'error': 'Route could not be fetched',
                'status': response.status_code,
                'details': response.text
            }), response.status_code
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Uygulama başlatma
if __name__ == '__main__':
    app.run(debug=True)
