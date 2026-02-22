import { LS } from "@/lib/utils";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://web-production-75bfb.up.railway.app";
// export const API_URL = "http://localhost:3001";

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
    const headers = {
        "Content-Type": "application/json",
        ...options.headers,
    };

    const token = LS.get("accessToken", null);
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
