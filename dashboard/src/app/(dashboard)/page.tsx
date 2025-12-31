"use client";

import { ArrowUpRight, Users, MousePointerClick, CreditCard, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LS } from "@/lib/utils";
import { AccountData } from "@/lib/types";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const KEY_DATA = (accountId: string) => `demo_account_${accountId}_data_v3`;

export default function Home() {
    const router = useRouter();
    const accountId = "ACC_DEMO_001";
    const [data, setData] = useState<AccountData | null>(null);

    useEffect(() => {
        const token = LS.get("accessToken", null);
        if (!token) {
            router.push("/login");
            return;
        }

        const accountData = LS.get(KEY_DATA(accountId), null);
        if (accountData) {
            setData(accountData);
        }
    }, [router]);

    if (!data) {
        return <div>Loading...</div>;
    }

    // Calculate real stats from events
    const totalImpressions = data.events.filter((e: any) => e.type === "impression").length;
    const totalClicks = data.events.filter((e: any) => e.type === "click").length;
    const totalConversions = data.events.filter((e: any) => e.type === "conversion").length;
    const totalRevenue = data.events
        .filter((e: any) => e.type === "conversion")
        .reduce((sum: number, e: any) => sum + (e.value || 50), 0);

    // Calculate unique visitors (simplified - using unique session IDs)
    const uniqueVisitors = new Set(data.events.map((e: any) => e.sessionId || e.timestamp)).size;

    // Calculate percentage changes (mock for now, would need historical data)
    const impressionChange = totalImpressions > 0 ? "+12%" : "0%";
    const clickChange = totalClicks > 0 ? "+5.4%" : "0%";
    const conversionChange = totalConversions > 0 ? "+2.1%" : "0%";
    const revenueChange = totalRevenue > 0 ? "+15.3%" : "0%";

    const stats = [
        { name: "Total Visitors", value: uniqueVisitors.toLocaleString(), change: impressionChange, icon: Users },
        { name: "Impressions", value: totalImpressions.toLocaleString(), change: clickChange, icon: MousePointerClick },
        { name: "Conversions", value: totalConversions.toLocaleString(), change: conversionChange, icon: ArrowUpRight },
        { name: "Revenue", value: `$${totalRevenue.toLocaleString()}`, change: revenueChange, icon: CreditCard },
    ];

    // Prepare chart data - group events by day
    const chartData = (() => {
        const eventsByDate = data.events.reduce((acc: any, event: any) => {
            const date = new Date(event.timestamp).toLocaleDateString();
            if (!acc[date]) {
                acc[date] = { date, impressions: 0, clicks: 0, conversions: 0 };
            }
            if (event.type === "impression") acc[date].impressions++;
            if (event.type === "click") acc[date].clicks++;
            if (event.type === "conversion") acc[date].conversions++;
            return acc;
        }, {});

        const sortedData = Object.values(eventsByDate).sort((a: any, b: any) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        // Show last 7 days or all if less
        return sortedData.slice(-7);
    })();

    // Get top campaigns by impressions
    const topCampaigns = data.banners
        .map(banner => {
            const impressions = data.events.filter((e: any) => e.bannerId === banner.id && e.type === "impression").length;
            const clicks = data.events.filter((e: any) => e.bannerId === banner.id && e.type === "click").length;
            const ctr = impressions > 0 ? ((clicks / impressions) * 100).toFixed(1) : "0.0";
            return { ...banner, impressions, clicks, ctr };
        })
        .sort((a, b) => b.impressions - a.impressions)
        .slice(0, 5);

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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-6 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                    <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                                <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
                                <YAxis stroke="#9CA3AF" fontSize={12} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1F2937',
                                        border: 'none',
                                        borderRadius: '8px',
                                        color: '#fff'
                                    }}
                                />
                                <Line type="monotone" dataKey="impressions" stroke="#3B82F6" strokeWidth={2} name="Impressions" />
                                <Line type="monotone" dataKey="clicks" stroke="#8B5CF6" strokeWidth={2} name="Clicks" />
                                <Line type="monotone" dataKey="conversions" stroke="#10B981" strokeWidth={2} name="Conversions" />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-[300px] text-gray-400">
                            <div className="text-center">
                                <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p>No activity data yet</p>
                                <p className="text-sm">Campaigns will appear here once they start receiving traffic</p>
                            </div>
                        </div>
                    )}
                </div>
                <div className="p-6 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                    <h3 className="text-lg font-semibold mb-4">Top Campaigns</h3>
                    <div className="space-y-4">
                        {topCampaigns.length > 0 ? (
                            topCampaigns.map((campaign) => (
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
                                                {campaign.status === "published" ? "Active" : "Draft"} • {campaign.impressions} views
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium">{campaign.ctr}%</p>
                                        <p className="text-xs text-gray-500">CTR</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-400">
                                <p>No campaigns yet</p>
                                <p className="text-sm mt-1">Create your first campaign to see analytics</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
