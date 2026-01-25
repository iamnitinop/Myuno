"use client";

import React from "react";
import { Layer } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
    ArrowUpToLine,
    ArrowDownToLine,
    ArrowLeftToLine,
    ArrowRightToLine,
    AlignCenterHorizontal,
    AlignCenterVertical,
    Trash2
} from "lucide-react";

import { BackgroundUrlInput } from "./BackgroundUrlInput";

import { Accordion, AccordionItem } from "@/components/ui/Accordion";
import { useEffect, useState } from "react";

// Internal Debounced Input Component
function DebouncedInput({
    value: initialValue,
    onChange,
    delay = 300,
    ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; delay?: number }) {
    const [value, setValue] = useState(initialValue);

    useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (value !== initialValue) {
                // @ts-ignore
                onChange?.({ target: { value } } as any);
            }
        }, delay);

        return () => clearTimeout(timer);
    }, [value, onChange, delay, initialValue]);

    return (
        <Input
            {...props}
            value={value}
            onChange={(e) => setValue(e.target.value)}
        />
    );
}

interface PropertiesPanelProps {
    selectedLayer: Layer | null;
    onChange: (id: string, patch: Partial<Layer>) => void;
    onDelete: (id: string) => void;
    onDuplicate: (id: string) => void;
    canvasSettings: {
        width?: number;
        height: number;
        background: string;
        backgroundImage?: string;
        backgroundOpacity?: number;
        borderWidth?: number;
        borderColor?: string;
        borderStyle?: string;
        borderRadius?: number;
        boxShadow?: string;
        padding?: number;
    };
    onCanvasChange: (patch: any) => void;
}

