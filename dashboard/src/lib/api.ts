export const API_URL = "https://web-production-75bfb.up.railway.app";

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
    const headers = {
        "Content-Type": "application/json",
        ...options.headers,
    };

    const token = localStorage.getItem("accessToken");
    if (token) {
        // @ts-ignore
        headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.message || "Something went wrong");
    }
    return data;
}
