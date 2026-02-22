"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { uid, LS } from "@/lib/utils";
import { defaultBanner, defaultRules } from "@/lib/defaults";
import { AccountData, Banner, TargetingRules, AdvancedTargetingRules } from "@/lib/types";
import { VisualEditor } from "@/components/features/editor/visual/VisualEditor";
import { RuleBuilder } from "@/components/features/rules";
import { AdvancedTargetingBuilder } from "@/components/features/targeting/AdvancedTargetingBuilder";
import { TargetingSimulator } from "@/components/features/targeting/TargetingSimulator";
import { PublishSettings } from "@/components/features/publish/PublishSettings";
import { Pill } from "@/components/ui/Pill";
import { Card } from "@/components/ui/Card";
import { ensureAdvancedRules } from "@/lib/rule-migration";
import { ArrowLeft, Pencil, Check, X, Eye } from "lucide-react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

export default function CampaignEditor({ campaignId }: { campaignId: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialTab = (searchParams?.get("tab") as "editor" | "targeting" | "publish") || "editor";

    const [tab, setTab] = useState<"editor" | "targeting" | "publish">(initialTab);
    const [data, setData] = useState<AccountData | null>(null);
    const [isEditingName, setIsEditingName] = useState(false);
    const [editedName, setEditedName] = useState("");
    const [showToast, setShowToast] = useState(false);
    const [accountId, setAccountId] = useState("Loading...");

    // Fetch Campaign Data
    useEffect(() => {
        const loadCampaign = async () => {
            try {
                const campaign = await apiFetch(`/campaigns/${campaignId}`);

                // Map to AccountData structure expected by children
                const banner = typeof campaign.creativeJson === 'string' ? JSON.parse(campaign.creativeJson) : campaign.creativeJson;
                banner.id = campaign.id;
                banner.name = campaign.name;
                banner.status = campaign.status;
                banner.type = campaign.type;

                const rule = typeof campaign.rulesJson === 'string' ? JSON.parse(campaign.rulesJson) : campaign.rulesJson;
                if (rule) rule.bannerId = campaign.id;

                setData({
                    accountId: campaign.accountId,
                    banners: [banner],
                    rules: rule ? [rule] : [defaultRules(campaign.id)],
                    abTests: [],
                    events: []
                });
                setAccountId(campaign.accountId);
            } catch (e) {
                console.error("Failed to load campaign", e);
                // router.push("/campaigns"); // Redirect if not found
            }
        };
        loadCampaign();
    }, [campaignId, router]);

    if (!data) return <div>Loading...</div>;

    const banner = data.banners.find(b => b.id === campaignId);
    if (!banner) {
        return <div>Campaign not found in loaded data</div>;
    }

    const rawRules = data.rules.find((r) => r.bannerId === banner.id) || defaultRules(banner.id);
    const rules = ensureAdvancedRules(rawRules);

    // Check if it's an email capture campaign (contains email form)
    const isAdvancedTargeting = banner.views.desktop.layers.some(l => l.type === 'email_form') ||
        (banner.views.mobile?.layers.some(l => l.type === 'email_form') ?? false);

    // Save logic
    const saveToServer = async (nextData: AccountData) => {
        // Optimistic update
        setData(nextData);

        const nextBanner = nextData.banners[0];
        const nextRules = nextData.rules[0];

        try {
            await apiFetch(`/campaigns/${campaignId}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    name: nextBanner.name,
                    creativeJson: nextBanner,
                    rulesJson: nextRules
                })
            });
        } catch (e) {
            console.error("Save failed", e);
            // Optionally show error toast
        }
    };

    // Auto-save (no toast)
    const autoSave = (next: AccountData) => {
        saveToServer(next);
    };

    // Manual save (with toast)
    const manualSave = async () => {
        if (!data) return;
        await saveToServer(data);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    const updateBanner = (nextBanner: Banner) => {
        const next = {
            ...data,
            banners: [nextBanner],
        };
        autoSave(next);
    };

    const updateRules = (nextRules: AdvancedTargetingRules) => {
        // Fix: ensure bannerId is correct in rules
        const fixedRules = { ...nextRules, bannerId: banner.id };
        const next = {
            ...data,
            rules: [fixedRules],
        };
        autoSave(next);
    };

    const publish = async () => {
        try {
            const nextBanner = { ...banner, status: "published" as const };
            const next = {
                ...data,
                banners: [nextBanner],
            };

            // Call dedicated publishing service (creates R2 snapshots)
            await apiFetch(`/publish/${campaignId}`, {
                method: 'POST'
            });

            setData(next);
        } catch (e) {
            console.error("Publish failed", e);
        }
    };

    const unpublish = async () => {
        try {
            const nextBanner = { ...banner, status: "draft" as const };
            const next = {
                ...data,
                banners: [nextBanner],
            };

            // Call dedicated unpublish service
            await apiFetch(`/publish/${campaignId}/unpublish`, {
                method: 'POST'
            });

            setData(next);
        } catch (e) {
            console.error("Unpublish failed", e);
        }
    };

    const startEditingName = () => {
        setEditedName(banner.name);
        setIsEditingName(true);
    };

    const saveName = () => {
        if (editedName.trim()) {
            updateBanner({ ...banner, name: editedName.trim() });
            setIsEditingName(false);
        }
    };

    const cancelEditingName = () => {
        setIsEditingName(false);
        setEditedName("");
    };

    return (
        <div className="flex flex-col h-[calc(100vh-80px)] -m-6 bg-white dark:bg-gray-950 relative">
            {/* TOAST NOTIFICATION */}
            {showToast && (
                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="bg-gray-900 text-white dark:bg-white dark:text-gray-900 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-500" />
                        <span className="text-sm font-medium">Campaign saved successfully</span>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
                <Link
                    href="/campaigns"
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="flex-1">
                    {isEditingName ? (
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={editedName}
                                onChange={(e) => setEditedName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") saveName();
                                    if (e.key === "Escape") cancelEditingName();
                                }}
                                className="text-2xl font-bold bg-transparent border-b-2 border-blue-500 focus:outline-none px-1"
                                autoFocus
                            />
                            <button
                                onClick={saveName}
                                className="p-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white transition-colors"
                            >
                                <Check className="w-4 h-4" />
                            </button>
                            <button
                                onClick={cancelEditingName}
                                className="p-1.5 rounded-lg bg-gray-500 hover:bg-gray-600 text-white transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold">{banner.name}</h1>
                            <button
                                onClick={startEditingName}
                                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                title="Edit campaign name"
                            >
                                <Pencil className="w-4 h-4 text-gray-500" />
                            </button>
                        </div>
                    )}
                    <p className="text-sm text-gray-500">Edit your campaign settings and design</p>
                </div>

                {/* Preview Button */}
                <button
                    onClick={() => router.push(`/campaigns/${campaignId}/preview`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-md shadow-sm transition-all text-sm font-medium"
                >
                    <Eye className="w-4 h-4" />
                    <span>Preview</span>
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden relative">
                {tab === "editor" ? (
                    <VisualEditor banner={banner} onChange={updateBanner} />
                ) : tab === "targeting" ? (
                    <div className="h-full overflow-y-auto p-6">
                        {isAdvancedTargeting ? (
                            <div className="max-w-5xl mx-auto">
                                <Card title="Advanced Targeting">
                                    <AdvancedTargetingBuilder
                                        banner={banner}
                                        rules={rules as AdvancedTargetingRules}
                                        onChange={updateRules}
                                    />
                                </Card>
                            </div>
                        ) : (
                            <div className="grid gap-6 lg:grid-cols-2 max-w-7xl mx-auto">
                                <Card title="Rule Builder">
                                    <RuleBuilder rules={rules} onChange={updateRules} />
                                </Card>
                                <Card title="Rule Simulator">
                                    <TargetingSimulator banner={banner} rules={rules as AdvancedTargetingRules} />
                                </Card>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="h-full overflow-y-auto p-6">
                        <div className="max-w-4xl mx-auto">
                            <PublishSettings
                                accountId={accountId}
                                banner={banner}
                                onPublish={publish}
                                onUnpublish={unpublish}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="h-16 px-6 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center justify-between shrink-0 z-10">
                <div className="flex bg-gray-100 dark:bg-gray-800 rounded p-1">
                    <button
                        onClick={() => setTab("editor")}
                        className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${tab === "editor"
                            ? "bg-blue-600 text-white shadow"
                            : "text-gray-600 dark:text-gray-300 hover:text-gray-900"
                            }`}
                    >
                        Editor
                    </button>
                    <button
                        onClick={() => setTab("targeting")}
                        className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${tab === "targeting"
                            ? "bg-blue-600 text-white shadow"
                            : "text-gray-600 dark:text-gray-300 hover:text-gray-900"
                            }`}
                    >
                        Targeting
                    </button>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={manualSave} // Manual save with toast
                        className="px-6 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-medium transition-colors"
                    >
                        Save
                    </button>
                    <button
                        onClick={() => setTab("publish")}
                        className="px-6 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 font-medium transition-colors border border-gray-200 dark:border-gray-700"
                    >
                        Publish
                    </button>
                </div>
            </div>
        </div>
    );
}
