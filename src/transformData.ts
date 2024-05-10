import { cleanAndSplitProductNames } from "./utils";
import type { ExternalVendor, Vendor, KeyMappingKeys } from "../types";
import { slugifyString } from "./utils";

// Define the mapping of CSV keys to your expected internal object keys
const keyMapping = {
  KUNDENR: "kundenr",
  KUNDENAVN: "kundenavn",
  K_Adresse: "kadresse",
  K_PostNr: "kpostnr",
  K_PostSted: "kpoststed",
  PRODUKTNAVN: "produktnavn",
};

/**
 * Transforms raw vendor data from a source like a CSV into a structured format suitable
 * for inserting into a Sanity database, using a pre-populated product cache to manage product references efficiently.
 *
 * @param data - Array of raw data objects representing vendors.
 * @param productCache - Map object containing product names and their corresponding Sanity IDs.
 * @returns Array of TransformedVendor objects ready for database insertion.
 */
export const transformVendorData = async (
  data: any[],
  productCache: Map<string, string>,
): Promise<Vendor[]> => {
  const lastImportTimestampUnix = Math.floor(Date.now() / 1000); // unix timestamp for import

  return data.map((rawVendor): Vendor => {
    const vendor: ExternalVendor = Object.keys(rawVendor).reduce((acc, key) => {
      const mappedKey = keyMapping[key as KeyMappingKeys];
      if (mappedKey) {
        acc[mappedKey as keyof ExternalVendor] = rawVendor[key];
      }
      return acc;
    }, {} as ExternalVendor);

    const vendorId = `vendor-${vendor.kundenr}`;
    const slug = slugifyString(vendor.kundenavn);
    const productNames = cleanAndSplitProductNames(rawVendor["PRODUKTNAVN"]);
    const productReferences = productNames.map((productName) => {
      const productId = productCache.get(productName);
      if (!productId) {
        throw new Error(
          `Product ID not found for product name: ${productName}`,
        );
      }
      return {
        _type: "reference" as const, // Ensures _type is exactly "reference"
        _ref: productId as string, // Asserts productId is not undefined
        _key: `productRef-${productId}`,
      };
    });

    return {
      _id: vendorId,
      _type: "vendor",
      vendor_name: vendor.kundenavn,
      streetAddress: vendor.kadresse,
      postalCode: vendor.kpostnr.padStart(4, "0"),
      city: vendor.kpoststed,
      slug: { _type: "slug", current: slug },
      products_in_stock: productReferences,
      lastImportTimestamp: lastImportTimestampUnix,
    };
  });
};
