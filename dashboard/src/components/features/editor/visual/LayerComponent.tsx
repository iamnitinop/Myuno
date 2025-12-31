"use client";

import React, { useRef, useEffect, useState } from "react";
import { Rnd } from "react-rnd";
import { Layer } from "@/lib/types";
import { TimerLayer } from "./TimerLayer";
import { Move } from "lucide-react";

export interface LayerComponentProps {
    layer: Layer;
    isSelected: boolean;
    onSelect: (id: string) => void;
    onChange: (id: string, patch: Partial<Layer>) => void;
    scale?: number;
    canvasSize: { width: number; height: number };
}

export function LayerComponent({
    layer,
    isSelected,
    onSelect,
    onChange,
    scale = 1,
    canvasSize,
}: LayerComponentProps) {
    const contentRef = useRef<HTMLDivElement>(null);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (!isSelected) {
            setIsEditing(false);
        }
    }, [isSelected]);

    const handleBlur = () => {
        if (contentRef.current) {
            onChange(layer.id, { content: contentRef.current.innerHTML });
        }
    };

    const isText = layer.type === "text" || layer.type === "button";

    // UNIT HANDLING
    const posUnits = (layer as any).positionUnits || { x: 'px', y: 'px' };
    const sizeUnits = (layer as any).sizeUnits || { width: 'px', height: 'px' };

    const xPx = posUnits.x === '%' ? (layer.position.x / 100) * canvasSize.width : layer.position.x;
    const yPx = posUnits.y === '%' ? (layer.position.y / 100) * canvasSize.height : layer.position.y;
    const wPx = sizeUnits.width === '%' ? (layer.size.width / 100) * canvasSize.width : layer.size.width;
    const hPx = sizeUnits.height === '%' ? (layer.size.height / 100) * canvasSize.height : layer.size.height;

    // TRANSFORM
    const transform = `rotate(${layer.rotation || 0}deg) scale(${layer.scaleX || 1}, ${layer.scaleY || 1})`;

    // RESIZE HANDLE STYLES
    const resizeHandleStyle: React.CSSProperties = {
        width: 10,
        height: 10,
        background: "white",
        border: "1px solid #3b82f6", // blue-500
        position: 'absolute',
        zIndex: 51,
        borderRadius: 0,
    };

    const handleClasses = {
        top: { top: -5, left: "50%", cursor: "n-resize" },
        right: { top: "50%", right: -5, cursor: "e-resize" },
        bottom: { bottom: -5, left: "50%", cursor: "s-resize" },
        left: { top: "50%", left: -5, cursor: "w-resize" },
        topRight: { top: -5, right: -5, cursor: "ne-resize" },
        bottomRight: { bottom: -5, right: -5, cursor: "se-resize" },
        bottomLeft: { bottom: -5, left: -5, cursor: "sw-resize" },
        topLeft: { top: -5, left: -5, cursor: "nw-resize" },
    };

    return (
        <Rnd
            size={{ width: wPx, height: hPx }}
            position={{ x: xPx, y: yPx }}
            onDragStop={(e, d) => {
                const newX = posUnits.x === '%' ? (d.x / canvasSize.width) * 100 : d.x;
                const newY = posUnits.y === '%' ? (d.y / canvasSize.height) * 100 : d.y;

                onChange(layer.id, {
                    position: {
                        x: Math.round(newX * 100) / 100,
                        y: Math.round(newY * 100) / 100
                    }
                });
            }}
            onResizeStop={(e, direction, ref, delta, position) => {
                const wRef = parseInt(ref.style.width);
                const hRef = parseInt(ref.style.height);

                const newW = sizeUnits.width === '%' ? (wRef / canvasSize.width) * 100 : wRef;
                const newH = sizeUnits.height === '%' ? (hRef / canvasSize.height) * 100 : hRef;

                // Position might also change during resize (Top/Left)
                const newX = posUnits.x === '%' ? (position.x / canvasSize.width) * 100 : position.x;
                const newY = posUnits.y === '%' ? (position.y / canvasSize.height) * 100 : position.y;

                onChange(layer.id, {
                    size: {
                        width: Math.round(newW * 100) / 100,
                        height: Math.round(newH * 100) / 100
                    },
                    position: {
                        x: Math.round(newX * 100) / 100,
                        y: Math.round(newY * 100) / 100
                    },
                });
            }}
            onMouseDown={(e) => {
                e.stopPropagation(); // prevent canvas click
                onSelect(layer.id);
            }}
            disableDragging={isEditing}
            scale={scale}
            bounds="parent"
            className={`${isSelected ? "ring-2 ring-blue-500 z-50" : "z-10 hover:ring-1 hover:ring-blue-300"}`}

            // CUSTOM RESIZE HANDLES
            enableResizing={isSelected}
            resizeHandleStyles={isSelected ? {
                top: { ...resizeHandleStyle, ...handleClasses.top, left: 'calc(50% - 5px)' },
                right: { ...resizeHandleStyle, ...handleClasses.right, top: 'calc(50% - 5px)' },
                bottom: { ...resizeHandleStyle, ...handleClasses.bottom, left: 'calc(50% - 5px)' },
                left: { ...resizeHandleStyle, ...handleClasses.left, top: 'calc(50% - 5px)' },
                topRight: { ...resizeHandleStyle, ...handleClasses.topRight },
                bottomRight: { ...resizeHandleStyle, ...handleClasses.bottomRight },
                bottomLeft: { ...resizeHandleStyle, ...handleClasses.bottomLeft },
                topLeft: { ...resizeHandleStyle, ...handleClasses.topLeft },
            } : {}}
        >
            <div
                style={{
                    ...layer.style,
                    width: "100%",
                    outline: "none",
                    fontFamily: layer.style.fontFamily,
                    fontSize: layer.style.fontSize,
                    fontWeight: layer.style.fontWeight,
                    fontStyle: layer.style.fontStyle,
                    textDecoration: layer.style.textDecoration,
                    textAlign: layer.style.textAlign as any,
                    color: layer.style.color,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: layer.style.textAlign === "center" || layer.style.display === "flex" ? "center" : undefined,
                    transform: transform, // APPLY TRANSFORM
                }}
                className={`w-full h-full relative group ${isText ? "cursor-text" : "cursor-default"}`}
                onDoubleClick={() => {
                    if (isText) {
                        setIsEditing(true);
                        setTimeout(() => contentRef.current?.focus(), 0);
                    }
                }}
            >
                {isText ? (
                    <div
                        ref={contentRef}
                        contentEditable={isEditing || isSelected}
                        suppressContentEditableWarning
                        onBlur={handleBlur}
                        onInput={(e) => { }}
                        style={{
                            width: "100%",
                            outline: "none",
                            fontFamily: layer.style.fontFamily,
                            fontSize: layer.style.fontSize,
                            fontWeight: layer.style.fontWeight,
                            fontStyle: layer.style.fontStyle,
                            textDecoration: layer.style.textDecoration,
                            textAlign: layer.style.textAlign as any,
                            color: layer.style.color,
                        }}
                        dangerouslySetInnerHTML={{ __html: layer.content }}
                    />
                ) : layer.type === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={layer.content} alt="" className="w-full h-full object-cover pointer-events-none" />
                ) : layer.type === "timer" ? (
                    <TimerLayer targetDate={layer.content} style={layer.style} timerDisplay={layer.metadata?.timerDisplay} boxColor={layer.metadata?.boxColor} labelColor={layer.metadata?.labelColor} padding={layer.metadata?.padding} minWidth={layer.metadata?.minWidth} gap={layer.metadata?.gap} borderRadius={layer.metadata?.borderRadius} />
                ) : (
                    <div className="flex items-center justify-center w-full h-full">
                        {layer.content}
                    </div>
                )}

                {/* DRAG HANDLE ICON (Bottom Right) */}
                {isSelected && (
                    <div
                        className="absolute -bottom-8 right-0 bg-white shadow p-1 rounded cursor-move text-gray-600 hover:text-blue-500 z-50 flex items-center justify-center"
                        style={{ width: 24, height: 24 }}
                    >
                        <Move size={14} />
                    </div>
                )}
            </div>
        </Rnd>
    );
}
