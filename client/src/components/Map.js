import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const busIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448339.png',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
});

// ✅ FIX: मैप को लोड होते ही सही साइज़ में रेंडर करने के लिए
// Map.js में MapFixer को अपडेट करें
function MapFixer({ busLocation }) {
  const map = useMap();
  useEffect(() => {
    // जब भी busLocation पहली बार आए या बदले, मैप को री-साइज करें
    const timer = setTimeout(() => {
      map.invalidateSize();
      if (busLocation) {
        map.setView([busLocation.lat, busLocation.lng], 15);
      }
    }, 500); // 500ms का डिले बेहतर काम करता है
    return () => clearTimeout(timer);
  }, [map, busLocation]);
  return null;
}

function RecenterMap({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position && position[0] && position[1]) {
      map.flyTo(position, 15, { animate: true, duration: 1.5 });
    }
  }, [position, map]);
  return null;
}

export default function Map({ busLocation }) {
  const defaultCenter = [21.1458, 79.0882];

  return (
    <div style={{ height: '100%', width: '100%', minHeight: '400px' }}>
      <MapContainer center={defaultCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapFixer />
        {busLocation && busLocation.lat && (
          <>
            <Marker position={[busLocation.lat, busLocation.lng]} icon={busIcon}>
              <Popup>Bus {busLocation.routeId} is here!</Popup>
            </Marker>
            <RecenterMap position={[busLocation.lat, busLocation.lng]} />
          </>
        )}
      </MapContainer>
    </div>
  );
}