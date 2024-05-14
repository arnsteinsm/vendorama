import { Vendor } from "models/Vendor";
import client from "../services/SanityService";

async function fixInvalidLocation() {
  const query = `*[_type == "vendor" && defined(location)]{
    _id,
    location
  }`;

  const vendors = await client.fetch(query);

  const transaction = client.transaction();
  let updated = 0;

  vendors.forEach((vendor: Vendor) => {
    if (Array.isArray(vendor.location) && vendor.location.length === 0) {
      // If location is an empty array, unset it
      transaction.patch(vendor._id, (patch) => patch.unset(["location"]));
      updated++;
    }
  });

  if (updated > 0) {
    try {
      await transaction.commit();
      console.log(`Successfully updated ${updated} vendors.`);
    } catch (error) {
      console.error("Failed to update vendors:", error);
    }
  } else {
    console.log("No vendors with invalid location fields found.");
  }
}

fixInvalidLocation();
