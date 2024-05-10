import { client as sanityClient, fetchBringData } from "../";
import { findOrCreateDocument } from "../sanityOperations";
import { updateLocation } from "./updateEntities";

export async function processVendors(vendors, bar) {
  const municipalities = new Map();
  const counties = new Map();
  const transaction = sanityClient.transaction();
  let transactionHasChanges = false;

  for (const vendor of vendors) {
    if (vendor.postalCode) {
      const bringData = await fetchBringData(vendor.postalCode);
      if (bringData && bringData.postal_codes.length > 0) {
        const changes = await processSingleVendor(
          vendor,
          bringData,
          municipalities,
          counties,
        );
        if (changes) transactionHasChanges = true;
      }
    }
    bar.tick();
  }

  if (transactionHasChanges) {
    await transaction.commit();
    console.log("Updates committed successfully.");
  } else {
    console.log("No updates needed.");
  }
}

import {
  fetchVendorsForUpdate,
  findOrCreateDocument,
} from "../sanityOperations";
import { client as sanityClient, fetchBringData } from "../";
import ProgressBar from "progress";

async function processLocationData() {
  try {
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

    await processVendors(vendors, municipalities, counties, bar, transaction);

    if (bar.complete) {
      console.log("Geocoding complete!");
    }
  } catch (error) {
    console.error("Failed to process location data:", error);
  }
}

async function processVendors(
  vendors,
  municipalities,
  counties,
  bar,
  transaction,
) {
  let transactionHasChanges = false;
  for (const vendor of vendors) {
    const changes = await processSingleVendor(vendor, municipalities, counties);
    if (changes) {
      transactionHasChanges = true;
    }
    bar.tick();
  }
  if (transactionHasChanges) {
    await transaction.commit();
    console.log("Updates committed successfully.");
  } else {
    console.log("No updates needed.");
  }
}

export async function processSingleVendor(vendor, municipalities, counties) {
  if (!vendor.postalCode) return false;
  const bringData = await fetchBringData(vendor.postalCode);
  if (!bringData || !bringData.postal_codes.length) return false;

  const { city: bringCity, municipality, county } = bringData.postal_codes[0];

  let municipalityDoc = municipalities.get(municipality);
  let countyDoc = counties.get(county);

  let transactionHasChanges = false;
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

  return updateLocation(vendor, bringCity, municipalityDoc, countyDoc);
}
export async function updateLocation(
  vendor,
  bringCity,
  municipalityDoc,
  countyDoc,
) {
  if (!countyDoc || !municipalityDoc || !bringCity || !vendor.city)
    return false;

  const transactionHasChanges =
    bringCity.toLowerCase() !== vendor.city.toLowerCase();
  if (transactionHasChanges) {
    transaction.patch(vendor._id, { set: { city: bringCity } });
  }

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
  transaction.patch(vendor._id, {
    set: { location: { _type: "reference", _ref: locationId } },
  });

  return true;
}

processLocationData();
