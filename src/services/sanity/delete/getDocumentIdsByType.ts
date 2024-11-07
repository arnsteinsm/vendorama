// src/services/sanity/delete/getDocumentIdsByType.ts

import { client } from "@/services/sanity/clients/sanityClient";

export async function getDocumentIdsByType(type: string): Promise<string[]> {
	const query = `*[_type == "${type}"]{_id}`;
	const documents = await client.fetch(query);
	return documents.map((doc: { _id: string }) => doc._id);
}
