// src/services/sanity/locations/createOrUpdateLocation.ts

import { client } from "@/services/sanity/clients/sanityClient";
import type { Location } from "@/types";

export async function createOrUpdateLocation(
	location: Location,
): Promise<void> {
	await client.createOrReplace<Location>(location);
}
