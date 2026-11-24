import { CITIES_IN } from './popularCitiesIN';
import { CITIES_US } from './popularCitiesUS';

// Pre-populated cities and states for India and USA for instant, zero-latency autocomplete
export const POPULAR_CITIES = {
  IN: CITIES_IN,
  US: CITIES_US
};

// Search locally matched cities
export function searchLocalCities(query, country = 'IN') {
  if (!query || query.trim().length === 0) return [];
  const clean = query.trim().toLowerCase();
  const list = POPULAR_CITIES[country] || [];

  return list.filter(
    (item) =>
      item.city.toLowerCase().includes(clean) ||
      item.state.toLowerCase().includes(clean)
  ).slice(0, 8);
}

// Search remote OpenStreetMap / Nominatim for any other city/town
export async function fetchRemoteCities(query, country = 'IN', signal) {
  if (!query || query.trim().length < 2) return [];
  try {
    const code = country === 'US' ? 'us' : 'in';
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      query.trim()
    )}&countrycodes=${code}&format=json&addressdetails=1&limit=6`;

    const res = await fetch(url, { signal });
    if (!res.ok) return [];
    const data = await res.json();

    return data
      .map((item) => {
        const addr = item.address || {};
        const city =
          addr.city ||
          addr.town ||
          addr.village ||
          addr.county ||
          item.name ||
          '';
        const state = addr.state || '';
        return {
          city,
          state,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon)
        };
      })
      .filter((item) => item.city);
  } catch {
    return [];
  }
}
