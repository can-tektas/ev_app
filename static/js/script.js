// Initialize the map with a default view (Poznań)
let map = L.map('map').setView([52.4064, 16.9656], 13);

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);



// Get user's geolocation
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
        function (position) {
            const userLat = position.coords.latitude;
            const userLon = position.coords.longitude;

            // Update map view to user's location
            map.setView([userLat, userLon], 13);

            // Add user marker
            L.marker([userLat, userLon])
                .addTo(map)
                .bindPopup("Your Location")
                .openPopup();

            // Fetch recommended stations
            fetch('/recommend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lat: userLat, lon: userLon })
            })
                .then(response => {
                    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
                    return response.json();
                })
                .then(stations => {
                    console.log("Stations received:", stations); // Debug log
                    const resultDiv = document.getElementById("result");
                    let stationsList = "<ul>";

                    stations.forEach(station => {
                        // Add station details to the list
                        stationsList += `<li>${station.name} - ${station.distance} km, ${station.price} €</li>`;

                        // Add station marker to the map
                        L.marker([station.coordinates[1], station.coordinates[0]])
                            .addTo(map)
                            .bindPopup(`${station.name}<br>Distance: ${station.distance} km`);

                        // Fetch and draw the route (using GET)
                        fetch(`/route?start_lon=${userLon}&start_lat=${userLat}&end_lon=${station.coordinates[0]}&end_lat=${station.coordinates[1]}`)
                            .then(response => {
                                if (!response.ok) throw new Error(`Route failed: ${response.status}`);
                                return response.json();
                            })
                            .then(routeData => {
                                console.log("Route data:", routeData); // Debug log
                                if (!routeData.features || routeData.features.length === 0) {
                                    throw new Error("No route found in response");
                                }
                                // Convert [lon, lat] to [lat, lon] for Leaflet
                                const routeCoords = routeData.features[0].geometry.coordinates.map(
                                    coord => [coord[1], coord[0]] // Swap to [lat, lon]
                                );
                                // Draw the route
                                L.polyline(routeCoords, {
                                    color: 'blue',
                                    weight: 4,
                                    opacity: 0.7
                                }).addTo(map);
                            })
                            .catch(error => {
                                console.error("Route error:", error);
                                // Optional: Show error on the station marker
                                L.marker([station.coordinates[1], station.coordinates[0]])
                                    .addTo(map)
                                    .bindPopup(`Route error: ${error.message}`);
                            });
                    });

                    stationsList += "</ul>";
                    resultDiv.innerHTML = stationsList;
                })
                .catch(error => {
                    console.error("Station fetch error:", error);
                    alert("Failed to load stations. Check console for details.");
                });
        },
        function (error) {
            console.error("Geolocation error:", error);
            alert("Could not get your location. Using default view.");
        }
    );
} else {
    alert("Geolocation is not supported by your browser.");
}