// src/services/sanity/delete/deleteData.ts

import { client } from "@/services/sanity/clients/sanityClient";
import { getDocumentIdsByType } from "./getDocumentIdsByType";

/**
 * Unsets references for types with dependencies.
 * @param typesToUnset Array of types with fields to unset references for.
 */
async function unsetReferences(
	typesToUnset: { type: string; fields: string[] }[],
): Promise<void> {
	for (const { type, fields } of typesToUnset) {
		const ids = await getDocumentIdsByType(type);
		const transaction = client.transaction();
		// For each document, unset the specified fields
		for (const id of ids) {
			transaction.patch(id, (patch) => patch.unset(fields));
		}

		await transaction.commit();
		console.log(`Unset references for ${type} documents.`);
	}
}

/**
 * Deletes documents in a specific order after unsetting necessary references.
 * @param typesToDelete The array of document types to delete in the correct order.
 */
export async function deleteData(typesToDelete: string[]): Promise<void> {
	// Step 1: Unset references to ensure smooth deletion
	await unsetReferences([
		{ type: "vendor", fields: ["location"] }, // Unset location reference on vendor
		{ type: "municipality", fields: ["county"] }, // Unset county reference on municipality
		{ type: "county", fields: ["municipalities"] }, // Unset municipality references on county
	]);

	// Step 2: Delete documents in order of dependency
	const deletionOrder = ["vendor", "location", "municipality", "county"];
	for (const type of deletionOrder) {
		if (typesToDelete.includes(type)) {
			await client.delete({ query: `*[_type == "${type}"]` });
		}
	}
}
