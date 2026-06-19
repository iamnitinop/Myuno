"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { listGlobalBanners, createGlobalBanner, deleteGlobalBanner, updateGlobalBanner } from "@/lib/api";
import { defaultGlobalBannerLayout } from "./defaults";
import { Globe, Plus, Pencil, Trash2, Loader2 } from "lucide-react";

interface BannerRow {
    id: string;
    name: string;
    enabled: boolean;
    priority: number;
    sheetUrl: string;
}

export default function GlobalBannerListPage() {
    const router = useRouter();
    const [banners, setBanners] = useState<BannerRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);

    const load = async () => {
        try {
            const rows = await listGlobalBanners();
            setBanners(Array.isArray(rows) ? rows : []);
        } catch {
            setBanners([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const createNew = async () => {
        setCreating(true);
        try {
            const created = await createGlobalBanner({
                name: "New Banner",
                enabled: false,
                creativeJson: {},
                layoutJson: defaultGlobalBannerLayout(),
                priority: banners.length,
            });
            router.push(`/global-banner/${created.id}`);
        } catch (e) {
            alert("Create failed: " + (e as Error).message);
            setCreating(false);
        }
    };

    const [toggling, setToggling] = useState<string | null>(null);
    const toggle = async (b: BannerRow) => {
        const next = !b.enabled;
        setToggling(b.id);
        // optimistic
        setBanners((rows) => rows.map((x) => (x.id === b.id ? { ...x, enabled: next } : x)));
        try {
            await updateGlobalBanner(b.id, { enabled: next });
        } catch (e) {
            // revert on failure
            setBanners((rows) => rows.map((x) => (x.id === b.id ? { ...x, enabled: b.enabled } : x)));
            alert("Could not update: " + (e as Error).message);
        } finally {
            setToggling(null);
        }
    };

    const remove = async (id: string, name: string) => {
        if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
        try {
            await deleteGlobalBanner(id);
            setBanners((b) => b.filter((x) => x.id !== id));
        } catch (e) {
            alert("Delete failed: " + (e as Error).message);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Globe className="w-6 h-6 text-blue-600" /> Global Banners
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Sheet-driven banners (BAU, CRM/Sale, …). Targeting rules decide which one a visitor sees.
                    </p>
                </div>
                <button
                    onClick={createNew}
                    disabled={creating}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium transition-colors flex items-center gap-2"
                >
                    {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    New banner
                </button>
            </div>

            {loading ? (
                <div className="text-sm text-gray-500">Loading…</div>
            ) : banners.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-10 text-center">
                    <p className="text-sm text-gray-500 mb-4">No global banners yet. Create one — e.g. a BAU banner and a CRM/Sale banner.</p>
                    <button onClick={createNew} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium">Create your first banner</button>
                </div>
            ) : (
                <div className="space-y-3">
                    {banners.map((b) => (
                        <div key={b.id} className="flex items-center gap-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 hover:shadow-sm transition-shadow">
                            {/* Live toggle */}
                            <div className="flex flex-col items-center gap-1 w-14 shrink-0">
                                <button
                                    role="switch"
                                    aria-checked={b.enabled}
                                    aria-label={b.enabled ? `Turn ${b.name} off` : `Turn ${b.name} live`}
                                    disabled={toggling === b.id}
                                    onClick={() => toggle(b)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-60 ${b.enabled ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"}`}
                                >
                                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${b.enabled ? "translate-x-5" : "translate-x-0.5"}`} />
                                </button>
                                <span className={`text-[10px] font-bold uppercase tracking-wide ${b.enabled ? "text-green-600" : "text-gray-400"}`}>
                                    {b.enabled ? "Live" : "Off"}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-semibold">{b.name}</div>
                                <div className="text-xs text-gray-500 truncate">
                                    priority {b.priority} · {b.sheetUrl ? "sheet set" : "no sheet"}
                                </div>
                            </div>
                            <button onClick={() => router.push(`/global-banner/${b.id}`)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" title="Edit">
                                <Pencil className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                            </button>
                            <button onClick={() => remove(b.id, b.name)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20" title="Delete">
                                <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <p className="text-xs text-gray-400">
                Tip: give the BAU banner a rule like <code>first-session URL does not contain “utm”</code> and the CRM banner <code>first-session URL contains “utm…”</code>. Lower priority number wins when several match.
            </p>
        </div>
    );
}
