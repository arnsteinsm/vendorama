import "dotenv/config";
import { GoogleSheetService } from "./services/GoogleSheetService";
import { transformVendorData } from "./transformers/vendorTransformer"; // Assuming you have a transformer

const sheetId = process.env.GOOGLE_SHEET_ID;

if (!sheetId) {
  throw new Error("Sheet ID must be defined");
}

async function main() {
  try {
    // Initialize Google Sheet service
    const sheetService = new GoogleSheetService(sheetId!);
    const rawData = await sheetService.fetchSheetData("result"); // Pass the sheet name
    console.log("Sample of fetched data:", rawData.slice(0, 5));

    // Transform vendor data, leveraging product cache handled within SanityService
    const transformedData = await transformVendorData(rawData);
    console.log(
      "Transformed vendor data ready for insertion:",
      transformedData.slice(0, 5),
    );

    // Additional processing can be done here, such as saving transformed data to Sanity
  } catch (error) {
    console.error("Error during application execution:", error);
  }
}

main();
