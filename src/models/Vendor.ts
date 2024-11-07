// src/models/Vendor.ts

export interface Vendor {
	_id: string;
	_type: "vendor";
	vendor_name: string; // Ensure all these fields are expected to be strings
	streetAddress: string;
	postalCode: string;
	city: string;
	slug: Slug;
	products_in_stock: ProductReference[];
	lastImportTimestamp: number;
	location?: {
		_ref: string;
		_type: "reference";
		_weak?: boolean;
	};
}

export interface Slug {
	_type: "slug";
	current: string;
}

export interface ProductReference {
	_type: "reference";
	_ref: string;
	_key: string;
}
