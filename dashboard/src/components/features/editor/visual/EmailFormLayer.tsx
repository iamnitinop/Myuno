"use client";

import { Layer } from "@/lib/types";
import { useState } from "react";

interface EmailFormLayerProps {
    layer: Layer;
    selected: boolean;
    onSelect: () => void;
    bannerId?: string;
}

export function EmailFormLayer({ layer, selected, onSelect, bannerId }: EmailFormLayerProps) {
    const [email, setEmail] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        if (!email || !email.includes("@")) {
            setError("Please enter a valid email address");
            return;
        }

        setSubmitting(true);
        setError("");

        try {
            console.log("Submitting email:", email);
            const response = await fetch("http://localhost:3001/email-capture", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email,
                    campaignId: bannerId || "unknown",
                    source: "email_capture_template",
                }),
            });

            console.log("Response status:", response.status);

            if (!response.ok) {
                throw new Error("Failed to capture email");
            }

            const data = await response.json();
            console.log("Email captured successfully:", data);

            setSubmitted(true);
            setEmail("");

            // Reset after 3 seconds
            setTimeout(() => {
                setSubmitted(false);
            }, 3000);
        } catch (err) {
            setError("Failed to submit. Please try again.");
            console.error("Email capture error:", err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleSubmit();
        }
    };

    const placeholder = layer.metadata?.placeholder || "Enter your email";

    const style = {
        position: "absolute" as const,
        left: layer.position.x,
        top: layer.position.y,
        width: layer.size.width,
        height: layer.size.height,
        ...layer.style,
        outline: selected ? "2px solid #3b82f6" : "none",
        cursor: "text",
        zIndex: 10,
    };

    if (submitted) {
        return (
            <div
                onClick={onSelect}
                style={{
                    ...style,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#10b981",
                    color: "#ffffff",
                    border: "none",
                    fontSize: "14px",
                    fontWeight: "500",
                }}
            >
                ✓ Thanks for subscribing!
            </div>
        );
    }

    return (
        <form
            onSubmit={handleSubmit}
            style={{
                width: "100%",
                height: "100%",
                margin: 0,
                padding: 0,
            }}
        >
            <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                onClick={(e) => {
                    e.stopPropagation();
                    onSelect();
                }}
                placeholder={placeholder}
                disabled={submitting}
                style={{
                    width: "100%",
                    height: "100%",
                    ...layer.style,
                    outline: selected ? "2px solid #3b82f6" : "none",
                    boxSizing: "border-box",
                }}
            />
            {/* Hidden submit button for Enter key */}
            <button type="submit" style={{ display: "none" }} />
            {error && (
                <div
                    style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        marginTop: "5px",
                        fontSize: "12px",
                        color: "#ef4444",
                        backgroundColor: "white",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                        whiteSpace: "nowrap",
                        zIndex: 100,
                    }}
                >
                    {error}
                </div>
            )}
        </form>
    );
}
