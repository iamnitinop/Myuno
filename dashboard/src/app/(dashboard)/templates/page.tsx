"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { templateLibrary, TemplateInfo } from "@/lib/templates";
import { TemplateCard } from "@/components/features/templates/TemplateCard";
import { AccountData, Banner } from "@/lib/types";
import { LS } from "@/lib/utils";
import { Search } from "lucide-react";
import { defaultRules, KEY_DATA } from "@/lib/defaults";

const ACCOUNT_ID = "ACC_DEMO_001"; // Hardcoded for demo parity

export default function TemplatesPage() {
    const router = useRouter();
    const [filter, setFilter] = useState<string>("all");
    const [search, setSearch] = useState("");

    const categories = [
        { id: "all", label: "All Templates" },
        { id: "holiday", label: "Holiday" },
        { id: "sales", label: "Sales & Promos" },
        { id: "email", label: "Email Capture" },
        { id: "general", label: "General" },
    ];

    const filteredTemplates = templateLibrary.filter(t => {
        const matchesCategory = filter === "all" || t.category === filter || (filter === "sales" && t.category === "sales"); // simplified matching
        const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const handleUseTemplate = (template: TemplateInfo) => {
        // 1. Generate new banner from template
        const newBanner = template.generator();

        // 2. Get existing data
        const currentData: AccountData | null = LS.get(KEY_DATA(ACCOUNT_ID), null);

        // 3. Create initial structure if missing
        const accountData: AccountData = currentData || {
            accountId: ACCOUNT_ID,
            banners: [],
            rules: [],
            abTests: [],
            events: []
        };

        if (!accountData.banners) accountData.banners = [];
        if (!accountData.rules) accountData.rules = [];
        if (!accountData.abTests) accountData.abTests = [];
        if (!accountData.events) accountData.events = [];

        // 4. Add new banner
        accountData.banners.push(newBanner);

        // 5. Add default rules for this banner
        accountData.rules.push(defaultRules(newBanner.id));

        // 6. Save
        LS.set(KEY_DATA(ACCOUNT_ID), accountData);

        // 7. Redirect (Hard navigation to bypass cache)
        window.location.href = `/campaigns/${newBanner.id}`;
    };

    const handlePreview = (template: TemplateInfo) => {
        // For now, preview just logs or could open a modal. 
        // Since we want to ship fast, we'll just treat it same as Use for now or alert.
        alert(`Preview for ${template.name} coming soon! Click "Use Template" to edit it.`);
    };

    return (
        <div className="p-8 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Template Library</h1>
                <p className="text-gray-500 dark:text-gray-400">Jumpstart your campaigns with our pre-designed, high-converting templates.</p>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 mb-8 items-center bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">

                {/* Search */}
                <div className="relative flex-grow max-w-md w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search templates..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setFilter(cat.id)}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filter === cat.id
                                ? "bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-none"
                                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                                }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredTemplates.map(template => (
                    <TemplateCard
                        key={template.id}
                        template={template}
                        onUse={handleUseTemplate}
                        onPreview={handlePreview}
                    />
                ))}
            </div>

            {filteredTemplates.length === 0 && (
                <div className="text-center py-20 text-gray-400">
                    No templates found matching your search.
                </div>
            )}
        </div>
    );
}
