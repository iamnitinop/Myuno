import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const uid = () =>
    "xxxxxxxx".replace(/x/g, () => ((Math.random() * 16) | 0).toString(16));

export const LS = {
    get(key: string, fallback: any) {
        if (typeof window === "undefined") return fallback;
        try {
            const v = localStorage.getItem(key);
            return v ? JSON.parse(v) : fallback;
        } catch {
            return fallback;
        }
    },
    set(key: string, value: any) {
        if (typeof window === "undefined") return;
        localStorage.setItem(key, JSON.stringify(value));
    },
    del(key: string) {
        if (typeof window === "undefined") return;
        localStorage.removeItem(key);
    },
};

export const hashish = (s: string) => {
    // NOTE: Demo only. Do NOT use this for production passwords.
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(16);
};

export const isDesktopByWidth = (w: number) => w >= 768;
