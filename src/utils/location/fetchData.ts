import { client as sanityClient } from "..";
import { Vendor } from "types";

/**
 * Fetches vendors that need location updates based on missing or incomplete location data.
 */
export async function fetchVendorsForUpdate(): Promise<Vendor[]> {
  const query = `
        *[_type == "vendor" && (!defined(location) || location->kommune == null || location->fylke == null)] {
            _id,
            vendor_name,
            streetAddress,
            postalCode,
            city,
            location->{_id, city, kommune, fylke}
        }
    `;
  try {
    const vendors = await sanityClient.fetch<Vendor[]>(query);
    console.log(`Fetched ${vendors.length} vendors for update.`);
    return vendors;
  } catch (error) {
    console.error("Error fetching vendors for update:", error);
    throw error;
  }
}
