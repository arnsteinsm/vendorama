import ProgressBar from "progress";
import { fetchVendorsForUpdate } from "../sanityOperations";
import { processVendors } from "./processVendors";

export async function processLocationData() {
  try {
    const vendors = await fetchVendorsForUpdate();
    const bar = new ProgressBar(":bar :current/:total (:percent) :etas", {
      total: vendors.length,
      width: 40,
      complete: "=",
      incomplete: " ",
    });

    await processVendors(vendors, bar);

    bar.complete && console.log("Geocoding complete!");
  } catch (error) {
    console.error("Failed to process location data:", error);
  }
}

processLocationData();
