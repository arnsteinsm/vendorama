import { client } from "./sanityClient";

export async function deleteAllVendors(): Promise<void> {
  try {
    const query = '*[_type == "vendor"]';

    await client.delete({ query });
    console.log("All vendor documents deleted successfully.");
  } catch (error) {
    console.error("Error deleting vendor documents:", error);
  }
}
