import ProgressBar from "progress";
import { TransformedVendor } from "../types";
import {
  fetchBringData,
  fetchMapboxGeocode,
  findOrCreateLocation,
  findOrCreateMunicipality,
  findOrCreateCounty,
  client,
} from "./utils";

export async function geocodeVendors(
  vendors: TransformedVendor[],
): Promise<TransformedVendor[]> {
  const bar = new ProgressBar("Geocoding vendors [:bar] :percent :etas", {
    total: vendors.length,
    width: 20,
  });

  // Start a transaction
  const transaction = client.transaction();

  for (const vendor of vendors) {
    // Skip geocoding if vendor already has geocode data
    if (vendor.location && vendor.location._ref) {
      console.log(
        `Skipping geocoding for vendor ${vendor.vendor_name} as location already exists.`,
      );
      bar.tick();
      continue;
    }

    try {
      const bringData = await fetchBringData(vendor.postalCode);
      if (bringData && bringData.postal_codes.length > 0) {
        const address = `${vendor.streetAddress}, ${vendor.postalCode}, ${bringData.postal_codes[0].city}`;
        const mapboxData = await fetchMapboxGeocode(address);
        if (mapboxData && mapboxData.features.length > 0) {
          const latitude = mapboxData.features[0].center[1];
          const longitude = mapboxData.features[0].center[0];

          const location = await findOrCreateLocation(
            {
              streetAddress: vendor.streetAddress,
              postalCode: vendor.postalCode,
              city: bringData.postal_codes[0].city,
              geopoint: { lat: latitude, lng: longitude },
            },
            transaction,
          );

          const municipality = await findOrCreateMunicipality(
            bringData.postal_codes[0].municipality,
            transaction,
          );
          const county = await findOrCreateCounty(
            bringData.postal_codes[0].county,
            transaction,
          );

          // Set references directly in the transaction
          transaction.patch(location._id, {
            set: {
              kommune: { _type: "reference", _ref: municipality._id },
              fylke: { _type: "reference", _ref: county._id },
            },
          });
          vendor.location = { _type: "reference", _ref: location._id };
        }
      }
    } catch (error) {
      console.error(`Failed to geocode vendor ${vendor.vendor_name}:`, error);
    }
    bar.tick();
  }

  // Commit the transaction
  await transaction.commit();
  console.log("Transaction committed successfully.");

  return vendors; // Return the updated vendors array with geocode data
}
