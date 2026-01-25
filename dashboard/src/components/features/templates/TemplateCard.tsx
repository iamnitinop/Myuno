import React, { useMemo } from "react";
import { TemplateInfo } from "@/lib/templates";
import { Monitor, MoreHorizontal } from "lucide-react";
import { Banner } from "@/lib/types";
import { BannerRenderer } from "@/components/features/preview/BannerRenderer";
import { useRouter } from "next/navigation";

interface TemplateCardProps {
    template: TemplateInfo;
    onUse: (template: TemplateInfo) => void;
    onPreview: (template: TemplateInfo) => void; // Kept for interface compat
}

export const TemplateCard: React.FC<TemplateCardProps> = ({ template, onUse }) => {
    const router = useRouter();

    // Generate banner config on fly for preview
    const banner = useMemo<Banner>(() => template.generator(), [template]);
    const view = banner.views.desktop;

    const bannerWidth = view.width || 1200;
    const bannerHeight = view.height || 100;

    // Scale logic
    const scale = banner.type === 'top_bar' ? 0.25 : 0.45;

    const handlePreviewClick = () => {
        router.push(`/templates/preview/${template.id}`);
    };

    return (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col h-full group">

            {/* Header / Badges */}
            <div className="p-3 flex items-center justify-between border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                <div className="flex gap-2">
                    <span className="text-xs font-medium px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-gray-600 dark:text-gray-300 capitalize">
                        {template.category}
                    </span>
                    {template.category === 'sales' && (
                        <span className="text-xs font-medium px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-gray-600 dark:text-gray-300">
                            Discount
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                    <button className="hover:text-gray-600 dark:hover:text-gray-200">
                        <MoreHorizontal size={16} />
                    </button>
                    <Monitor size={16} />
                </div>
            </div>

            {/* Live Preview Canvas */}
            <div className="relative w-full aspect-video bg-gray-100 dark:bg-gray-800 overflow-hidden flex items-center justify-center p-4">

                {/* Scaled Banner Container */}
                <div
                    style={{
                        width: bannerWidth,
                        height: bannerHeight,
                        backgroundColor: view.background,
                        backgroundImage: view.backgroundImage,
                        position: "relative",
                        transform: `scale(${scale})`,
                        flexShrink: 0,
                        transformOrigin: "center center",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        borderRadius: view.borderRadius || 0,
                        overflow: "hidden"
                    }}
                >
                    <BannerRenderer layers={view.layers} />
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 z-10 box-border">
                    <button
                        onClick={() => onUse(template)}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all duration-200"
                    >
                        Use Template
                    </button>
                </div>
            </div>

            {/* Footer Details */}
            <div className="p-4 flex flex-col flex-grow">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {template.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4 flex-grow">
                    {template.description}
                </p>

                <div className="flex items-center gap-3 mt-auto">
                    <button
                        onClick={() => onUse(template)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-2 rounded transition-colors"
                    >
                        Use Template
                    </button>
                    <button
                        onClick={handlePreviewClick}
                        className="flex-1 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium px-3 py-2 rounded transition-colors"
                    >
                        Preview
                    </button>
                </div>
            </div>
        </div>
    );
};
