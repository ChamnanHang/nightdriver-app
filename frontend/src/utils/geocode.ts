export interface GeoResult {
  display_name: string;
  lat: string;
  lon: string;
}

export async function searchAddress(query: string): Promise<GeoResult[]> {
  if (!query.trim()) return [];
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`;
  const res = await fetch(url, {
    headers: { "Accept-Language": "en", "User-Agent": "NightDriverApp/1.0" },
  });
  return res.json();
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
  const res = await fetch(url, {
    headers: { "Accept-Language": "en", "User-Agent": "NightDriverApp/1.0" },
  });
  const data = await res.json();
  return data.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}
