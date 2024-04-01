import { createClient } from "@sanity/client";

// Setup Sanity client configuration
const client = createClient({
  projectId: "1p7743co",
  dataset: "production",
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
  apiVersion: "2021-08-31",
});

export { client };
