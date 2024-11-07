// src/sanity/clients/sanityClient.ts

import "dotenv/config";
import { createClient } from "@sanity/client";

export const client = createClient({
	projectId: "1p7743co",
	dataset: "production",
	token: process.env.SANITY_API_TOKEN,
	useCdn: false,
	apiVersion: "2024-01-01",
});

export type SanityClientType = typeof client;
