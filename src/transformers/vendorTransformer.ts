import { slugifyString } from "../utils/slugifyString";
import { cleanAndSplitProductNames } from "../utils/productOperations";
import { ensureProductExists } from "../services/SanityService";
import { Vendor, ProductReference, Slug } from "../models/Vendor";
import { ExternalVendor, keyMapping } from "../models/ExternalVendor";

export const transformVendorData = async (
  data: ExternalVendor[],
): Promise<Vendor[]> => {
  return Promise.all(
    data.map(async (rawVendor): Promise<Vendor> => {
      let vendor: Partial<Vendor> = {
        _id: `vendor-${rawVendor.KUNDENR}`, // Prepend "vendor-" to KUNDENR
        _type: "vendor",
        slug: { _type: "slug", current: slugifyString(rawVendor.KUNDENAVN) },
        lastImportTimestamp: Math.floor(Date.now() / 1000),
      };

      Object.entries(keyMapping).forEach(([externalKey, vendorKey]) => {
        const value = rawVendor[externalKey as keyof ExternalVendor];
        if (vendorKey && typeof value === "string") {
          (vendor[vendorKey as keyof Vendor] as any) = value; // Force TypeScript to accept the assignment
        }
      });

      const productNames = cleanAndSplitProductNames(rawVendor.PRODUKTNAVN);
      vendor.products_in_stock = await Promise.all(
        productNames.map(async (productName) => {
          const productId = await ensureProductExists(productName);
          return {
            _type: "reference",
            _ref: productId,
            _key: `productRef-${productId}`,
          } as ProductReference;
        }),
      );

      return vendor as Vendor;
    }),
  );
};
