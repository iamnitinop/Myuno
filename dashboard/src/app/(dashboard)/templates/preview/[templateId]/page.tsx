"use client";

import React, { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { templateLibrary } from "@/lib/templates";
import { BannerRenderer } from "@/components/features/preview/BannerRenderer";
import { AccountData, Banner, ViewConfig } from "@/lib/types";
import { defaultRules } from "@/lib/defaults";
import { Monitor, Smartphone, Tablet, X, Check, ArrowLeft } from "lucide-react";
import { Pill } from "@/components/ui/Pill";
import { apiFetch } from "@/lib/api";

export default function TemplatePreviewPage() {
    const params = useParams();
    const router = useRouter();
    const templateId = params.templateId as string;

    const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");

    const template = templateLibrary.find(t => t.id === templateId);

    // Generate fresh banner instance
    const banner = useMemo<Banner | null>(() => template ? template.generator() : null, [template]);

    if (!template || !banner) {
        return <div className="p-8 text-center">Template not found.</div>;
    }

    const currentView: ViewConfig = banner.views[device] || banner.views.desktop;

    const handleUseTemplate = () => {
        // Logic duplicated from TemplatesPage - ideally shared hook, but keeping simple for now
        const currentData: AccountData | null = LS.get(KEY_DATA(ACCOUNT_ID), null);
        const accountData: AccountData = currentData || {
            accountId: ACCOUNT_ID,
            banners: [],
            rules: [],
            abTests: [],
            events: []
        };

        if (!accountData.banners) accountData.banners = [];
        if (!accountData.rules) accountData.rules = [];
        if (!accountData.abTests) accountData.abTests = [];
        if (!accountData.events) accountData.events = [];

        accountData.banners.push(banner);
        accountData.rules.push(defaultRules(banner.id));
        LS.set(KEY_DATA(ACCOUNT_ID), accountData);

        // Force hard navigation to ensure fresh state read
        window.location.href = `/campaigns/${banner.id}`;
    };

    return (
        <div className="fixed inset-0 z-[200] bg-gray-900 flex flex-col h-screen w-screen overflow-hidden text-white">

            {/* Top Bar */}
            <div className="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6 shrink-0 relative z-50">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="text-gray-400 hover:text-white transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold text-white">{template.name}</h1>
                        <p className="text-xs text-gray-400">Template Preview</p>
                    </div>
                </div>

                {/* Device Toggles */}
                <div className="flex bg-gray-800 rounded p-1">
                    <Pill active={device === "desktop"} onClick={() => setDevice("desktop")} className={device === "desktop" ? "!bg-gray-600 !text-white" : "!text-gray-400 !bg-transparent"}>
                        <Monitor size={16} className="mr-2" /> Desktop
                    </Pill>
                    <Pill active={device === "tablet"} onClick={() => setDevice("tablet")} className={device === "tablet" ? "!bg-gray-600 !text-white" : "!text-gray-400 !bg-transparent"}>
                        <Tablet size={16} className="mr-2" /> Tablet
                    </Pill>
                    <Pill active={device === "mobile"} onClick={() => setDevice("mobile")} className={device === "mobile" ? "!bg-gray-600 !text-white" : "!text-gray-400 !bg-transparent"}>
                        <Smartphone size={16} className="mr-2" /> Mobile
                    </Pill>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleUseTemplate}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-md shadow-lg transition-transform transform hover:scale-105 flex items-center gap-2"
                    >
                        Use This Template
                    </button>
                    <button onClick={() => router.back()} className="text-gray-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>
            </div>

            {/* Preview Window */}
            <div className="flex-grow relative bg-gray-800 flex items-center justify-center overflow-auto p-8">

                {/* Simulated Monitor/Screen */}
                <div
                    className={`relative bg-white transition-all duration-300 shadow-2xl overflow-hidden ${device === 'mobile' ? 'w-[375px] h-[750px] rounded-3xl border-8 border-gray-900' :
                        device === 'tablet' ? 'w-[768px] h-[1024px] rounded-xl border-8 border-gray-900' :
                            'w-full max-w-[1400px] h-[800px] rounded-lg border border-gray-700'
                        }`}
                >
                    {/* Dummy Website Background */}
                    <div className="absolute inset-0 z-0 opacity-20 pointer-events-none"
                        style={{
                            backgroundImage: "url('https://cdn.dribbble.com/users/1615584/screenshots/15710288/media/fb6122d4f23e75e11f185799c5138241.jpg?compress=1&resize=1600x1200')", // Generic ecommerce placeholder
                            backgroundSize: 'cover',
                            backgroundPosition: 'top center',
                            filter: 'blur(2px) grayscale(50%)'
                        }}
                    />

                    {/* Green Sash Overlay (Justuno Style) */}
                    <div className="absolute top-[10%] left-0 right-0 z-[100] transform -rotate-2 pointer-events-none flex justify-center">
                        <div className="bg-green-500 text-white font-bold py-2 px-12 shadow-lg text-sm uppercase tracking-wider border-y-2 border-green-400 flex items-center gap-2 w-full justify-center">
                            <Check size={16} />
                            You are viewing a preview of this template
                            <span className="bg-white text-green-600 text-xs px-2 py-0.5 rounded ml-2">LIVE PREVIEW</span>
                        </div>
                    </div>

                    {/* Banner Render Area */}
                    <div className="absolute inset-0 z-10 pointer-events-none">
                        {/* 
                            We need to honor the fixedPosition if it exists, otherwise assume center or top 
                            depending on banner type.
                            Top bar = top: 0
                            Modal = center
                        */}
                        <div className={`absolute w-full h-full ${banner.type === 'top_bar' ? 'flex items-start justify-center' : 'flex items-center justify-center'
                            }`}>

                            {/* The Actual Banner */}
                            <div
                                style={{
                                    width: currentView.width || (device === 'mobile' ? 340 : device === 'tablet' ? 700 : 800), // Default widths if fallback fails
                                    height: currentView.height,
                                    backgroundColor: currentView.background,
                                    backgroundImage: currentView.backgroundImage,
                                    position: "relative",
                                    borderRadius: currentView.borderRadius,
                                    boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
                                    // If top bar, standard width is 100% usually, but for preview we constrain to container
                                    ...(banner.type === 'top_bar' ? { width: '100%' } : {})
                                }}
                            >
                                <BannerRenderer layers={currentView.layers} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
