"use client";

import React from "react";
import {
    Bold, Italic, Underline, Strikethrough,
    Superscript, Subscript, Eraser,
    AlignLeft, AlignCenter, AlignRight, AlignJustify,
    List, ListOrdered, Link as LinkIcon, Unlink,
    Palette, Type, FileCode
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface RichTextToolbarProps {
    style: React.CSSProperties;
    onStyleChange: (style: Partial<React.CSSProperties>) => void;
    onExecCommand: (command: string, value?: string) => void;
    position: { x: number; y: number };
    layerHeight: number;
}

export function RichTextToolbar({ style, onStyleChange, onExecCommand, position, layerHeight }: RichTextToolbarProps) {
    // Prevent toolbar clicks from deselecting the layer, EXCEPT for inputs
    const handleMouseDown = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.tagName === 'SELECT' || target.tagName === 'INPUT' || target.tagName === 'OPTION') {
            e.stopPropagation(); // Allow event, but stop propagation to canvas
            return;
        }
        e.preventDefault();
        e.stopPropagation();
    };

    const TOOLBAR_HEIGHT = 90;
    const GAP = 10;

    // Calculate top position: Position above. Can go negative (outside canvas)
    const top = position.y - TOOLBAR_HEIGHT - GAP;

    return (
        <div
            className="absolute z-[100] flex flex-col gap-1 w-[500px] bg-zinc-800 text-white rounded shadow-xl border border-zinc-700 p-1"
            style={{
                left: position.x,
                top: top,
            }}
            onMouseDown={handleMouseDown}
        >
            {/* Row 1: Formatting Buttons */}
            <div className="flex items-center gap-1 flex-wrap border-b border-zinc-700 pb-1 mb-1">
                <ToolbarBtn icon={<Bold size={14} />} onClick={() => onExecCommand("bold")} active={String(style.fontWeight) === "bold"} title="Bold" />
                <ToolbarBtn icon={<Italic size={14} />} onClick={() => onExecCommand("italic")} active={style.fontStyle === "italic"} title="Italic" />
                <ToolbarBtn icon={<Underline size={14} />} onClick={() => onExecCommand("underline")} active={String(style.textDecoration).includes("underline")} title="Underline" />
                <ToolbarBtn icon={<Strikethrough size={14} />} onClick={() => onExecCommand("strikeThrough")} active={String(style.textDecoration).includes("line-through")} title="Strikethrough" />

                <div className="w-px h-4 bg-zinc-600 mx-1" />

                <ToolbarBtn icon={<Subscript size={14} />} onClick={() => onExecCommand("subscript")} title="Subscript" />
                <ToolbarBtn icon={<Superscript size={14} />} onClick={() => onExecCommand("superscript")} title="Superscript" />
                <ToolbarBtn icon={<Eraser size={14} />} onClick={() => onExecCommand("removeFormat")} title="Remove Format" />

                <div className="w-px h-4 bg-zinc-600 mx-1" />

                <div className="flex gap-1">
                    <input
                        type="color"
                        value={String(style.color || "#000000")}
                        onChange={(e) => onStyleChange({ color: e.target.value })}
                        className="w-5 h-5 bg-transparent border-0 p-0 cursor-pointer"
                        title="Text Color"
                    />
                    <input
                        type="color"
                        value={String(style.backgroundColor || "#ffffff")}
                        onChange={(e) => onStyleChange({ backgroundColor: e.target.value })}
                        className="w-5 h-5 bg-transparent border-0 p-0 cursor-pointer"
                        title="Background Color"
                    />
                </div>

                <div className="w-px h-4 bg-zinc-600 mx-1" />

                <ToolbarBtn icon={<LinkIcon size={14} />} onClick={() => {
                    const url = prompt("Enter Link URL:");
                    if (url) onExecCommand("createLink", url);
                }} title="Link" />
                <ToolbarBtn icon={<Unlink size={14} />} onClick={() => onExecCommand("unlink")} title="Unlink" />

                <div className="flex-1" />
                <ToolbarBtn icon={<FileCode size={14} />} onClick={() => alert("Source editing not implemented yet")} title="Source" />
            </div>

            {/* Row 2: Fonts, Alignment, Lists */}
            <div className="flex items-center gap-1 flex-wrap">
                <select
                    className="h-6 bg-zinc-700 text-xs border border-zinc-600 rounded px-1 w-24 text-white focus:outline-none"
                    value={String(style.fontFamily || "Arial").replace(/['"]+/g, '')}
                    onChange={(e) => onStyleChange({ fontFamily: e.target.value })}
                >
                    <option value="Arial">Arial</option>
                    <option value="Helvetica">Helvetica</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Courier New">Courier New</option>
                    <option value="Verdana">Verdana</option>
                    <option value="Georgia">Georgia</option>
                </select>

                <select
                    className="h-6 bg-zinc-700 text-xs border border-zinc-600 rounded px-1 w-16 text-white focus:outline-none"
                    value={((val) => {
                        // Normalize value to have 'px' if number, or keep string
                        if (!val) return "16px";
                        const s = String(val);
                        return s.endsWith("px") ? s : s + "px";
                    })(style.fontSize)}
                    onChange={(e) => onStyleChange({ fontSize: e.target.value })}
                >
                    {[12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64, 72].map(s => (
                        <option key={s} value={`${s}px`}>{s}</option>
                    ))}
                </select>

                <div className="w-px h-4 bg-zinc-600 mx-1" />

                <ToolbarBtn icon={<AlignLeft size={14} />} onClick={() => onStyleChange({ textAlign: "left" })} active={style.textAlign === "left"} title="Align Left" />
                <ToolbarBtn icon={<AlignCenter size={14} />} onClick={() => onStyleChange({ textAlign: "center" })} active={style.textAlign === "center"} title="Align Center" />
                <ToolbarBtn icon={<AlignRight size={14} />} onClick={() => onStyleChange({ textAlign: "right" })} active={style.textAlign === "right"} title="Align Right" />
                <ToolbarBtn icon={<AlignJustify size={14} />} onClick={() => onStyleChange({ textAlign: "justify" })} active={style.textAlign === "justify"} title="Justify" />

                <div className="w-px h-4 bg-zinc-600 mx-1" />

                <ToolbarBtn icon={<ListOrdered size={14} />} onClick={() => onExecCommand("insertOrderedList")} title="Ordered List" />
                <ToolbarBtn icon={<List size={14} />} onClick={() => onExecCommand("insertUnorderedList")} title="Unordered List" />
            </div>
        </div>
    );
}

function ToolbarBtn({ icon, onClick, active, title }: { icon: React.ReactNode, onClick: () => void, active?: boolean, title?: string }) {
    return (
        <button
            className={`p-1 rounded hover:bg-zinc-600 transition-colors ${active ? "bg-zinc-600 text-blue-300" : "text-zinc-300"}`}
            onClick={onClick}
            title={title}
        >
            {icon}
        </button>
    );
}
