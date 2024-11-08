// src/services/sanity/cache/getProductsInStock.ts

import type { ProductReference } from "@/models/Vendor";
import { client } from "@/services/sanity/clients/sanityClient";
import { slugifyString } from "@/utils/slugifyString";
import { cache } from "./initializeCache";

/** Ensures each product in the provided list exists in Sanity and retrieves product references.
 */
export const getProductsInStock = async (
	productNames: string[],
): Promise<ProductReference[]> => {
	const results: ProductReference[] = [];
	const newProducts = [];

	for (const productName of productNames) {
		let productId = cache.products.get(productName);

		// If the product doesn't exist in the cache, prepare to create it
		if (!productId) {
			productId = slugifyString(productName);
			cache.products.set(productName, productId); // Cache the new product ID
			newProducts.push({
				_type: "product",
				product: productName,
				_id: productId,
			});
		}

		results.push({
			_type: "reference",
			_ref: productId,
			_key: `productRef-${productId}`,
		} as ProductReference);
	}

	// Batch-create new products in Sanity if there are any
	if (newProducts.length > 0) {
		const transaction = client.transaction();
		for (const newProduct of newProducts) {
			transaction.createIfNotExists(newProduct);
		}
		await transaction.commit();
	}

	return results;
};
