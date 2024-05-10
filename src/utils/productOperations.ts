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

/**
 * Cleans and splits a string of product names separated by semicolons into an array of cleaned product names.
 * @param produktnavn The string containing product names separated by semicolons.
 * @returns An array of cleaned product names.
 */
export function cleanAndSplitProductNames(produktnavn: string): string[] {
  if (!produktnavn) {
    return [];
  }
  // Split the string by semicolons, then clean and trim each product name
  return (
    produktnavn
      .split(";")
      .map((name) =>
        name
          // Remove volume, weight, and other numeric information, but keep percentages
          .replace(/(\d+(\.\d+)?(?!\d*%)\w*)/g, "")
          // Trim whitespace and remove trailing punctuation
          .trim()
          .replace(/[.,]$/g, ""),
      )
      // Filter out any empty strings that may result from the cleaning process
      .filter((name) => name !== "")
  );
}
