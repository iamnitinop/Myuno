"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AdvancedTargetingRules, GlobalBannerLayout } from "@/lib/types";
import { getGlobalBanner, updateGlobalBanner, refreshGlobalBannerSheet } from "@/lib/api";
import { ensureAdvancedRules } from "@/lib/rule-migration";
import { defaultRules } from "@/lib/defaults";
import { defaultGlobalBannerLayout } from "../defaults";
import { GlobalBannerLayoutEditor } from "../GlobalBannerLayoutEditor";
import { RuleBuilder } from "@/components/features/rules";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Pill } from "@/components/ui/Pill";
import { Check, ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function GlobalBannerEditorPage() {
    const params = useParams();
    const router = useRouter();
    const id = String(params?.id || "");

    const [name, setName] = useState("Banner");
    const [enabled, setEnabled] = useState(false);
    const [priority, setPriority] = useState(0);
    const [sheetUrl, setSheetUrl] = useState("");
    const [layout, setLayout] = useState<GlobalBannerLayout>(() => defaultGlobalBannerLayout());
    const [rules, setRules] = useState<AdvancedTargetingRules>(() => ensureAdvancedRules(defaultRules(id)));

    const [tab, setTab] = useState<"layout" | "settings" | "targeting">("layout");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [savedToast, setSavedToast] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const cfg = await getGlobalBanner(id);
                setName(cfg.name || "Banner");
                setEnabled(!!cfg.enabled);
                setPriority(cfg.priority ?? 0);
                setSheetUrl(cfg.sheetUrl || "");
                setLayout(cfg.layoutJson && cfg.layoutJson.bar ? cfg.layoutJson : defaultGlobalBannerLayout());
                setRules(ensureAdvancedRules(cfg.rulesJson || defaultRules(id)));
            } catch (e) {
                alert("Failed to load banner: " + (e as Error).message);
                router.push("/global-banner");
            } finally {
                setLoading(false);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const save = async () => {
        setSaving(true);
        try {
            await updateGlobalBanner(id, {
                name, enabled, priority, sheetUrl,
                layoutJson: layout,
                rulesJson: { ...rules, enabled: rules.enabled },
            });
            setSavedToast(true);
            setTimeout(() => setSavedToast(false), 2500);
        } catch (e) {
            alert("Save failed: " + (e as Error).message);
        } finally {
            setSaving(false);
        }
    };

    const refresh = async () => {
        setRefreshing(true);
        try { await refreshGlobalBannerSheet(id); } catch (e) { alert("Refresh failed: " + (e as Error).message); }
        finally { setRefreshing(false); }
    };

    if (loading) return <div className="p-6 text-sm text-gray-500">Loading…</div>;

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] -m-6">
            {savedToast && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
                    <div className="bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-500" /><span className="text-sm font-medium">Saved</span>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
                <Link href="/global-banner" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><ArrowLeft className="w-5 h-5" /></Link>
                <input value={name} onChange={(e) => setName(e.target.value)}
                    className="text-xl font-bold bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none" />
                <div className="flex bg-gray-100 dark:bg-gray-800 rounded p-1 ml-2">
                    {(["layout", "settings", "targeting"] as const).map((t) => (
                        <button key={t} onClick={() => setTab(t)}
                            className={`px-3 py-1 rounded text-sm font-medium capitalize transition-colors ${tab === t ? "bg-blue-600 text-white shadow" : "text-gray-600 dark:text-gray-300"}`}>
                            {t}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-3 ml-auto">
                    <Pill active={enabled} onClick={() => setEnabled(!enabled)}>{enabled ? "Live" : "Off"}</Pill>
                    <button onClick={refresh} disabled={refreshing} title="Clear sheet cache so edits go live"
                        className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-60 text-sm font-medium flex items-center gap-2">
                        <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh
                    </button>
                    <button onClick={save} disabled={saving}
                        className="px-5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-medium flex items-center gap-2">
                        {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save
                    </button>
                </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-hidden">
                {tab === "layout" && (
                    <GlobalBannerLayoutEditor layout={layout} onChange={setLayout} id={id} sheetUrl={sheetUrl} />
                )}
                {tab === "settings" && (
                    <div className="h-full overflow-y-auto p-6">
                        <div className="max-w-2xl mx-auto">
                            <Card title="Sheet & Settings">
                                <div className="space-y-4">
                                    <Input label="Published Google Sheet URL" value={sheetUrl} onChange={(e) => setSheetUrl(e.target.value)} placeholder="https://docs.google.com/…/pubhtml?gid=0&single=true" />
                                    <p className="text-xs text-gray-500 -mt-2">Use a <strong>Publish to web</strong> link or share “Anyone with the link”. Needs <code>Page Handle</code>, <code>Promotion Text</code>, <code>Sale Active</code>, and an <code>Image</code> column. The sheet message's first heading line is stripped automatically — set your heading in the Layout tab's “Custom heading” container.</p>
                                    <Input label="Priority (lower wins when multiple banners match)" type="number" value={String(priority)} onChange={(e) => setPriority(Number(e.target.value) || 0)} />
                                </div>
                            </Card>
                        </div>
                    </div>
                )}
                {tab === "targeting" && (
                    <div className="h-full overflow-y-auto p-6">
                        <div className="max-w-5xl mx-auto">
                            <Card title="Targeting Rules">
                                <p className="text-sm text-gray-500 mb-4">
                                    BAU: <strong>First URL visitor came to this session</strong> <code>does not contain</code> <code>utm</code>; CRM: <code>contains</code> <code>utm_campaign=crm</code>.
                                </p>
                                <RuleBuilder rules={rules} onChange={setRules} />
                            </Card>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
