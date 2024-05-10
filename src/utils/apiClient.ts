// utils/apiClient.ts

import "dotenv/config";

export async function makeAPIRequest<T>(
  url: string,
  options: RequestInit,
): Promise<T> {
  try {
    const response = await fetch(url, options);
    if (!response.ok)
      throw new Error(
        `API request failed with status ${response.status}: ${response.statusText}`,
      );
    return (await response.json()) as T;
  } catch (error) {
    console.error("API request error:", error);
    throw error;
  }
}
