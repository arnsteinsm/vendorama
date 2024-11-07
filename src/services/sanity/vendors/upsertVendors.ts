// src/services/sanity/vendors/upsertVendors.ts

import type { Vendor } from "@/models/Vendor";
import { getProductsInStock, initializeProductCache } from "@/services/sanity";
import { client } from "@/services/sanity/clients/sanityClient";
import { fetchExistingVendorsDetails } from "./fetchExistingVendorsDetails";

/** Upserts a batch of vendor records in Sanity, ensuring all associated products are correctly referenced.
 */
export async function upsertVendors(transformedVendors: Vendor[]) {
	// Initialize product cache only once per execution
	await initializeProductCache();

	// Step 1: Collect unique product names needed for this batch of vendors
	const productNames = Array.from(
		new Set(
			transformedVendors.flatMap((vendor) =>
				vendor.products_in_stock.map((productRef) => productRef._ref),
			),
		),
	);

	// Step 2: Get all product references in one go, ensuring they are cached
	const productReferences = await getProductsInStock(productNames);

	// Step 3: Map each product reference to its product ID for quick lookup
	const productRefMap = new Map(
		productReferences.map((ref) => [ref._ref, ref]),
	);

	// Step 4: Prepare a single transaction for all vendor upserts
	const existingVendorsDetails = await fetchExistingVendorsDetails();
	const transaction = client.transaction();

	for (const vendor of transformedVendors) {
		// Set product references based on the cached product map
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
