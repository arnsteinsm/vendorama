import { slugifyString, client as sanityClient } from ".";
import { Vendor } from "types";

// Fetch vendors that need their location updated
export async function fetchVendorsForUpdate(): Promise<Vendor[]> {
  const query = `
    *[_type == "vendor" && (location->kommune == null || location->fylke == null)]{
      _id,
      vendor_name,
      streetAddress,
      postalCode,
      city,
      location->{_id, city, kommune, fylke}
    }
  `;
  try {
    const vendors = await sanityClient.fetch<Vendor[]>(query);
    console.log(`Fetched ${vendors.length} vendors for update.`);
    return vendors;
  } catch (error) {
    console.error("Error fetching vendors for update:", error);
    throw error;
  }
}

// Example function to find or create a document (Municipality or County)
export async function findOrCreateDocument(
  type: string,
  name: string,
  map: Map<string, any>,
) {
  if (!name) return null;

  let doc = map.get(name);
  if (doc) {
    return doc;
  }

  doc = await sanityClient.fetch(
    `*[_type == "${type}" && name == "${name}"][0]`,
  );

  if (!doc) {
    const slug = slugifyString(name);
    doc = await sanityClient.create({
      _type: type,
      name: name,
      slug: { _type: "slug", current: slug },
    });
    doc = await sanityClient.fetch(`*[_id == "${doc._id}"][0]`);
    map.set(name, doc);
  }

  return doc;
}
