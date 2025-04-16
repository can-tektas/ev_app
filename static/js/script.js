let map = L.map('map').setView([52.4064, 16.9656], 13);  // Default: Poznań

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
}).addTo(map);

if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const userLat = position.coords.latitude;
            const userLon = position.coords.longitude;

            // Update map to user's location
            map.setView([userLat, userLon], 13);
            L.marker([userLat, userLon])
                .addTo(map)
                .bindPopup("You are here")
                .openPopup();

            // Fetch recommended stations
            fetch('/recommend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lat: userLat, lon: userLon })
            })
            .then(response => response.json())
            .then(stations => {
                stations.forEach(station => {
                    // Add station marker
                    L.marker([station.coordinates[1], station.coordinates[0]])
                        .addTo(map)
                        .bindPopup(`${station.name}<br>Distance: ${station.distance} km`);

                    // Fetch and draw route (POST)
                    fetch('/route', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            start: [userLon, userLat],
                            end: station.coordinates
                        })
                    })
                    .then(response => response.json())
                    .then(data => {
                        const coords = data.features[0].geometry.coordinates
                            .map(coord => [coord[1], coord[0]]);  // [lat, lon] for Leaflet
                        L.polyline(coords, { color: 'blue', weight: 4 }).addTo(map);
                    })
                    .catch(error => console.error("Route error:", error));
                });
            })
            .catch(error => console.error("Station error:", error));
        },
        (error) => {
            console.error("Geolocation failed:", error);
            alert("Using default location (Poznań)");
        }
    );
} else {
    alert("Geolocation not supported");
}