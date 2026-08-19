const fallbackApiUrl =
  typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:3060`
    : "http://localhost:3060";

const API_URL = import.meta.env.VITE_API_URL || fallbackApiUrl;

export async function request(path, identity, options = {}) {
  const headers = { "Content-Type": "application/json" };
  if (identity?.token) headers.Authorization = `Bearer ${identity.token}`;

  const url = new URL(`${API_URL}${path}`);
  if (identity?.name && !identity.token && !url.searchParams.has("userName")) {
    url.searchParams.set("userName", identity.name);
  }

  const response = await fetch(url, { headers, ...options });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}
