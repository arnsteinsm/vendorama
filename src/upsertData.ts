import ProgressBar from "progress";
import { client } from "./utils";
import type { TransformedVendor } from "../types";

async function fetchExistingVendorIds() {
  const query = '*[_type == "vendor"]._id';
  const existingVendorIds = await client.fetch(query);
  return new Set(existingVendorIds); // Use a Set for efficient lookups
}

// Assuming `transformedVendors` is an array of vendor data ready for upsert
export async function upsertVendors(transformedVendors: TransformedVendor[]) {
  //show progress in terminal
  const bar = new ProgressBar(":bar :percent :etas", {
    total: transformedVendors.length,
  });
  const existingVendorIds = await fetchExistingVendorIds();
  const transaction = client.transaction();

  transformedVendors.forEach((vendor) => {
    if (existingVendorIds.has(vendor._id)) {
      transaction.patch(vendor._id, (patch) =>
        patch.set({ products_in_stock: vendor.products_in_stock }),
      );
    } else {
      // Vendor does not exist, prepare to create
      transaction.create({ ...vendor, _id: vendor._id });
    }
    bar.tick();
  });

  // Execute the transaction
  try {
    await transaction.commit();
    console.log("Successfully processed all vendors");
  } catch (error) {
    console.error("Failed to process vendors:", error);
  }
}
