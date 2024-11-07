// src/transformers/vendorTransformer.ts

import {
	ensureProductExists,
	initializeProductCache,
	productCache,
} from "@/services/sanity";
import type { Vendor } from "../models/Vendor";
import type { ExternalVendor } from "../models/externalVendor";
import { keyMapping } from "../models/externalVendor";
import { cleanAndSplitProductNames } from "../utils/productOperations";
import { slugifyString } from "../utils/slugifyString";

// Initialize the product cache once
await initializeProductCache();

export const transformVendorData = async (
	data: ExternalVendor[],
): Promise<Vendor[]> => {
	// Collect all unique product names across vendors
	const uniqueProductNames = new Set<string>();
	for (const rawVendor of data) {
		const productNames = cleanAndSplitProductNames(rawVendor.PRODUKTNAVN);
		for (const name of productNames) {
			uniqueProductNames.add(name);
		}
	}

	// Ensure all unique products exist in Sanity and cache them
	await Promise.all(
		Array.from(uniqueProductNames).map(async (productName) => {
			if (!productCache.has(productName)) {
				const productId = await ensureProductExists(productName);
				productCache.set(productName, productId);
			}
		}),
	);

	// Transform each vendor using the cached product IDs
	return Promise.all(
		data.map(async (rawVendor): Promise<Vendor> => {
			const vendor: Partial<Vendor> = {
				_id: `vendor-${rawVendor.KUNDENR}`,
				_type: "vendor",
				slug: { _type: "slug", current: slugifyString(rawVendor.KUNDENAVN) },
				lastImportTimestamp: Math.floor(Date.now() / 1000),
			};

			// Map properties using key mapping
			for (const [externalKey, vendorKey] of Object.entries(keyMapping)) {
				const value = rawVendor[externalKey as keyof ExternalVendor];
				if (vendorKey && value) {
					if (
						typeof value === "string" &&
						(vendorKey === "vendor_name" ||
							vendorKey === "streetAddress" ||
							vendorKey === "city" ||
							vendorKey === "postalCode")
					) {
						vendor[vendorKey] = value;
					}
				}
			}

			// Handle products with cached IDs
			const productNames = cleanAndSplitProductNames(rawVendor.PRODUKTNAVN);
			vendor.products_in_stock = productNames.map((productName) => {
				const productId = productCache.get(productName); // Retrieve cached ID
				if (!productId) {
					throw new Error(`Product ID not found for product: ${productName}`);
				}
				return {
					_type: "reference",
					_ref: productId,
					_key: `productRef-${productId}`,
				};
			});

			return vendor as Vendor;
		}),
	);
};
