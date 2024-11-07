// src/services/sanity/index.ts

// Vendors
export { fetchVendorsForUpdate } from "./vendors/fetchVendorsForUpdate";
export { upsertVendors } from "./vendors/upsertVendors";

// Cache
export { ensureProductExists } from "./cache/ensureProductExists";
export { initializeProductCache } from "./cache/initializeProductCache";
export { getProductsInStock } from "./cache/getProductsInStock";
export { productCache } from "./cache/productCache";

// Locations
export { createOrUpdateLocation } from "./locations/createOrUpdateLocation";
export { linkVendorToLocation } from "./locations/linkVendorToLocation";
export { fetchExistingLocations } from "./locations/fetchExistingLocations";
export { processVendorLocations } from "./locations/geographicalReferences";

// Delete
export { deleteData } from "./delete/deleteData";

// Counts
export { updateVendorCounts } from "./counts/updateVendorCounts";
