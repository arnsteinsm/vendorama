// src/utils/resetLocation.ts

import { client } from "@/services/sanity/clients/sanityClient";

/**
 * Fixes invalid `location` fields for vendors in Sanity by unsetting any empty arrays in the `location` field.
 * This function checks for vendors where `location` is defined as an empty array and resets it to ensure
 * consistent data integrity.
 */
export async function fixInvalidLocation(): Promise<void> {
	const query = `*[_type == "vendor" && defined(location)]{
		_id,
		location
	}`;

	const vendors = await client.fetch(query);

	const transaction = client.transaction();
	let updated = 0;

	for (const vendor of vendors) {
		if (Array.isArray(vendor.location) && vendor.location.length === 0) {
			// If location is an empty array, unset it
			transaction.patch(vendor._id, (patch) => patch.unset(["location"]));
			updated++;
		}
	}

	if (updated > 0) {
		try {
			await transaction.commit();
			console.log(
				`Successfully updated ${updated} vendors with invalid locations.`,
			);
		} catch (error) {
			console.error("Failed to update vendors:", error);
		}
	} else {
		console.log("No vendors with invalid location fields found.");
	}
}
