// Initialize the map with a default view (Poznań)
let map = L.map('map').setView([52.4064, 16.9656], 13);

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Get user's geolocation and update the map
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
        const userLat = position.coords.latitude;
        const userLon = position.coords.longitude;

        // Update map view to user's location
        map.setView([userLat, userLon], 13);

        // Add marker for user's location
        L.marker([userLat, userLon]).addTo(map)
            .bindPopup("Your Location")
            .openPopup();

        // Fetch recommended charging stations
        fetch('/recommend', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat: userLat, lon: userLon })
        })
        .then(response => response.json())
        .then(stations => {
            const resultDiv = document.getElementById("result");
            let stationsList = "<ul>";

            // Process each station
            stations.forEach(station => {
                stationsList += `
                    <li>
                        ${station.name} - 
                        Distance: ${station.distance} km, 
                        Price: ${station.price} €
                    </li>
                `;

                // Add station marker to the map
                L.marker([station.coordinates[1], station.coordinates[0]])
                    .addTo(map)
                    .bindPopup(`
                        ${station.name}<br>
                        Distance: ${station.distance} km<br>
                        Price: ${station.price} €
                    `);

                // Fetch and draw the route from user to station
                fetch('/route', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        start: [userLon, userLat], // [lon, lat]
                        end: station.coordinates    // [lon, lat]
                    })
                })
                .then(response => response.json())
                .then(routeData => {
                    // Convert route coordinates to Leaflet format [lat, lng]
                    const routePath = routeData.routes[0].geometry.coordinates
                        .map(coord => [coord[1], coord[0]]); // Swap lon/lat to lat/lon

                    // Draw the route on the map
                    L.polyline(routePath, {
                        color: 'blue',
                        weight: 3,
                        opacity: 0.7
                    }).addTo(map);
                })
                .catch(error => console.error('Route error:', error));
            });

            stationsList += "</ul>";
            resultDiv.innerHTML = stationsList;
        })
        .catch(error => console.error('Error fetching stations:', error));
    }, (error) => {
        console.error('Geolocation error:', error);
        alert("Could not get your location. Using default view.");
    });
} else {
    alert("Geolocation is not supported by this browser.");
}