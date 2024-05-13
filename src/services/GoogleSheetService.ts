import csvtojson from "csvtojson"; // For converting CSV to JSON

export class GoogleSheetService {
  constructor(private sheetId: string) {}

  async fetchSheetData(sheetName: string): Promise<any[]> {
    const url = `https://docs.google.com/spreadsheets/d/${this.sheetId}/gviz/tq?tqx=out:csv&sheet=${sheetName}`;
    console.log(`Fetching data from URL: ${url}`);

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch data with status: ${response.status} ${response.statusText}`,
        );
      }

      const csvData = await response.text();
      const jsonData = await csvtojson().fromString(csvData);
      return jsonData;
    } catch (error: unknown) {
      // Using type guard to narrow down the type
      if (error instanceof Error) {
        console.error(`Error in fetchSheetData: ${error.message}`);
        throw new Error(`Error fetching or processing data: ${error.message}`);
      } else {
        // Handle non-Error throwables
        console.error(`An unexpected error occurred: ${String(error)}`);
        throw new Error("An unexpected error occurred");
      }
    }
  }
}
