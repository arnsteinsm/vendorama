// src/services/MapboxApiService.ts

import "dotenv/config";

export class MapboxClient {
	private accessToken: string;

	constructor(
		accessToken: string = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "",
	) {
		if (!accessToken) {
			throw new Error(
				"Mapbox token is not defined. Please check your environment variables.",
			);
		}
		this.accessToken = accessToken;
	}
	async geocodeAddress(address: string): Promise<MapboxAPIResponse | null> {
		const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?country=no&access_token=${this.accessToken}`;
		try {
			const response = await fetch(url);
			if (!response.ok)
				throw new Error(
					`Mapbox API call failed with status: ${response.status}`,
				);
			return response.json();
		} catch (error) {
			console.error("Failed to geocode address:", error);
			return null;
		}
	}
}

export interface MapboxAPIResponse {
	features: Array<{
		center: [number, number];
		id: string;
		place_name: string;
	}>;
}
