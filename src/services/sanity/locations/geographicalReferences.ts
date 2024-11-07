// src/services/sanity/locations/geographicalReferences.ts

import { fetchGeopoint } from "@/services/fetchGeoPoint";
import { client } from "@/services/sanity/clients/sanityClient";
import { validateAndFetchLocationData } from "@/services/validateAndFetchLocationData";
import type { Location, Vendor } from "@/types";
import ProgressBar from "progress";
import { v4 as uuidv4 } from "uuid";

/**
 * Processes vendor location data by fetching postal data, creating locations, and linking references.
 */
export async function processVendorLocations(vendors: Vendor[]) {
	const progressBar = new ProgressBar("Processing [:bar] :percent :etas", {
		total: vendors.length,
		width: 50,
	});

	const transaction = client.transaction();

	for (const vendor of vendors) {
		if (vendor.postalCode) {
			// Validate and potentially update location data
			const updatedLocationData = await validateAndFetchLocationData(
				vendor.postalCode,
				vendor.city || "",
			);

			if (updatedLocationData) {
				const { city, municipality, county } = updatedLocationData;

				// Get or generate geocode data
				const geopoint = await fetchGeopoint(
					vendor.streetAddress ?? "",
					vendor.postalCode ?? "",
					city,
				);

				const newLocation: Location = {
					_type: "location",
					_id: `location-${vendor._id}`,
					streetAddress: vendor.streetAddress ?? undefined,
					postalCode: vendor.postalCode ?? undefined,
					city,
					geopoint: geopoint ?? undefined,
					municipality: {
						_type: "reference",
						_ref: municipality._id,
						_key: uuidv4(), // Ensure each reference has a unique _key
					},
					county: {
						_type: "reference",
						_ref: county._id,
						_key: uuidv4(), // Unique _key for the reference
					},
				};

				transaction.createOrReplace(newLocation);

				// Link vendor to the new location reference
				transaction.patch(vendor._id, {
					set: {
						location: {
							_type: "reference",
							_ref: newLocation._id,
						},
					},
				});
			}
		}
		progressBar.tick();
	}

	await transaction.commit();
	console.log(
		"Vendor locations updated with geographical references successfully.",
	);
}
