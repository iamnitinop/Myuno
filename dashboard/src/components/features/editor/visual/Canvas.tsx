"use client";

import React from "react";
import { Layer, ViewConfig } from "@/lib/types";
import { LayerComponent } from "./LayerComponent";
import { RichTextToolbar } from "./RichTextToolbar";

interface CanvasProps {
    viewConfig: ViewConfig;
    selectedLayerId: string | null;
    onSelectLayer: (id: string | null) => void;
    onUpdateLayer: (id: string, patch: Partial<Layer>) => void;
    scale?: number;
    websiteUrl?: string;
    referenceImage?: string | null;
}

export function Canvas({
    viewConfig,
    selectedLayerId,
    onSelectLayer,
    onUpdateLayer,
    scale = 1,
    websiteUrl,
    referenceImage,
}: CanvasProps) {
    const selectedLayer = viewConfig.layers.find(l => l.id === selectedLayerId);

    // Handler for toolbar style changes (box level)
    const handleStyleChange = (stylePatch: Partial<React.CSSProperties>) => {
        if (!selectedLayerId) return;
        // Merge with existing style
        onUpdateLayer(selectedLayerId, {
            style: { ...selectedLayer?.style, ...stylePatch }
        });
    };

    // Handler for execCommand (inline rich text)
    const handleExecCommand = (command: string, value?: string) => {
        document.execCommand(command, false, value);
        // We rely on the LayerComponent's onBlur to save the HTML content changes
    };

    return (
        <div
            className="relative shadow-lg border border-gray-200 dark:border-gray-800 transition-all bg-white mx-auto"
            style={{
                width: viewConfig.width || "100%",
                height: viewConfig.height,
                minHeight: websiteUrl ? "800px" : viewConfig.height,
                // Removed overflow: "hidden" here to allow toolbar to fly out
            }}
            onMouseDown={(e) => {
                // If clicking canvas background (outer wrapper), deselect
                if (e.target === e.currentTarget) {
                    onSelectLayer(null);
                }
            }}
        >
            {/* Website Background Review */}
            {(websiteUrl || referenceImage) && (
                <div className="absolute inset-0 z-0 pointer-events-none opacity-50 overflow-hidden">
                    {referenceImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={referenceImage}
                            alt="Reference"
                            className="w-full h-full object-cover opacity-50"
                        />
                    ) : (
                        <iframe
                            src={websiteUrl}
                            className="w-full h-full border-none"
                            title="Website Preview"
                            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                        />
                    )}
                </div>
            )}

            {/* Banner Container (Clipped Content) */}
            <div
                className="relative z-10 w-full h-full overflow-hidden" // Only clip the actual banner content
                onMouseDown={(e) => {
                    // Deselect if clicking the banner background directly
                    if (e.target === e.currentTarget) {
                        onSelectLayer(null);
                    }
                }}
                style={{
                    height: viewConfig.height,
                    // Border settings
                    borderTopWidth: viewConfig.borderWidth,
                    borderRightWidth: viewConfig.borderWidth,
                    borderBottomWidth: viewConfig.borderWidth,
                    borderLeftWidth: viewConfig.borderWidth,
                    borderColor: viewConfig.borderColor,
                    borderStyle: viewConfig.borderStyle,
                    borderRadius: viewConfig.borderRadius,
                    boxShadow: viewConfig.boxShadow,
                    padding: viewConfig.padding,
                }}
            >
                {/* Background Layer */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundColor: viewConfig.backgroundImage ? 'transparent' : viewConfig.background,
                        backgroundImage: viewConfig.backgroundImage
                            ? `url(${viewConfig.backgroundImage})`
                            : (viewConfig.background.includes('gradient') ? viewConfig.background : undefined),
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        opacity: viewConfig.backgroundOpacity ?? 1,
                    }}
                />
                {viewConfig.layers.filter(l => l.visible !== false).map((layer) => (
                    <LayerComponent
                        key={layer.id}
                        layer={layer}
                        isSelected={selectedLayerId === layer.id}
                        onSelect={onSelectLayer}
                        onChange={onUpdateLayer}
                        scale={scale}
                        canvasSize={{ width: viewConfig.width || 1200, height: viewConfig.height }}
                    />
                ))}
            </div>

            {/* Toolbar Overlay (Outside Clipping) */}
            {selectedLayer && (selectedLayer.type === "text" || selectedLayer.type === "button") && (
                <RichTextToolbar
                    style={selectedLayer.style}
                    onStyleChange={handleStyleChange}
                    onExecCommand={handleExecCommand}
                    position={selectedLayer.position}
                    layerHeight={selectedLayer.size.height}
                />
            )}
        </div>
    );

}
