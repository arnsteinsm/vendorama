// src/services/sanity/documents/findOrCreateDocument.ts

import { client } from "@/services/sanity/clients/sanityClient";
import type { Document } from "@/types";
import { slugifyString } from "@/utils/slugifyString";

/**
 * Finds a document of a given type and name in Sanity. If it doesn't exist, creates a new one.
 * @param type The type of document to find or create (e.g., "county", "municipality").
 * @param name The name of the document to find or create.
 * @param parentId Optional parent ID to link to if creating a new document (used for hierarchical relationships).
 * @returns The found or newly created document.
 */
export async function findOrCreateDocument(
	type: string,
	name: string,
	parentId?: string,
): Promise<Document> {
	// Check if the document exists in Sanity
	const existingDocument = await client.fetch<Document>(
		"*[_type == $type && name == $name][0]",
		{ type, name },
	);

	// If the document exists, return it
	if (existingDocument) {
		return existingDocument;
	}

	// Create a new document if it doesn't exist
	const slug = slugifyString(name);
	const newDocument: Document = {
		_type: type,
		name,
		slug: { _type: "slug", current: slug },
	};

	// Add parent reference if provided (e.g., for a municipality under a county)
	if (parentId && type === "municipality") {
		newDocument.county = {
			_type: "reference",
			_ref: parentId,
		};
	}

	// Create and return the new document in Sanity
	return await client.create(newDocument);
}
