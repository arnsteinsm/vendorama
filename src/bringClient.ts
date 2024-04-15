// utils/bringClient.ts

interface BringAPIResponse {
  postal_codes: Array<{
    city: string;
    municipality: string;
    county: string;
  }>;
}

export async function fetchBringData(
  postalCode: string,
): Promise<BringAPIResponse | null> {
  const url = `https://api.bring.com/address/api/no/postal-codes/${postalCode}`;
  const headers = {
    "X-Mybring-API-Uid": process.env.BRING_ID!,
    "X-Mybring-API-Key": process.env.BRING_KEY!,
  };

  try {
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(
        `Failed to fetch data from Bring API: ${response.statusText}`,
      );
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching Bring data:", error);
    return null;
  }
}
