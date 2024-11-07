// src/services/sanity/delete/deleteDocuments.ts

import { client } from "@/services/sanity/clients/sanityClient";

export async function deleteDocuments(
	ids: string[],
	type: string,
): Promise<void> {
	if (ids.length === 0) return;
	const transaction = client.transaction();
	for (const id of ids) {
		transaction.delete(id);
	}
	await transaction.commit();
	console.log(`Deleted all documents of type: ${type}`);
}
