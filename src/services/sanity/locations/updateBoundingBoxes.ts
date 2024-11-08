// src/services/sanity/locations/updateBoundingBoxes.ts

import { client } from "@/services/sanity/clients/sanityClient";
import type { Geopoint } from "@/types";
import { calculateBoundingBox } from "@/utils/boundingBoxCalculation";
import type { Transaction } from "@sanity/client";
import ProgressBar from "progress";

export async function updateBoundingBoxes() {
	console.log("Fetching locations with geopoints...");
	const locations = await client.fetch(`
        *[_type == "location" && defined(geopoint) && defined(county) && defined(municipality)]{
            _id,
            geopoint,
            "countyId": county._ref,
            "municipalityId": municipality._ref
        }
    `);

	const countyBounds: Record<string, { sw: Geopoint; ne: Geopoint }> = {};
	const municipalityBounds: Record<string, { sw: Geopoint; ne: Geopoint }> = {};

	console.log("Calculating bounding boxes...");
	const progressBar = new ProgressBar(
		"Processing locations [:bar] :percent :etas",
		{
			total: locations.length,
			width: 50,
		},
	);

	for (const location of locations) {
		const { geopoint, countyId, municipalityId } = location;

		// Update county bounds
		if (countyId) {
			countyBounds[countyId] = calculateBoundingBox(
				countyBounds[countyId],
				geopoint,
			);
		}

		// Update municipality bounds
		if (municipalityId) {
			municipalityBounds[municipalityId] = calculateBoundingBox(
				municipalityBounds[municipalityId],
				geopoint,
			);
		}

		progressBar.tick();
	}

	// Step 2: Pre-fetch existing bounding boxes
	const existingCountyBounds = await fetchExistingBoundingBoxes("county");
	const existingMunicipalityBounds =
		await fetchExistingBoundingBoxes("municipality");

	// Step 3: Start a single transaction for all bounding box updates
	const transaction = client.transaction();
	console.log("Adding necessary bounding box updates to transaction...");

	await updateBoundingBoxesIfNecessary(
		countyBounds,
		existingCountyBounds,
		"county",
		transaction,
	);
	await updateBoundingBoxesIfNecessary(
		municipalityBounds,
		existingMunicipalityBounds,
		"municipality",
		transaction,
	);

	console.log("Committing bounding box updates...");
	await transaction.commit(); // Commit all updates at once
	console.log("Bounding box updates committed successfully.");
}

/** Fetches existing bounding boxes for a given region type */
async function fetchExistingBoundingBoxes(
	regionType: "county" | "municipality",
) {
	const result = await client.fetch(
		`
		*[_type == $regionType && defined(boundingBox)]{
			_id,
			boundingBox
		}
	`,
		{ regionType },
	);
	return result.reduce(
		(
			acc: Record<string, { sw: Geopoint; ne: Geopoint }>,
			item: { _id: string; boundingBox: { sw: Geopoint; ne: Geopoint } },
		) => {
			acc[item._id] = item.boundingBox;
			return acc;
		},
		{} as Record<string, { sw: Geopoint; ne: Geopoint }>,
	);
}

/** Updates bounding boxes in Sanity only if they differ from the current bounding boxes */
async function updateBoundingBoxesIfNecessary(
	boundsMap: Record<string, { sw: Geopoint; ne: Geopoint }>,
	existingBoundsMap: Record<string, { sw: Geopoint; ne: Geopoint }>,
	regionType: "county" | "municipality",
	transaction: Transaction,
) {
	const ids = Object.keys(boundsMap);
	const progressBar = new ProgressBar(
		`Updating bounding boxes for ${regionType}s [:bar] :percent :etas`,
		{
			total: ids.length,
			width: 50,
		},
	);

	for (const id of ids) {
		const newBounds = boundsMap[id];
		const existingBounds = existingBoundsMap[id];

		// Compare existing bounds with new bounds; if they differ, update
		if (
			!existingBounds ||
			newBounds.sw.lat !== existingBounds.sw?.lat ||
			newBounds.sw.lng !== existingBounds.sw?.lng ||
			newBounds.ne.lat !== existingBounds.ne?.lat ||
			newBounds.ne.lng !== existingBounds.ne?.lng
		) {
			transaction.patch(id, { set: { boundingBox: newBounds } });
			console.log(
				`Adding bounding box update for ${regionType} with ID: ${id}`,
			);
		}

		progressBar.tick();
	}
}