export function PropertiesPanel({
    selectedLayer,
    onChange,
    onDelete,
    onDuplicate,
    canvasSettings,
    onCanvasChange,
}: PropertiesPanelProps) {

    // Helper for alignment
    const alignLayer = (direction: 'top' | 'bottom' | 'left' | 'right' | 'center-h' | 'center-v') => {
        if (!selectedLayer) return;

        const canvasW = canvasSettings.width || 600; // Default fallback
        const canvasH = canvasSettings.height;
        const { width: layerW, height: layerH } = selectedLayer.size;

        let newPos = { ...selectedLayer.position };

        switch (direction) {
            case 'top': newPos.y = 0; break;
            case 'bottom': newPos.y = canvasH - layerH; break;
            case 'left': newPos.x = 0; break;
            case 'right': newPos.x = canvasW - layerW; break;
            case 'center-h': newPos.x = (canvasW - layerW) / 2; break;
            case 'center-v': newPos.y = (canvasH - layerH) / 2; break;
        }

        onChange(selectedLayer.id, { position: newPos });
    };

    const toggleUnit = (prop: 'width' | 'height') => {
        if (!selectedLayer) return;

        const canvasW = canvasSettings.width || 600;
        const canvasH = canvasSettings.height || 400;
        const referenceSize = prop === 'width' ? canvasW : canvasH;

        // Use type assertion for safety with new props
        const currentUnits = (selectedLayer as any).sizeUnits || { width: 'px', height: 'px' };
        const currentUnit = currentUnits[prop] || 'px';
        const newUnit = currentUnit === 'px' ? '%' : 'px';

        // CONVERT VALUE
        const currentValue = selectedLayer.size[prop];
        let newValue = currentValue;

        if (currentUnit === 'px' && newUnit === '%') {
            // PX -> %
            newValue = (currentValue / referenceSize) * 100;
        } else if (currentUnit === '%' && newUnit === 'px') {
            // % -> PX
            newValue = (currentValue / 100) * referenceSize;
        }

        // Round to 2 decimals
        newValue = Math.round(newValue * 100) / 100;

        onChange(selectedLayer.id, {
            sizeUnits: { ...currentUnits, [prop]: newUnit },
            size: { ...selectedLayer.size, [prop]: newValue }
        } as any);
    };

    if (!selectedLayer) {
        return (
            <Card title="Canvas Settings" className="h-full flex flex-col">
                <Accordion className="border-0 shadow-none bg-transparent">
                    {/* Dimensions & Color */}
                    <AccordionItem title="Dimensions & Color" defaultOpen={true}>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <Input
                                    label="Height (px)"
                                    value={String(canvasSettings.height)}
                                    onChange={(e) => onCanvasChange({ height: Number(e.target.value) })}
                                />
                                <Input
                                    label="Width (px, optional)"
                                    value={String(canvasSettings.width || "")}
                                    placeholder="100% (auto)"
                                    onChange={(e) => onCanvasChange({ width: Number(e.target.value) || undefined })}
                                />
                            </div>

                            {/* Opacity Slider */}
                            <div className="space-y-1">
                                <div className="flex justify-between">
                                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Opacity</label>
                                    <span className="text-xs text-gray-500">{Math.round((canvasSettings.backgroundOpacity ?? 1) * 100)}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                                    value={(canvasSettings.backgroundOpacity ?? 1) * 100}
                                    onChange={(e) => onCanvasChange({ backgroundOpacity: Number(e.target.value) / 100 })}
                                />
                            </div>

                            {/* Background Color & Gradient */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Background Color</label>
                                <div className="flex gap-2">
                                    <div className="shrink-0">
                                        <input
                                            type="color"
                                            className="w-10 h-10 p-1 rounded border border-gray-300 dark:border-gray-700 cursor-pointer"
                                            value={canvasSettings.background.startsWith("#") ? canvasSettings.background : "#ffffff"}
                                            onChange={(e) => onCanvasChange({ background: e.target.value })}
                                            disabled={canvasSettings.background.includes("gradient")}
                                        />
                                    </div>
                                    <Input
                                        className="flex-1"
                                        value={canvasSettings.background}
                                        onChange={(e) => onCanvasChange({ background: e.target.value })}
                                        placeholder="#ffffff or linear-gradient(...)"
                                    />
                                </div>

                                {!canvasSettings.background.includes("gradient") ? (
                                    <Button
                                        kind="primary"
                                        className="w-full text-xs"
                                        onClick={() => onCanvasChange({ background: "linear-gradient(90deg, #4f46e5 0%, #06b6d4 100%)" })}
                                    >
                                        <span className="bg-gradient-to-r from-blue-400 to-cyan-400 text-transparent bg-clip-text font-bold mr-1">|||</span> Create Gradient
                                    </Button>
                                ) : (
                                    <Button
                                        kind="secondary"
                                        className="w-full text-xs"
                                        onClick={() => onCanvasChange({ background: "#ffffff" })}
                                    >
                                        Switch to Solid Color
                                    </Button>
                                )}
                            </div>
                        </div>
                    </AccordionItem>

                    {/* Custom Graphic */}
                    <AccordionItem title="Custom Graphic">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Background Image</label>
                                {canvasSettings.backgroundImage && (
                                    <button
                                        className="text-xs text-red-500 hover:text-red-600"
                                        onClick={() => onCanvasChange({ backgroundImage: undefined })}
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>

                            {!canvasSettings.backgroundImage ? (
                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <svg className="w-8 h-8 mb-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                                        <p className="text-xs text-gray-500">Drag Image Here or Click</p>
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                const url = URL.createObjectURL(file);
                                                onCanvasChange({ backgroundImage: url });
                                            }
                                        }}
                                    />
                                </label>
                            ) : (
                                <div className="relative group">
                                    <img src={canvasSettings.backgroundImage} alt="Background" className="w-full h-32 object-cover rounded border border-gray-200 dark:border-gray-700" />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded">
                                        <span className="text-white text-xs font-medium">Change Image</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const url = URL.createObjectURL(file);
                                                    onCanvasChange({ backgroundImage: url });
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            )}


                            <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Or enter Image URL</label>
                                <BackgroundUrlInput
                                    value={canvasSettings.backgroundImage || ""}
                                    onChange={(val) => onCanvasChange({ backgroundImage: val })}
                                />
                            </div>
                        </div>
                    </AccordionItem>

                    {/* Border Options Removed - Moved to Layer Properties */}
                </Accordion>
            </Card>
        );
    }

    const updateStyle = (stylePatch: React.CSSProperties) => {
        onChange(selectedLayer.id, { style: { ...selectedLayer.style, ...stylePatch } });
    };

    return (
        <Card title="Layer Properties" className="h-full flex flex-col overflow-hidden">
            <Accordion className="border-0 shadow-none bg-transparent flex-1 overflow-y-auto min-h-0 pr-1 scrollbar-thin">

                {/* Layer Positioning */}
                <AccordionItem title="Layer Positioning" defaultOpen={true}>
                    <div className="grid grid-cols-6 gap-2">
                        <Button kind="secondary" className="p-1 h-8" onClick={() => alignLayer('top')} title="Top Align Selected Layer">
                            <ArrowUpToLine className="w-4 h-4" />
                        </Button>
                        <Button kind="secondary" className="p-1 h-8" onClick={() => alignLayer('center-h')} title="Center Selected Layers Horizontally">
                            <AlignCenterHorizontal className="w-4 h-4" />
                        </Button>
                        <Button kind="secondary" className="p-1 h-8" onClick={() => alignLayer('bottom')} title="Bottom Align Selected Layers">
                            <ArrowDownToLine className="w-4 h-4" />
                        </Button>
                        <Button kind="secondary" className="p-1 h-8" onClick={() => alignLayer('left')} title="Left Align Selected Layer">
                            <ArrowLeftToLine className="w-4 h-4" />
                        </Button>
                        <Button kind="secondary" className="p-1 h-8" onClick={() => alignLayer('center-v')} title="Center Selected Layers Vertically">
                            <AlignCenterVertical className="w-4 h-4" />
                        </Button>
                        <Button kind="secondary" className="p-1 h-8" onClick={() => alignLayer('right')} title="Right Align Selected Layers">
                            <ArrowRightToLine className="w-4 h-4" />
                        </Button>
                    </div>

                    {/* Fixed Position Dropdown */}
                    <div className="pt-4 mt-2 border-t border-gray-100 dark:border-gray-800">
                        <label className="text-xs text-gray-500 mb-1 block">Fixed Position</label>
                        <select
                            className="w-full h-9 text-sm border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 px-2"
                            value={selectedLayer.fixedPosition || "None"}
                            onChange={(e) => {
                                const val = e.target.value;
                                const updates: Partial<Layer> = { fixedPosition: val === "None" ? undefined : val };
                                // ... (keeping existing fixed position logic triggers if needed for context, but simplistic for brevity in replacement)
                                // Actually, I should probably keep the logic intact if I am replacing the block. 
                                // But the user instruction is to ADD features below layer positioning.
                                // The block I am replacing ends at line 391.
                                // I will re-include the logic.

                                const canvasW = canvasSettings.width || 600;
                                const canvasH = canvasSettings.height || 400;
                                const layerW = selectedLayer.size.width;
                                const layerH = selectedLayer.size.height;

                                let newX = selectedLayer.position.x;
                                let newY = selectedLayer.position.y;

                                if (val === "Top Left") { newX = 0; newY = 0; }
                                else if (val === "Top Center") { newX = (canvasW - layerW) / 2; newY = 0; }
                                else if (val === "Top Right") { newX = canvasW - layerW; newY = 0; }
                                else if (val === "Left Side") { newX = 0; newY = (canvasH - layerH) / 2; }
                                else if (val === "Horizontally Centered") { newX = (canvasW - layerW) / 2; }
                                else if (val === "Vertically Centered") { newY = (canvasH - layerH) / 2; }
                                else if (val === "Vert & Horz Centered") { newX = (canvasW - layerW) / 2; newY = (canvasH - layerH) / 2; }
                                else if (val === "Right Side") { newX = canvasW - layerW; newY = (canvasH - layerH) / 2; }
                                else if (val === "Bottom Left") { newX = 0; newY = canvasH - layerH; }
                                else if (val === "Bottom Center") { newX = (canvasW - layerW) / 2; newY = canvasH - layerH; }
                                else if (val === "Bottom Right") { newX = canvasW - layerW; newY = canvasH - layerH; }

                                updates.position = { x: newX, y: newY };
                                onChange(selectedLayer.id, updates);
                            }}
                        >
                            <option value="None">None</option>
                            <option value="Top Left">Top Left</option>
                            <option value="Top Center">Top Center</option>
                            <option value="Top Right">Top Right</option>
                            <option value="Left Side">Left Side</option>
                            <option value="Horizontally Centered">Horizontally Centered</option>
                            <option value="Vertically Centered">Vertically Centered</option>
                            <option value="Vert & Horz Centered">Vert & Horz Centered</option>
                            <option value="Right Side">Right Side</option>
                            <option value="Bottom Left">Bottom Left</option>
                            <option value="Bottom Center">Bottom Center</option>
                            <option value="Bottom Right">Bottom Right</option>
                        </select>
                    </div>

                    <div className="pt-4 mt-2 border-t border-gray-100 dark:border-gray-800 space-y-3">
                        {/* Position Section */}
                        <div>
                            <label className="text-xs font-semibold text-gray-900 dark:text-gray-100 mb-2 block">Position</label>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="relative">
                                    <Input
                                        label="X"
                                        type="number"
                                        value={String(Math.round(selectedLayer.position.x))}
                                        onChange={(e) => onChange(selectedLayer.id, { position: { ...selectedLayer.position, x: Number(e.target.value) } })}
                                    />
                                </div>
                                <div className="relative">
                                    <Input
                                        label="Y"
                                        type="number"
                                        value={String(Math.round(selectedLayer.position.y))}
                                        onChange={(e) => onChange(selectedLayer.id, { position: { ...selectedLayer.position, y: Number(e.target.value) } })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Size Section */}
                        <div>
                            <label className="text-xs font-semibold text-gray-900 dark:text-gray-100 mb-2 block">Size</label>
                            <div className="grid grid-cols-2 gap-2">
                                {/* Width */}
                                <div className="flex items-end gap-1">
                                    <div className="flex-1 relative">
                                        <Input
                                            label="Width"
                                            type="number"
                                            value={String(Math.round(selectedLayer.size.width))}
                                            onChange={(e) => onChange(selectedLayer.id, { size: { ...selectedLayer.size, width: Number(e.target.value) } })}
                                        />
                                    </div>
                                    <button
                                        className="h-9 px-1 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-xs font-medium w-8 hover:bg-gray-200 dark:hover:bg-gray-700 mb-[1px]"
                                        onClick={() => toggleUnit('width')}
                                    >
                                        {(selectedLayer as any).sizeUnits?.width?.toUpperCase() || 'PX'}
                                    </button>
                                </div>

                                {/* Height */}
                                <div className="flex items-end gap-1">
                                    <div className="flex-1 relative">
                                        <Input
                                            label="Height"
                                            type="number"
                                            value={String(Math.round(selectedLayer.size.height))}
                                            onChange={(e) => onChange(selectedLayer.id, { size: { ...selectedLayer.size, height: Number(e.target.value) } })}
                                        />
                                    </div>
                                    <button
                                        className="h-9 px-1 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-xs font-medium w-8 hover:bg-gray-200 dark:hover:bg-gray-700 mb-[1px]"
                                        onClick={() => toggleUnit('height')}
                                    >
                                        {(selectedLayer as any).sizeUnits?.height?.toUpperCase() || 'PX'}
                                    </button>
                                </div>
                            </div>
                        </div>
                        {/* Transform Section */}
                        <div>
                            <label className="text-xs font-semibold text-gray-900 dark:text-gray-100 mb-2 block">Transform</label>
                            <div className="grid grid-cols-2 gap-2 items-end">
                                <Input
                                    label="Rotate (°)"
                                    type="number"
                                    value={String(selectedLayer.rotation || 0)}
                                    onChange={(e) => onChange(selectedLayer.id, { rotation: Number(e.target.value) })}
                                />
                                <div className="flex gap-1 h-9 mb-[1px]">
                                    <Button
                                        kind="secondary"
                                        className="flex-1 px-0 h-full"
                                        onClick={() => onChange(selectedLayer.id, { scaleX: (selectedLayer.scaleX || 1) * -1 })}
                                        title="Flip Horizontal"
                                    >
                                        <span style={{ transform: 'scaleX(-1)', display: 'inline-block' }}>◢|</span>
                                    </Button>
                                    <Button
                                        kind="secondary"
                                        className="flex-1 px-0 h-full"
                                        onClick={() => onChange(selectedLayer.id, { scaleY: (selectedLayer.scaleY || 1) * -1 })}
                                        title="Flip Vertical"
                                    >
                                        <span style={{ transform: 'scaleY(-1)', display: 'inline-block' }}>◢</span>
                                        <span className="text-xs absolute" style={{ fontSize: '8px', top: '2px' }}>_</span>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </AccordionItem >

                {/* Main Settings */}
                < AccordionItem title="Settings" defaultOpen={true} >
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-bold capitalize">{selectedLayer.type} Layer</span>
                            <div className="flex gap-2">
                                <Button kind="secondary" onClick={() => onDuplicate(selectedLayer.id)} className="text-xs px-2 py-1 h-auto flex items-center gap-1">
                                    <span className="text-sm">❐</span> Duplicate
                                </Button>
                                <Button kind="danger" onClick={() => onDelete(selectedLayer.id)} className="text-xs px-2 py-1 h-auto flex items-center gap-1">
                                    <Trash2 className="w-3 h-3" /> Delete
                                </Button>
                            </div>
                        </div>

                        {/* Content */}
                        {selectedLayer.type === "text" || selectedLayer.type === "button" ? (
                            <DebouncedInput
                                label="Text Content"
                                value={selectedLayer.content}
                                onChange={(e) => onChange(selectedLayer.id, { content: e.target.value })}
                            />
                        ) : null}

                        {selectedLayer.type === "image" ? (
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Image URL</label>
                                <DebouncedInput
                                    value={selectedLayer.content}
                                    onChange={(e) => onChange(selectedLayer.id, { content: e.target.value })}
                                />
                            </div>
                        ) : null}

                        {selectedLayer.type === "video" ? (
                            <Input
                                label="Video Embed URL"
                                value={selectedLayer.content}
                                onChange={(e) => onChange(selectedLayer.id, { content: e.target.value })}
                            />
                        ) : null}



                        {selectedLayer.type === "timer" ? (
                            <div className="flex flex-col gap-4">
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-semibold">End Date (ISO)</label>
                                    <input
                                        type="datetime-local"
                                        className="border p-1 rounded text-sm w-full"
                                        value={selectedLayer.content ? new Date(selectedLayer.content).toISOString().slice(0, 16) : ""}
                                        onChange={(e) => onChange(selectedLayer.id, { content: new Date(e.target.value).toISOString() })}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-semibold">Show up to:</label>
                                    <select
                                        className="w-full text-sm border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800"
                                        value={selectedLayer.metadata?.timerDisplay || "Days"}
                                        onChange={(e) => onChange(selectedLayer.id, {
                                            metadata: { ...selectedLayer.metadata, timerDisplay: e.target.value }
                                        })}
                                    >
                                        <option value="Days">Days</option>
                                        <option value="Hours">Hours</option>
                                        <option value="Minutes">Minutes</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <Input
                                        label="Box Color"
                                        type="color"
                                        className="h-10 p-1"
                                        value={selectedLayer.metadata?.boxColor || "#ffffff"}
                                        onChange={(e) => onChange(selectedLayer.id, {
                                            metadata: { ...selectedLayer.metadata, boxColor: e.target.value }
                                        })}
                                    />
                                    <Input
                                        label="Label Color"
                                        type="color"
                                        className="h-10 p-1"
                                        value={selectedLayer.metadata?.labelColor || "#ffffff"}
                                        onChange={(e) => onChange(selectedLayer.id, {
                                            metadata: { ...selectedLayer.metadata, labelColor: e.target.value }
                                        })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <Input
                                        label="Padding (px)"
                                        type="number"
                                        value={selectedLayer.metadata?.padding || "8"}
                                        onChange={(e) => onChange(selectedLayer.id, {
                                            metadata: { ...selectedLayer.metadata, padding: parseInt(e.target.value) }
                                        })}
                                    />
                                    <Input
                                        label="Min Width (px)"
                                        type="number"
                                        value={selectedLayer.metadata?.minWidth || "48"}
                                        onChange={(e) => onChange(selectedLayer.id, {
                                            metadata: { ...selectedLayer.metadata, minWidth: parseInt(e.target.value) }
                                        })}
                                    />
                                    <Input
                                        label="Radius (px)"
                                        type="number"
                                        value={selectedLayer.metadata?.borderRadius || "6"}
                                        onChange={(e) => onChange(selectedLayer.id, {
                                            metadata: { ...selectedLayer.metadata, borderRadius: parseInt(e.target.value) }
                                        })}
                                    />
                                    <Input
                                        label="Gap (px)"
                                        type="number"
                                        value={selectedLayer.metadata?.gap || "16"}
                                        onChange={(e) => onChange(selectedLayer.id, {
                                            metadata: { ...selectedLayer.metadata, gap: parseInt(e.target.value) }
                                        })}
                                    />
                                </div>
                            </div>
                        ) : null}

                        {selectedLayer.type === "input" || selectedLayer.type === "email_form" || selectedLayer.type === "sms_signup" || selectedLayer.type === "coupon_box" ? (
                            <Input
                                label="Placeholder / Text"
                                value={selectedLayer.content}
                                onChange={(e) => onChange(selectedLayer.id, { content: e.target.value })}
                            />
                        ) : null}

                        {/* Text Styles */}
                        {(selectedLayer.type === "text" || selectedLayer.type === "button" || selectedLayer.type === "timer") && (
                            <>
                                <div className="grid grid-cols-2 gap-3 mt-4">
                                    <Input
                                        label="Color"
                                        type="color"
                                        className="h-10 p-1"
                                        value={String(selectedLayer.style.color)}
                                        onChange={(e) => updateStyle({ color: e.target.value })}
                                    />
                                    <Input
                                        label="Font Size"
                                        value={String(selectedLayer.style.fontSize)}
                                        onChange={(e) => updateStyle({ fontSize: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3 mt-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Font Weight</label>
                                        <select
                                            className="w-full text-sm border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 h-9 px-2"
                                            value={String(selectedLayer.style.fontWeight || "normal")}
                                            onChange={(e) => updateStyle({ fontWeight: e.target.value })}
                                        >
                                            <option value="normal">Normal</option>
                                            <option value="bold">Bold</option>
                                            <option value="100">100 (Thin)</option>
                                            <option value="200">200 (Extra Light)</option>
                                            <option value="300">300 (Light)</option>
                                            <option value="400">400 (Regular)</option>
                                            <option value="500">500 (Medium)</option>
                                            <option value="600">600 (Semi Bold)</option>
                                            <option value="700">700 (Bold)</option>
                                            <option value="800">800 (Extra Bold)</option>
                                            <option value="900">900 (Black)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Align</label>
                                        <select
                                            className="w-full text-sm border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 h-9 px-2"
                                            value={String(selectedLayer.style.textAlign || "left")}
                                            onChange={(e) => updateStyle({ textAlign: e.target.value as any })}
                                        >
                                            <option value="left">Left</option>
                                            <option value="center">Center</option>
                                            <option value="right">Right</option>
                                            <option value="justify">Justify</option>
                                        </select>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Box Styles */}
                        <div className="grid grid-cols-2 gap-3 mt-4">
                            <Input
                                label="Bg Color"
                                type="color"
                                className="h-10 p-1"
                                value={String(selectedLayer.style.backgroundColor || "#00000000")}
                                onChange={(e) => updateStyle({ backgroundColor: e.target.value })}
                            />
                            <Input
                                label="Border Radius"
                                value={String(selectedLayer.style.borderRadius || "0px")}
                                onChange={(e) => updateStyle({ borderRadius: e.target.value })}
                            />
                            <div className="space-y-1 col-span-2">
                                <div className="flex justify-between">
                                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Opacity</label>
                                    <span className="text-xs text-gray-500">{Math.round(Number(selectedLayer.style.opacity ?? 1) * 100)}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                                    value={Number(selectedLayer.style.opacity ?? 1) * 100}
                                    onChange={(e) => updateStyle({ opacity: Number(e.target.value) / 100 })}
                                />
                            </div>
                        </div>
                    </div>
                </AccordionItem >

                {/* Border Options */}
                <AccordionItem title="Border Options">
                    {/* Border Width */}
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Border Width</label>
                            <select
                                className="w-full text-sm border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 focus:ring-blue-500 focus:border-blue-500 h-9 px-2"
                                value={parseInt(String(selectedLayer.style.borderWidth || 0))}
                                onChange={(e) => updateStyle({ borderWidth: Number(e.target.value) })}
                            >
                                <option value={0}>None</option>
                                {[...Array(100)].map((_, i) => (
                                    <option key={i + 1} value={i + 1}>{i + 1}px</option>
                                ))}
                            </select>
                        </div>

                        {/* Border Color */}
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Border Color</label>
                            <div className="flex gap-2">
                                <input
                                    type="color"
                                    className="w-10 h-8 p-0 rounded cursor-pointer border border-gray-300 dark:border-gray-700"
                                    value={String(selectedLayer.style.borderColor || "#000000")}
                                    onChange={(e) => updateStyle({ borderColor: e.target.value })}
                                />
                                <Input
                                    value={String(selectedLayer.style.borderColor || "transparent")}
                                    onChange={(e) => updateStyle({ borderColor: e.target.value })}
                                    className="h-8 text-xs flex-1"
                                />
                            </div>
                        </div>

                        {/* Border Style */}
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Border Style</label>
                            <select
                                className="w-full text-sm border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 focus:ring-blue-500 focus:border-blue-500 h-9 px-2"
                                value={String(selectedLayer.style.borderStyle || "solid")}
                                onChange={(e) => updateStyle({ borderStyle: e.target.value })}
                            >
                                <option value="solid">Solid</option>
                                <option value="dashed">Dashed</option>
                                <option value="dotted">Dotted</option>
                                <option value="double">Double</option>
                                <option value="groove">Groove</option>
                                <option value="ridge">Ridge</option>
                                <option value="inset">Inset</option>
                                <option value="outset">Outset</option>
                            </select>
                        </div>

                        {/* Rounded Corners */}
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Rounded Corners</label>
                            <select
                                className="w-full text-sm border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 focus:ring-blue-500 focus:border-blue-500 h-9 px-2"
                                value={parseInt(String(selectedLayer.style.borderRadius || 0))}
                                onChange={(e) => updateStyle({ borderRadius: Number(e.target.value) })}
                            >
                                <option value={0}>None</option>
                                {[...Array(100)].map((_, i) => (
                                    <option key={i + 1} value={i + 1}>{i + 1}px</option>
                                ))}
                            </select>
                        </div>

                        {/* Border Shadow */}
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Border Shadow</label>
                            <select
                                className="w-full text-sm border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 focus:ring-blue-500 focus:border-blue-500 h-9 px-2"
                                value={String(selectedLayer.style.boxShadow || "none")}
                                onChange={(e) => updateStyle({ boxShadow: e.target.value })}
                            >
                                <option value="none">None</option>
                                <option value="0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)">Small Shadow</option>
                                <option value="0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)">Medium Shadow</option>
                                <option value="0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)">Large Shadow</option>
                                <option value="0 25px 50px -12px rgba(0, 0, 0, 0.25)">Extra Large Shadow</option>
                            </select>
                        </div>

                        {/* Border Padding */}
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Border Padding</label>
                            <select
                                className="w-full text-sm border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 focus:ring-blue-500 focus:border-blue-500 h-9 px-2"
                                value={parseInt(String(selectedLayer.style.padding || 0))}
                                onChange={(e) => updateStyle({ padding: Number(e.target.value) })}
                            >
                                <option value={0}>None</option>
                                {[...Array(100)].map((_, i) => (
                                    <option key={i + 1} value={i + 1}>{i + 1}px</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </AccordionItem>
            </Accordion>
        </Card >
    );
}
