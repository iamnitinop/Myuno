"use client";

import { X, Book, PenTool, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { uid, LS } from "@/lib/utils";
import { defaultBanner, defaultRules } from "@/lib/defaults";
import { AccountData, Banner } from "@/lib/types";

interface CreatePromotionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const KEY_DATA = (accountId: string) => `demo_account_${accountId}_data_v3`;

export function CreatePromotionModal({ isOpen, onClose }: CreatePromotionModalProps) {
    const router = useRouter();

    if (!isOpen) return null;

    const handleCustomPromotion = () => {
        // Create new campaign
        const accountId = "ACC_DEMO_001";
        const data: AccountData = LS.get(KEY_DATA(accountId), {
            accountId,
            banners: [],
            rules: [],
            events: [],
        });

        const newBannerId = "bn_" + uid();
        const newBanner = defaultBanner(newBannerId);
        const newRules = defaultRules(newBannerId);

        data.banners.push(newBanner);
        data.rules.push(newRules);

        LS.set(KEY_DATA(accountId), data);

        // Navigate to editor
        router.push(`/campaigns/${newBannerId}`);
        onClose();
    };

    const handleImportPromotion = () => {
        // Create file input
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json";

        input.onchange = async (e: Event) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            try {
                const text = await file.text();
                const imported = JSON.parse(text);

                // Validate structure
                if (!imported.campaign || !imported.campaign.banner) {
                    throw new Error("Invalid campaign file format");
                }

                const accountId = "ACC_DEMO_001";
                const data: AccountData = LS.get(KEY_DATA(accountId), {
                    accountId,
                    banners: [],
                    rules: [],
                    events: [],
                });

                // Generate new ID for imported campaign
                const newBannerId = "bn_" + uid();
                const importedBanner: Banner = {
                    ...imported.campaign.banner,
                    id: newBannerId,
                    name: imported.campaign.banner.name + " (Imported)",
                };

                const importedRules = imported.campaign.rules || defaultRules(newBannerId);
                importedRules.bannerId = newBannerId;

                data.banners.push(importedBanner);
                data.rules.push(importedRules);

                LS.set(KEY_DATA(accountId), data);

                // Navigate to editor
                router.push(`/campaigns/${newBannerId}`);
                onClose();
            } catch (error) {
                alert("Failed to import campaign: " + (error as Error).message);
            }
        };

        input.click();
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-50"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-md">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
                        <h2 className="text-xl font-semibold">Create Promotion</h2>
                        <button
                            onClick={onClose}
                            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Options */}
                    <div className="p-6 space-y-3">
                        {/* Template Library - Disabled */}
                        <button
                            disabled
                            className="w-full p-4 text-left rounded-lg border-2 border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 cursor-not-allowed opacity-60"
                        >
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                                    <Book className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold mb-1">Template Library</h3>
                                    <p className="text-sm text-gray-500">
                                        Professionally designed promotion templates ready to use on all devices.
                                    </p>
                                </div>
                            </div>
                        </button>

                        {/* Custom Promotion */}
                        <button
                            onClick={handleCustomPromotion}
                            className="w-full p-4 text-left rounded-lg border-2 border-gray-200 dark:border-gray-800 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors"
                        >
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/20">
                                    <PenTool className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold mb-1">Custom Promotion</h3>
                                    <p className="text-sm text-gray-500">
                                        Design a unique custom promotion or get started without setup wizard.
                                    </p>
                                </div>
                            </div>
                        </button>

                        {/* Import Promotion */}
                        <button
                            onClick={handleImportPromotion}
                            className="w-full p-4 text-left rounded-lg border-2 border-gray-200 dark:border-gray-800 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/10 transition-colors"
                        >
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                                    <Upload className="w-5 h-5 text-green-600 dark:text-green-400" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold mb-1">Import Promotion</h3>
                                    <p className="text-sm text-gray-500">
                                        Import promotion from JSON file.
                                    </p>
                                </div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
