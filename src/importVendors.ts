import "dotenv/config";

import { fetchDataFromGoogleSheets } from "./fetchData";
import { transformVendorData } from "./transformData";
import { upsertVendors } from "./upsertData";
import {
  // deleteAllVendors,
  cleanAndSplitProductNames,
  initializeProductCache,
  ensureProductExists,
} from "./utils";

// Assuming the sheetId is defined somewhere in your script
const sheetId = process.env.GOOGLE_SHEET_ID;

async function main() {
  try {
    // Delete all existing vendors before proceeding with the new import
    // await deleteAllVendors();
    // console.log("Deleted all existing vendors.");

    const data = await fetchDataFromGoogleSheets(sheetId!);
    console.log("Fetched data:", data.slice(0, 5));

    // Initialize and update product cache
    let productCache = await initializeProductCache();
    let allProducts = new Set(
      data.flatMap((vendor) =>
        cleanAndSplitProductNames(vendor["PRODUKTNAVN"]),
      ),
    );
    for (let productName of allProducts) {
      if (!productCache.has(productName)) {
        const productId = await ensureProductExists(productName, productCache);
        productCache.set(productName, productId);
      }
    }

    // Transform vendor data using the updated product cache
    const transformedData = await transformVendorData(data, productCache);
    console.log("Transformed data:", transformedData.slice(0, 5));

    // Upsert the transformed vendor data
    await upsertVendors(transformedData);
    console.log("All vendors have been processed successfully.");
  } catch (error) {
    console.error("Error in processing data:", error);
  }
}

main();
