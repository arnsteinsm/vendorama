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

async function fetchExistingVendorsDetails(): Promise<Record<string, Vendor>> {
  const query = `*[_type == "vendor"]{
    _id,
    streetAddress,
    postalCode,
    city,
    products_in_stock
  }`;
  const vendors: Vendor[] = await client.fetch(query);
  return vendors.reduce<Record<string, Vendor>>((acc, vendor) => {
    acc[vendor._id] = vendor;
    return acc;
  }, {});
}

export async function upsertVendors(transformedVendors: Vendor[]) {
  const bar = new ProgressBar(":bar :percent :etas", {
    total: transformedVendors.length,
  });

  // Get details of existing vendors
  const existingVendorsDetails = await fetchExistingVendorsDetails();
  const newVendorIds = new Set(transformedVendors.map((vendor) => vendor._id));

  const transaction = client.transaction();

  // Iterate over transformed vendors to update or create
  transformedVendors.forEach((vendor) => {
    const existingVendor = existingVendorsDetails[vendor._id];

    if (existingVendor) {
      // Check for changes in address or product stock
      if (
        existingVendor.streetAddress !== vendor.streetAddress ||
        existingVendor.postalCode !== vendor.postalCode
      ) {
        transaction.patch(vendor._id, (patch) =>
          patch.set({
            streetAddress: vendor.streetAddress,
            postalCode: vendor.postalCode,
            city: vendor.city,
            location: null, // Reset location due to address change
          }),
        );
      }
      // Update products in stock
      transaction.patch(vendor._id, (patch) =>
        patch.set({ products_in_stock: vendor.products_in_stock }),
      );
    } else {
      // Vendor does not exist, create a new record
      console.log("Attempting to create new vendor with ID:", vendor._id);
      transaction.create({ ...vendor, _id: vendor._id });
    }
    bar.tick();
  });

  // Handle existing vendors not in new data
  Object.keys(existingVendorsDetails).forEach((vendorId) => {
    if (!newVendorIds.has(vendorId)) {
      // Set products to null or empty array
      transaction.patch(
        vendorId,
        (patch) => patch.set({ products_in_stock: [] }), // or set it to []
      );
    }
  });

  try {
    await transaction.commit();
    console.log("Successfully processed all vendors");
  } catch (error) {
    console.error("Failed to process vendors:", error);
  }
}

export default client;
