// src/services/sanity/cache/initializeCache.ts

import { client } from "@/services/sanity/clients/sanityClient";

export const cache = {
	products: new Map(),
	municipalities: new Map(),
	counties: new Map(),
	vendors: new Map(),
	locations: new Map(),
};

export async function initializeCaches() {
	const query = `{
        "products": *[_type == "product"]{_id, product},
        "municipalities": *[_type == "municipality"]{_id, name},
        "counties": *[_type == "county"]{_id, name},
        "vendors": *[_type == "vendor"]{_id, vendor_name},
        "locations": *[_type == "location"]{_id, location_name}
    }`;
	const results = await client.fetch(query);
	// Populate caches
	for (const p of results.products) {
		cache.products.set(p.product, p._id);
	}
	for (const m of results.municipalities) {
		cache.municipalities.set(m.name, m._id);
	}
	for (const c of results.counties) {
		cache.counties.set(c.name, c._id);
	}
	for (const v of results.vendors) {
		cache.vendors.set(v.vendor_name, v._id);
	}
	for (const l of results.locations) {
		cache.locations.set(l.location_name, l._id);
	}
}

export function clearCaches() {
	for (const map of Object.values(cache)) {
		map.clear();
	}
}
