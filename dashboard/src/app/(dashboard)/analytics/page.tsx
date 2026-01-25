"use client";

import React, { useState } from "react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from "recharts";
import {
    Calendar,
    ChevronDown,
    Mail,
    MousePointerClick,
    Eye,
    MoreHorizontal,
    Menu
} from "lucide-react";

// --- Mock Data ---

const mockChartData = [
    { date: "12/18", sessions: 4000, engagements: 2400 },
    { date: "12/22", sessions: 3000, engagements: 1398 },
    { date: "12/26", sessions: 9800, engagements: 5000 },
    { date: "12/30", sessions: 3908, engagements: 2780 },
    { date: "01/03", sessions: 4800, engagements: 1890 },
    { date: "01/07", sessions: 3800, engagements: 2390 },
    { date: "01/11", sessions: 4300, engagements: 3490 },
];

// --- Components ---

function StatCard({
    title,
    value,
    substats,
    icon: Icon
}: {
    title: string;
    value: string;
    substats: { label: string; value: string }[];
    icon?: React.ElementType;
}) {
    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm flex flex-col justify-between h-48 relative overflow-hidden group hover:border-blue-500/30 transition-colors">
            {Icon && (
                <div className="absolute top-4 right-4 text-gray-300 dark:text-gray-700 group-hover:text-blue-500/20 transition-colors">
                    <Icon className="w-6 h-6" />
                </div>
            )}

            <div>
                <h3 className="text-4xl font-bold text-gray-900 dark:text-white mb-1">{value}</h3>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            </div>

            <div className="space-y-1 mt-4">
                {substats.map((sub, idx) => (
                    <div key={idx} className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>{sub.value} {sub.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function FilterButton({ label, active = false }: { label: string; active?: boolean }) {
    return (
        <button
            className={`
                px-4 py-2 text-xs font-medium border border-gray-300 dark:border-gray-700 
                first:rounded-l-md last:rounded-r-md -ml-px first:ml-0
                hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors
                ${active ? 'bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400' : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400'}
            `}
        >
            {label}
        </button>
    );
}

export default function AnalyticsPage() {
    const [dateRange, setDateRange] = useState("12/18/2025 -> 01/18/2026");

    return (
        <div className="max-w-[1600px] mx-auto space-y-6">

            {/* --- Header Controls --- */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex bg-white dark:bg-gray-900 rounded-md shadow-sm">
                    <FilterButton label="All Traffic" active />
                    <FilterButton label="Desktop" />
                    <FilterButton label="Mobile" />
                </div>

                <div className="flex bg-white dark:bg-gray-900 rounded-md shadow-sm ml-0 md:ml-4">
                    <FilterButton label="All Visitors" active />
                    <FilterButton label="New" />
                    <FilterButton label="Returning" />
                </div>

                <div className="flex-1" />

                <div className="flex items-center gap-2">
                    <div className="flex items-center bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm text-gray-600 dark:text-gray-300">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        <span>{dateRange}</span>
                        <ChevronDown className="w-4 h-4 ml-2 text-gray-400" />
                    </div>

                    <div className="flex bg-white dark:bg-gray-900 rounded-md shadow-sm">
                        <FilterButton label="Day" />
                        <FilterButton label="Week" />
                        <FilterButton label="Month" active />
                        <FilterButton label="Qtr" />
                    </div>
                </div>
            </div>

            {/* --- Hero Section --- */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-8 text-center text-white shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-2xl md:text-3xl font-bold mb-2">
                        Your website had 34,617 Session Engagements
                    </h1>
                    <div className="w-24 h-1 bg-white/30 mx-auto my-4 rounded-full" />
                    <p className="text-lg font-medium text-white/90">
                        with a 11.11% engagement rate
                    </p>
                </div>

                {/* Background decoration */}
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
                    </svg>
                </div>
            </div>

            {/* --- Main Content Grid --- */}
            <div className="grid grid-cols-12 gap-6">

                {/* Left Column: Stats & Charts */}
                <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">

                    {/* Stats Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <StatCard
                            title="Emails Collected"
                            value="0"
                            icon={Mail}
                            substats={[
                                { label: "Engagement Rate", value: "0%" },
                                { label: "Engaged Conversion Rate", value: "0%" }
                            ]}
                        />
                        <StatCard
                            title="Click Engagements"
                            value="38,223"
                            icon={MousePointerClick}
                            substats={[
                                { label: "Engagement Rate", value: "10.01%" },
                                { label: "Engaged Conversion Rate", value: "0%" }
                            ]}
                        />
                        <StatCard
                            title="View Engagements"
                            value="0"
                            icon={Eye}
                            substats={[
                                { label: "Engagement Rate", value: "0%" },
                                { label: "Engaged Conversion Rate", value: "0%" }
                            ]}
                        />
                        <StatCard
                            title="Other Engagements"
                            value="0"
                            icon={MoreHorizontal}
                            substats={[
                                { label: "Engagement Rate", value: "0%" },
                                { label: "Engaged Conversion Rate", value: "0%" }
                            ]}
                        />
                    </div>

                    {/* Chart Section */}
                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm min-h-[400px]">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-semibold text-gray-700 dark:text-gray-300">Engagement Trends</h3>
                            <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <Menu className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={mockChartData}>
                                    <defs>
                                        <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorEngagements" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.5} />
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#6B7280', fontSize: 12 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#6B7280', fontSize: 12 }}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1F2937', color: '#fff', border: 'none', borderRadius: '8px' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="sessions"
                                        stroke="#4F46E5"
                                        fillOpacity={1}
                                        fill="url(#colorSessions)"
                                        strokeWidth={3}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="engagements"
                                        stroke="#06b6d4"
                                        fillOpacity={1}
                                        fill="url(#colorEngagements)"
                                        strokeWidth={3}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Chart Custom Legend/Stats Footer */}
                        <div className="grid grid-cols-3 gap-8 mt-6 pt-6 border-t border-gray-100 dark:border-gray-800 text-center">
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">406,504</p>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mt-1">Sessions</p>
                                <div className="w-16 h-1 bg-indigo-500 mx-auto mt-3 rounded-full" />
                                <p className="text-[10px] text-gray-400 mt-2">76.58% Bounce Rate</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">311,471</p>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mt-1">Session Impressions</p>
                                <div className="w-16 h-1 bg-cyan-500 mx-auto mt-3 rounded-full" />
                                <p className="text-[10px] text-gray-400 mt-2">76.62% of Visitor Sessions</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">523,847</p>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mt-1">Impressions</p>
                                <div className="w-16 h-1 bg-gray-300 dark:bg-gray-700 mx-auto mt-3 rounded-full" />
                                <p className="text-[10px] text-gray-400 mt-2">45,801 Engagements</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Cart Abandonment Sidebar */}
                <div className="col-span-12 lg:col-span-4">
                    <div className="bg-slate-600 dark:bg-slate-800 rounded-xl p-8 text-white h-full flex flex-col justify-center space-y-12 shadow-lg">

                        {/* 1. Cart Abandonment */}
                        <div className="text-center">
                            <div className="text-4xl font-light mb-1">100%</div>
                            <div className="text-xs font-medium text-slate-300 uppercase tracking-wider">Cart Abandonment</div>
                            <div className="w-12 h-1 bg-white/20 mx-auto mt-3 rounded-full" />
                        </div>

                        {/* 2. Engaged Cart Abandonment */}
                        <div className="text-center">
                            <div className="text-4xl font-light mb-1">100%</div>
                            <div className="text-xs font-medium text-slate-300 uppercase tracking-wider">Engaged Cart Abandonment</div>
                            <div className="w-12 h-1 bg-white/20 mx-auto mt-3 rounded-full" />
                        </div>

                        {/* 3. Total Cart Abandonment */}
                        <div className="text-center">
                            <div className="text-4xl font-light mb-1">100%</div>
                            <div className="text-xs font-medium text-slate-300 uppercase tracking-wider">Total Cart Abandonment</div>
                            <div className="w-12 h-1 bg-white/20 mx-auto mt-3 rounded-full" />
                        </div>

                        {/* Info Icon */}
                        <div className="absolute top-6 right-6 opacity-50 hover:opacity-100 cursor-pointer">
                            <div className="w-5 h-5 rounded-full border border-white flex items-center justify-center text-xs">i</div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
