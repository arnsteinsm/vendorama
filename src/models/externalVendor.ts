// src/models/externalVendor.ts

import { Vendor } from "./Vendor";

// ExternalVendor type tailored for incoming data structure
export interface ExternalVendor {
  KUNDENR: string; // Typically used as the unique identifier
  KUNDENAVN: string; // Vendor name
  K_Adresse: string; // Street address
  K_PostNr: string; // Postal code
  K_PostSted: string; // City or location
  PRODUKTNAVN: string; // Product names, potentially a list
  // Index signature
  [key: string]: string;
}

// Mapping keys from external data format to your internal model properties
export const keyMapping: {
  [key in keyof ExternalVendor]?: keyof Vendor | null;
} = {
  KUNDENR: "vendor_name", // Assuming vendor_name is a string
  KUNDENAVN: "vendor_name", // Assuming vendor_name is a string
  K_Adresse: "streetAddress", // Assuming streetAddress is a string
  K_PostNr: "postalCode", // Assuming postalCode is a string
  K_PostSted: "city", // Assuming city is a string
  PRODUKTNAVN: undefined, // No direct mapping, handle separately
};

export type KeyMappingKeys = keyof typeof keyMapping;
