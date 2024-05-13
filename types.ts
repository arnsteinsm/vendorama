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

export type Product = {
  _id: string;
  _type: "product";
  _createdAt: string;
  _updatedAt: string;
  _rev: string;
  product?: string;
  product_unit?: string;
  product_id?: string;
  product_url?: string;
  productImage?: {
    asset?: {
      _ref: string;
      _type: "reference";
      _weak?: boolean;
      [internalGroqTypeReferenceTo]?: "sanity.imageAsset";
    };
    hotspot?: SanityImageHotspot;
    crop?: SanityImageCrop;
    _type: "image";
  };
};

export type Vendor = {
  _id: string;
  _type: "vendor";
  _createdAt: string;
  _updatedAt: string;
  _rev: string;
  vendor_name?: string;
  streetAddress?: string;
  postalCode?: string;
  city?: string;
  location?: {
    _ref: string;
    _type: "reference";
    _weak?: boolean;
    [internalGroqTypeReferenceTo]?: "location";
  };
  products_in_stock?: Array<{
    _ref: string;
    _type: "reference";
    _weak?: boolean;
    _key: string;
    [internalGroqTypeReferenceTo]?: "product";
  }>;
  slug?: Slug;
  lastImportTimestamp?: number;
};

export type Location = {
  _id: string;
  _type: "location";
  _createdAt: string;
  _updatedAt: string;
  _rev: string;
  streetAddress?: string;
  postalCode?: string;
  city?: string;
  kommune?: {
    _ref: string;
    _type: "reference";
    _weak?: boolean;
    [internalGroqTypeReferenceTo]?: "municipality";
  };
  fylke?: {
    _ref: string;
    _type: "reference";
    _weak?: boolean;
    [internalGroqTypeReferenceTo]?: "county";
  };
  geopoint?: Geopoint;
  mapboxPlaceId?: string;
};

export type Municipality = {
  _id: string;
  _type: "municipality";
  _createdAt: string;
  _updatedAt: string;
  _rev: string;
  name?: string;
  slug?: Slug;
  county?: {
    _ref: string;
    _type: "reference";
    _weak?: boolean;
    [internalGroqTypeReferenceTo]?: "county";
  };
  vendorCount?: number;
  boundingBox?: {
    sw?: Geopoint;
    ne?: Geopoint;
  };
};

export type County = {
  _id: string;
  _type: "county";
  _createdAt: string;
  _updatedAt: string;
  _rev: string;
  name?: string;
  slug?: Slug;
  municipalities?: Array<{
    _ref: string;
    _type: "reference";
    _weak?: boolean;
    _key: string;
    [internalGroqTypeReferenceTo]?: "municipality";
  }>;
  totalVendorCount?: number;
  boundingBox?: {
    sw?: Geopoint;
    ne?: Geopoint;
  };
};

export type Geopoint = {
  _type: "geopoint";
  lat?: number;
  lng?: number;
  alt?: number;
};

export type Slug = {
  _type: "slug";
  current?: string;
  source?: string;
};

export type Settings = {
  _id: string;
  _type: "settings";
  _createdAt: string;
  _updatedAt: string;
  _rev: string;
  menuItems?: Array<
    | {
        _ref: string;
        _type: "reference";
        _weak?: boolean;
        [internalGroqTypeReferenceTo]?: "home";
      }
    | {
        _ref: string;
        _type: "reference";
        _weak?: boolean;
        [internalGroqTypeReferenceTo]?: "vendor";
      }
  >;
  footer?: Array<{
    children?: Array<{
      marks?: Array<string>;
      text?: string;
      _type: "span";
      _key: string;
    }>;
    style?: "normal" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "blockquote";
    listItem?: "bullet" | "number";
    markDefs?: Array<{
      href?: string;
      _type: "link";
      _key: string;
    }>;
    level?: number;
    _type: "block";
    _key: string;
  }>;
  ogImage?: {
    asset?: {
      _ref: string;
      _type: "reference";
      _weak?: boolean;
      [internalGroqTypeReferenceTo]?: "sanity.imageAsset";
    };
    hotspot?: any;
    crop?: any;
    _type: "image";
  };
};

export type Home = {
  _id: string;
  _type: "home";
  _createdAt: string;
  _updatedAt: string;
  _rev: string;
  title?: string;
  overview?: Array<{
    children?: Array<{
      marks?: Array<string>;
      text?: string;
      _type: "span";
      _key: string;
    }>;
    style?: "normal";
    listItem?: never;
    markDefs?: Array<{
      href?: string;
      _type: "link";
      _key: string;
    }>;
    level?: number;
    _type: "block";
    _key: string;
  }>;
  showcaseVendors?: Array<{
    _ref: string;
    _type: "reference";
    _weak?: boolean;
    _key: string;
    [internalGroqTypeReferenceTo]?: "vendor";
  }>;
};
export declare const internalGroqTypeReferenceTo: unique symbol;
