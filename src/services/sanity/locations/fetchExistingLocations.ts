// src/services/sanity/locations/fetchExistingLocations.ts

import { client } from "@/services/sanity/clients/sanityClient";
import type { Location } from "@/types";

export async function fetchExistingLocations(): Promise<Map<string, Location>> {
	const query =
		'*[_type == "location"]{_id, streetAddress, postalCode, geopoint}';
	const locations = await client.fetch<Location[]>(query);
	const locationsMap = new Map<string, Location>();
	for (const location of locations) {
		const key = `${location.streetAddress?.toLowerCase() ?? ""}|${location.postalCode}`;
		locationsMap.set(key, location);
	}

	return locationsMap;
}
