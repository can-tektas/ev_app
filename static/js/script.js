let map = L.map('map').setView([52.4064, 16.9656], 13); // Poznań başlangıç

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Global değişkenler
let userLat, userLon;

// Kullanıcının konumunu al
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function (position) {
        userLat = position.coords.latitude;
        userLon = position.coords.longitude;

        L.marker([userLat, userLon]).addTo(map)
            .bindPopup("Your Location")
            .openPopup();

        // Flask backend’e öneri isteği at
        fetch('/recommend', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat: userLat, lon: userLon })
        })
            .then(response => response.json())
            .then(data => {
                let resultDiv = document.getElementById("result");
                let stationsList = "<ul>";

                // En yüksek puanlı istasyonu seç
                const bestStation = data[0];

                data.forEach(station => {
                    stationsList += `<li>${station.name} - Distance: ${station.distance} km, Price: ${station.price} €</li>`;

                    L.marker([station.coordinates[1], station.coordinates[0]]).addTo(map)
                        .bindPopup(`${station.name} - ${station.distance} km away`);
                });

                stationsList += "</ul>";
                resultDiv.innerHTML = stationsList;

                // Rota çizimi için istek at
                fetch('/route', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        start: [userLon, userLat],
                        end: bestStation.coordinates
                    })
                })
                    .then(response => response.json())
                    .then(routeData => {
                        const coordinates = routeData.routes[0].geometry.coordinates;

                        // Koordinatları Leaflet formatına çevir
                        const latlngs = coordinates.map(coord => [coord[1], coord[0]]);

                        // Rota çiz
                        L.polyline(latlngs, { color: 'black', weight: 8 }).addTo(map);
                    })
                    .catch(err => {
                        console.error("Rota çizimi hatası:", err);
                    });
            })
            .catch(error => console.error('Error:', error));
    });
} else {
    alert("Geolocation is not supported by this browser.");
}
