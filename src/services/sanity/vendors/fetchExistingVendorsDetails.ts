// src/services/sanity/vendors/fetchExistingVendorsDetails.ts

import type { Vendor } from "@/models/Vendor";
import { client } from "@/services/sanity/clients/sanityClient";

export async function fetchExistingVendorsDetails(): Promise<
	Record<string, Vendor>
> {
	const query =
		'*[_type == "vendor"]{_id, streetAddress, postalCode, city, products_in_stock}';
	const vendors: Vendor[] = await client.fetch(query);
	return vendors.reduce(
		(acc, vendor) => {
			acc[vendor._id] = vendor;
			return acc;
		},
		{} as Record<string, Vendor>,
	);
}
