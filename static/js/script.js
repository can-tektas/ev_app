let map = L.map('map').setView([52.4064, 16.9656], 13);

// OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
        function (position) {
            const userLat = position.coords.latitude;
            const userLon = position.coords.longitude;

            map.setView([userLat, userLon], 13);

            L.marker([userLat, userLon])
                .addTo(map)
                .bindPopup("Your Location")
                .openPopup();

            fetch('/recommend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lat: userLat, lon: userLon })
            })
                .then(response => response.json())
                .then(stations => {
                    const resultDiv = document.getElementById("result");
                    let stationsList = "<ul>";

                    stations.forEach(station => {
                        stationsList += `<li>${station.name} - ${station.distance} km, ${station.price} €</li>`;

                        L.marker([station.coordinates[1], station.coordinates[0]])
                            .addTo(map)
                            .bindPopup(`${station.name}<br>Distance: ${station.distance} km`);

                        fetch(`/route?start_lon=${userLon}&start_lat=${userLat}&end_lon=${station.coordinates[0]}&end_lat=${station.coordinates[1]}`)
                            .then(response => response.json())
                            .then(routeData => {
                                const routeCoords = routeData.features[0].geometry.coordinates.map(
                                    coord => [coord[1], coord[0]]
                                );
                                L.polyline(routeCoords, {
                                    color: 'blue',
                                    weight: 4,
                                    opacity: 0.7
                                }).addTo(map);
                            })
                            .catch(error => {
                                console.error("Route error:", error);
                            });
                    });

                    stationsList += "</ul>";
                    resultDiv.innerHTML = stationsList;
                })
                .catch(error => {
                    console.error("Station fetch error:", error);
                    alert("Failed to load stations.");
                });
        },
        function (error) {
            console.error("Geolocation error:", error);
            alert("Could not get your location.");
        }
    );
} else {
    alert("Geolocation is not supported by your browser.");
}
