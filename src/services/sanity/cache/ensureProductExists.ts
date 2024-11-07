// src/services/sanity/cache/ensureProductExists.ts

import { client } from "@/services/sanity/clients/sanityClient";
import type { Product } from "@/types";
import { slugifyString } from "@/utils/slugifyString";
import { initializeProductCache, productCache } from "./initializeProductCache";

// Ensures a product exists, adding it to the cache and Sanity if necessary
export const ensureProductExists = async (
	productName: string,
): Promise<string> => {
	await initializeProductCache();
	if (productCache.has(productName)) {
		const id = productCache.get(productName);
		if (id) return id;
	}

	const productId = slugifyString(productName);
	const newProduct: Product = {
		_type: "product",
		product: productName,
		_id: productId,
	};

	const createdProduct = await client.createIfNotExists<Product>(newProduct);
	productCache.set(productName, createdProduct._id);
	return createdProduct._id;
};
