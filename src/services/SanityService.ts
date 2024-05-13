import "dotenv/config";
import { createClient } from "@sanity/client";
import { slugifyString } from "../utils/slugifyString";
import ProgressBar from "progress";
import { Vendor } from "models/Vendor";

export type SanityClientType = ReturnType<typeof createClient>;

const client: SanityClientType = createClient({
  projectId: "1p7743co",
  dataset: "production",
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
  apiVersion: "2024-01-01",
});

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
  await initializeProductCache();
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

async function fetchExistingVendorIds() {
  const query = '*[_type == "vendor"]._id';
  return new Set(await client.fetch(query));
}

export async function upsertVendors(transformedVendors: Vendor[]) {
  const bar = new ProgressBar(":bar :percent :etas", {
    total: transformedVendors.length,
  });
  const existingVendorIds = await fetchExistingVendorIds();
  const transaction = client.transaction();

  transformedVendors.forEach((vendor) => {
    if (existingVendorIds.has(vendor._id)) {
      transaction.patch(vendor._id, (patch) => patch.set({ ...vendor }));
    } else {
      transaction.create({ ...vendor, _id: vendor._id });
    }
    bar.tick();
  });

  try {
    await transaction.commit();
    console.log("Successfully processed all vendors");
  } catch (error) {
    console.error("Failed to process vendors:", error);
  }
}

export default client;
