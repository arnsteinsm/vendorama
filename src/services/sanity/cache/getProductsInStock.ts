// src/services/sanity/cache/getProductsInStock.ts

import type { ProductReference } from "@/models/Vendor";
import { ensureProductExists } from "./ensureProductExists";
import { productCache } from "./initializeProductCache";

/** Ensures each product in the provided list exists in Sanity and retrieves product references.
 */
export const getProductsInStock = async (
	productNames: string[],
): Promise<ProductReference[]> => {
	const results: ProductReference[] = [];

	for (const productName of productNames) {
		let productId = productCache.get(productName);

		if (!productId) {
			productId = await ensureProductExists(productName);
			productCache.set(productName, productId); // Cache the new product ID
		}

		results.push({
			_type: "reference",
			_ref: productId,
			_key: `productRef-${productId}`,
		} as ProductReference);
	}

	return results;
};
