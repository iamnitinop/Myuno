"use client";

import React, { useState, useEffect } from "react";
import { uid, LS } from "@/lib/utils";
import { defaultBanner, defaultRules } from "@/lib/defaults";
import { AccountData, Banner, TargetingRules, AdvancedTargetingRules } from "@/lib/types";
import { VisualEditor } from "@/components/features/editor/visual/VisualEditor";
// import { TargetingBuilder } from "@/components/features/targeting/TargetingBuilder"; // Old
import { RuleBuilder } from "@/components/features/rules"; // New
import { TargetingSimulator } from "@/components/features/targeting/TargetingSimulator";
import { PublishSettings } from "@/components/features/publish/PublishSettings";
import { Pill } from "@/components/ui/Pill";
import { Card } from "@/components/ui/Card";
import { ensureAdvancedRules } from "@/lib/rule-migration";

const KEY_DATA = (accountId: string) => `demo_account_${accountId}_data_v3`;

function getOrCreateAccountData(accountId: string): AccountData {
    const existing = LS.get(KEY_DATA(accountId), null);
    if (existing) return existing;
    const bannerId = "bn_" + uid();
    const data: AccountData = {
        accountId,
        banners: [defaultBanner(bannerId)],
        rules: [defaultRules(bannerId)],
        abTests: [],
        events: [],
    };
    LS.set(KEY_DATA(accountId), data);
    return data;
}

export default function CampaignManager() {
    // Use real account ID
    const [accountId, setAccountId] = useState("Loading...");

    useEffect(() => {
        setAccountId(LS.get("accountId", "ACC_DEMO_001"));
    }, []);

    const [tab, setTab] = useState<"editor" | "targeting" | "publish">("editor");
    const [data, setData] = useState<AccountData | null>(null);

    useEffect(() => {
        setData(getOrCreateAccountData(accountId));
    }, []);

    if (!data) return <div>Loading...</div>;

    const banner = data.banners[0];
    const rawRules = data.rules.find((r) => r.bannerId === banner.id) || defaultRules(banner.id);
    const rules = ensureAdvancedRules(rawRules);

    const save = (next: AccountData) => {
        setData(next);
        LS.set(KEY_DATA(accountId), next);
    };

    const updateBanner = (nextBanner: Banner) => {
        const next = {
            ...data,
            banners: data.banners.map((b) => (b.id === banner.id ? nextBanner : b)),
        };
        save(next);
    };

    const updateRules = (nextRules: AdvancedTargetingRules) => {
        const next = {
            ...data,
            rules: data.rules.map((r) => (r.bannerId === banner.id ? nextRules : r)),
        };
        save(next);
    };

    const publish = () => {
        const next = {
            ...data,
            banners: data.banners.map((b) => (b.id === banner.id ? { ...b, status: "published" } as const : b)),
        };
        save(next);
    };

    const unpublish = () => {
        const next = {
            ...data,
            banners: data.banners.map((b) => (b.id === banner.id ? { ...b, status: "draft" } as const : b)),
        };
        save(next);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Campaign Manager</h1>
                    <p className="text-sm text-gray-500">Manage your popups and targeting rules</p>
                </div>
                <Card className="p-2 flex gap-2 w-full sm:w-auto overflow-x-auto">
                    <Pill active={tab === "editor"} onClick={() => setTab("editor")}>Editor</Pill>
                    <Pill active={tab === "targeting"} onClick={() => setTab("targeting")}>Targeting</Pill>
                    <Pill active={tab === "publish"} onClick={() => setTab("publish")}>Publish</Pill>
                </Card>
            </div>

            {tab === "editor" && (
                <VisualEditor banner={banner} onChange={updateBanner} />
            )}

            {tab === "targeting" && (
                <div className="grid gap-6 lg:grid-cols-2">
                    <Card title="Advanced Rule Builder">
                        <RuleBuilder rules={rules} onChange={updateRules} />
                    </Card>
                    <Card title="Rule Simulator">
                        <TargetingSimulator banner={banner} rules={rules} />
                    </Card>
                </div>
            )}

            {tab === "publish" && (
                <PublishSettings
                    accountId={accountId}
                    banner={banner}
                    onPublish={publish}
                    onUnpublish={unpublish}
                />
            )}
        </div>
    );
}
