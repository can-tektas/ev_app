let map = L.map('map').setView([52.4064, 16.9656], 13); // Starting map position (Poznań)

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Get user's geolocation
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
        let userLat = position.coords.latitude;
        let userLon = position.coords.longitude;

        // Add marker for user's location
        L.marker([userLat, userLon]).addTo(map)
            .bindPopup("Your Location")
            .openPopup();

        // Send request to the Flask server to get recommended stations
        fetch('/recommend', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat: userLat, lon: userLon })
        })
        .then(response => response.json())
        .then(data => {
            let resultDiv = document.getElementById("result");
            let stationsList = "<ul>";

            // List each station and add a marker to the map
            data.forEach(station => {
                stationsList += `<li>${station.name} - Distance: ${station.distance} km, Price: ${station.price} €</li>`;

                // Add station marker to the map
                L.marker([station.coordinates[1], station.coordinates[0]]).addTo(map)
                    .bindPopup(`${station.name} - ${station.distance} km away`)
                    .openPopup();
            });

            stationsList += "</ul>";
            resultDiv.innerHTML = stationsList;
        })
        .catch(error => console.error('Error:', error));
    });
} else {
    alert("Geolocation is not supported by this browser.");
}
