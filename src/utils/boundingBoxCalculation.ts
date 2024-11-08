// src/utils/boundingBoxCalculation.ts
import type { Geopoint } from "@/types";

/**
 * Calculates the bounding box for a region by expanding the existing box to include a new geopoint
 * @param currentBounds - Current bounding box with SW and NE geopoints
 * @param geopoint - New geopoint to include in the bounding box
 * @returns Updated bounding box
 */
export function calculateBoundingBox(
	currentBounds: { sw: Geopoint; ne: Geopoint } | undefined,
	geopoint: Geopoint,
): { sw: Geopoint; ne: Geopoint } {
	if (!currentBounds) {
		return {
			sw: { ...geopoint, _type: "geopoint" },
			ne: { ...geopoint, _type: "geopoint" },
		};
	}

	return {
		sw: {
			_type: "geopoint",
			lat: Math.min(currentBounds.sw.lat ?? 0, geopoint.lat ?? 0),
			lng: Math.min(currentBounds.sw.lng ?? 0, geopoint.lng ?? 0),
		},
		ne: {
			_type: "geopoint",
			lat: Math.max(currentBounds.ne.lat ?? 0, geopoint.lat ?? 0),
			lng: Math.max(currentBounds.ne.lng ?? 0, geopoint.lng ?? 0),
		},
	};
}
