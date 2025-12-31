"use client";

import React, { useState } from "react";
import { Layer } from "@/lib/types";
import { Eye, EyeOff, Trash2, GripVertical, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface LayerListPanelProps {
    layers: Layer[];
    selectedLayerId: string | null;
    onSelect: (id: string) => void;
    onUpdate: (id: string, patch: Partial<Layer>) => void;
    onDelete: (id: string) => void;
    onReorder: (oldIndex: number, newIndex: number) => void;
}

function SortableLayerItem({
    layer,
    index,
    isSelected,
    onSelect,
    onUpdate,
    onDelete
}: {
    layer: Layer;
    index: number;
    isSelected: boolean;
    onSelect: (id: string) => void;
    onUpdate: (id: string, patch: Partial<Layer>) => void;
    onDelete: (id: string) => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: layer.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : "auto",
        position: isDragging ? "relative" as const : "static" as const,
    };

    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(layer.name);

    const handleSaveName = () => {
        if (editName.trim()) {
            onUpdate(layer.id, { name: editName });
        } else {
            setEditName(layer.name); // Revert if empty
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleSaveName();
        if (e.key === "Escape") {
            setEditName(layer.name);
            setIsEditing(false);
        }
    };

    // Determine row color
    // "Close Button" -> Pink
    // Alternating -> Green / White
    let bgClass = "";
    if (layer.type === "close_button") {
        bgClass = "bg-pink-50 hover:bg-pink-100 dark:bg-pink-900/10 dark:hover:bg-pink-900/20";
    } else if (index % 2 === 0) {
        bgClass = "bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800";
    } else {
        bgClass = "bg-emerald-50/50 dark:bg-emerald-900/10 hover:bg-emerald-100/50 dark:hover:bg-emerald-900/20";
    }

    if (isSelected) {
        bgClass = "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 hover:bg-blue-100/50";
    } else {
        bgClass = cn(bgClass, "border-l-4 border-transparent");
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "flex items-center gap-2 px-2 py-2 text-sm group transition-colors border-b border-gray-100 dark:border-gray-800",
                bgClass,
                isDragging ? "shadow-lg ring-2 ring-blue-500/20 opacity-90" : ""
            )}
            onClick={() => onSelect(layer.id)}
        >
            {/* Drag Handle */}
            <div
                {...attributes}
                {...listeners}
                className="cursor-grab text-gray-400 hover:text-gray-600 flex-shrink-0"
            >
                <GripVertical className="w-4 h-4" />
            </div>

            {/* Visibility Toggle */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onUpdate(layer.id, { visible: !layer.visible });
                }}
                className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                title={layer.visible ? "Hide Layer" : "Show Layer"}
            >
                {layer.visible ? <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" /> : <EyeOff className="w-4 h-4 text-gray-300" />}
            </button>

            {/* Name (Editable) */}
            <div className="flex-1 min-w-0" onDoubleClick={() => setIsEditing(true)}>
                {isEditing ? (
                    <input
                        autoFocus
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={handleSaveName}
                        onKeyDown={handleKeyDown}
                        className="w-full text-xs px-1 py-0.5 border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                        onClick={(e) => e.stopPropagation()}
                    />
                ) : (
                    <span className={cn(
                        "truncate block font-medium select-none text-xs",
                        layer.visible ? "text-gray-700 dark:text-gray-200" : "text-gray-400 italic"
                    )}>
                        {layer.name}
                    </span>
                )}
            </div>

            {/* Edit/Rename Icon (appears on hover) */}
            {!isEditing && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsEditing(true);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-500 transition-opacity flex-shrink-0"
                    title="Rename"
                >
                    <Pencil className="w-3 h-3" />
                </button>
            )}

            {/* Delete Button */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete(layer.id);
                }}
                className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                title="Delete Layer"
            >
                <Trash2 className="w-4 h-4" />
            </button>
        </div>
    );
}

