import ProgressBar from "progress";
import {
  client as sanityClient,
  fetchBringData,
  fetchVendorsForUpdate,
  findOrCreateDocument,
} from "./utils";

async function processLocationData() {
  const vendors = await fetchVendorsForUpdate();
  const bar = new ProgressBar(":bar :current/:total (:percent) :etas", {
    total: vendors.length,
    width: 40,
    complete: "=",
    incomplete: " ",
  });

  const municipalities = new Map<string, any>();
  const counties = new Map<string, any>();
  const transaction = sanityClient.transaction();
  let transactionHasChanges = false;

  for (const vendor of vendors) {
    if (vendor.postalCode) {
      const bringData = await fetchBringData(vendor.postalCode);
      if (bringData && bringData.postal_codes.length > 0) {
        const {
          city: bringCity,
          municipality,
          county,
        } = bringData.postal_codes[0];

        let municipalityDoc = municipalities.get(municipality);
        let countyDoc = counties.get(county);

        if (!countyDoc && county) {
          countyDoc = await findOrCreateDocument("county", county, counties);
          transactionHasChanges = true;
        }

        if (!municipalityDoc && municipality) {
          municipalityDoc = await findOrCreateDocument(
            "municipality",
            municipality,
            municipalities,
          );
          transactionHasChanges = true;
        }

        // Ensure documents are valid before proceeding
        if (countyDoc && municipalityDoc && bringCity && vendor.city) {
          // Update the city if necessary
          if (
            bringCity &&
            bringCity.toLowerCase() !== vendor.city.toLowerCase()
          ) {
            transaction.patch(vendor._id, { set: { city: bringCity } });
            transactionHasChanges = true;
          }

          // Create or update location with proper references
          const locationId = `location-${vendor._id}`;
          transaction.createOrReplace({
            _type: "location",
            _id: locationId,
            streetAddress: vendor.streetAddress,
            postalCode: vendor.postalCode,
            city: bringCity,
            kommune: { _type: "reference", _ref: municipalityDoc._id },
            fylke: { _type: "reference", _ref: countyDoc._id },
          });
          transactionHasChanges = true;

          // Link vendor to the location
          transaction.patch(vendor._id, {
            set: { location: { _type: "reference", _ref: locationId } },
          });
        }
      }
    }
    bar.tick();
  }

  // Update counties with their municipalities
  counties.forEach((municipalities, countyId) => {
    transaction.patch(countyId, {
      set: { municipalities },
    });
  });

  if (transactionHasChanges) {
    console.log("Committing updates...");
    await transaction.commit();
    console.log("Updates committed successfully.");
  } else {
    console.log("No updates needed.");
  }

  if (bar.complete) {
    console.log("Geocoding complete!");
  }
}

processLocationData();
