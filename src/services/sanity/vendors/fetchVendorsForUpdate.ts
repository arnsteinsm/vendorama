// src/services/sanity/vendors/fetchVendorsForUpdate.ts

import type { Vendor } from "@/models/Vendor";
import { client } from "@/services/sanity/clients/sanityClient";

/** Fetches vendors that need location updates (i.e., vendors without a linked location reference). */
export async function fetchVendorsForUpdate(): Promise<Vendor[]> {
	const query = `*[_type == "vendor" && !defined(location._ref)]{_id, vendor_name, streetAddress, postalCode, city, location}`;
	return client.fetch(query);
}
