// src/services/sanity/counts/countVendorsByRegion.ts

import { client } from "@/services/sanity/clients/sanityClient";

// Define the structure of the fetched data
interface VendorData {
	municipalityId?: string;
	countyId?: string;
}

// Function to count vendors by municipality
export const countVendorsByMunicipality = async (): Promise<
	Record<string, number>
> => {
	const query = `
    *[_type == "vendor" && defined(location->municipality._ref)]{
      "municipalityId": location->municipality._ref
    }
  `;

	const result = await client.fetch<VendorData[]>(query);

	// Group and count vendors by municipalityId
	return result.reduce(
		(acc, { municipalityId }) => {
			if (municipalityId) {
				acc[municipalityId] = (acc[municipalityId] || 0) + 1;
			}
			return acc;
		},
		{} as Record<string, number>,
	);
};

// Function to count vendors by county
export const countVendorsByCounty = async (): Promise<
	Record<string, number>
> => {
	const query = `
    *[_type == "vendor" && defined(location->county._ref)]{
      "countyId": location->county._ref
    }
  `;

	const result = await client.fetch<VendorData[]>(query);

	// Group and count vendors by countyId
	return result.reduce(
		(acc, { countyId }) => {
			if (countyId) {
				acc[countyId] = (acc[countyId] || 0) + 1;
			}
			return acc;
		},
		{} as Record<string, number>,
	);
};
