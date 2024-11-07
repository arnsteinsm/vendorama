// src/app.ts

require("dotenv").config();

import { GoogleSheetService } from "@/services/GoogleSheetService";
import { deleteData, upsertVendors } from "@/services/sanity";
import { transformVendorData } from "@/transformers/vendorTransformer";
import ProgressBar from "progress";
import type { Vendor } from "./models/Vendor";

const sheetId = process.env.GOOGLE_SHEET_ID;

if (!sheetId)
	throw new Error("GOOGLE_SHEET_ID environment variable is required");

async function main() {
	console.log("Starting data deletion...");
	const typesToDelete = ["vendor"];
	await deleteData(typesToDelete);
	console.log("Data deletion complete. Proceeding with data import...");

	const sheetService = new GoogleSheetService(sheetId as string);
	const rawData = await sheetService.fetchSheetData("result");
	console.log("Fetched data sample (first 5 rows):", rawData.slice(0, 5));

	// Initialize progress bar and array to hold all transformed vendors
	const progressBar = new ProgressBar(
		"Processing vendors [:bar] :percent :etas",
		{
			complete: "=",
			incomplete: " ",
			width: 40,
			total: rawData.length,
		},
	);

	const allTransformedVendors: Vendor[] = [];

	// Transform data in batches and update progress bar
	const batchSize = 50;
	for (let i = 0; i < rawData.length; i += batchSize) {
		const batch = rawData.slice(i, i + batchSize);
		const transformedBatch = await transformVendorData(batch);
		allTransformedVendors.push(...transformedBatch);
		progressBar.tick(batch.length);
	}
	console.log(
		"\nTransformed vendor data (first 5 vendors):",
		allTransformedVendors.slice(0, 5),
	);

	// Upsert all vendors in a single transaction
	await upsertVendors(allTransformedVendors);
	console.log(
		"\nBatch processing complete. All vendors have been upserted in a single transaction.",
	);
}

main().catch((error) => {
	console.error("Error in main function execution:", error);
});
