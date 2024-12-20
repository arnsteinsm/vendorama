// src/types.ts

// types.ts

export declare const internalGroqTypeReferenceTo: unique symbol;

export interface Reference {
	_ref: string;
	_key: string;
	_type: string;
}

export interface DocumentWithMunicipalities {
	_id: string;
	municipalities: Reference[];
}

export interface Document {
	_type: string;
	name: string;
	slug: {
		_type: "slug";
		current: string;
	};
	county?: {
		_type: "reference";
		_ref: string;
	};
	municipality?: {
		_type: "reference";
		_ref: string;
	};
}

export interface BringAPIResponse {
	postal_codes: Array<{
		city: string;
		municipality: string;
		county: string;
		municipalityId: string;
	}>;
}

export type Product = {
	_id: string;
	_type: "product";
	_createdAt?: string;
	_updatedAt?: string;
	_rev?: string;
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
	_createdAt?: string;
	_updatedAt?: string;
	_rev?: string;
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
	_createdAt?: string;
	_updatedAt?: string;
	_rev?: string;
	streetAddress?: string;
	postalCode?: string;
	city?: string;
	municipality?: {
		_ref: string;
		_type: "reference";
		_weak?: boolean;
		[internalGroqTypeReferenceTo]?: "municipality";
		_key?: string;
	};
	county?: {
		_ref: string;
		_type: "reference";
		_weak?: boolean;
		[internalGroqTypeReferenceTo]?: "county";
		_key?: string;
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

export type SanityImageCrop = {
	_type: "sanity.imageCrop";
	top?: number;
	bottom?: number;
	left?: number;
	right?: number;
};

export type SanityImageHotspot = {
	_type: "sanity.imageHotspot";
	x?: number;
	y?: number;
	height?: number;
	width?: number;
};

export type SanityImageAsset = {
	_id: string;
	_type: "sanity.imageAsset";
	_createdAt: string;
	_updatedAt: string;
	_rev: string;
	originalFilename?: string;
	label?: string;
	title?: string;
	description?: string;
	altText?: string;
	sha1hash?: string;
	extension?: string;
	mimeType?: string;
	size?: number;
	assetId?: string;
	uploadId?: string;
	path?: string;
	url?: string;
	metadata?: SanityImageMetadata;
	source?: SanityAssetSourceData;
};

export type SanityAssetSourceData = {
	_type: "sanity.assetSourceData";
	name?: string;
	id?: string;
	url?: string;
};

export type SanityImageMetadata = {
	_type: "sanity.imageMetadata";
	location?: Geopoint;
	dimensions?: SanityImageDimensions;
	palette?: SanityImagePalette;
	lqip?: string;
	blurHash?: string;
	hasAlpha?: boolean;
	isOpaque?: boolean;
};

export type SanityImagePaletteSwatch = {
	_type: "sanity.imagePaletteSwatch";
	background?: string;
	foreground?: string;
	population?: number;
	title?: string;
};

export type SanityImagePalette = {
	_type: "sanity.imagePalette";
	darkMuted?: SanityImagePaletteSwatch;
	lightVibrant?: SanityImagePaletteSwatch;
	darkVibrant?: SanityImagePaletteSwatch;
	vibrant?: SanityImagePaletteSwatch;
	dominant?: SanityImagePaletteSwatch;
	lightMuted?: SanityImagePaletteSwatch;
	muted?: SanityImagePaletteSwatch;
};

export type SanityImageDimensions = {
	_type: "sanity.imageDimensions";
	height?: number;
	width?: number;
	aspectRatio?: number;
};
