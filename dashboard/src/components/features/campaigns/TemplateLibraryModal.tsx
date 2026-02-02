"use client";

import { X } from "lucide-react";
import { templateLibrary, TemplateInfo } from "@/lib/templates";
import { useRouter } from "next/navigation";
import { defaultRules } from "@/lib/defaults";
import { BannerRenderer } from "@/components/features/preview/BannerRenderer";
import { apiFetch } from "@/lib/api";

interface TemplateLibraryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function TemplateLibraryModal({ isOpen, onClose }: TemplateLibraryModalProps) {
    const router = useRouter();

    if (!isOpen) return null;

    const handleUseTemplate = async (template: TemplateInfo) => {
        try {
            // Generate banner from template
            const newBanner = template.generator();
            const newRules = defaultRules(newBanner.id);

            // Save to backend via API
            const res = await apiFetch('/campaigns', {
                method: 'POST',
                body: JSON.stringify({
                    name: template.name,
                    type: newBanner.type,
                    creativeJson: newBanner,
                    rulesJson: newRules
                })
            });

            if (res && res.id) {
                // Navigate to the created campaign
                router.push(`/campaigns/${res.id}`);
                onClose();
            }
        } catch (e) {
            console.error("Failed to create campaign from template", e);
            alert("Failed to create campaign from template");
        }
    };

    const handlePreview = (template: TemplateInfo) => {
        // For now, just use the template
        // In future, could open a preview modal
        handleUseTemplate(template);
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
                <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
                        <h2 className="text-xl font-semibold">Template Library</h2>
                        <button
                            onClick={onClose}
                            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Templates Grid */}
                    <div className="p-6 overflow-y-auto max-h-[calc(90vh-88px)]">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {templateLibrary.map((template) => (
                                <div
                                    key={template.id}
                                    className="border-2 border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
                                >
                                    {/* Template Preview */}
                                    <div className="bg-gray-100 dark:bg-gray-800 aspect-video relative flex items-center justify-center p-4 overflow-hidden">
                                        {(() => {
                                            const banner = template.generator();
                                            const view = banner.views.desktop;
                                            // Calculate scale to fit in roughly 300x160 box
                                            const scale = 300 / (view.width || 800);

                                            return (
                                                <div
                                                    style={{
                                                        transform: `scale(${scale})`,
                                                        transformOrigin: 'center center',
                                                        width: view.width || 800,
                                                        height: view.height,
                                                        position: 'absolute'
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            width: '100%',
                                                            height: '100%',
                                                            backgroundColor: view.background,
                                                            backgroundImage: view.backgroundImage,
                                                            borderRadius: view.borderRadius,
                                                            boxShadow: view.boxShadow,
                                                            position: 'relative',
                                                            overflow: 'hidden'
                                                        }}
                                                    >
                                                        <BannerRenderer layers={view.layers} />
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>

                                    {/* Template Info */}
                                    <div className="p-4">
                                        <h3 className="font-semibold text-lg mb-1">{template.name}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                            {template.description}
                                        </p>

                                        {/* Action Buttons */}
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleUseTemplate(template)}
                                                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                                            >
                                                Use Template
                                            </button>
                                            <button
                                                onClick={() => handlePreview(template)}
                                                className="px-4 py-2 border-2 border-gray-300 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 font-medium rounded-lg transition-colors"
                                            >
                                                Preview
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
