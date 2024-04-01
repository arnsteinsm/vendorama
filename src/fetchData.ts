import csvtojson from "csvtojson";

// Function to fetch data from Google Sheets and convert to JSON
export async function fetchDataFromGoogleSheets(
  sheetId: string,
): Promise<any[]> {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=result`;
  console.log(`Fetching data from URL: ${url}`); // Log the URL being accessed
  const response = await fetch(url);
  console.log(`Response status: ${response.status} ${response.statusText}`); // Log the response status
  if (!response.ok) {
    throw new Error(`Failed to fetch data: ${response.statusText}`);
  }
  const csvData = await response.text();
  const jsonData = await csvtojson().fromString(csvData);
  return jsonData;
}
