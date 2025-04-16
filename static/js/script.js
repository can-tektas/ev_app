const map = L.map('map').setView([52.396032, 16.9508864], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

let userMarker = null;
let routePolyline = null;

// Şarj istasyonu örnek verileri (simülasyon)
const stations = [
  { name: "Station A", lat: 52.4029, lon: 16.9192, score: 78 },
  { name: "Station B", lat: 52.4387, lon: 16.9342, score: 92 },
  { name: "Station C", lat: 52.4064, lon: 16.9656, score: 85 },
  { name: "Station D", lat: 52.4111, lon: 16.9413, score: 88 },
  { name: "Station E", lat: 52.4025, lon: 16.9252, score: 75 }
];

// En iyi skora sahip istasyonu bul
function getBestStation(stations) {
  return stations.reduce((best, current) => (current.score > best.score ? current : best));
}

// Kullanıcının konumunu al ve haritada göster
navigator.geolocation.getCurrentPosition(position => {
  const userLat = position.coords.latitude;
  const userLon = position.coords.longitude;

  // Kullanıcı konumunu işaretle
  userMarker = L.marker([userLat, userLon]).addTo(map)
    .bindPopup("Senin Konumun").openPopup();

  // En iyi istasyonu seç
  const bestStation = getBestStation(stations);

  // En iyi istasyonu haritaya ekle
  const stationMarker = L.marker([bestStation.lat, bestStation.lon]).addTo(map)
    .bindPopup(`${bestStation.name} - Skor: ${bestStation.score}`);

  // Rota çiz
  drawRoute(userLon, userLat, bestStation.lon, bestStation.lat);
}, error => {
  console.error("Konum alınamadı:", error);
});

// OpenRouteService ile rota çizen fonksiyon
function drawRoute(startLon, startLat, endLon, endLat) {
  const apiKey = '5b3ce3597851110001cf6248131fee57310748b9a61e299dcee2bc23';
  const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${apiKey}&start=${startLon},${startLat}&end=${endLon},${endLat}`;

  fetch(url, {
    headers: {
      'Accept': 'application/json'
    }
  })
    .then(response => response.json())
    .then(data => {
      const coords = data.features[0].geometry.coordinates;
      const latlngs = coords.map(coord => [coord[1], coord[0]]); // [lat, lon] formatına çevir

      // Eski rota varsa sil
      if (routePolyline) {
        map.removeLayer(routePolyline);
      }

      // Yeni rotayı çiz
      routePolyline = L.polyline(latlngs, { color: 'blue' }).addTo(map);
      map.fitBounds(routePolyline.getBounds());
    })
    .catch(error => {
      console.error("Rota çizimi sırasında hata oluştu:", error);
    });
}
