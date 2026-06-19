import { LS } from "@/lib/utils";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://web-production-75bfb.up.railway.app";
// export const API_URL = "http://localhost:3001";

const baseUrl = () => (API_URL.endsWith("/") ? API_URL.slice(0, -1) : API_URL);

let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
    if (refreshInFlight) return refreshInFlight;

    const refreshToken = LS.get("refreshToken", null);
    if (!refreshToken) return null;

    refreshInFlight = (async () => {
        try {
            const res = await fetch(`${baseUrl()}/auth/refresh`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refreshToken }),
            });
            if (!res.ok) return null;
            const data = await res.json();
            if (!data.accessToken) return null;
            LS.set("accessToken", data.accessToken);
            if (data.refreshToken) LS.set("refreshToken", data.refreshToken);
            return data.accessToken as string;
        } catch {
            return null;
        } finally {
            // Reset on next tick so concurrent callers in this cycle share the result
            setTimeout(() => { refreshInFlight = null; }, 0);
        }
    })();

    return refreshInFlight;
}

function buildHeaders(extra: HeadersInit | undefined, token: string | null): HeadersInit {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(extra as Record<string, string> | undefined),
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
}

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
    const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const url = `${baseUrl()}${path}`;

    // Don't auto-refresh on the auth endpoints themselves
    const isAuthEndpoint = path.startsWith("/auth/");

    const token = LS.get("accessToken", null);
    let res = await fetch(url, { ...options, headers: buildHeaders(options.headers, token) });

    if (res.status === 401 && !isAuthEndpoint) {
        const newToken = await refreshAccessToken();
        if (newToken) {
            res = await fetch(url, { ...options, headers: buildHeaders(options.headers, newToken) });
        } else {
            // Refresh failed — clear creds and bounce to login
            LS.del("accessToken");
            LS.del("refreshToken");
            if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
                window.location.href = "/login";
            }
        }
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(data.message || "Something went wrong");
    }
    return data;
}

// --- Global Banners (multiple per account) -------------------------------

export interface GlobalBannerUpsert {
    name?: string;
    enabled?: boolean;
    sheetUrl?: string;
    creativeJson?: any;
    offerLayerId?: string | null;
    offerImageLayerId?: string | null;
    styleJson?: any;
    rulesJson?: any;
    layoutJson?: any;
    priority?: number;
}

export async function listGlobalBanners() {
    return apiFetch("/global-banner");
}

export async function getGlobalBanner(id: string) {
    return apiFetch(`/global-banner/${id}`);
}

export async function createGlobalBanner(cfg: GlobalBannerUpsert) {
    return apiFetch("/global-banner", { method: "POST", body: JSON.stringify(cfg) });
}

export async function updateGlobalBanner(id: string, cfg: GlobalBannerUpsert) {
    return apiFetch(`/global-banner/${id}`, { method: "PUT", body: JSON.stringify(cfg) });
}

export async function deleteGlobalBanner(id: string) {
    return apiFetch(`/global-banner/${id}`, { method: "DELETE" });
}

export async function refreshGlobalBannerSheet(id: string) {
    return apiFetch(`/global-banner/${id}/refresh`, { method: "POST" });
}

export async function previewGlobalBanner(id: string, handle: string, sheetUrl?: string) {
    const sheetParam = sheetUrl ? `&sheetUrl=${encodeURIComponent(sheetUrl)}` : "";
    return apiFetch(`/global-banner/${id}/preview?handle=${encodeURIComponent(handle)}${sheetParam}`);
}
