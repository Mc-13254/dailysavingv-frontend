import { useState, useRef } from 'react';

/**
 * Free-text search across every place on Earth (country, region, city,
 * district, village) via OpenStreetMap's Nominatim API — no API key, no
 * locally-maintained city list to keep up to date. Selecting a result calls
 * onSelect with the parsed address so the caller can autofill Country/City/
 * District/Street/PostalCode/Latitude/Longitude in one click.
 */
export default function PlaceSearchInput({ placeholder = 'Rechercher une ville, un quartier…', onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  const search = async (q) => {
    if (!q || q.length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=8&q=${encodeURIComponent(q)}`
      );
      setResults(await res.json());
    } catch { setResults([]); }
    finally { setLoading(false); }
  };

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 400);
  };

  const pick = (r) => {
    const a = r.address || {};
    onSelect({
      country: a.country || '',
      city: a.city || a.town || a.village || a.municipality || '',
      district: a.suburb || a.city_district || a.county || '',
      neighborhood: a.neighbourhood || a.quarter || '',
      street: a.road || '',
      houseNumber: a.house_number || '',
      postalCode: a.postcode || '',
      latitude: parseFloat(r.lat),
      longitude: parseFloat(r.lon),
    });
    setResults([]);
    setQuery(r.display_name);
  };

  return (
    <div className="relative">
      <input value={query} onChange={handleChange} placeholder={placeholder} />
      {loading && <div className="text-[11px] text-gray-400 mt-1">Recherche…</div>}
      {results.length > 0 && (
        <ul className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-56 overflow-y-auto text-xs normal-case">
          {results.map((r) => (
            <li key={r.place_id} className="px-2.5 py-1.5 cursor-pointer hover:bg-gray-50" onClick={() => pick(r)}>
              {r.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
