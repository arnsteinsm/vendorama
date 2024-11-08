// src/app.ts

require("dotenv").config();

import { GoogleSheetService } from "@/services/GoogleSheetService";
import { transformVendorData } from "@/transformers/vendorTransformer";
import {
	clearCaches,
	initializeCaches,
} from "./services/sanity/cache/initializeCache";
import { updateVendorCounts } from "./services/sanity/counts/updateVendorCounts";
import { deleteData } from "./services/sanity/delete/deleteData";
import { processVendorLocations } from "./services/sanity/locations/processVendorLocations";
import { updateBoundingBoxes } from "./services/sanity/locations/updateBoundingBoxes";
import { upsertVendors } from "./services/sanity/vendors/upsertVendors";

const sheetId = process.env.GOOGLE_SHEET_ID;

if (!sheetId)
	throw new Error("GOOGLE_SHEET_ID environment variable is required");

async function main() {
	try {
		console.log("Initializing caches...");
		await initializeCaches();
		console.log("Caches initialized.");

		// Optional: Uncomment if you need data deletion
		console.log("Starting data deletion...");
		const typesToDelete = ["vendor", "location", "municipality", "county"];
		await deleteData(typesToDelete);
		console.log("Data deletion complete. Proceeding with data import...");

		const sheetService = new GoogleSheetService(sheetId as string);
		const rawData = await sheetService.fetchSheetData("result");
		console.log("Fetched data sample (first 2 rows):", rawData.slice(0, 2));

		// Transform raw data once and store the result
		const transformedData = await transformVendorData(rawData);
		console.log(
			"\nTransformed vendor data (first 2 vendors):",
			transformedData.slice(0, 2),
		);

		// Upsert all vendors in a single transaction
		await upsertVendors(transformedData);
		console.log(
			"\nBatch processing complete. All vendors have been upserted in a single transaction.",
		);

		// Process vendor locations
		await processVendorLocations(transformedData);
		console.log("Location processing complete.");

		// Update bounding boxes based on location data
		console.log("Updating bounding boxes...");
		await updateBoundingBoxes();
		console.log("Bounding boxes updated successfully.");

		// Update vendor counts
		console.log("Updating vendor counts...");
		await updateVendorCounts();
		console.log("Vendor counts updated successfully.");
	} catch (error) {
		console.error("Error during operation:", error);
	} finally {
		// Clear all caches after operations are complete or if an error occurs
		clearCaches();
		console.log("All caches have been cleared.");
	}
}

main().catch((error) => {
	console.error("Error in main function execution:", error);
});
