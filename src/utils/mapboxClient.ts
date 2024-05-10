// utils/mapboxClient.ts

import "dotenv/config";

export interface MapboxAPIResponse {
  features: Array<{
    center: [number, number];
    id: string;
    place_name: string;
  }>;
}

import { makeAPIRequest } from "./apiClient";

export async function fetchMapboxGeocode(
  address: string,
): Promise<MapboxAPIResponse> {
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?country=no&access_token=${process.env.MAPBOX_TOKEN}`;
  return makeAPIRequest(url, {});
}
