import "dotenv/config";

import { deleteAllVendors } from "./utils/sanityOperations"; // Adjust the import path as necessary
import { fetchDataFromGoogleSheets } from "./fetchData";
import { transformVendorData } from "./transformData";
import { upsertVendors } from "./upsertData";

// Assuming the sheetId is defined somewhere in your script
const sheetId = process.env.GOOGLE_SHEET_ID;

async function main() {
  try {
    // Delete all existing vendors before proceeding with the new import
    // await deleteAllVendors();
    // console.log("Deleted all existing vendors.");

    const data = await fetchDataFromGoogleSheets(sheetId!);
    console.log("Fetched data:", data.slice(0, 5)); // Assuming `data` is already the array you expect

    const transformedData = await transformVendorData(data);
    console.log("Transformed data:", transformedData.slice(0, 5)); // Now `transformedData` is awaited and should be an array

    await upsertVendors(transformedData);
    console.log("All vendors have been processed successfully.");
  } catch (error) {
    console.error("Error in processing data:", error);
  }
}

main();
