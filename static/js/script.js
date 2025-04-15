let map = L.map('map').setView([52.4064, 16.9656], 13);
let routeLayer = null; // Rota çizgisi için

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
        let userLat = position.coords.latitude;
        let userLon = position.coords.longitude;

        // Kullanıcı konumu marker
        L.marker([userLat, userLon]).addTo(map)
            .bindPopup("Your Location")
            .openPopup();

        // Flask'a konumu gönder
        fetch('/recommend', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat: userLat, lon: userLon })
        })
        .then(response => response.json())
        .then(data => {
            let resultDiv = document.getElementById("result");
            let stationsList = "<ul>";

            let bestStation = data[0]; // En yüksek skora sahip istasyon
            stationsList += `<li><strong>Recommended:</strong> ${bestStation.name} - Distance: ${bestStation.distance} km, Price: ${bestStation.price} €</li>`;

            // Diğer istasyonları da listele
            for (let i = 1; i < data.length; i++) {
                let station = data[i];
                stationsList += `<li>${station.name} - Distance: ${station.distance} km, Price: ${station.price} €</li>`;
            }

            resultDiv.innerHTML = stationsList;

            // İstasyon marker'ları
            data.forEach(station => {
                L.marker([station.coordinates[1], station.coordinates[0]]).addTo(map)
                    .bindPopup(`${station.name} - ${station.distance} km away`);
            });

            // En iyi istasyon için rota çiz
            fetch('/route', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    start: [userLon, userLat], // [lon, lat]
                    end: bestStation.coordinates // [lon, lat]
                })
            })
            .then(response => response.json())
            .then(routeData => {
                let coords = routeData.routes[0].geometry.coordinates;

                let latlngs = coords.map(coord => [coord[1], coord[0]]); // [lat, lon]

                // Önceki rota varsa temizle
                if (routeLayer) {
                    map.removeLayer(routeLayer);
                }

                // Rota çiz
                routeLayer = L.polyline(latlngs, { color: 'blue' }).addTo(map);
                map.fitBounds(routeLayer.getBounds());
            });

        })
        .catch(error => console.error('Error:', error));
    });
} else {
    alert("Geolocation is not supported by this browser.");
}
