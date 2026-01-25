"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Split, Trash2 } from "lucide-react";
import { LS } from "@/lib/utils";
import { AccountData } from "@/lib/types";

const KEY_DATA = (accountId: string) => `demo_account_${accountId}_data_v3`;

export default function ABTestsPage() {
    const router = useRouter();
    const accountId = "ACC_DEMO_001";
    const [data, setData] = useState<AccountData | null>(null);

    useEffect(() => {
        const accountData: AccountData = LS.get(KEY_DATA(accountId), {
            accountId,
            banners: [],
            rules: [],
            abTests: [],
            events: [],
        });
        setData(accountData);
    }, []);

    const deleteTest = (testId: string) => {
        if (!data || !confirm("Are you sure you want to delete this A/B Test?")) return;
        const newData = {
            ...data,
            abTests: (data.abTests || []).filter(t => t.id !== testId)
        };
        setData(newData);
        LS.set(KEY_DATA(accountId), newData);
    };

    if (!data) return <div className="p-8">Loading...</div>;

    const abTests = data.abTests || [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">A/B Tests</h1>
                <button
                    onClick={() => router.push("/ab-tests/new")}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    New A/B Test
                </button>
            </div>

            {abTests.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
                    <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600 dark:text-blue-400">
                        <Split className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-medium mb-1">No A/B Tests Yet</h3>
                    <p className="text-gray-500 mb-6">Create your first experiment to optimize your campaigns.</p>
                    <button
                        onClick={() => router.push("/ab-tests/new")}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                    >
                        Create Your First Test
                    </button>
                </div>
            ) : (
                <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden flex flex-col bg-white dark:bg-black">
                    <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="col-span-5">Test Name</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-2">Device</div>
                        <div className="col-span-2">Date Range</div>
                        <div className="col-span-1"></div>
                    </div>
                    <div className="divide-y divide-gray-200 dark:divide-gray-800">
                        {abTests.map((test) => (
                            <div
                                key={test.id}
                                className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors cursor-pointer"
                                onClick={() => router.push(`/ab-tests/${test.id}`)}
                            >
                                <div className="col-span-5 font-medium">{test.name}</div>
                                <div className="col-span-2">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${test.status === 'running' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                        test.status === 'scheduled' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                            test.status === 'ended' ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' :
                                                'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                        }`}>
                                        {test.status.charAt(0).toUpperCase() + test.status.slice(1)}
                                    </span>
                                </div>
                                <div className="col-span-2 text-sm text-gray-500 capitalize">{test.device}</div>
                                <div className="col-span-2 text-xs text-gray-500">
                                    {new Date(test.startDate).toLocaleDateString()} - {new Date(test.endDate).toLocaleDateString()}
                                </div>
                                <div className="col-span-1 text-right">
                                    <button
                                        onClick={() => deleteTest(test.id)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
