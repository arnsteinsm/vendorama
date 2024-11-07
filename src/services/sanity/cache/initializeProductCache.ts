// src/services/sanity/cache/initializeProductCache.ts

import { client } from "@/services/sanity/clients/sanityClient";
import type { Product } from "@/types";

export const productCache = new Map<string, string>();
let isCacheInitialized = false;

// Initialize the product cache by fetching products from Sanity
export const initializeProductCache = async (): Promise<void> => {
	if (!isCacheInitialized) {
		const products = await client.fetch<Product[]>(
			'*[_type == "product"]{product, _id}',
		);
		for (const product of products) {
			if (product.product) {
				productCache.set(product.product, product._id);
			}
		}
		isCacheInitialized = true;
	}
};
