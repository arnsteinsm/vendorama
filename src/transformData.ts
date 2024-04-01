import {
  ensureProductExists,
  initializeProductCache,
} from "./utils/productOperations";
import { cleanAndSplitProductNames } from "./utils";

import type {
  ExternalVendor,
  TransformedVendor,
  KeyMappingKeys,
} from "../types";
import { slugifyString } from "./utils";

// Assuming keyMapping and ExternalVendor are defined as before
const keyMapping = {
  KUNDENR: "kundenr",
  KUNDENAVN: "kundenavn",
  K_Adresse: "kadresse",
  K_PostNr: "kpostnr",
  K_PostSted: "kpoststed",
  PRODUKTNAVN: "produktnavn",
};

export const transformVendorData = async (
  data: any[],
): Promise<TransformedVendor[]> => {
  const productCache = await initializeProductCache();
  const lastImportTimestampUnix = Math.floor(Date.now() / 1000); // unix timestamp for import

  // Explicitly type the map callback for better type inference
  const vendorPromises: Promise<TransformedVendor>[] = data.map(
    async (rawVendor): Promise<TransformedVendor> => {
      // Transformation logic remains the same...
      const vendor: ExternalVendor = Object.keys(rawVendor).reduce(
        (acc, key) => {
          const mappedKey = keyMapping[key as KeyMappingKeys];
          if (mappedKey) {
            if (mappedKey === "produktnavn") {
              acc[mappedKey] = cleanAndSplitProductNames(rawVendor[key]);
            } else {
              acc[mappedKey as keyof ExternalVendor] = rawVendor[key];
            }
          }
          return acc;
        },
        {} as ExternalVendor,
      );

      const vendorId = `vendor-${vendor.kundenr}`;
      const slug = slugifyString(vendor.kundenavn);

      const productNames = cleanAndSplitProductNames(rawVendor["PRODUKTNAVN"]);
      const productReferences = await Promise.all(
        productNames.map(
          async (
            productName,
          ): Promise<{ _type: "reference"; _ref: string; _key: string }> => {
            const productId = await ensureProductExists(
              productName,
              productCache,
            );
            const key = `productRef-${productId}`;
            return {
              _type: "reference",
              _ref: productId,
              _key: key,
            };
          },
        ),
      );

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
    },
  );

  return Promise.all(vendorPromises);
};
