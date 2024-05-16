// utils/apiClient.ts

interface APIRequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  headers?: Record<string, string>;
  body?: any;
}

async function makeAPIRequest<T>(
  url: string,
  options: APIRequestOptions = {},
): Promise<T> {
  const { method = "GET", headers = {}, body = null } = options;

  const config: RequestInit = {
    method,
    headers: new Headers(headers),
    body: body ? JSON.stringify(body) : null,
  };

  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return (await response.json()) as T;
  } catch (error) {
    console.error("Failed to fetch data:", error);
    throw error;
  }
}

export { makeAPIRequest };
