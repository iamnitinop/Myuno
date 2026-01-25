import React from "react";
import { Layer } from "@/lib/types";

interface BannerRendererProps {
    layers: Layer[];
    scale?: number;
}

const MiniLayer: React.FC<{ layer: Layer }> = ({ layer }) => {
    const style: React.CSSProperties = {
        position: "absolute",
        left: `${layer.position.x}px`,
        top: `${layer.position.y}px`,
        width: `${layer.size.width}px`,
        height: `${layer.size.height}px`,
        ...layer.style,
        pointerEvents: "none", // Interaction handled by parent or disabled
    };

    if (layer.type === "text") {
        return (
            <div style={{ ...style, lineHeight: 1.2, whiteSpace: "pre-wrap" }}>
                {layer.content}
            </div>
        );
    }

    if (layer.type === "button") {
        return (
            <button style={{ ...style, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {layer.content}
            </button>
        );
    }

    if (layer.type === "image") {
        return (
            <img
                src={layer.content}
                alt={layer.name}
                style={{ ...style, objectFit: "cover" }}
            />
        );
    }

    if (layer.type === "shape") {
        return <div style={style} />;
    }

    if (layer.type === "close_button") {
        return (
            <div style={{ ...style, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {layer.content}
            </div>
        );
    }

    if (layer.type === "email_form") {
        return (
            <input
                type="text"
                placeholder={layer.metadata?.placeholder || "Email"}
                disabled
                style={style}
            />
        );
    }

    return <div style={{ ...style, border: "1px dashed #ccc" }} />;
};

export const BannerRenderer: React.FC<BannerRendererProps> = ({ layers, scale = 1 }) => {
    return (
        <>
            {layers.map(layer => (
                <MiniLayer key={layer.id} layer={layer} />
            ))}
        </>
    );
};
