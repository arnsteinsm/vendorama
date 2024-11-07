// src/services/sanity/locations/linkVendorToLocation.ts

import { client } from "@/services/sanity/clients/sanityClient";

export async function linkVendorToLocation(
	vendorId: string,
	locationId: string,
): Promise<void> {
	await client
		.patch(vendorId)
		.set({ location: { _type: "reference", _ref: locationId } })
		.commit();
}
