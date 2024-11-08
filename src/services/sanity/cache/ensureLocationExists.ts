// src/services/sanity/cache/ensureLocationExists.ts

import { client } from "@/services/sanity/clients/sanityClient";
import { slugifyString } from "@/utils/slugifyString";
import { cache as mainCache } from "./initializeCache";

export const ensureLocationExists = async (
	name: string,
	type: "municipality" | "county" | "location",
): Promise<string> => {
	const cacheMap = {
		municipality: mainCache.municipalities,
		county: mainCache.counties,
		location: mainCache.locations,
	};

	const specificCache = cacheMap[type];
	if (specificCache.has(name)) {
		const cachedId = specificCache.get(name);
		if (cachedId) {
			return cachedId; // Retrieve ID from cache if it exists
		}
	}

	// Slugify and create new document
	const id = `${type}-${slugifyString(name)}`;
	const newEntry = {
		_type: type,
		_id: id,
		name: name,
	};

	const createdEntry = await client.createIfNotExists(newEntry);
	specificCache.set(name, createdEntry._id); // Cache the new entry immediately
	return createdEntry._id;
};
