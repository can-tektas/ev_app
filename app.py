from flask import Flask, render_template, request, jsonify
import requests
import random
import os
from flask import request, jsonify
import requests


app = Flask(__name__)

API_KEY = "5b3ce3597851110001cf6248131fee57310748b9a61e299dcee2bc23"

charging_stations = [
    {"name": "Galeria Malta", "coordinates": [16.9656, 52.4064]},
    {"name": "Stary Browar", "coordinates": [16.9252, 52.4025]},
    {"name": "Poznań Plaza", "coordinates": [16.9342, 52.4387]},
    {"name": "Orlen (Małe Garbary 1A)", "coordinates": [16.9413, 52.4111]},
    {"name": "Novotel Poznań Centrum", "coordinates": [16.9192, 52.4029]}
]

def calculate_score(distance_km, occupancy, charging_speed, price):
    w_distance = 0.2
    w_occupancy = 0.3
    w_speed = 0.3
    w_price = 0.1

    score = (
        w_distance * (1 / (distance_km + 1)) +
        w_occupancy * (1 - occupancy) +
        w_speed * (charging_speed / 150) +
        w_price * (1 / price)
    )
    return score

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/recommend', methods=['POST'])
def recommend():
    data = request.get_json()
    user_coords = [data['lon'], data['lat']]  # [lon, lat]

    headers = {
        'Accept': 'application/json',
        'Authorization': API_KEY,
        'Content-Type': 'application/json'
    }

    station_scores = []

    for station in charging_stations:
        station["occupancy"] = random.uniform(0.2, 1)
        station["charging_speed"] = random.choice([22, 50, 120])
        station["price"] = round(random.uniform(1.5, 3.5), 2)

        body = {
            "coordinates": [user_coords, station["coordinates"]]
        }

        response = requests.post('https://api.openrouteservice.org/v2/directions/driving-car',
                                 json=body, headers=headers)

        if response.status_code == 200:
            result = response.json()
            distance = result["routes"][0]["summary"]["distance"] / 1000

            score = calculate_score(distance, station["occupancy"],
                                    station["charging_speed"], station["price"])

            station_scores.append({
                "name": station["name"],
                "distance": round(distance, 2),
                "occupancy": round(station["occupancy"] * 100),
                "charging_speed": station["charging_speed"],
                "price": station["price"],
                "score": round(score, 4),
                "coordinates": station["coordinates"]
            })

    sorted_stations = sorted(station_scores, key=lambda x: x["score"], reverse=True)
    return jsonify(sorted_stations)

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=False, host='0.0.0.0', port=port)

@app.route('/route', methods=['POST'])
def get_route():
    data = request.get_json()
    start = data['start']  # [lon, lat]
    end = data['end']      # [lon, lat]

    headers = {
        'Accept': 'application/json, application/geo+json',
        'Authorization': API_KEY,
        'Content-Type': 'application/json'
    }

    body = {
        "coordinates": [start, end]
    }

    response = requests.post('https://api.openrouteservice.org/v2/directions/driving-car',
                             json=body, headers=headers)

    return jsonify(response.json())


@app.route("/route", methods=["POST"])
def get_route():
    data = request.get_json()
    start = data.get("start")  # [lon, lat]
    end = data.get("end")      # [lon, lat]

    if not start or not end:
        return jsonify({"error": "Invalid coordinates"}), 400

    url = f"https://api.openrouteservice.org/v2/directions/driving-car"
    headers = {
        'Accept': 'application/json',
        'Authorization': API_KEY
    }
    body = {
        "coordinates": [start, end]
    }

    response = requests.post(url, json=body, headers=headers)
    
    if response.status_code == 200:
        return jsonify(response.json())  # JSON rotayı dön
    else:
        return jsonify({"error": response.text}), response.status_code




@app.route('/route', methods=['POST'])
def route():
    data = request.json
    start = data['start']  # [longitude, latitude]
    end = data['end']      # [longitude, latitude]

    # OpenRouteService API URL
    url = f"https://api.openrouteservice.org/v2/directions/driving-car"
    
    headers = {
        'Authorization': '5b3ce3597851110001cf6248131fee57310748b9a61e299dcee2bc23',
        'Accept': 'application/json'
    }

    params = {
        'start': f'{start[0]},{start[1]}',
        'end': f'{end[0]},{end[1]}'
    }

    # API isteği
    response = requests.get(url, headers=headers, params=params)

    if response.status_code == 200:
        return jsonify(response.json())
    else:
        return jsonify({'error': 'Route not found', 'status': response.status_code}), 400
    


