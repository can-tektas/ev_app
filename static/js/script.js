// ... (previous code remains the same until the fetch block)

fetch('/recommend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lat: userLat, lon: userLon })
})
.then(response => response.json())
.then(data => {
    let resultDiv = document.getElementById("result");
    let stationsList = "<ul>";

    data.forEach(station => {
        stationsList += `<li>${station.name} - Distance: ${station.distance} km, Price: ${station.price} €</li>`;

        // Add station marker
        L.marker([station.coordinates[1], station.coordinates[0]]).addTo(map)
            .bindPopup(`${station.name} - ${station.distance} km away`);

        // Fetch and draw the route
        fetch('/route', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                start: [userLon, userLat], // [lon, lat]
                end: station.coordinates     // [lon, lat]
            })
        })
        .then(response => response.json())
        .then(routeData => {
            // Extract coordinates from the route
            const routeCoords = routeData.routes[0].geometry.coordinates;
            // Convert [lon, lat] to [lat, lon] for Leaflet
            const latLngs = routeCoords.map(coord => [coord[1], coord[0]]);
            // Draw the route
            L.polyline(latLngs, { color: 'blue' }).addTo(map);
        })
        .catch(error => console.error('Route error:', error));
    });

    stationsList += "</ul>";
    resultDiv.innerHTML = stationsList;
})
.catch(error => console.error('Error:', error));