// utils/mapboxClient.ts
interface MapboxAPIResponse {
  features: Array<{
    center: [number, number];
    id: string;
  }>;
}

export async function fetchMapboxGeocode(
  address: string,
): Promise<MapboxAPIResponse | null> {
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?country=no&limit=1&proximity=ip&types=address%2Cplace&language=nb&access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch geocode data from Mapbox: ${response.statusText}`,
      );
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching Mapbox geocode data:", error);
    return null;
  }
}
