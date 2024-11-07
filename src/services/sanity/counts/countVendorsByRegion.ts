// src/services/sanity/counts/countVendorsByRegion.ts

import { client } from "@/services/sanity/clients/sanityClient";

type RegionType = "county" | "municipality";

/**
 * Counts the number of vendors in a given region (county or municipality).
 * @param regionType - The type of the region ("county" or "municipality").
 * @param regionId - The Sanity ID of the region document.
 * @returns The number of vendors in the specified region.
 */
export const countVendorsByRegion = async (
	regionType: RegionType,
	regionId: string,
): Promise<number> => {
	// Construct the query dynamically based on the region type
	const query =
		regionType === "county"
			? `count(*[_type == "vendor" && location->municipality->county._ref == $regionId])`
			: `count(*[_type == "vendor" && location->municipality._ref == $regionId])`;

	try {
		// Fetch the count of vendors linked to the region ID
		const vendorCount = await client.fetch<number>(query, { regionId });
		return vendorCount;
	} catch (error) {
		console.error(
			`Error counting vendors in ${regionType} ${regionId}:`,
			error,
		);
		throw error;
	}
};