export function LayerListPanel({
    layers,
    selectedLayerId,
    onSelect,
    onUpdate,
    onDelete,
    onReorder,
}: LayerListPanelProps) {
    const [filter, setFilter] = useState<"All" | "Intro" | "Pre" | "Post">("All");

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), // Requires 5px movement to start drag
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            const oldIndex = layers.findIndex((l) => l.id === active.id);
            const newIndex = layers.findIndex((l) => l.id === over?.id);
            if (oldIndex !== -1 && newIndex !== -1) {
                onReorder(oldIndex, newIndex);
            }
        }
    };

    // Reverse for visual order (Top layer on Top) or standard (Bottom layer at bottom of list)
    // The visual editor typically renders layers: index 0 is at the BACK, index N is at the FRONT.
    // In the list, we usually want Top-most layer (Front) at the TOP of the list?
    // If so, we need to iterate in REVERSE.
    // However, dnd-kit expects the id array to match the items order.
    // If we map reverse, we must handle indices carefully.
    // Let's assume: List Top = Layer Front (High Z-Index).
    // Layers array: 0 (Back) -> N (Front).
    // So we display `[...layers].reverse()`.

    // BUT drag and drop index mapping gets confusing if we reverse.
    // Strategy: We want the visual list to map 1:1 with the data if possible to avoid confusion, 
    // OR we explicitly handle index inversion.
    // 
    // Standard layers panel: Top of list = Top layer (Front).
    // Array: [Back, Middle, Front].
    // List: [Front, Middle, Back].
    // OldIndex (in List) -> Mapped to OldIndex (in Array).
    // 
    // Let's just keep strict order for now: Index 0 = Top of List.
    // If I render layers directly: Index 0 is displayed first. 
    // If Index 0 is "Back" layer, then Back layer is at top of accordion. 
    // Usually Layers Panels show Front layer at top.
    // 
    // Let's reverse the array for display.
    // Reversed Layers = `items`.
    // When dnd-kit says "moved from 0 to 1" (in Reversed List), it means moved from Front to Front-1.
    // We can just pass the reorder indices relative to the VISUAL list, and `onReorder` can handle the swap logic?
    // OR cleaner:
    // Just sort the data in the list such that visual order = data order for dndkit.
    // We let the parent handle the data.
    // If we want "Index 0 = Front", then `onReorder` in `VisualEditor` should handle that.
    // 
    // Current `VisualEditor` likely renders `layers.map` -> 0 is rendered first (Back).
    // So Canvas renders: 0 (Back) ... N (Front).
    // 
    // If I want List to show N (Front) at top.
    // I should pass `reversedLayers` to `SortableContext`?
    // 
    // To simplify integration: I will render the list in the same order as the array for now (Index 0 at top).
    // If the user wants "Top Layer at Top of List", effectively "Back layer" is at top of list. 
    // This is "reverse" of standard design tools (Ps/Figma show absolute top layer at list top).
    // 
    // But `VisualEditor` renders 0 first.
    // If I keep it simple: Index 0 = Top of List = Back Layer.
    // I'll stick to **Index 0 = Top of list** for simplicity to prevent DnD bugs.
    // If the user wants reverse display later, I can fix it.

    // Actually, looking at the user Screenshot 2: 
    // "Code Threshold" is at top.
    // "Image 48" is at bottom.
    // This implies typical list order. 
    // I'll just render `layers` as is.

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-900">
            {/* Filter Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                {["All", "Intro", "Pre", "Post"].map((tab) => (
                    <button
                        key={tab}
                        className={cn(
                            "flex-1 py-2 text-xs font-semibold text-center hover:bg-white dark:hover:bg-gray-700 transition-colors uppercase tracking-wide",
                            filter === tab
                                ? "text-blue-600 border-b-2 border-blue-600 bg-white dark:bg-gray-900"
                                : "text-gray-500 border-b-2 border-transparent"
                        )}
                        onClick={() => setFilter(tab as any)}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Layer List Header (Optional Legend?) No, screenshot doesn't have it. */}

            {/* Layer List */}
            <div className="flex-1 overflow-y-auto">
                {layers.length === 0 ? (
                    <div className="p-8 text-center flex flex-col items-center justify-center text-gray-400">
                        <span className="text-xs italic">No layers yet</span>
                        <span className="text-[10px] mt-1 opacity-70">Add layers from the toolbox</span>
                    </div>
                ) : (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={layers.map(l => l.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="flex flex-col">
                                {layers.map((layer, index) => (
                                    <SortableLayerItem
                                        key={layer.id}
                                        layer={layer}
                                        index={index}
                                        isSelected={selectedLayerId === layer.id}
                                        onSelect={onSelect}
                                        onUpdate={onUpdate}
                                        onDelete={onDelete}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                )}
            </div>
        </div>
    );
}
