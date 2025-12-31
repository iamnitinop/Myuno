"use client";

import { Bell, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LS } from "@/lib/utils";
import { AccountData } from "@/lib/types";

export default function Header() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [showResults, setShowResults] = useState(false);

    useEffect(() => {
        if (searchQuery.trim()) {
            // Get account data and filter campaigns
            const accountId = "ACC_DEMO_001";
            const data: AccountData | null = LS.get(`demo_account_${accountId}_data_v3`, null);

            if (data && data.banners) {
                const filtered = data.banners.filter(banner =>
                    banner.name.toLowerCase().includes(searchQuery.toLowerCase())
                );
                setSearchResults(filtered);
                setShowResults(true);
            }
        } else {
            setSearchResults([]);
            setShowResults(false);
        }
    }, [searchQuery]);

    const handleSelectCampaign = (campaignId: string) => {
        router.push(`/campaigns/${campaignId}`);
        setSearchQuery("");
        setShowResults(false);
    };

    return (
        <header className="h-16 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-black/80 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold">Dashboard</h2>
            </div>
            <div className="flex items-center gap-4">
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search campaigns..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onBlur={() => setTimeout(() => setShowResults(false), 200)}
                        onFocus={() => searchQuery && setShowResults(true)}
                        className="pl-9 pr-4 py-2 text-sm rounded-full border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-64"
                    />

                    {showResults && searchResults.length > 0 && (
                        <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden z-50">
                            {searchResults.map((campaign) => (
                                <button
                                    key={campaign.id}
                                    onClick={() => handleSelectCampaign(campaign.id)}
                                    className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-100 dark:border-gray-800 last:border-0"
                                >
                                    <p className="font-medium text-sm">{campaign.name}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {campaign.status === "published" ? "Active" : "Draft"} • {campaign.type === "top_bar" ? "Top Bar" : "Modal"}
                                    </p>
                                </button>
                            ))}
                        </div>
                    )}

                    {showResults && searchQuery && searchResults.length === 0 && (
                        <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-800 p-4 z-50">
                            <p className="text-sm text-gray-500 text-center">No campaigns found</p>
                        </div>
                    )}
                </div>
                <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <Bell className="w-5 h-5 text-gray-500" />
                </button>
            </div>
        </header>
    );
}
