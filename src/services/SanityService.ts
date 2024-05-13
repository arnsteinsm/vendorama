import "dotenv/config";

import { createClient } from "@sanity/client";
import { slugifyString } from "../utils/slugifyString";

export type SanityClientType = ReturnType<typeof createClient>;

// Setup Sanity client configuration
const client: SanityClientType = createClient({
  projectId: "1p7743co",
  dataset: "production",
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
  apiVersion: "2024-01-01",
});

// Initialize product cache
let productCache = new Map<string, string>();

export const initializeProductCache = async (): Promise<
  Map<string, string>
> => {
  if (productCache.size === 0) {
    const products = await fetchAllProducts();
    products.forEach((product: { product: string; _id: string }) => {
      productCache.set(product.product, product._id);
    });
  }
  return productCache;
};

export const fetchAllProducts = async () => {
  const query = '*[_type == "product"]';
  return await client.fetch(query);
};

export async function ensureProductExists(
  productName: string,
): Promise<string> {
  await initializeProductCache(); // Ensure the cache is initialized
  if (productCache.has(productName)) {
    return productCache.get(productName)!;
  } else {
    const productId = slugifyString(productName);
    const newProduct = {
      _type: "product",
      product: productName,
      _id: productId,
    };

    const createdProduct = await client.createIfNotExists(newProduct);
    productCache.set(productName, createdProduct._id);
    return createdProduct._id;
  }
}

export default client;
