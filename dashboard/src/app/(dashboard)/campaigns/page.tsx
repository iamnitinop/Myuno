"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Monitor, Smartphone, Trash2, BarChart3, Edit, Target, Gift, Download, FileUp, Archive, History, Plug, Copy } from "lucide-react";
import { LS } from "@/lib/utils";
import { AccountData } from "@/lib/types";
import { CreatePromotionModal } from "@/components/features/campaigns/CreatePromotionModal";
import { exportCampaign } from "@/lib/campaign-export";
import { ensureAdvancedRules } from "@/lib/rule-migration";

const KEY_DATA = (accountId: string) => `demo_account_${accountId}_data_v3`;

export default function CampaignsPage() {
    const router = useRouter();
    const accountId = "ACC_DEMO_001";
    const [data, setData] = useState<AccountData | null>(null);
    const [showOptionsPanel, setShowOptionsPanel] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [activeTab, setActiveTab] = useState<"actions" | "settings">("actions");
    const [panelPosition, setPanelPosition] = useState<{ top: number; right: number; placement: 'above' | 'below' } | null>(null);

    useEffect(() => {
        const accountData: AccountData = LS.get(KEY_DATA(accountId), {
            accountId,
            banners: [],
            rules: [],
            events: [],
        });
        setData(accountData);
    }, []);

    if (!data) return <div>Loading...</div>;

    const getCampaignStats = (campaignId: string) => {
        const campaignEvents = data.events.filter(e => e.bannerId === campaignId);
        const impressions = campaignEvents.filter(e => e.type === "impression").length;
        const clicks = campaignEvents.filter(e => e.type === "click").length;
        const conversions = campaignEvents.filter(e => e.type === "conversion").length;

        return { impressions, clicks, conversions };
    };

    const toggleCampaignStatus = (campaignId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const updatedBanners = data.banners.map(b =>
            b.id === campaignId
                ? { ...b, status: b.status === "published" ? "draft" as const : "published" as const }
                : b
        );
        const newData = { ...data, banners: updatedBanners };
        setData(newData);
        LS.set(KEY_DATA(accountId), newData);
    };

    const deleteCampaign = (campaignId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this campaign?")) return;

        const newData = {
            ...data,
            banners: data.banners.filter(b => b.id !== campaignId),
            rules: data.rules.filter(r => r.bannerId !== campaignId),
            events: data.events.filter(e => e.bannerId !== campaignId),
        };
        setData(newData);
        LS.set(KEY_DATA(accountId), newData);
        setShowOptionsPanel(null);
    };

    const duplicateCampaign = (campaignId: string) => {
        const campaign = data.banners.find(b => b.id === campaignId);
        const rules = data.rules.find(r => r.bannerId === campaignId);
        if (!campaign) return;

        const newId = "bn_" + Date.now();
        const newBanner = { ...campaign, id: newId, name: campaign.name + " (Copy)" };
        const newRules = rules ? { ...rules, bannerId: newId } : undefined;

        const newData = {
            ...data,
            banners: [...data.banners, newBanner],
            rules: newRules ? [...data.rules, newRules] : data.rules,
        };
        setData(newData);
        LS.set(KEY_DATA(accountId), newData);
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
            const spaceAbove = rect.top;

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

                                        {/* Impressions */}
                                        <div className="w-20 text-right text-sm text-gray-600 dark:text-gray-400">
                                            {stats.impressions}
                                        </div>

                                        {/* Engagements (Clicks) */}
                                        <div className="w-24 text-right text-sm">
                                            <span className={stats.clicks > 0 ? "text-green-600 font-medium" : "text-gray-600 dark:text-gray-400"}>
                                                {stats.clicks} ({stats.impressions > 0 ? Math.round((stats.clicks / stats.impressions) * 100) : 0}%)
                                            </span>
                                        </div>

                                        {/* Conversions */}
                                        <div className="w-24 text-right text-sm">
                                            <span className={stats.conversions > 0 ? "text-green-600 font-medium" : "text-gray-600 dark:text-gray-400"}>
                                                {stats.conversions} ({stats.impressions > 0 ? Math.round((stats.conversions / stats.impressions) * 100) : 0}%)
                                            </span>
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
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    router.push(`/campaigns/${campaign.id}`);
                                                }}
                                                className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                                title="Mobile preview"
                                            >
                                                <Smartphone className="w-4 h-4" />
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
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowOptionsPanel(null)}
                    />

                    {/* Floating Panel */}
                    <div
                        className="fixed z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-xl w-64"
                        style={{
                            top: `${panelPosition.top}px`,
                            right: `${panelPosition.right}px`,
                            transform: panelPosition.placement === 'above' ? 'translateY(-100%)' : 'translateY(0)'
                        }}
                    >
                        {/* Tabs */}
                        <div className="flex border-b border-gray-200 dark:border-gray-800">
                            <button
                                onClick={() => setActiveTab("actions")}
                                className={`flex-1 py-2 px-3 text-xs font-medium transition-colors ${activeTab === "actions"
                                    ? "border-b-2 border-blue-600 text-blue-600 -mb-px"
                                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                    }`}
                            >
                                Actions
                            </button>
                            <button
                                onClick={() => setActiveTab("settings")}
                                className={`flex-1 py-2 px-3 text-xs font-medium transition-colors ${activeTab === "settings"
                                    ? "border-b-2 border-blue-600 text-blue-600 -mb-px"
                                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                    }`}
                            >
                                Settings
                            </button>
                        </div>

                        {/* Tab Content */}
                        <div className="p-3">
                            {activeTab === "actions" && (
                                <div className="space-y-1">
                                    <button
                                        onClick={() => {
                                            router.push(`/campaigns/${selectedCampaign.id}?tab=editor`);
                                            setShowOptionsPanel(null);
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left text-sm"
                                    >
                                        <Edit className="w-4 h-4 text-gray-500" />
                                        <span>Edit Design</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            router.push(`/campaigns/${selectedCampaign.id}?tab=targeting`);
                                            setShowOptionsPanel(null);
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left text-sm"
                                    >
                                        <Target className="w-4 h-4 text-gray-500" />
                                        <span>Targeting Rules</span>
                                    </button>
                                    <button className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left text-sm">
                                        <Gift className="w-4 h-4 text-gray-500" />
                                        <span>Coupons</span>
                                    </button>
                                    <button className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left text-sm">
                                        <BarChart3 className="w-4 h-4 text-gray-500" />
                                        <span>Analytics</span>
                                    </button>
                                    <button className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left text-sm">
                                        <Download className="w-4 h-4 text-gray-500" />
                                        <span>Download Emails</span>
                                    </button>

                                    <div className="pt-2">
                                        <button
                                            onClick={(e) => {
                                                toggleCampaignStatus(selectedCampaign.id, e);
                                                setShowOptionsPanel(null);
                                            }}
                                            className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
                                        >
                                            {selectedCampaign.status === "published" ? "Unpublish" : "Publish"}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeTab === "settings" && (
                                <div className="space-y-1">
                                    <button
                                        onClick={() => {
                                            duplicateCampaign(selectedCampaign.id);
                                            setShowOptionsPanel(null);
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left text-sm"
                                    >
                                        <Copy className="w-3.5 h-3.5 text-gray-500" />
                                        <span>Duplicate</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleExport(selectedCampaign.id);
                                            setShowOptionsPanel(null);
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left text-sm"
                                    >
                                        <FileUp className="w-3.5 h-3.5 text-gray-500" />
                                        <span>Export</span>
                                    </button>
                                    <button className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left text-sm">
                                        <Plug className="w-3.5 h-3.5 text-gray-500" />
                                        <span>Integrations</span>
                                    </button>
                                    <button className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left text-sm">
                                        <History className="w-3.5 h-3.5 text-gray-500" />
                                        <span>Version History</span>
                                    </button>
                                    <button className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left text-sm">
                                        <Archive className="w-3.5 h-3.5 text-gray-500" />
                                        <span>Archive</span>
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            deleteCampaign(selectedCampaign.id, e);
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 transition-colors text-left text-sm"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>Delete</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            <CreatePromotionModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
            />
        </>
    );
}
