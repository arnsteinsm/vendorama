// src/services/validateAndFetchLocationData.ts

import BringApiService from "@/services/BringApiService";
import type { BringAPIResponse } from "@/types";
import { slugifyString } from "@/utils/slugifyString";

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

export interface LocationValidationResult {
	city: string;
	municipality: {
		_id: string;
		name: string;
	};
	county: {
		_id: string;
		name: string;
	};
}

export async function validateAndFetchLocationData(
	postalCode: string,
	existingCity: string,
) {
	const bringData: BringAPIResponse =
		await bringApiService.fetchPostalData(postalCode);

	if (bringData && bringData.postal_codes.length > 0) {
		const { city, municipality, county, municipalityId } =
			bringData.postal_codes[0];

		if (!existingCity || city.toLowerCase() === existingCity.toLowerCase()) {
			return {
				city,
				municipality: {
					_id: `municipality-${municipalityId}`, // Assuming municipalityId is provided by Bring
					name: municipality,
				},
				county: {
					_id: `county-${slugifyString(county)}`, // Generate a unique ID using the county name
					name: county,
				},
			};
		}
	}

	return null;
}
