// src/services/GoogleSheetService.ts

import type { ExternalVendor } from "@/models/externalVendor"; // Import ExternalVendor type
import csvtojson from "csvtojson";

export class GoogleSheetService {
	constructor(private sheetId: string) {}

	async fetchSheetData(sheetName: string): Promise<ExternalVendor[]> {
		const url = `https://docs.google.com/spreadsheets/d/${this.sheetId}/gviz/tq?tqx=out:csv&sheet=${sheetName}`;
		console.log(`Fetching data from Google Sheet: ${sheetName}`);

		try {
			const response = await fetch(url);
			if (!response.ok) {
				throw new Error(
					`Failed to fetch data: ${response.status} ${response.statusText}`,
				);
			}

			console.log("Converting CSV data to JSON format...");
			const csvData = await response.text();
			const jsonData = await csvtojson().fromString(csvData);

			// Map the raw data to ExternalVendor type structure
			const typedData = jsonData.map((row) => ({
				KUNDENR: row.KUNDENR,
				KUNDENAVN: row.KUNDENAVN,
				K_Adresse: row.K_Adresse,
				K_PostNr: row.K_PostNr,
				K_PostSted: row.K_PostSted,
				PRODUKTNAVN: row.PRODUKTNAVN,
			})) as ExternalVendor[];

			console.log(
				`Successfully fetched and parsed ${typedData.length} records.`,
			);
			return typedData;
		} catch (error) {
			console.error("Error in fetchSheetData:", error);
			throw new Error(
				`Failed to fetch or parse data from Google Sheet: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}
}
