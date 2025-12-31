"use client";

import React, { useState } from "react";
import { Banner } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Pill } from "@/components/ui/Pill";
import { RenderBanner } from "./RenderBanner";

interface EditorProps {
    banner: Banner;
    onChange: (banner: Banner) => void;
}

export function BannerEditor({ banner, onChange }: EditorProps) {
    const [view, setView] = useState<"desktop" | "mobile">("desktop");
    const v = banner.views[view];

    const updateView = (patch: any) => {
        onChange({
            ...banner,
            views: { ...banner.views, [view]: { ...banner.views[view], ...patch } },
        });
    };

    return (
        <div className="grid gap-6 lg:grid-cols-2">
            <Card
                title="Banner Editor"
                right={
                    <div className="flex items-center gap-2">
                        <Pill active={view === "desktop"} onClick={() => setView("desktop")}>Desktop</Pill>
                        <Pill active={view === "mobile"} onClick={() => setView("mobile")}>Mobile</Pill>
                    </div>
                }
            >
                <div className="grid gap-4">
                    <Select
                        label="Type"
                        value={banner.type}
                        onChange={(e) => onChange({ ...banner, type: e.target.value as any })}
                        options={[
                            { value: "top_bar", label: "Top bar" },
                            { value: "modal", label: "Modal" },
                        ]}
                    />

                    <Input label="Message" value={v.text} onChange={(e) => updateView({ text: e.target.value })} />

                    <div className="grid grid-cols-2 gap-4">
                        <Input label="CTA text" value={v.ctaText} onChange={(e) => updateView({ ctaText: e.target.value })} />
                        <Input label="CTA URL" value={v.ctaUrl} onChange={(e) => updateView({ ctaUrl: e.target.value })} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Background" value={v.background} onChange={(e) => updateView({ background: e.target.value })} />
                        <Input label="Text color" value={v.textColor} onChange={(e) => updateView({ textColor: e.target.value })} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input label="CTA bg" value={v.ctaBg} onChange={(e) => updateView({ ctaBg: e.target.value })} />
                        <Input
                            label="CTA text color"
                            value={v.ctaTextColor}
                            onChange={(e) => updateView({ ctaTextColor: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Height (px)"
                            value={String(v.height || "")}
                            onChange={(e) => updateView({ height: Math.max(40, Number(e.target.value || 0)) })}
                            placeholder="72"
                        />
                        <Select
                            label="Close button"
                            value={v.showClose ? "yes" : "no"}
                            onChange={(e) => updateView({ showClose: e.target.value === "yes" })}
                            options={[
                                { value: "yes", label: "Show" },
                                { value: "no", label: "Hide" },
                            ]}
                        />
                    </div>
                </div>
            </Card>

            <Card title="Live Preview">
                <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-black/20">
                    <div className="border-b border-gray-200 dark:border-gray-800 px-4 py-3 text-xs text-gray-500">
                        Preview viewport: {view === "desktop" ? "Desktop (>=768px)" : "Mobile (<768px)"}
                    </div>
                    <div className={view === "desktop" ? "" : "max-w-[420px] mx-auto border-x border-gray-200 dark:border-gray-800"}>
                        <RenderBanner
                            banner={banner}
                            device={view}
                            onClose={() => { }}
                            onCta={() => { }}
                        />
                        <div className="p-6 text-sm text-gray-400">
                            <div className="mb-2 font-semibold text-gray-300">Page content (mock)</div>
                            <div className="space-y-2">
                                <div className="h-3 w-5/6 rounded bg-gray-200 dark:bg-gray-800" />
                                <div className="h-3 w-4/6 rounded bg-gray-200 dark:bg-gray-800" />
                                <div className="h-3 w-3/6 rounded bg-gray-200 dark:bg-gray-800" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-4 rounded-xl bg-gray-50 dark:bg-gray-900 p-4 text-xs text-gray-500">
                    This editor saves JSON (banner definition). The real runtime renders this configuration.
                </div>
            </Card>
        </div>
    );
}
