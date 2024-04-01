import { client } from "./sanityClient";
import { slugifyString } from "./";

export async function initializeProductCache(): Promise<Map<string, string>> {
  const query = '*[_type == "product"]';
  const products = await client.fetch(query);
  const productCache = new Map<string, string>();

  products.forEach((product: { product: string; _id: string }) => {
    const productName = product.product;
    const productId = product._id;
    productCache.set(productName, productId);
  });

  return productCache;
}

export async function ensureProductExists(
  productName: string,
  productCache: Map<string, string>,
): Promise<string> {
  if (productCache.has(productName)) {
    return productCache.get(productName)!; // Non-null assertion since we know it exists
  } else {
    const productId = slugifyString(productName);
    const newProduct = {
      _type: "product",
      product: productName,
      _id: productId!,
    };

    const createdProduct = await client.createIfNotExists(newProduct);
    productCache.set(productName, createdProduct._id);
    return createdProduct._id;
  }
}
