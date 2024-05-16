import { slugifyString } from "../utils/slugifyString";
import { ensureProductExists } from "../services/SanityService";
import { Vendor } from "../models/Vendor";
import { ExternalVendor, keyMapping } from "../models/externalVendor";
import ProgressBar from "progress";
import { cleanAndSplitProductNames } from "../utils/productOperations";

export const transformVendorData = async (
  data: ExternalVendor[],
): Promise<Vendor[]> => {
  const progressBar = new ProgressBar(
    "Processing vendors [:bar] :percent :etas",
    {
      complete: "=",
      incomplete: " ",
      width: 40,
      total: data.length,
    },
  );

  return Promise.all(
    data.map(async (rawVendor): Promise<Vendor> => {
      let vendor: Partial<Vendor> = {
        _id: `vendor-${rawVendor.KUNDENR}`,
        _type: "vendor",
        slug: { _type: "slug", current: slugifyString(rawVendor.KUNDENAVN) },
        lastImportTimestamp: Math.floor(Date.now() / 1000),
      };

      // Map properties using key mapping
      Object.entries(keyMapping).forEach(([externalKey, vendorKey]) => {
        const value = rawVendor[externalKey as keyof ExternalVendor];
        if (vendorKey && value) {
          if (
            typeof value === "string" &&
            (vendorKey === "vendor_name" ||
              vendorKey === "streetAddress" ||
              vendorKey === "city" ||
              vendorKey === "postalCode")
          ) {
            vendor[vendorKey] = value;
          }
        }
      });

      // Handle products separately
      const productNames = cleanAndSplitProductNames(rawVendor.PRODUKTNAVN);
      vendor.products_in_stock = await Promise.all(
        productNames.map(async (productName) => {
          const productId = await ensureProductExists(productName);
          return {
            _type: "reference",
            _ref: productId,
            _key: `productRef-${productId}`,
          };
        }),
      );

      progressBar.tick(); // Update the progress bar
      return vendor as Vendor;
    }),
  );
};
