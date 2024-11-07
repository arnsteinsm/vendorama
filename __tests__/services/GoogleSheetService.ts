// __tests__/services/GoogleSheetService.ts

import { GoogleSheetService } from "../../src/services/GoogleSheetService";

// Mock the global fetch function
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("GoogleSheetService", () => {
	const sheetId = "test_sheet_id";
	const sheetService = new GoogleSheetService(sheetId);

	beforeEach(() => {
		mockFetch.mockClear();
	});

	it("fetches data successfully from the Google Sheet and returns JSON", async () => {
		// Update mock CSV to match the new structure
		const mockCsv = `"KUNDENR","KUNDENAVN","K_Adresse","K_PostNr","K_PostSted","PRODUKTNAVN"
"2450302","BUNNPRIS & GOURMET ALTA","LABYRINTEN 4","9510","ALTA","Hervik 80% Jordbærsyltetøy m/ Lime, Eple, Sitron 320g;Hervik Ripsgelé 330g;Hervik Plomme og Kirsebærsyltetøy 320g;Hervik Ufiltrert Rips Bringebærsaft 0.5l 0,5l;Hervik Ufiltrert Bringebærsaft 0.5l 0,5l;Hervik Hardangerplommesyltetøy 320g"
"114751","BUNNPRIS & GOURMET BOSSEKOP","SKIFERVEIEN 2","9513","ALTA","Hervik Hardangerplommesyltetøy 320g;Hervik Ufiltrert Rips Bringebærsaft 0.5l 0,5l;Hervik Ripsgelé 330g"`;

		mockFetch.mockResolvedValue({
			ok: true,
			text: () => Promise.resolve(mockCsv),
			status: 200,
			statusText: "OK",
		});

		// Update expected result to match the mock data structure
		const result = await sheetService.fetchSheetData("result");
		expect(result).toEqual([
			{
				KUNDENR: "2450302",
				KUNDENAVN: "BUNNPRIS & GOURMET ALTA",
				K_Adresse: "LABYRINTEN 4",
				K_PostNr: "9510",
				K_PostSted: "ALTA",
				PRODUKTNAVN:
					"Hervik 80% Jordbærsyltetøy m/ Lime, Eple, Sitron 320g;Hervik Ripsgelé 330g;Hervik Plomme og Kirsebærsyltetøy 320g;Hervik Ufiltrert Rips Bringebærsaft 0.5l 0,5l;Hervik Ufiltrert Bringebærsaft 0.5l 0,5l;Hervik Hardangerplommesyltetøy 320g",
			},
			{
				KUNDENR: "114751",
				KUNDENAVN: "BUNNPRIS & GOURMET BOSSEKOP",
				K_Adresse: "SKIFERVEIEN 2",
				K_PostNr: "9513",
				K_PostSted: "ALTA",
				PRODUKTNAVN:
					"Hervik Hardangerplommesyltetøy 320g;Hervik Ufiltrert Rips Bringebærsaft 0.5l 0,5l;Hervik Ripsgelé 330g",
			},
		]);
	});

	it("throws an error when the fetch operation fails", async () => {
		mockFetch.mockResolvedValue({
			ok: false,
			status: 404,
			statusText: "Not Found",
		});

		await expect(sheetService.fetchSheetData("result")).rejects.toThrow(
			"Failed to fetch or parse data from Google Sheet: Failed to fetch data: 404 Not Found",
		);
	});
});
