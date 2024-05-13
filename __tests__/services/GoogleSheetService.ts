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
    const mockCsv = `"Name","Age"\n"John",30\n"Jane",25`;
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(mockCsv),
      status: 200,
      statusText: "OK",
    });

    const result = await sheetService.fetchSheetData("result");
    expect(result).toEqual([
      { Name: "John", Age: "30" },
      { Name: "Jane", Age: "25" },
    ]);
  });

  it("throws an error when the fetch operation fails", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
    });

    await expect(sheetService.fetchSheetData("result")).rejects.toThrow(
      "Failed to fetch data with status: 404 Not Found",
    );
  });
});
