// src/services/sanity/counts/updateVendorCounts.ts

import { client } from "@/services/sanity/clients/sanityClient";
import ProgressBar from "progress";
import { countVendorsByRegion } from "./countVendorsByRegion";

/** Updates the vendor counts for all municipalities and counties in Sanity. */
export async function updateVendorCounts() {
	const [municipalities, counties] = await Promise.all([
		client.fetch(`*[_type == "municipality"]{_id}`),
		client.fetch(`*[_type == "county"]{_id}`),
	]);

	const transaction = client.transaction();
	const progressBar = new ProgressBar(
		"Updating vendor counts [:bar] :percent :etas",
		{
			complete: "=",
			incomplete: " ",
			width: 50,
			total: municipalities.length + counties.length,
		},
	);

	// Update vendor counts for municipalities
	for (const muni of municipalities) {
		const vendorCount = await countVendorsByRegion("municipality", muni._id);
		transaction.patch(muni._id, { set: { vendorCount } });
		progressBar.tick();
	}

	// Update vendor counts for counties
	for (const county of counties) {
		const totalVendorCount = await countVendorsByRegion("county", county._id);
		transaction.patch(county._id, { set: { totalVendorCount } });
		progressBar.tick();
	}

	await transaction.commit();
	console.log("Vendor counts updated successfully.");
}
