import { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, Circle, FeatureGroup, useMap } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const COLLECTOR_COLORS = ['#1E90FF', '#11fc82', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

function FlyTo({ position }) {
  const map = useMap();
  useEffect(() => { if (position) map.flyTo(position, 13, { duration: 1.2 }); }, [position, map]);
  return null;
}

function LocationSearchBox({ onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const debounceRef = useRef(null);

  const search = useCallback(async (q) => {
    if (!q || q.length < 2) { setResults([]); return; }
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=8&q=${encodeURIComponent(q)}`
      );
      setResults(await res.json());
    } catch { setResults([]); }
  }, []);

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 400);
  };

  return (
    <div className="map-search-box">
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder="Rechercher : pays, région, ville, quartier, village..."
        className="search-input"
      />
      {results.length > 0 && (
        <ul className="map-search-results">
          {results.map((r) => (
            <li key={r.place_id} onClick={() => {
              onSelect({ lat: parseFloat(r.lat), lon: parseFloat(r.lon), displayName: r.display_name, address: r.address });
              setResults([]);
              setQuery(r.display_name);
            }}>
              {r.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * WorldMap
 * zones: [{ zoneCollecteID, libelle, latitude, longitude, shapeType, polygonCoordinates, radiusMeters, activeCollectorCount }]
 * clients: [{ clientId, clientName, latitude, longitude }] (optional — most clients won't have GPS yet)
 * drawable: show the polygon/circle/rectangle drawing toolbar
 * onDrawComplete(shape), onLocationSelect(locationInfo)
 */
export default function WorldMap({ zones = [], clients = [], drawable = false, onDrawComplete, onLocationSelect, height = 460 }) {
  const [flyTarget, setFlyTarget] = useState(null);
  const featureGroupRef = useRef(null);

  const handleSearchSelect = (loc) => {
    setFlyTarget([loc.lat, loc.lon]);
    onLocationSelect?.(loc);
  };

  const colorFor = (i) => COLLECTOR_COLORS[i % COLLECTOR_COLORS.length];

  return (
    <div className="world-map-wrapper" style={{ height }}>
      <LocationSearchBox onSelect={handleSearchSelect} />

      <MapContainer center={[20, 0]} zoom={2} minZoom={2} worldCopyJump style={{ height: '100%', width: '100%', borderRadius: 8 }}>
        <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <FlyTo position={flyTarget} />

        {drawable && (
          <FeatureGroup ref={featureGroupRef}>
            <EditControl
              position="topright"
              draw={{ polygon: true, circle: true, rectangle: true, polyline: false, marker: false, circlemarker: false }}
              onCreated={(e) => {
                const { layerType, layer } = e;
                let shape;
                if (layerType === 'circle') {
                  const c = layer.getLatLng();
                  shape = { shapeType: 'Circle', latitude: c.lat, longitude: c.lng, radiusMeters: layer.getRadius() };
                } else {
                  const latlngs = layer.getLatLngs()[0].map((p) => [p.lat, p.lng]);
                  shape = { shapeType: layerType === 'rectangle' ? 'Rectangle' : 'Polygon', polygonCoordinates: JSON.stringify(latlngs) };
                }
                onDrawComplete?.(shape);
              }}
            />
          </FeatureGroup>
        )}

        {zones.map((zone, i) => {
          const color = colorFor(i);
          if (zone.shapeType === 'Circle' && zone.latitude && zone.longitude) {
            return (
              <Circle key={zone.zoneCollecteID} center={[zone.latitude, zone.longitude]} radius={zone.radiusMeters || 500}
                pathOptions={{ color, fillColor: color, fillOpacity: 0.25 }}>
                <Popup>{zone.libelle}</Popup>
              </Circle>
            );
          }
          if ((zone.shapeType === 'Polygon' || zone.shapeType === 'Rectangle') && zone.polygonCoordinates) {
            let coords = [];
            try { coords = JSON.parse(zone.polygonCoordinates); } catch { coords = []; }
            if (coords.length === 0) return null;
            return (
              <Polygon key={zone.zoneCollecteID} positions={coords} pathOptions={{ color, fillColor: color, fillOpacity: 0.25 }}>
                <Popup>{zone.libelle}</Popup>
              </Polygon>
            );
          }
          if (zone.latitude && zone.longitude) {
            return (
              <Marker key={zone.zoneCollecteID} position={[zone.latitude, zone.longitude]}>
                <Popup>{zone.libelle}</Popup>
              </Marker>
            );
          }
          return null;
        })}

        {clients.map((c) => c.latitude && c.longitude && (
          <Marker key={c.clientId} position={[c.latitude, c.longitude]}>
            <Popup>{c.clientName}<br />{c.clientCode}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
