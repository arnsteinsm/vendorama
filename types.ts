// Interface for ExternalVendor
export interface ExternalVendor {
  kundenr: string;
  kundenavn: string;
  kadresse: string;
  kpostnr: string;
  kpoststed: string;
  produktnavn: string[]; // Changed to array of strings
}

// keyMapping object
export const keyMapping = {
  KUNDENR: "kundenr",
  KUNDENAVN: "kundenavn",
  K_Adresse: "kadresse",
  K_PostNr: "kpostnr",
  K_PostSted: "kpoststed",
  PRODUKTNAVN: "produktnavn",
};

// keys of keyMapping
export type KeyMappingKeys = keyof typeof keyMapping;

export interface TransformedVendor {
  _id: string;
  _type: "vendor";
  vendor_name: string;
  streetAddress: string;
  postalCode: string;
  city: string;
  slug: {
    _type: "slug";
    current: string;
  };
  // Assuming products_in_stock will be an array of references to product documents
  products_in_stock?: Array<{
    _key: string;
    _ref: string;
    _type: "reference";
  }>;
  // If you're including geolocation data or other references
  location?: {
    _ref: string;
    _type: "reference";
  };
  lastImportTimestamp: number;
}

export interface ProductReference {
  _type: "reference";
  _ref: string;
}
