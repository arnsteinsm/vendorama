import { client as sanityClient } from "./";
import { Municipality } from "types";

// Local extension of the Municipality type
interface LocalMunicipality extends Municipality {
  countyRef?: string;
}

async function linkMunicipalitiesToCountiesFromLocations() {
  // Fetch municipalities missing county references
  const municipalitiesWithoutCounty: LocalMunicipality[] =
    await sanityClient.fetch(`
        *[_type == "municipality" && !defined(county._ref)] {
            _id,
            name,
            "countyRef": *[_type == "location" && references(^._id)][0].fylke._ref
        }
    `);

  const transaction = sanityClient.transaction();
  municipalitiesWithoutCounty.forEach((municipality: LocalMunicipality) => {
    if (municipality.countyRef) {
      // Update municipality with the county reference found in its related location
      transaction.patch(municipality._id, {
        set: { county: { _type: "reference", _ref: municipality.countyRef } },
      });
    }
  });

  await transaction.commit();
  console.log(
    "Municipalities have been linked to counties based on existing location data.",
  );
}

linkMunicipalitiesToCountiesFromLocations();

import { v4 as uuidv4 } from "uuid"; // Ensure you have 'uuid' installed for generating unique keys

async function fixBrokenReferences() {
  // Define the types of documents to check and the paths to their reference fields
  const typesToCheck = [
    { type: "county", referencePath: "municipalities" }, // Array of references
    { type: "municipality", referencePath: "county" }, // Single reference
    // Add more types as needed
  ];

  for (const { type, referencePath } of typesToCheck) {
    const query = `*[_type == "${type}" && defined(${referencePath})] {_id, ${referencePath}}`;
    const documents = await client.fetch(query);

    for (const doc of documents) {
      const refData = doc[referencePath];
      if (Array.isArray(refData)) {
        // Handle array of references
        const fixedRefs = refData.map((ref) => ({
          ...ref,
          _key: ref._key || uuidv4(), // Ensure each reference has a unique key
        }));
        await updateDocument(doc._id, { [referencePath]: fixedRefs });
      } else if (refData && typeof refData === "object" && refData._ref) {
        // Handle single reference
        const fixedRef = {
          ...refData,
          _key: refData._key || uuidv4(), // Ensure the single reference has a unique key
        };
        await updateDocument(doc._id, { [referencePath]: fixedRef });
      }
    }
  }
}

async function updateDocument(
  docId: string,
  updatedData: { [x: string]: any },
) {
  await client
    .patch(docId)
    .set(updatedData)
    .commit()
    .then((updatedDoc) => {
      console.log(`Updated document ${updatedDoc._id} successfully`);
    })
    .catch((err) => {
      console.error("Failed to update document:", err.message);
    });
}

fixBrokenReferences();

interface ExtendedCounty extends County {
  municipalityRefs?: string[];
  municipalities?: Array<{
    _ref: string;
    _key: string; // Ensure _key is always required as per County type.
    _type: "reference";
    _weak?: boolean;
  }>;
}

async function linkCountiesToMunicipalitiesFromLocations() {
  // Fetch counties that might be missing references to municipalities
  const counties: ExtendedCounty[] = await sanityClient.fetch(`
    *[_type == "county" && (!defined(municipalities) || count(municipalities) == 0)] {
      _id,
      name,
      "municipalityRefs": *[_type == "municipality" && references(^._id)]._id
    }
  `);

  console.log("Fetched counties:", counties);

  const transaction = sanityClient.transaction();

  counties.forEach((county: ExtendedCounty) => {
    if (county.municipalityRefs && county.municipalityRefs.length > 0) {
      console.log(
        `Updating county ${county._id} with municipalities:`,
        county.municipalityRefs,
      );
      // Update county with the municipality references found in its related municipalities
      transaction.patch(county._id, {
        set: {
          municipalities: county.municipalityRefs.map((ref) => ({
            _type: "reference",
            _ref: ref,
            _key: uuid(),
          })),
        },
      });
    } else {
      console.log(`No municipalities found for county ${county._id}`);
    }
  });

  const response = await transaction.commit();
  console.log("Transaction response:", response);
  console.log(
    "Counties have been linked to municipalities based on existing municipality data.",
  );
}

//linkCountiesToMunicipalitiesFromLocations();

async function addKeysToMunicipalityReferences() {
  // Fetch counties where at least one municipality reference lacks a _key
  const countiesWithKeylessRefs: ExtendedCounty[] = await sanityClient.fetch(`
        *[_type == "county" && municipalities[]._key == null]{
            _id,
            name,
            municipalities[] {
                _ref,
                _key
            }
        }
    `);

  const transaction = sanityClient.transaction();

  countiesWithKeylessRefs.forEach((county) => {
    if (county.municipalities) {
      // Check if municipalities array is present
      const updatedMunicipalities = county.municipalities.map(
        (municipality) => ({
          ...municipality,
          _key: municipality._key || generateUniqueKey(), // Ensure _key is set
          _type: "reference",
        }),
      );

      transaction.patch(county._id, {
        set: { municipalities: updatedMunicipalities },
      });
    }
  });

  await transaction.commit();
  console.log(
    "Missing keys have been added to municipality references in counties.",
  );
}

