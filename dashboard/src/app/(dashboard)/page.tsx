"use client";

import { ArrowUpRight, Users, MousePointerClick, CreditCard } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LS } from "@/lib/utils";
import { apiFetch } from "@/lib/api";


export default function Home() {
    const router = useRouter();
    const [campaigns, setCampaigns] = useState<any[]>([]);

    useEffect(() => {
        const token = LS.get("accessToken", null);
        if (!token) {
            router.push("/login");
            return;
        }

        // Fetch real campaigns from backend for analytics
        apiFetch("/campaigns")
            .then((data) => setCampaigns(data || []))
            .catch((err) => console.error("Failed to fetch campaigns", err));
    }, [router]);


    const stats = [
        { name: "Total Campaigns", value: campaigns.length.toLocaleString(), change: campaigns.length > 0 ? "+" + campaigns.length : "0", icon: Users },
        { name: "Published", value: campaigns.filter(c => c.status === "published").length.toLocaleString(), change: "+0%", icon: MousePointerClick },
        { name: "Drafts", value: campaigns.filter(c => c.status === "draft").length.toLocaleString(), change: "+0%", icon: ArrowUpRight },
        { name: "Revenue", value: "$0", change: "0%", icon: CreditCard },
    ];

    // Top campaigns sorted by name for now (analytics coming soon)
    const topCampaigns = campaigns.slice(0, 5);


    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => (
                    <div key={stat.name} className="p-6 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-medium text-gray-500">{stat.name}</span>
                            <stat.icon className="w-5 h-5 text-gray-400" />
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold">{stat.value}</span>
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${stat.change.startsWith("+")
                                ? "text-green-500 bg-green-500/10"
                                : "text-gray-500 bg-gray-500/10"
                                }`}>
                                {stat.change}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-6 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                <h3 className="text-lg font-semibold mb-4">Your Campaigns</h3>
                <div className="space-y-4">
                    {topCampaigns.length > 0 ? (
                        topCampaigns.map((campaign: any) => (
                            <div
                                key={campaign.id}
                                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                                onClick={() => router.push(`/campaigns/${campaign.id}`)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded bg-gradient-to-br from-blue-500 to-violet-500 flex-shrink-0" />
                                    <div>
                                        <p className="font-medium">{campaign.name}</p>
                                        <p className="text-xs text-gray-500">
                                            {campaign.status === "published" ? "Active" : "Draft"}
                                        </p>
                                    </div>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${campaign.status === "published"
                                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                    : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                                    }`}>
                                    {campaign.status === "published" ? "Published" : "Draft"}
                                </span>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 text-gray-400">
                            <p>No campaigns yet</p>
                            <p className="text-sm mt-1">Create your first campaign to see it here</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
