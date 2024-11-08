// src/services/sanity/counts/updateVendorCounts.ts

import { client } from "@/services/sanity/clients/sanityClient";
import ProgressBar from "progress";
import {
	countVendorsByCounty,
	countVendorsByMunicipality,
} from "./countVendorsByRegion";

/** Updates the vendor counts for all municipalities and counties in Sanity. */
export async function updateVendorCounts() {
	// Fetch vendor counts in one go using the optimized counting functions
	const [municipalityCounts, countyCounts] = await Promise.all([
		countVendorsByMunicipality(),
		countVendorsByCounty(),
	]);

	const transaction = client.transaction();
	const totalRegions =
		Object.keys(municipalityCounts).length + Object.keys(countyCounts).length;
	const progressBar = new ProgressBar(
		"Updating vendor counts [:bar] :percent :etas",
		{
			complete: "=",
			incomplete: " ",
			width: 50,
			total: totalRegions,
		},
	);

	// Update vendor counts for each municipality based on the fetched counts
	for (const [municipalityId, vendorCount] of Object.entries(
		municipalityCounts,
	)) {
		transaction.patch(municipalityId, { set: { vendorCount } });
		progressBar.tick();
	}

	// Update vendor counts for each county based on the fetched counts
	for (const [countyId, totalVendorCount] of Object.entries(countyCounts)) {
		transaction.patch(countyId, { set: { totalVendorCount } });
		progressBar.tick();
	}

	await transaction.commit();
	console.log("Vendor counts updated successfully.");
}
