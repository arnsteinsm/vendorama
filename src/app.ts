import "dotenv/config";
import { GoogleSheetService } from "./services/GoogleSheetService";
import { transformVendorData } from "./transformers/vendorTransformer";
import { deleteData, upsertVendors } from "./services/SanityService";
import { processLocationData } from "./services/processLocationData"; // Ensure this is imported correctly

const sheetId = process.env.GOOGLE_SHEET_ID;

if (!sheetId) {
  throw new Error("Sheet ID must be defined");
}

async function main() {
  try {
    //delete before import.
    console.log("Starting data deletion...");
    await deleteData();
    console.log("Data deletion complete. Proceeding with data import...");

    // Initialize Google Sheet service
    const sheetService = new GoogleSheetService(sheetId!);
    const rawData = await sheetService.fetchSheetData("result"); // Pass the sheet name
    console.log("Sample of fetched data:", rawData.slice(0, 5));

    // Transform vendor data, leveraging product cache handled within SanityService
    const transformedData = await transformVendorData(rawData);
    console.log(
      "Transformed vendor data ready for insertion:",
      JSON.stringify(
        transformedData.slice(0, 5).map((vendor) => ({
          ...vendor,
          products_in_stock: vendor.products_in_stock.map((product) => ({
            _type: product._type,
            _ref: product._ref,
            _key: product._key,
          })),
        })),
        null,
        2,
      ),
    );

    // Upsert transformed vendor data into Sanity
    await upsertVendors(transformedData);
    console.log("All vendor data has been successfully upserted.");
  } catch (error) {
    console.error("Error during application execution:", error);
  }

  // Process location data
  try {
    await processLocationData();
    console.log("Location data processing complete.");
  } catch (error) {
    console.error("Error during application execution:", error);
  }
}

main();
