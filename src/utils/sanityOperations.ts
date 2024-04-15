import { client } from "./sanityClient";
import { slugifyString } from "./slugifyString";
import { Location, Municipality, County } from "types"; // Adjust the import path as necessary

export async function findOrCreateLocation(
  locationData: Partial<Location>,
  transaction: any, // Pass the transaction object
): Promise<Location> {
  const existingLocation: Location | null = await client.fetch(
    `*[_type == "location" && streetAddress == $address && postalCode == $postalCode && city == $city][0]`,
    {
      address: locationData.streetAddress,
      postalCode: locationData.postalCode,
      city: locationData.city,
    },
  );

  if (existingLocation) {
    return existingLocation;
  } else {
    const newLocation: Omit<Location, "_id"> = {
      _type: "location",
      streetAddress: locationData.streetAddress!,
      postalCode: locationData.postalCode!,
      city: locationData.city!,
      geopoint: locationData.geopoint,
    };
    return transaction.create(newLocation) as Location; // Use transaction to create
  }
}

export async function findOrCreateMunicipality(
  name: string,
  transaction: any, // Pass the transaction object
): Promise<Municipality> {
  let municipality: Municipality | null = await client.fetch(
    `*[_type == "municipality" && name == $name][0]`,
    { name },
  );

  if (!municipality) {
    const slug = slugifyString(name);
    municipality = transaction.create({
      _type: "municipality",
      name: name,
      slug: {
        _type: "slug",
        current: slug,
      },
    }) as Municipality; // Use transaction to create
  }
  return municipality;
}

export async function findOrCreateCounty(
  name: string,
  transaction: any, // Pass the transaction object
): Promise<County> {
  let county: County | null = await client.fetch(
    `*[_type == "county" && name == $name][0]`,
    { name },
  );

  if (!county) {
    const slug = slugifyString(name);
    county = transaction.create({
      _type: "county",
      name: name,
      slug: {
        _type: "slug",
        current: slug,
      },
    }) as County; // Use transaction to create
  }
  return county;
}
