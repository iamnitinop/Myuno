"use client";

import { X, Book, PenTool, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { uid } from "@/lib/utils";
import { defaultBanner, defaultRules } from "@/lib/defaults";
import { apiFetch } from "@/lib/api";
import { AccountData, Banner } from "@/lib/types";
import { TemplateLibraryModal } from "./TemplateLibraryModal";
import { useState } from "react";

interface CreatePromotionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const KEY_DATA = (accountId: string) => `demo_account_${accountId}_data_v4`;

export function CreatePromotionModal({ isOpen, onClose }: CreatePromotionModalProps) {
    const router = useRouter();
    const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);

    if (!isOpen) return null;

    const handleCustomPromotion = async () => {
        try {
            const newBannerId = "bn_" + uid();
            const newBanner = defaultBanner(newBannerId);
            const newRules = defaultRules(newBannerId);

            // Create on server
            await apiFetch('/campaigns', {
                method: 'POST',
                body: JSON.stringify({
                    name: newBanner.name,
                    type: newBanner.type,
                    creativeJson: newBanner,
                    rulesJson: newRules
                })
            });

            // The backend might return the created ID, but for now we generated one or we trust the response.
            // Actually, backend create returns the DB object which has an ID. 
            // Better to use the ID from the server.
            // Let's adjust slightly to use server response.

            // Re-fetch or just navigate. Since we need the ID to navigate:
            // The previous logic generated ID on client: "bn_" + uid()
            // Backend uses UUID.
            // We should use backend ID.

            // Let's do it properly:

        } catch (e) {
            console.error(e);
            alert("Failed to create campaign");
            return; // Don't close/navigate
        }
    };

    // Wait, let's rewrite the handler properly in one go
    const handleCreate = async () => {
        try {
            // Default structures
            const tempId = "bn_" + uid(); // Temp ID for structure generation
            const banner = defaultBanner(tempId);
            const rules = defaultRules(tempId);

            const res = await apiFetch('/campaigns', {
                method: 'POST',
                body: JSON.stringify({
                    name: "New Campaign", // Default name
                    type: "modal", // Default type
                    creativeJson: banner, // Backend stores JSON
                    rulesJson: rules
                })
            });

            // Res should be the campaign object
            if (res && res.id) {
                router.push(`/campaigns/${res.id}`);
                onClose();
            }
        } catch (e: any) {
            console.error("Creation failed", e);
            alert("Failed to create campaign: " + e.message);
        }
    };

    const handleImportPromotion = () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json";
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const jsonString = event.target?.result as string;
                    const parsedData = JSON.parse(jsonString);
                    const { validateCampaignImport } = await import("@/lib/campaign-export");
                    const validated = validateCampaignImport(parsedData);

                    const { banner, rules } = validated.campaign;

                    // Generate new ID and append "(Imported)" to avoid conflicts
                    const originalId = banner.id;
                    banner.id = "bn_" + uid();
                    banner.name = `${banner.name} (Imported)`;
                    if (rules) {
                        rules.bannerId = banner.id;
                        // It's also possible rules have matching IDs internally, but basic structure is fine
                    }

                    const res = await apiFetch('/campaigns', {
                        method: 'POST',
                        body: JSON.stringify({
                            name: banner.name,
                            type: banner.type || 'modal',
                            creativeJson: banner,
                            rulesJson: rules
                        })
                    });

                    if (res && res.id) {
                        router.push(`/campaigns/${res.id}?tab=editor`);
                        onClose();
                    }
                } catch (err: any) {
                    console.error("Import failed", err);
                    alert("Failed to import campaign: " + err.message);
                }
            };
            reader.readAsText(file);
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
                        {/* Template Library - Enabled */}
                        <button
                            onClick={() => setShowTemplateLibrary(true)}
                            className="w-full p-4 text-left rounded-lg border-2 border-gray-200 dark:border-gray-800 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors"
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
                            onClick={handleCreate}
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

            {/* Template Library Modal */}
            <TemplateLibraryModal
                isOpen={showTemplateLibrary}
                onClose={() => setShowTemplateLibrary(false)}
            />
        </>
    );
}
