const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3060";

export async function request(path, identity, options = {}) {
  const headers = { "Content-Type": "application/json" };
  if (identity?.token) headers.Authorization = `Bearer ${identity.token}`;

  const response = await fetch(`${API_URL}${path}`, { headers, ...options });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}
