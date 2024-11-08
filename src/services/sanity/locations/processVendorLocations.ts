// src/services/sanity/locations/processVendorLocations.ts

import { fetchGeopoint } from "@/services/fetchGeoPoint";
import { cache } from "@/services/sanity/cache/initializeCache";
import { client } from "@/services/sanity/clients/sanityClient";
import { validateAndFetchLocationData } from "@/services/validateAndFetchLocationData";
import type { Vendor } from "@/types";
import { slugifyString } from "@/utils/slugifyString";
import ProgressBar from "progress";
import { v4 as uuidv4 } from "uuid";

export async function processVendorLocations(vendors: Vendor[]) {
	const progressBar = new ProgressBar(
		"Processing vendors locations [:bar] :percent :etas",
		{
			total: vendors.length,
			width: 50,
		},
	);

	const countyTransaction = client.transaction();
	const municipalityTransaction = client.transaction();
	const locationTransaction = client.transaction();
	const vendorTransaction = client.transaction();

	const pendingCountyRefs = new Map<string, string[]>(); // Map of countyId -> municipalityIds
	const pendingMunicipalityRefs = new Map<string, string>(); // Map of municipalityId -> countyId

	// Step 1: Process Counties and Municipalities, storing references to add later
	for (const vendor of vendors) {
		if (vendor.postalCode && vendor.city) {
			const locationKey = `${vendor.streetAddress}-${vendor.postalCode}-${vendor.city}`;
			let locationId = cache.locations.get(locationKey);

			if (!locationId) {
				const locationData = await validateAndFetchLocationData(
					vendor.postalCode,
					vendor.city,
				);
				if (locationData) {
					const { city, municipality, county } = locationData;

					let countyId = cache.counties.get(county.name);
					if (!countyId) {
						countyId = `county-${uuidv4()}`;
						countyTransaction.createIfNotExists({
							_type: "county",
							_id: countyId,
							name: county.name,
							slug: { _type: "slug", current: slugifyString(county.name) },
							municipalities: [], // Placeholder array to be updated later
						});
						cache.counties.set(county.name, countyId);
					}

					let municipalityId = cache.municipalities.get(municipality.name);
					if (!municipalityId) {
						municipalityId = `municipality-${uuidv4()}`;
						municipalityTransaction.createIfNotExists({
							_type: "municipality",
							_id: municipalityId,
							name: municipality.name,
							slug: {
								_type: "slug",
								current: slugifyString(municipality.name),
							},
							county: { _type: "reference", _ref: countyId }, // County reference to be validated later
						});
						cache.municipalities.set(municipality.name, municipalityId);
					}

					// Store municipality -> county reference
					pendingMunicipalityRefs.set(municipalityId, countyId);

					// Store county -> municipality reference
					const municipalitiesForCounty = pendingCountyRefs.get(countyId) || [];
					if (!municipalitiesForCounty.includes(municipalityId)) {
						municipalitiesForCounty.push(municipalityId);
						pendingCountyRefs.set(countyId, municipalitiesForCounty);
					}

					locationId = `location-${uuidv4()}`;
					const geopoint = await fetchGeopoint(
						vendor.streetAddress ?? "",
						vendor.postalCode ?? "",
						city,
					);
					locationTransaction.createIfNotExists({
						_type: "location",
						_id: locationId,
						streetAddress: vendor.streetAddress ?? undefined,
						postalCode: vendor.postalCode ?? undefined,
						city,
						geopoint,
						municipality: { _type: "reference", _ref: municipalityId },
						county: { _type: "reference", _ref: countyId },
					});
					cache.locations.set(locationKey, locationId);
				}
			}

			// Link vendor to the location
			if (locationId) {
				vendorTransaction.patch(vendor._id, {
					set: { location: { _type: "reference", _ref: locationId } },
				});
			}
		}
		progressBar.tick();
	}

	// Step 2: Commit initial county and municipality creation
	console.log("Committing counties...");
	await countyTransaction.commit();
	console.log("Counties committed.");

	console.log("Committing municipalities...");
	await municipalityTransaction.commit();
	console.log("Municipalities committed.");

	// Step 3: Update municipality -> county references if necessary
	const refTransaction = client.transaction();
	for (const [municipalityId, countyId] of pendingMunicipalityRefs) {
		refTransaction.patch(municipalityId, {
			set: {
				county: { _type: "reference", _ref: countyId, _key: `key-${countyId}` },
			},
		});
	}

	// Update county -> municipalities array
	for (const [countyId, municipalityIds] of pendingCountyRefs) {
		refTransaction.patch(countyId, {
			set: {
				municipalities: municipalityIds.map((id) => ({
					_type: "reference",
					_ref: id,
					_key: `key-${id}`,
				})),
			},
		});
	}

	// Commit the final reference updates
	console.log("Committing county and municipality references...");
	await refTransaction.commit();
	console.log("References committed.");

	console.log("Committing locations...");
	await locationTransaction.commit();
	console.log("Locations committed.");

	console.log("Committing vendors with locations...");
	await vendorTransaction.commit();
	console.log("Vendors with locations committed.");

	console.log(
		"Vendor locations updated with geographical references and slugs successfully.",
	);
}
