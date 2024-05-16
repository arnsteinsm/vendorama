import ProgressBar from "progress";
import {
  findOrCreateDocument,
  fetchVendorsForUpdate,
  client, // Using the globally configured client from SanityService
  fetchExistingLocations,
  updateGeographicalReferencesAndCounts,
} from "./SanityService";
import BringApiService from "./BringApiService";
import { MapboxClient } from "./MapboxApiService";
import { v4 as uuidv4 } from "uuid";

const bringApiService = new BringApiService(
  process.env.BRING_KEY!,
  process.env.BRING_ID!,
);

export async function processLocationData() {
  const mapboxClient = new MapboxClient();
  const vendors = await fetchVendorsForUpdate();
  const existingLocations = await fetchExistingLocations();
  const municipalities = new Map<string, any>();
  const counties = new Map<string, any>();

  const bar = new ProgressBar(":bar :current/:total (:percent) :etas", {
    total: vendors.length,
    width: 40,
    complete: "=",
    incomplete: " ",
  });

  const transaction = client.transaction();

  try {
    for (const vendor of vendors) {
      if (vendor.postalCode) {
        const locationKey = `${vendor.streetAddress.toLowerCase()}|${vendor.postalCode}`;
        const existingLocation = existingLocations.get(locationKey);

        if (
          !existingLocation ||
          (existingLocation.city &&
            vendor.city &&
            existingLocation.city.toLowerCase() !== vendor.city.toLowerCase())
        ) {
          const bringData = await bringApiService.fetchPostalData(
            vendor.postalCode,
          );
          if (bringData && bringData.postal_codes.length > 0) {
            const { city, municipality, county } = bringData.postal_codes[0];

            let municipalityDoc = municipalities.get(municipality);
            if (!municipalityDoc) {
              municipalityDoc = await findOrCreateDocument(
                "municipality",
                municipality,
              );
              municipalities.set(municipality, municipalityDoc);
            }

            let countyDoc = counties.get(county);
            if (!countyDoc) {
              countyDoc = await findOrCreateDocument("county", county);
              counties.set(county, countyDoc);
            }

            const geocodeData = await mapboxClient.geocodeAddress(
              `${vendor.streetAddress}, ${vendor.postalCode}, ${city}`,
            );
            if (geocodeData && geocodeData.features.length > 0) {
              const [lng, lat] = geocodeData.features[0].center;
              const locationId = `location-${vendor._id}`;

              transaction.createOrReplace({
                _type: "location",
                _id: locationId,
                streetAddress: vendor.streetAddress,
                postalCode: vendor.postalCode,
                city: city,
                geopoint: { _type: "geopoint", lat, lng },
                municipality: {
                  _type: "reference",
                  _ref: municipalityDoc._id,
                  _key: uuidv4(),
                },
                county: {
                  _type: "reference",
                  _ref: countyDoc._id,
                  _key: uuidv4(),
                },
              });

              transaction.patch(vendor._id, {
                set: {
                  location: {
                    _type: "reference",
                    _ref: locationId,
                    _key: uuidv4(),
                  },
                },
              });
            }
          }
        }
      }
      bar.tick();
    }

    await transaction.commit();
    console.log("All vendor locations updated successfully.");
  } catch (error) {
    console.error("Failed to update vendor locations:", error);
  } finally {
    // Perform cleanup or further actions like reference fixing and updating counts
    await updateGeographicalReferencesAndCounts();
  }

  console.log("Location data processing complete.");
}
