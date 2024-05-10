// utils/bringClient.ts

import "dotenv/config";

export interface BringAPIResponse {
  postal_codes: Array<{
    city: string;
    municipality: string;
    county: string;
  }>;
}

import { makeAPIRequest } from "./apiClient";

export async function fetchBringData(
  postalCode: string,
): Promise<BringAPIResponse> {
  const url = `https://api.bring.com/address/api/no/postal-codes/${postalCode}`;
  const headers: Record<string, string> = {
    "X-Mybring-API-Uid": process.env.BRING_ID!,
    "X-Mybring-API-Key": process.env.BRING_KEY!,
  };
  return makeAPIRequest<BringAPIResponse>(url, { headers });
}
