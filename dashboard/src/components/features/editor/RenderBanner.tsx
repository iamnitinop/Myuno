import React from "react";
import { Banner } from "@/lib/types";
import {
    Bell,
    MessageSquare,
    Ticket,
    Dices,
    Eraser,
    Facebook,
    Box,
    CheckSquare
} from "lucide-react";
import { TimerLayer } from "./visual/TimerLayer";

interface RenderBannerProps {
    banner: Banner;
    device: "desktop" | "mobile";
    onClose?: () => void;
    onCta?: (url: string) => void;
}

export function RenderBanner({ banner, device, onClose, onCta }: RenderBannerProps) {
    const v = banner.views[device] || banner.views.desktop;

    const renderContent = (layer: any) => {
        switch (layer.type) {
            case "image":
                return (
                    <div className="w-full h-full relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={layer.content}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const fallback = e.currentTarget.nextElementSibling;
                                if (fallback) fallback.classList.remove('hidden');
                            }}
                        />
                        <div className="hidden w-full h-full flex flex-col items-center justify-center bg-gray-100 text-gray-400 p-2 text-center pointer-events-none border border-dashed border-gray-300">
                            <span className="text-[10px]">Broken Image</span>
                        </div>
                    </div>
                );

            case "video":
                return (
                    <iframe
                        src={layer.content}
                        className="w-full h-full border-none pointer-events-auto"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                );

            case "timer":
                return (
                    <TimerLayer targetDate={layer.content} style={layer.style} timerDisplay={layer.metadata?.timerDisplay} boxColor={layer.metadata?.boxColor} labelColor={layer.metadata?.labelColor} padding={layer.metadata?.padding} minWidth={layer.metadata?.minWidth} gap={layer.metadata?.gap} borderRadius={layer.metadata?.borderRadius} />
                );

            case "email_form":
            case "sms_signup":
                return (
                    <div className="flex h-full w-full gap-2">
                        <input
                            type="text"
                            placeholder={layer.content}
                            className="flex-1 px-2 border border-gray-300 rounded text-sm text-black"
                        />
                        <button className="bg-blue-600 text-white px-3 text-sm rounded">Submit</button>
                    </div>
                );

            case "consent_checkbox":
                return (
                    <div className="flex items-center gap-2 h-full text-sm">
                        <CheckSquare className="w-4 h-4" />
                        <span>{layer.content}</span>
                    </div>
                );

            case "coupon_box":
                return (
                    <div className="border-2 border-dashed border-gray-400 h-full flex items-center justify-center bg-white text-black font-mono font-bold text-xl">
                        {layer.content}
                        <Ticket className="w-5 h-5 ml-2" />
                    </div>
                );

            case "spin_to_win":
                return (
                    <div className="w-full h-full rounded-full border-4 border-yellow-400 bg-orange-500 flex items-center justify-center text-white relative overflow-hidden">
                        <Dices className="w-12 h-12 animate-bounce" />
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-white/20"></div>
                    </div>
                );

            case "slot_machine":
                return (
                    <div className="w-full h-full bg-gray-800 border-4 border-yellow-600 rounded flex items-center justify-around p-2 text-white text-3xl font-mono">
                        <div className="bg-white text-black rounded px-2">7</div>
                        <div className="bg-white text-black rounded px-2">🍒</div>
                        <div className="bg-white text-black rounded px-2">🍋</div>
                    </div>
                );

            case "scratch_off":
                return (
                    <div className="w-full h-full bg-gray-300 flex items-center justify-center text-gray-500 cursor-cell relative">
                        <Eraser className="w-8 h-8 opacity-50" />
                        <span className="sr-only">Scratch Here</span>
                    </div>
                );

            case "text_ticker":
                return (
                    <div className="w-full h-full flex items-center overflow-hidden whitespace-nowrap bg-black text-white">
                        <span className="animate-marquee px-4">{layer.content}   •   {layer.content}</span>
                    </div>
                );

            case "fb_messenger":
                return <Facebook className="w-full h-full text-blue-600" />;

            case "close_button":
                return (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200 rounded-full hover:bg-gray-300">
                        <span className="font-bold text-gray-600">X</span>
                    </div>
                );

            default:
                return layer.content;
        }
    };

    return (
        <div
            className="relative overflow-hidden shadow-lg mx-auto"
            style={{
                width: v.width || "100%",
                maxWidth: "100%",
                height: v.height,
                background: v.background,
            }}
        >
            {v.layers.filter(l => l.visible !== false).map((layer) => (
                <div
                    key={layer.id}
                    style={{
                        position: "absolute",
                        left: layer.position.x,
                        top: layer.position.y,
                        width: layer.size.width,
                        height: layer.size.height,
                        ...layer.style,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: layer.type === "button" || layer.type === "close_button" ? "pointer" : "default",
                    }}
                    onClick={() => {
                        if (layer.type === "close_button") onClose?.();
                        // TODO: Add ctaUrl to button layer model to support onCta
                    }}
                >
                    {renderContent(layer)}
                </div>
            ))}
        </div>
    );
}
