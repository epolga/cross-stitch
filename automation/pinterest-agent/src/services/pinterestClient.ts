import "dotenv/config";

const PINTEREST_API_BASE = "https://api.pinterest.com/v5";

export async function pinterestGet<T>(path: string): Promise<T> {
  const token = process.env.PINTEREST_ACCESS_TOKEN;

  if (!token) {
    throw new Error("Missing PINTEREST_ACCESS_TOKEN");
  }

  const response = await fetch(`${PINTEREST_API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Pinterest API error ${response.status}: ${text}`);
  }

  return response.json() as Promise<T>;
}
