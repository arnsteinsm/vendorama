// src/services/validateAndFetchLocationData.ts

import BringApiService from "@/services/BringApiService";
import type { BringAPIResponse } from "@/types";

// Initialize the Bring API client
const bringApiService = new BringApiService(
	process.env.BRING_KEY ?? "",
	process.env.BRING_ID ?? "",
);

/**
 * Validates location data by fetching city, municipality, and county using the Bring API.
 * @param postalCode The postal code to validate.
 * @param existingCity The existing city name, if available.
 * @returns An object with city, municipality, and county if validated successfully, or null if validation fails.
 */
export async function validateAndFetchLocationData(
	postalCode: string,
	existingCity: string,
): Promise<{
	city: string;
	municipality: { _id: string; name: string };
	county: { _id: string; name: string };
} | null> {
	const bringData: BringAPIResponse =
		await bringApiService.fetchPostalData(postalCode);

	if (bringData && bringData.postal_codes.length > 0) {
		const { city, municipality, county } = bringData.postal_codes[0];

		// Only return if city matches or if no existing city is provided
		if (!existingCity || city.toLowerCase() === existingCity.toLowerCase()) {
			return {
				city,
				municipality: {
					_id: `municipality-${municipality}`,
					name: municipality,
				},
				county: { _id: `county-${county}`, name: county },
			};
		}
		console.warn(
			`City mismatch for postal code ${postalCode}: expected ${existingCity}, got ${city}`,
		);
	} else {
		console.warn(`No data found for postal code: ${postalCode}`);
	}

	return null;
}
