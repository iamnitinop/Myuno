"use client";

import React, { useState } from "react";
import { Banner, Layer, LayerType, ViewConfig } from "@/lib/types";
import { uid } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Pill";
import { Accordion, AccordionItem } from "@/components/ui/Accordion";
import { arrayMove } from "@dnd-kit/sortable";
import { Toolbox } from "./Toolbox";
import { Canvas } from "./Canvas";
import { PropertiesPanel } from "./PropertiesPanel";
import { LayerListPanel } from "./LayerListPanel";

// Helper: scalable number parsing
const parseNum = (val: string | number | undefined) => {
    if (typeof val === "number") return val;
    if (!val) return 0;
    return parseFloat(val.toString());
};

const getSmartResponsiveLayout = (baseLayers: Layer[], targetWidth: number, baseWidth: number, device: "tablet" | "mobile") => {
    const isMobile = device === "mobile";
    const scale = targetWidth / baseWidth;

    // Separate special layers
    const normalLayers = baseLayers.filter(l => l.type !== "close_button");
    const closeButtons = baseLayers.filter(l => l.type === "close_button");

    // Process normal layers
    let processedLayers: Layer[] = [];

    if (isMobile) {
        // Mobile: Stack layout
        // Sort by visual reading order (Top-to-Bottom, then Left-to-Right)
        // We group items that are roughly on the same Y-level (within 30px) to preserve some row structure if needed,
        // but for pure stacking, we just want to sequentialize them.
        const sorted = [...normalLayers].sort((a, b) => {
            const yDiff = a.position.y - b.position.y;
            if (Math.abs(yDiff) < 30) return a.position.x - b.position.x; // Same row-ish
            return yDiff;
        });

        let currentY = 20; // Start with top padding

        processedLayers = sorted.map(layer => {
            // Clone style
            const style = { ...layer.style };

            // Scale Width (max out at container width - padding)
            const margin = 5; // Minimal margin for end-to-end look
            const maxW = targetWidth - (margin * 2);
            let newW = Math.round(layer.size.width * scale);
            // Don't shrink too tiny
            if (newW < 20 && layer.type !== 'icon') newW = 20;
            // Cap width
            if (newW > maxW) newW = maxW;
            // Force full width for text/buttons to use space
            if (layer.type === 'text' || layer.type === 'button') newW = maxW;

            // Scale Font Size
            if (style.fontSize) {
                style.fontSize = "18px";
            }

            // Calc Height
            // For text, we estimate new height needed since width shrank
            let newH = Math.round(layer.size.height * scale);
            if (layer.type === 'text') {
                style.padding = "0px"; // Remove padding
                style.margin = "0px";

                // Tight height estimation: chars * charWidth / width * lineHeight
                // Avg char width ~ 9px for 18px font. Line height ~ 1.2
                const textLen = layer.content.replace(/<[^>]*>/g, '').length; // Strip HTML tags
                const lines = Math.ceil((textLen * 9) / newW);
                newH = Math.max(24, lines * 22); // 22px line height
            } else if (layer.type === 'button' || layer.type === 'email_form') {
                // Keep touch targets accessible but tight
                newH = 40;
            }

            // Center X
            const newX = Math.round((targetWidth - newW) / 2);

            // Stack Y
            const newY = currentY;
            currentY += newH; // Zero Gap

            // Center text alignment for mobile flow
            if (layer.type === 'text') {
                style.textAlign = 'center';
            }

            return {
                ...layer,
                style,
                position: { x: newX, y: newY },
                size: { width: newW, height: newH }
            };
        });

    } else {
        // Tablet: Smart Scale (preserve layout but fit)
        processedLayers = normalLayers.map(layer => {
            const style = { ...layer.style };

            // Scale Font Size
            if (style.fontSize) {
                const oldSize = parseNum(style.fontSize);
                const newSize = Math.max(12, Math.round(oldSize * scale));
                style.fontSize = `${newSize}px`;
            }

            return {
                ...layer,
                style,
                position: {
                    x: Math.round(layer.position.x * scale),
                    y: Math.round(layer.position.y * scale),
                },
                size: {
                    width: Math.round(layer.size.width * scale),
                    height: Math.round(layer.size.height * scale),
                },
            };
        });
    }

    // Handle Close Buttons (Always Top-Right or Top-Left, don't stack)
    const processedCloseButtons = closeButtons.map(layer => {
        // Detect if it was on the right or left
        const param = scale; // Scale down size/pos
        const isRight = layer.position.x > (baseWidth / 2);

        const newSize = Math.max(24, Math.round(layer.size.width * scale));

        return {
            ...layer,
            position: {
                x: isRight ? targetWidth - newSize - 10 : 10,
                y: 10
            },
            size: { width: newSize, height: newSize },
            style: { ...layer.style }
        };
    });

    // Re-merge (maintain roughly z-index by appending close buttons last as they are usually top)
    // For height, if mobile, we need to know the final Y. We can calc it from processedLayers.
    const mobileHeight = isMobile ? processedLayers.reduce((max, l) => Math.max(max, l.position.y + l.size.height), 0) + 40 : undefined;

    return {
        layers: [...processedLayers, ...processedCloseButtons],
        height: mobileHeight
    };
};

