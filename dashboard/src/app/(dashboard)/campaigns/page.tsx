"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Monitor, Smartphone, Trash2, BarChart3, Edit, Target, Gift, Download, FileUp, Archive, History, Plug, Copy } from "lucide-react";
import { LS, uid } from "@/lib/utils";
import { defaultRules } from "@/lib/defaults";
import { AccountData, Banner, TargetingRules, AdvancedTargetingRules } from "@/lib/types";
import { CreatePromotionModal } from "@/components/features/campaigns/CreatePromotionModal";
import { exportCampaign } from "@/lib/campaign-export";
import { ensureAdvancedRules } from "@/lib/rule-migration";
import { apiFetch } from "@/lib/api";

export default function CampaignsPage() {
    const router = useRouter();
    const [data, setData] = useState<AccountData | null>(null);
    const [loading, setLoading] = useState(true);
    const [showOptionsPanel, setShowOptionsPanel] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [activeTab, setActiveTab] = useState<"actions" | "settings">("actions");
    const [panelPosition, setPanelPosition] = useState<{ top: number; right: number; placement: 'above' | 'below' } | null>(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            const campaigns = await apiFetch("/campaigns");
            // Map backend campaigns to frontend AccountData structure
            // Backend returns { id, name, type, status, creativeJson, rulesJson, ... }

            const banners: Banner[] = [];
            const rules: (TargetingRules | AdvancedTargetingRules)[] = [];

            campaigns.forEach((c: any) => {
                // Parse creativeJson if it's string, or use as object
                const banner = typeof c.creativeJson === 'string' ? JSON.parse(c.creativeJson) : c.creativeJson;
                // Merge top-level fields
                banner.id = c.id;
                banner.name = c.name;
                banner.status = c.status;
                banner.type = c.type;
                banners.push(banner);

                const rule = typeof c.rulesJson === 'string' ? JSON.parse(c.rulesJson) : c.rulesJson;
                if (rule) {
                    rule.bannerId = c.id;
                    rules.push(rule);
                }
            });

            const accountId = LS.get("accountId", "") || campaigns[0]?.accountId || "";

            setData({
                accountId,
                banners,
                rules,
                abTests: [],
                events: [] // TODO: Fetch events/stats from backend
            });
        } catch (err) {
            console.error("Failed to fetch campaigns", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (loading) return <div className="p-8 text-center">Loading campaigns...</div>;
    if (!data) return <div className="p-8 text-center">Failed to load data</div>;

    const getCampaignStats = (campaignId: string) => {
        // Placeholder stats until backend supports aggregation
        // const campaignEvents = data.events.filter(e => e.bannerId === campaignId);
        return { impressions: 0, clicks: 0, conversions: 0 };
    };

    const toggleCampaignStatus = async (campaignId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const campaign = data.banners.find(b => b.id === campaignId);
        if (!campaign) return;

        const newStatus = campaign.status === "published" ? "draft" : "published";

        // Optimistic update
        const updatedBanners = data.banners.map(b =>
            b.id === campaignId
                ? { ...b, status: newStatus as "draft" | "published" }
                : b
        );
        setData({ ...data, banners: updatedBanners });

        try {
            await apiFetch(`/campaigns/${campaignId}`, {
                method: "PATCH",
                body: JSON.stringify({ status: newStatus })
            });
        } catch (err) {
            console.error("Failed to update status", err);
            // Revert on failure
            fetchData();
        }
    };

    const deleteCampaign = async (campaignId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this campaign?")) return;

        try {
            await apiFetch(`/campaigns/${campaignId}`, { method: "DELETE" });
        } catch (err) {
            console.error("Failed to delete", err);
            alert("Failed to delete campaign. Please try again.");
            return;
        }

        const newData = {
            ...data,
            banners: data.banners.filter(b => b.id !== campaignId),
            rules: data.rules.filter(r => r.bannerId !== campaignId),
        };
        setData(newData);
        setShowOptionsPanel(null);
    };

    const duplicateCampaign = async (campaignId: string) => {
        const banner = data?.banners.find(b => b.id === campaignId);
        const rules = data?.rules.find(r => r.bannerId === campaignId);
        if (!banner) return;

        try {
            // Deep copy the banner
            const duplicatedBanner = JSON.parse(JSON.stringify(banner));
            duplicatedBanner.id = "bn_" + uid();
            duplicatedBanner.name = `${duplicatedBanner.name} (Copy)`;
            duplicatedBanner.status = "draft"; // Duplicates start as draft

            let duplicatedRules = null;
            if (rules) {
                duplicatedRules = JSON.parse(JSON.stringify(rules));
                duplicatedRules.bannerId = duplicatedBanner.id;
            }

            await apiFetch('/campaigns', {
                method: 'POST',
                body: JSON.stringify({
                    name: duplicatedBanner.name,
                    type: duplicatedBanner.type || 'modal',
                    creativeJson: duplicatedBanner,
                    rulesJson: duplicatedRules || defaultRules(duplicatedBanner.id)
                })
            });

            // Refresh the list
            fetchData();
        } catch (err) {
            console.error("Failed to duplicate campaign", err);
            alert("Failed to duplicate campaign");
        }
    };

    const handleExport = (campaignId: string) => {
        const banner = data.banners.find(b => b.id === campaignId);
        const rules = data.rules.find(r => r.bannerId === campaignId);
        if (!banner || !rules) return;
        const userEmail = LS.get("userEmail", "user@example.com");
        const advancedRules = ensureAdvancedRules(rules);
        exportCampaign(banner, advancedRules, userEmail);
    };

    const toggleOptionsPanel = (campaignId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const button = e.currentTarget as HTMLElement;
        const rect = button.getBoundingClientRect();

        if (showOptionsPanel === campaignId) {
            setShowOptionsPanel(null);
        } else {
            setShowOptionsPanel(campaignId);
            setActiveTab("actions");

            // Smart positioning: detect available space
            const PANEL_HEIGHT = 320; // Estimated panel height
            const SPACING = 8; // Gap between button and panel
            const spaceBelow = window.innerHeight - rect.bottom;

            // Prefer 'below' placement unless insufficient space
            const placement: 'above' | 'below' = spaceBelow >= PANEL_HEIGHT ? 'below' : 'above';

            setPanelPosition({
                top: placement === 'below' ? rect.bottom + SPACING : rect.top - SPACING,
                right: window.innerWidth - rect.right,
                placement
            });
        }
    };

    const selectedCampaign = showOptionsPanel ? data.banners.find(b => b.id === showOptionsPanel) : null;

    return (
        <>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Campaigns</h1>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                    >
                        Create Promotion
                    </button>
                </div>

                {/* Campaign List */}
                {data.banners.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <p className="mb-4">No campaigns yet</p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                        >
                            Create Your First Campaign
                        </button>
                    </div>
                ) : (
                    <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 200px)' }}>
                        {/* Fixed Header */}
                        <div className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                            <div className="flex items-center gap-4 px-4 py-3 text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                <div className="w-3 flex-shrink-0"></div> {/* Active toggle column */}
                                <div className="w-10 flex-shrink-0"></div> {/* Thumbnail column */}
                                <div className="flex-1 min-w-0">Title ↕</div>
                                <div className="w-20 text-right">Impressions ↕</div>
                                <div className="w-24 text-right">Engagements ↕</div>
                                <div className="w-24 text-right">Conversions ↕</div>
                                <div className="w-20 flex-shrink-0"></div> {/* Action icons column */}
                                <div className="w-20 flex-shrink-0"></div> {/* Options button column */}
                            </div>
                        </div>

                        {/* Scrollable Body */}
                        <div className="flex-1 overflow-y-auto">
                            {data.banners.map((campaign, index) => {
                                const stats = getCampaignStats(campaign.id);
                                const isActive = campaign.status === "published";

                                return (
                                    <div
                                        key={campaign.id}
                                        className={`flex items-center gap-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors ${index !== 0 ? 'border-t border-gray-200 dark:border-gray-800' : ''
                                            }`}
                                    >
                                        {/* Active Toggle */}
                                        <button
                                            onClick={(e) => toggleCampaignStatus(campaign.id, e)}
                                            className={`w-3 h-3 rounded-full flex-shrink-0 ${isActive ? "bg-green-500" : "bg-gray-300 dark:bg-gray-700"
                                                }`}
                                        />

                                        {/* Thumbnail */}
                                        <div className="w-10 h-10 rounded bg-gradient-to-br from-red-800 to-red-900 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                                            {campaign.name.charAt(0)}
                                        </div>

                                        {/* Campaign Name */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-medium text-sm">{campaign.name}</h3>
                                                <span className="text-xs text-gray-500">- {campaign.type === "top_bar" ? "Desktop" : "Mobile"}</span>
                                            </div>
                                        </div>

                                        {/* Stats */}
                                        <div className="w-20 text-right text-sm text-gray-600 dark:text-gray-400">
                                            {stats.impressions}
                                        </div>
                                        <div className="w-24 text-right text-sm">
                                            {stats.clicks}
                                        </div>
                                        <div className="w-24 text-right text-sm">
                                            {stats.conversions}
                                        </div>

                                        {/* Action Icons */}
                                        <div className="flex items-center gap-1 w-20 flex-shrink-0">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    router.push(`/campaigns/${campaign.id}`);
                                                }}
                                                className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                                title="Desktop preview"
                                            >
                                                <Monitor className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={(e) => deleteCampaign(campaign.id, e)}
                                                className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {/* Options Button */}
                                        <button
                                            onClick={(e) => toggleOptionsPanel(campaign.id, e)}
                                            className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors flex items-center gap-1 w-20 flex-shrink-0"
                                        >
                                            Options
                                            <span className="text-xs">▼</span>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Floating Options Panel */}
            {showOptionsPanel && selectedCampaign && panelPosition && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowOptionsPanel(null)}
                    />
                    <div
                        className="fixed z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-xl w-64"
                        style={{
                            top: `${panelPosition.top}px`,
                            right: `${panelPosition.right}px`,
                            transform: panelPosition.placement === 'above' ? 'translateY(-100%)' : 'translateY(0)'
                        }}
                    >
                        <div className="flex border-b border-gray-200 dark:border-gray-800">
                            <button
                                className={`flex-1 py-1.5 text-xs font-medium ${activeTab === 'actions' ? 'text-gray-900 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
                                onClick={(e) => { e.stopPropagation(); setActiveTab('actions'); }}
                            >
                                Actions
                            </button>
                            <button
                                className={`flex-1 py-1.5 text-xs font-medium ${activeTab === 'settings' ? 'text-gray-900 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
                                onClick={(e) => { e.stopPropagation(); setActiveTab('settings'); }}
                            >
                                More
                            </button>
                        </div>

                        <div className="p-1 max-h-64 overflow-y-auto">
                            {activeTab === 'actions' ? (
                                <>
                                    <button onClick={() => { router.push(`/campaigns/${selectedCampaign.id}?tab=editor`); setShowOptionsPanel(null); }} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 rounded flex items-center gap-2">
                                        <Edit className="w-4 h-4 text-blue-500" /> Edit Design
                                    </button>
                                    <button onClick={() => { router.push(`/campaigns/${selectedCampaign.id}?tab=rules`); setShowOptionsPanel(null); }} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 rounded flex items-center gap-2">
                                        <Target className="w-4 h-4 text-purple-500" /> Advanced Rules
                                    </button>
                                    <button onClick={() => { router.push(`/campaigns/${selectedCampaign.id}?tab=publish`); setShowOptionsPanel(null); }} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 rounded flex items-center gap-2">
                                        <FileUp className="w-4 h-4 text-green-500" /> Publish Status
                                    </button>
                                    <div className="h-px bg-gray-200 dark:bg-gray-800 my-1 mx-2" />
                                    <button onClick={(e) => { e.stopPropagation(); toggleCampaignStatus(selectedCampaign.id, e); setShowOptionsPanel(null); }} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 rounded flex items-center gap-2">
                                        {selectedCampaign.status === 'published' ? <Archive className="w-4 h-4 text-gray-500" /> : <Monitor className="w-4 h-4 text-green-500" />}
                                        {selectedCampaign.status === 'published' ? 'Unpublish' : 'Publish'}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button onClick={(e) => { e.stopPropagation(); duplicateCampaign(selectedCampaign.id); setShowOptionsPanel(null); }} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 rounded flex items-center gap-2">
                                        <Copy className="w-4 h-4 text-gray-500" /> Duplicate
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); handleExport(selectedCampaign.id); setShowOptionsPanel(null); }} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 rounded flex items-center gap-2">
                                        <Download className="w-4 h-4 text-gray-500" /> Export JSON
                                    </button>
                                    <div className="h-px bg-gray-200 dark:bg-gray-800 my-1 mx-2" />
                                    <button onClick={(e) => { e.stopPropagation(); deleteCampaign(selectedCampaign.id, e); }} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded flex items-center gap-2">
                                        <Trash2 className="w-4 h-4 text-red-500" /> Delete Campaign
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </>
            )}

            <CreatePromotionModal
                isOpen={showCreateModal}
                onClose={() => {
                    setShowCreateModal(false);
                    fetchData(); // Refresh list after close
                }}
            />
        </>
    );
}
