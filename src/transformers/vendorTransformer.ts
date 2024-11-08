// src/transformers/vendorTransformer.ts

import { getProductsInStock } from "@/services/sanity/cache/getProductsInStock";
import {
	cache,
	initializeCaches,
} from "@/services/sanity/cache/initializeCache";
import type { ProductReference, Vendor } from "../models/Vendor";
import type { ExternalVendor } from "../models/externalVendor";
import { keyMapping } from "../models/externalVendor";
import { cleanAndSplitProductNames } from "../utils/productOperations";
import { slugifyString } from "../utils/slugifyString";

export const transformVendorData = async (
	data: ExternalVendor[],
): Promise<Vendor[]> => {
	// Initialize cache at the start of the transformation process
	await initializeCaches();

	// Collect all unique product names across vendors
	const uniqueProductNames = new Set<string>();
	for (const rawVendor of data) {
		const productNames = cleanAndSplitProductNames(rawVendor.PRODUKTNAVN);
		for (const name of productNames) {
			uniqueProductNames.add(name);
		}
	}

	// Ensure all unique products exist in Sanity and retrieve their references
	const productReferences = await getProductsInStock(
		Array.from(uniqueProductNames),
	);
	const productRefMap = new Map(
		productReferences.map((ref) => [ref._ref, ref]),
	);

	// Transform each vendor using the cached product IDs
	const transformedVendors = data.map(async (rawVendor): Promise<Vendor> => {
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
					vendor[vendorKey] = value.trim();
				}
			}
		}

		// Handle products with cached IDs
		const productNames = cleanAndSplitProductNames(rawVendor.PRODUKTNAVN);
		vendor.products_in_stock = productNames
			.map((productName) => {
				const productId = cache.products.get(productName);
				return productId ? productRefMap.get(productId) : undefined;
			})
			.filter((ref): ref is ProductReference => ref !== undefined);

		return vendor as Vendor;
	});

	return Promise.all(transformedVendors);
};