const getMobileLayer = (baseLayer: Layer, targetWidth: number, currentY: number) => {
    // Clone style
    const style = { ...baseLayer.style };

    // Scale Font Size
    if (style.fontSize) {
        style.fontSize = "18px";
    }

    // Full width minus padding
    const margin = 5;
    const newW = targetWidth - (margin * 2);

    // Calc Height
    // For text, we estimate new height needed since width shrank
    let newH = 40;
    if (baseLayer.type === 'text') {
        style.padding = "0px";
        style.margin = "0px";
        const textLen = baseLayer.content.replace(/<[^>]*>/g, '').length;
        const lines = Math.ceil((textLen * 9) / newW);
        newH = Math.max(24, lines * 22);
    } else if (baseLayer.type === 'image' || baseLayer.type === 'video') {
        // Keep aspect ratio
        const ratio = baseLayer.size.height / baseLayer.size.width;
        newH = Math.round(newW * ratio);
    } else {
        newH = Math.max(50, baseLayer.size.height); // Minimum touch target
    }

    // Center X
    const newX = margin;

    // Center text alignment for mobile flow
    if (baseLayer.type === 'text') {
        style.textAlign = 'center';
    }

    return {
        ...baseLayer,
        style,
        position: { x: newX, y: currentY },
        size: { width: newW, height: newH }
    };
};

interface VisualEditorProps {
    banner: Banner;
    onChange: (banner: Banner) => void;
}

