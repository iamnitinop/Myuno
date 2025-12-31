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
    const normalizedView = banner.views[device] || {
        ...banner.views.desktop,
        width: device === "tablet" ? 768 : banner.views.desktop.width,
        layers: banner.views.desktop.layers.map(layer => ({ ...layer })),
    };

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

    // ... (keep keyboard shortcuts and other logic same, I'll use a larger replacement to be safe with context) 

    // Actually, I can't strip the logic. I need to keep it.
    // Using a targeted replace for the RETURN statement and the state definition might be cleaner if I can find unique anchors.

    // Let's replace the top part first to add state.

    // Warning: I need to be careful not to delete logic. 
    // I will use a larger block replacement for the component start.

    // Keyboard Shortcuts
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "z") {
                e.preventDefault();
                if (e.shiftKey) {
                    redo();
                } else {
                    undo();
                }
            }
            if ((e.metaKey || e.ctrlKey) && e.key === "y") {
                e.preventDefault();
                redo();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [history, future, viewConfig]); // Dependencies for closure

    // Push to history before making changes
    const saveHistory = () => {
        setHistory((prev) => [...prev, viewConfig]);
        setFuture([]); // Clear redo stack on new change
    };

    const updateView = (patch: any) => {
        saveHistory();

        // Ensure tablet view exists in banner before updating
        const updatedViews = { ...banner.views };
        if (device === "tablet" && !updatedViews.tablet) {
            // Create tablet view from desktop if it doesn't exist
            updatedViews.tablet = {
                ...banner.views.desktop,
                width: 768,
                layers: banner.views.desktop.layers.map(layer => ({ ...layer })),
            };
        }

        const newViewConfig = { ...viewConfig, ...patch };

        onChange({
            ...banner,
            views: { ...updatedViews, [device]: newViewConfig },
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
        updateView({ layers: [...viewConfig.layers, newLayer] });
        setSelectedLayerId(newLayer.id);
    };

    const updateLayer = (id: string, patch: Partial<Layer>) => {
        updateView({
            layers: viewConfig.layers.map((l) => (l.id === id ? { ...l, ...patch } : l)),
        });
    };

    const reorderLayers = (oldIndex: number, newIndex: number) => {
        const newLayers = arrayMove(viewConfig.layers, oldIndex, newIndex);
        updateView({ layers: newLayers });
    };

    const deleteLayer = (id: string) => {
        updateView({ layers: viewConfig.layers.filter((l) => l.id !== id) });
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