function generateUniqueKey(): string {
  return uuid(); // Assuming you are using the 'uuid' library and its V4 method
}

//addKeysToMunicipalityReferences();
import ProgressBar from "progress";
import { client } from "..";

export async function updateVendorCounts() {
  console.log("Updating vendor counts...");

  // Start a new transaction
  const transaction = client.transaction();

  // Get a list of all municipalities and counties excluding drafts
  const municipalities = await client.fetch(
    '*[_type == "municipality" && !(_id in path("drafts.**"))]',
  );
  const counties = await client.fetch(
    '*[_type == "county" && !(_id in path("drafts.**"))]',
  );

  // Prepare a progress bar for visual feedback
  const totalUpdates = municipalities.length + counties.length;
  const bar = new ProgressBar(":bar :current/:total (:percent) :etas", {
    complete: "=",
    incomplete: " ",
    width: 40,
    total: totalUpdates,
  });

  // Update each municipality with its vendor count
  for (const municipality of municipalities) {
    const vendorCount = await client.fetch(
      'count(*[_type == "vendor" && location->kommune._ref == $id && !(_id in path("drafts.**"))])',
      { id: municipality._id },
    );
    transaction.patch(municipality._id, {
      set: { vendorCount },
    });
    bar.tick(); // Update the progress bar after each municipality
  }

  // Update each county with its total vendor count
  for (const county of counties) {
    const totalVendorCount = await client.fetch(
      'count(*[_type == "vendor" && location->kommune->county._ref == $id && !(_id in path("drafts.**"))])',
      { id: county._id },
    );
    transaction.patch(county._id, {
      set: { totalVendorCount },
    });
    bar.tick(); // Update the progress bar after each county
  }

  // Commit the transaction
  await transaction.commit();
  console.log("Vendor counts updated successfully.");
}

updateVendorCounts();

import { client as sanityClient } from "./sanityClient";
import { v4 as uuid } from "uuid";
import { County, Municipality } from "types"; // Assuming types are properly defined and imported

interface ExtendedCounty extends County {
  municipalityRefs?: string[];
  municipalities?: Array<{
    _ref: string;
    _key: string; // Ensure _key is always required as per County type.
    _type: "reference";
    _weak?: boolean;
  }>;
}

async function linkCountiesToMunicipalitiesFromLocations() {
  // Fetch counties that might be missing references to municipalities
  const counties: ExtendedCounty[] = await sanityClient.fetch(`
    *[_type == "county" && (!defined(municipalities) || count(municipalities) == 0)] {
      _id,
      name,
      "municipalityRefs": *[_type == "municipality" && references(^._id)]._id
    }
  `);

  console.log("Fetched counties:", counties);

  const transaction = sanityClient.transaction();

  counties.forEach((county: ExtendedCounty) => {
    if (county.municipalityRefs && county.municipalityRefs.length > 0) {
      console.log(
        `Updating county ${county._id} with municipalities:`,
        county.municipalityRefs,
      );
      // Update county with the municipality references found in its related municipalities
      transaction.patch(county._id, {
        set: {
          municipalities: county.municipalityRefs.map((ref) => ({
            _type: "reference",
            _ref: ref,
            _key: uuid(),
          })),
        },
      });
    } else {
      console.log(`No municipalities found for county ${county._id}`);
    }
  });

  const response = await transaction.commit();
  console.log("Transaction response:", response);
  console.log(
    "Counties have been linked to municipalities based on existing municipality data.",
  );
}

//linkCountiesToMunicipalitiesFromLocations();

async function addKeysToMunicipalityReferences() {
  // Fetch counties where at least one municipality reference lacks a _key
  const countiesWithKeylessRefs: ExtendedCounty[] = await sanityClient.fetch(`
        *[_type == "county" && municipalities[]._key == null]{
            _id,
            name,
            municipalities[] {
                _ref,
                _key
            }
        }
    `);

  const transaction = sanityClient.transaction();

  countiesWithKeylessRefs.forEach((county) => {
    if (county.municipalities) {
      // Check if municipalities array is present
      const updatedMunicipalities = county.municipalities.map(
        (municipality) => ({
          ...municipality,
          _key: municipality._key || generateUniqueKey(), // Ensure _key is set
          _type: "reference",
        }),
      );

      transaction.patch(county._id, {
        set: { municipalities: updatedMunicipalities },
      });
    }
  });

  await transaction.commit();
  console.log(
    "Missing keys have been added to municipality references in counties.",
  );
}

function generateUniqueKey(): string {
  return uuid(); // Assuming you are using the 'uuid' library and its V4 method
}

//addKeysToMunicipalityReferences();