export function VisualEditor({ banner, onChange }: VisualEditorProps) {
    const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
    const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
    const [websiteUrl, setWebsiteUrl] = useState<string>(""); // Temporary reference URL
    const [referenceImage, setReferenceImage] = useState<string | null>(null); // Reference image fallback

    // History Stacks
    const [history, setHistory] = useState<ViewConfig[]>([]);
    const [future, setFuture] = useState<ViewConfig[]>([]);

    // Ensure tablet view exists (for backward compatibility with old banners)
    // Ensure view exists (sync with desktop or use saved view)
    // Ensure view exists (sync with desktop or use saved view)
    const normalizedView = (() => {
        if (banner.views[device]) return banner.views[device];

        // Derive from desktop for responsive behavior
        const base = banner.views.desktop;
        const targetWidth = device === "mobile" ? 375 : device === "tablet" ? 768 : (base.width || 1200);
        const baseWidth = base.width || 1200;

        const layout = getSmartResponsiveLayout(base.layers, targetWidth, baseWidth, device as "tablet" | "mobile");

        return {
            ...base,
            width: targetWidth,
            height: layout.height || base.height,
            layers: layout.layers
        };
    })();

    const viewConfig: ViewConfig = {
        ...normalizedView,
        background: normalizedView.background || "#ffffff",
    };

    const selectedLayer = viewConfig.layers.find((l) => l.id === selectedLayerId) || null;

    // ... (keep history logic same)

    const undo = () => {
        if (history.length === 0) return;
        const previous = history[history.length - 1];
        setFuture((prev) => [viewConfig, ...prev]);
        setHistory((prev) => prev.slice(0, -1));

        onChange({
            ...banner,
            views: { ...banner.views, [device]: previous },
        });
    };

    const redo = () => {
        if (future.length === 0) return;
        const next = future[0];
        setHistory((prev) => [...prev, viewConfig]);
        setFuture((prev) => prev.slice(1));

        onChange({
            ...banner,
            views: { ...banner.views, [device]: next },
        });
    };

    // Clipboard
    const [clipboard, setClipboard] = useState<Layer | null>(null);

    const duplicateLayer = (id: string, offset = 10) => {
        const layerToClone = viewConfig.layers.find(l => l.id === id);
        if (!layerToClone) return;

        const newLayer: Layer = {
            ...layerToClone,
            id: "l_" + uid(),
            name: layerToClone.name + " (Copy)",
            position: {
                x: layerToClone.position.x + offset,
                y: layerToClone.position.y + offset,
            },
        };

        updateView({ layers: [...viewConfig.layers, newLayer] });
        setSelectedLayerId(newLayer.id);
    };

    const copyLayer = () => {
        if (selectedLayerId) {
            const layer = viewConfig.layers.find(l => l.id === selectedLayerId);
            if (layer) setClipboard(layer);
        }
    };

    const pasteLayer = () => {
        if (clipboard) {
            // Create a duplicate of the clipboard item
            const newLayer: Layer = {
                ...clipboard,
                id: "l_" + uid(),
                name: clipboard.name + " (Copy)",
                position: {
                    x: clipboard.position.x + 20,
                    y: clipboard.position.y + 20,
                },
            };
            updateView({ layers: [...viewConfig.layers, newLayer] });
            setSelectedLayerId(newLayer.id);
        }
    };

    // ... (keep keyboard shortcuts and other logic same, I'll use a larger replacement to be safe with context) 

    // Actually, I can't strip the logic. I need to keep it.
    // Using a targeted replace for the RETURN statement and the state definition might be cleaner if I can find unique anchors.

    // Let's replace the top part first to add state.

    // Warning: I need to be careful not to delete logic. 
    // I will use a larger block replacement for the component start.

    // Keyboard Shortcuts
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Undo: Ctrl+Z
            if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
                e.preventDefault();
                undo();
            }
            // Redo: Ctrl+Shift+Z or Ctrl+Y
            if ((e.metaKey || e.ctrlKey) && ((e.key === "z" && e.shiftKey) || e.key === "y")) {
                e.preventDefault();
                redo();
            }
            // Helper to check if user is typing in an input
            const isTyping = () => {
                const el = document.activeElement;
                return (
                    el?.tagName === 'INPUT' ||
                    el?.tagName === 'TEXTAREA' ||
                    el?.getAttribute('contenteditable') === 'true'
                );
            };

            // Copy: Ctrl+C
            if ((e.metaKey || e.ctrlKey) && e.key === "c") {
                if (isTyping()) return;
                e.preventDefault();
                copyLayer();
            }
            // Paste: Ctrl+V
            if ((e.metaKey || e.ctrlKey) && e.key === "v") {
                if (isTyping()) return;
                e.preventDefault();
                pasteLayer();
            }
            // Duplicate: Ctrl+D
            if ((e.metaKey || e.ctrlKey) && e.key === "d") {
                e.preventDefault();
                if (selectedLayerId) duplicateLayer(selectedLayerId);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [history, future, viewConfig, clipboard, selectedLayerId]); // Dependencies for closure

    // Push to history before making changes
    const saveHistory = () => {
        setHistory((prev) => [...prev, viewConfig]);
        setFuture([]); // Clear redo stack on new change
    };

    const updateView = (patch: any) => {
        saveHistory();

        // The viewConfig is already derived correctly (scaled/normalized) by our useMemo above.
        // We just need to merge the patch and save it to the specific device slot.
        // This implicitly "breaks sync" with desktop because we are now saving a specific 
        // configuration for this device, so correct normalizedView will use this saved view hereafter.
        const newViewConfig = { ...viewConfig, ...patch };

        onChange({
            ...banner,
            views: { ...banner.views, [device]: newViewConfig },
        });
    };

    const addLayer = (type: LayerType) => {
        const baseStyle = {
            fontSize: "16px",
            color: "#000",
            backgroundColor: type === "button" ? "#007bff" : type === "shape" ? "#ccc" : undefined,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center" as const,
        };

        // ... (content switch) ...
        let content = "";
        let width = 160;
        let height = 40;

        switch (type) {
            case "text": content = "New Text"; width = 200; break;
            case "button": content = "Click Me"; width = 140; break;
            case "image": content = "https://via.placeholder.com/150"; width = 150; height = 150; break;
            case "icon": content = "flag"; width = 40; height = 40; break;
            case "email_form": content = "Enter your email"; width = 300; height = 50; break;
            case "consent_checkbox": content = "I agree to terms"; width = 250; height = 30; break;
            case "push_notification": content = "Allow Notifications"; width = 200; height = 50; break;
            case "sms_signup": content = "Enter phone number"; width = 300; height = 50; break;
            case "video": content = "https://www.youtube.com/embed/dQw4w9WgXcQ"; width = 300; height = 170; break;
            case "coupon_box": content = "SAVE20"; width = 200; height = 60; break;
            case "close_button": content = "X"; width = 30; height = 30; break;
            case "commerce_ai": content = "Recommended Products"; width = 300; height = 200; break;
            case "spin_to_win": content = ""; width = 300; height = 300; break;
            case "timer": content = new Date(Date.now() + 86400000).toISOString(); width = 200; height = 60; break;
            case "slot_machine": content = ""; width = 300; height = 200; break;
            case "scratch_off": content = ""; width = 300; height = 150; break;
            case "text_ticker": content = "Breaking News... Sale Ending Soon..."; width = 400; height = 40; break;
            case "fb_messenger": content = ""; width = 60; height = 60; break;
            case "html": content = "<div>Custom Code</div>"; width = 300; height = 200; break;
        }

        const newLayer: Layer = {
            id: "l_" + uid(),
            type,
            name: `${type === "text" ? "Text" : type === "button" ? "Button" : type} Layer`,
            visible: true,
            content,
            position: { x: 50, y: 50 },
            size: { width, height },
            style: baseStyle,
        };

        const updatedViews = { ...banner.views };

        // Add to current view
        let newCurrentLayers = [...viewConfig.layers, newLayer];

        // If we are on Desktop, propagate to others if they exist
        if (device === "desktop") {
            updatedViews.desktop = { ...updatedViews.desktop, layers: newCurrentLayers };

            // Propagate to Mobile/Tablet if they are already forked
            (["tablet", "mobile"] as const).forEach(d => {
                const view = updatedViews[d];
                if (view) {
                    // Smart add: calculate position for this device
                    // For mobile, append to bottom
                    let layerToAdd = { ...newLayer };
                    if (d === "mobile") {
                        // Simple approximation: put at bottom
                        const maxY = view.layers.reduce((max, l) => Math.max(max, l.position.y + l.size.height), 0);
                        layerToAdd = getMobileLayer(newLayer, view.width || 375, maxY + 20);
                        // Expand view height if needed
                        updatedViews[d] = {
                            ...view,
                            height: Math.max(view.height, layerToAdd.position.y + layerToAdd.size.height + 20),
                            layers: [...view.layers, layerToAdd]
                        };
                    } else {
                        updatedViews[d] = { ...view, layers: [...view.layers, layerToAdd] };
                    }
                }
            });

            // For current device (desktop), we already updated updatedViews.desktop
            // But we need to call onChange with the FULL structure
            onChange({
                ...banner,
                views: updatedViews,
            });
            setSelectedLayerId(newLayer.id);
            return;
        }

        // If not desktop, just add to current
        updateView({ layers: newCurrentLayers });
        setSelectedLayerId(newLayer.id);
    };

    const updateLayer = (id: string, patch: Partial<Layer>) => {
        const updatedViews = { ...banner.views };

        // Update current view logic first
        const newLayers = viewConfig.layers.map((l) => (l.id === id ? { ...l, ...patch } : l));

        // If on Desktop, and we are changing CONTENT (text/image), propagate to other views
        if (device === "desktop" && (patch.content !== undefined || patch.type !== undefined)) { // Type check just in case
            updatedViews.desktop = { ...updatedViews.desktop, layers: newLayers };

            (["tablet", "mobile"] as const).forEach(d => {
                const view = updatedViews[d];
                if (view) {
                    const viewLayers = view.layers.map(l => {
                        if (l.id === id) {
                            return { ...l, content: patch.content! }; // Propagate content only
                        }
                        return l;
                    });
                    updatedViews[d] = { ...view, layers: viewLayers };
                }
            });

            onChange({
                ...banner,
                views: updatedViews,
            });
            return;
        }

        updateView({ layers: newLayers });
    };

    const reorderLayers = (oldIndex: number, newIndex: number) => {
        const newLayers = arrayMove(viewConfig.layers, oldIndex, newIndex);
        updateView({ layers: newLayers });
    };

    const deleteLayer = (id: string) => {
        if (device === "desktop") {
            const updatedViews = { ...banner.views };
            // Delete from all views
            (["desktop", "tablet", "mobile"] as const).forEach(d => {
                const view = updatedViews[d];
                if (view) {
                    updatedViews[d] = { ...view, layers: view.layers.filter(l => l.id !== id) };
                }
            });
            onChange({ ...banner, views: updatedViews });
        } else {
            updateView({ layers: viewConfig.layers.filter((l) => l.id !== id) });
        }
        setSelectedLayerId(null);
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-950">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
                <div className="flex gap-4 items-center">
                    <div className="flex bg-gray-100 dark:bg-gray-800 rounded p-1">
                        <Pill active={device === "desktop"} onClick={() => setDevice("desktop")}>Desktop</Pill>
                        <Pill active={device === "tablet"} onClick={() => setDevice("tablet")}>Tablet</Pill>
                        <Pill active={device === "mobile"} onClick={() => setDevice("mobile")}>Mobile</Pill>
                    </div>

                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-700" />

                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Enter website URL for preview..."
                            className="border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-sm w-48 bg-transparent"
                            value={websiteUrl}
                            onChange={(e) => setWebsiteUrl(e.target.value)}
                        />
                        <span className="text-xs text-gray-400">OR</span>
                        <label className="cursor-pointer bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-sm flex items-center gap-2">
                            <span>{referenceImage ? "Change Img" : "Upload Screenshot"}</span>
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        const url = URL.createObjectURL(file);
                                        setReferenceImage(url);
                                    }
                                }}
                            />
                        </label>
                    </div>
                </div>

                <div className="flex gap-2 items-center">
                    <span className="text-xs text-gray-500 mr-4">{viewConfig.layers.length} layers</span>
                    <Button kind="secondary" onClick={undo} disabled={history.length === 0} className="h-8 text-xs">Undo</Button>
                    <Button kind="secondary" onClick={redo} disabled={future.length === 0} className="h-8 text-xs">Redo</Button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">

                {/* Left: Sidebar with Accordion */}
                <div className="w-64 shrink-0 flex flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-y-auto">
                    <Accordion className="border-0 bg-transparent shadow-none">
                        <AccordionItem title="Layers" defaultOpen={true}>
                            <LayerListPanel
                                layers={viewConfig.layers}
                                selectedLayerId={selectedLayerId}
                                onSelect={setSelectedLayerId}
                                onUpdate={updateLayer}
                                onDelete={deleteLayer}
                                onReorder={reorderLayers}
                            />
                        </AccordionItem>
                        <AccordionItem title="Add Layer" contentClassName="p-0">
                            <Toolbox onAddLayer={addLayer} />
                        </AccordionItem>
                    </Accordion>
                </div>

                {/* Center: Canvas Area */}
                <div className="flex-1 flex items-center justify-center bg-gray-100 dark:bg-gray-900 overflow-hidden p-8 relative">
                    <div
                        style={{
                            width: device === "mobile" ? 375 : "100%",
                            maxWidth: device === "mobile" ? 375 : 1200,
                            transition: "width 0.3s ease"
                        }}
                    >
                        <Canvas
                            viewConfig={viewConfig}
                            selectedLayerId={selectedLayerId}
                            onSelectLayer={setSelectedLayerId}
                            onUpdateLayer={updateLayer}
                            websiteUrl={websiteUrl}
                            referenceImage={referenceImage}
                        />
                    </div>
                </div>

                {/* Right: Properties */}
                <div className="w-64 shrink-0 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                    <PropertiesPanel
                        selectedLayer={selectedLayer}
                        onChange={updateLayer}
                        onDelete={deleteLayer}
                        onDuplicate={(id) => duplicateLayer(id)}
                        canvasSettings={{
                            height: viewConfig.height,
                            background: viewConfig.background,
                            width: viewConfig.width,
                            backgroundImage: viewConfig.backgroundImage,
                            backgroundOpacity: viewConfig.backgroundOpacity,
                            borderWidth: viewConfig.borderWidth,
                            borderColor: viewConfig.borderColor,
                            borderStyle: viewConfig.borderStyle,
                            borderRadius: viewConfig.borderRadius,
                            boxShadow: viewConfig.boxShadow,
                            padding: viewConfig.padding,
                        }}
                        onCanvasChange={updateView}
                    />
                </div>
            </div>
        </div>
    );
}
