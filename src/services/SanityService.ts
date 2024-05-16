import "dotenv/config";
import { createClient } from "@sanity/client";
import { slugifyString } from "../utils/slugifyString";
import { Vendor } from "models/Vendor";
import {
  Document,
  County,
  Municipality,
  DocumentWithMunicipalities,
} from "../../types";
import { v4 as uuidv4 } from "uuid";
import ProgressBar from "progress";

export type SanityClientType = ReturnType<typeof createClient>;

export const client: SanityClientType = createClient({
  projectId: "1p7743co",
  dataset: "production",
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
  apiVersion: "2024-01-01",
});

let productCache = new Map<string, string>();

export const initializeProductCache = async (): Promise<
  Map<string, string>
> => {
  if (productCache.size === 0) {
    const products = await fetchAllProducts();
    products.forEach((product: { product: string; _id: string }) => {
      productCache.set(product.product, product._id);
    });
  }
  return productCache;
};

export async function fetchAllProducts(): Promise<any[]> {
  const query = '*[_type == "product"]';
  return await client.fetch(query);
}

export async function ensureProductExists(
  productName: string,
): Promise<string> {
  await initializeProductCache();
  if (productCache.has(productName)) {
    return productCache.get(productName)!;
  } else {
    const productId = slugifyString(productName);
    const newProduct = {
      _type: "product",
      product: productName,
      _id: productId,
    };
    const createdProduct = await client.createIfNotExists(newProduct);
    productCache.set(productName, createdProduct._id);
    return createdProduct._id;
  }
}

export async function fetchVendorsForUpdate(): Promise<Vendor[]> {
  const query =
    '*[_type == "vendor" && !defined(location._ref)]{_id, vendor_name, streetAddress, postalCode, city, location}';
  return await client.fetch(query);
}

export async function upsertVendors(transformedVendors: Vendor[]) {
  const existingVendorsDetails = await fetchExistingVendorsDetails();
  const transaction = client.transaction();

  transformedVendors.forEach((vendor) => {
    const existingVendor = existingVendorsDetails[vendor._id];
    if (existingVendor) {
      transaction.patch(vendor._id, (patch) => patch.set({ ...vendor }));
    } else {
      transaction.create({ ...vendor, _id: vendor._id });
    }
  });

  await transaction.commit();
}

async function fetchExistingVendorsDetails(): Promise<Record<string, Vendor>> {
  const query = `*[_type == "vendor"]{_id, streetAddress, postalCode, city, products_in_stock}`;
  const vendors: Vendor[] = await client.fetch(query);
  return vendors.reduce<Record<string, Vendor>>((acc, vendor) => {
    acc[vendor._id] = vendor;
    return acc;
  }, {});
}

export async function findOrCreateDocument(
  type: string,
  name: string,
  parentId?: string, // Optional parent ID for creating linked documents
): Promise<any> {
  const existingDocument = await client.fetch(
    `*[_type == $type && name == $name][0]`,
    { type, name },
  );

  if (!existingDocument) {
    const slug = slugifyString(name);
    const newDocument: Document = {
      _type: type,
      name,
      slug: { _type: "slug", current: slug },
    };

    // If parentId is provided and it's a type that should have a parent reference, add it
    if (parentId && type === "municipality") {
      newDocument.county = {
        _type: "reference",
        _ref: parentId,
      };
    }

    return await client.create(newDocument);
  }

  return existingDocument;
}

export async function createOrUpdateLocation(location: any): Promise<void> {
  await client.createOrReplace(location);
}

export async function linkVendorToLocation(
  vendorId: string,
  locationId: string,
): Promise<void> {
  await client
    .patch(vendorId)
    .set({ location: { _type: "reference", _ref: locationId } })
    .commit();
}

export async function deleteData(): Promise<void> {
  const typesToDelete = ["vendor", "municipality", "county", "location"];
  try {
    for (const type of typesToDelete) {
      console.log(`Deleting all documents of type: ${type}`);
      const query = `*[_type == "${type}"]{_id}`;
      const documents = await client.fetch(query);
      const ids = documents.map((doc: any) => doc._id);
      if (ids.length > 0) {
        const transaction = client.transaction();
        ids.forEach((id: string) => transaction.delete(id));
        await transaction.commit();
        console.log(`Deleted all documents of type: ${type}`);
      } else {
        console.log(`No documents found for type: ${type}, skipping deletion.`);
      }
    }
    console.log("All specified data types have been deleted successfully.");
  } catch (error) {
    console.error("Failed to delete data:", error);
  }
}

export async function fetchExistingLocations(): Promise<Map<string, any>> {
  const query = `*[_type == "location"]{
    _id,
    streetAddress,
    postalCode,
    geopoint
  }`;
  const locations = await client.fetch(query);
  const locationsMap = new Map();
  locations.forEach((location: any) => {
    const key = `${location.streetAddress.toLowerCase()}|${location.postalCode}`;
    locationsMap.set(key, location);
  });
  return locationsMap;
}

export async function updateGeographicalReferencesAndCounts() {
  const municipalities = await client.fetch(
    '*[_type == "municipality" && !defined(county._ref)]',
  );
  const counties = await client.fetch('*[_type == "county"]');

  const transaction = client.transaction();
  const progressBar = new ProgressBar("Processing [:bar] :percent :etas", {
    complete: "=",
    incomplete: " ",
    width: 50,
    total: municipalities.length + counties.length,
  });

  // Update municipality with county references
  for (const muni of municipalities) {
    const locations = await client.fetch(
      `*[_type == "location" && references("${muni._id}")]`,
    );
    const countyRef = locations.find((loc: any) => loc.county)?._ref;
    if (countyRef) {
      transaction.patch(muni._id, {
        set: { county: { _type: "reference", _ref: countyRef } },
      });
    }
    progressBar.tick();
  }

  // Update counties and fix municipality references
  for (const county of counties) {
    if (county.municipalities) {
      const fixedRefs = county.municipalities.map((ref: any) => ({
        ...ref,
        _key: ref._key || uuidv4(),
      }));
      transaction.patch(county._id, {
        set: { municipalities: fixedRefs },
      });
    }
    progressBar.tick();
  }

  await transaction.commit();
  console.log(
    "Geographical references and vendor counts updated successfully.",
  );
  updateVendorCounts();
}

async function updateVendorCounts() {
  const municipalities = await client.fetch('*[_type == "municipality"]');
  const counties = await client.fetch('*[_type == "county"]');
  const transaction = client.transaction();
  const progressBar = new ProgressBar(
    "Updating vendor counts [:bar] :current/:total :percent :etas",
    {
      complete: "=",
      incomplete: " ",
      width: 50,
      total: municipalities.length + counties.length,
    },
  );

  for (const muni of municipalities) {
    const vendorCount = await client.fetch(
      `count(*[_type == "vendor" && location->municipality._ref == "${muni._id}" && !(_id in path("drafts.**"))])`,
    );
    transaction.patch(muni._id, {
      set: { vendorCount: vendorCount },
    });
    progressBar.tick();
  }

  for (const county of counties) {
    const totalVendorCount = await client.fetch(
      `count(*[_type == "vendor" && location->municipality->county._ref == "${county._id}" && !(_id in path("drafts.**"))])`,
    );
    transaction.patch(county._id, {
      set: { totalVendorCount: totalVendorCount },
    });
    progressBar.tick();
  }

  await transaction.commit();
  console.log("Vendor counts updated successfully.");
}
