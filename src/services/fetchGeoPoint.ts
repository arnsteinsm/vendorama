// src/services/fetchGeoPoint.ts

import { MapboxClient } from "@/services/MapboxApiService";
import type { Geopoint } from "@/types";

// Initialize the Mapbox client
const mapboxClient = new MapboxClient();

/**
 * Fetches geopoint (latitude and longitude) for a given address.
 * @param streetAddress The street address.
 * @param postalCode The postal code.
 * @param city The city.
 * @returns A Geopoint object with latitude and longitude or null if not found.
 */
export async function fetchGeopoint(
	streetAddress: string,
	postalCode: string,
	city: string,
): Promise<Geopoint | null> {
	const address = `${streetAddress}, ${postalCode}, ${city}`;
	const geocodeData = await mapboxClient.geocodeAddress(address);

	if (geocodeData && geocodeData.features.length > 0) {
		const [lng, lat] = geocodeData.features[0].center;
		return { _type: "geopoint", lat, lng };
	}

	console.warn(`Geopoint not found for address: ${address}`);
	return null;
}
