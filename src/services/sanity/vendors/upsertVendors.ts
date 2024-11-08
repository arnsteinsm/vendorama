// src/services/sanity/vendors/upsertVendors.ts

import type { Vendor } from "@/models/Vendor";
import { getProductsInStock } from "@/services/sanity/cache/getProductsInStock";
import { initializeCaches } from "@/services/sanity/cache/initializeCache";
import { client } from "@/services/sanity/clients/sanityClient";
import { fetchExistingVendorsDetails } from "./fetchExistingVendorsDetails";

/** Upserts a batch of vendor records in Sanity, ensuring all associated products are correctly referenced.
 */
export async function upsertVendors(transformedVendors: Vendor[]) {
	// Initialize all caches once at the start
	await initializeCaches();

	// Step 1: Collect unique product names required for this batch of vendors
	const productNames = Array.from(
		new Set(
			transformedVendors.flatMap((vendor) =>
				vendor.products_in_stock.map((productRef) => productRef._ref),
			),
		),
	);

	// Step 2: Ensure all products exist in Sanity and cache their references
	const productReferences = await getProductsInStock(productNames);

	// Step 3: Map each product reference to its product ID for quick lookup
	const productRefMap = new Map(
		productReferences.map((ref) => [ref._ref, ref]),
	);

	// Step 4: Fetch existing vendors in Sanity
	const existingVendorsDetails = await fetchExistingVendorsDetails();

	// Step 5: Prepare a single transaction for all vendor upserts
	const transaction = client.transaction();

	for (const vendor of transformedVendors) {
		// Update product references based on the cache
		vendor.products_in_stock = vendor.products_in_stock.map(
			(productRef) => productRefMap.get(productRef._ref) as typeof productRef,
		);

		// Upsert vendor: create or update in a single batch
		const existingVendor = existingVendorsDetails[vendor._id];
		if (existingVendor) {
			transaction.patch(vendor._id, (patch) => patch.set(vendor));
		} else {
			transaction.create(vendor);
		}
	}

	// Commit transaction after preparing all upserts
	await transaction.commit();
}
