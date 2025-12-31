"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import {
    Type,
    Image as ImageIcon,
    Flag,
    Mail,
    CheckSquare,
    ExternalLink,
    ArrowRightCircle,
    Bell,
    MessageSquare,
    Video,
    Ticket,
    XCircle,
    Sparkles,
    Dices,
    Clock,
    Accessibility,
    Eraser,
    ScrollText,
    Facebook,
    Box,
    LucideIcon
} from "lucide-react";

interface ToolboxProps {
    onAddLayer: (type: any) => void;
}

const LAYER_OPTIONS: { type: string; label: string; icon: LucideIcon; isNew?: boolean }[] = [
    { type: "text", label: "Text / Object", icon: Type },
    { type: "image", label: "Image", icon: ImageIcon },
    { type: "icon", label: "Icon", icon: Flag },
    { type: "email_form", label: "Email Form", icon: Mail },
    { type: "consent_checkbox", label: "Consent Checkbox", icon: CheckSquare },
    { type: "button", label: "CTA", icon: ExternalLink },
    //   { type: "intro_continue", label: "Intro Continue Button", icon: ArrowRightCircle }, // Mapping to button for now?
    { type: "push_notification", label: "Push Notification CTA", icon: Bell },
    { type: "sms_signup", label: "SMS Text Message", icon: MessageSquare },
    { type: "video", label: "Video", icon: Video },
    { type: "coupon_box", label: "Unique Coupon Box", icon: Ticket },
    { type: "close_button", label: "Close Button", icon: XCircle },
    { type: "commerce_ai", label: "Commerce AI", icon: Sparkles, isNew: true },
    { type: "spin_to_win", label: "Spin to Win", icon: Dices },
    { type: "timer", label: "Timer", icon: Clock },
    { type: "slot_machine", label: "Slot Machine", icon: Accessibility, isNew: true }, // Icon approx
    { type: "scratch_off", label: "Scratch Off", icon: Eraser, isNew: true },
    { type: "text_ticker", label: "Text Ticker", icon: ScrollText, isNew: true },
    { type: "fb_messenger", label: "FB Messenger", icon: Facebook },
    { type: "html", label: "Plugins", icon: Box },
];

export function Toolbox({ onAddLayer }: ToolboxProps) {
    return (
        <div className="flex flex-col space-y-1 p-2 max-h-[500px] overflow-y-auto">
            {LAYER_OPTIONS.map((opt) => (
                <button
                    key={opt.type}
                    onClick={() => onAddLayer(opt.type)}
                    className="w-full flex items-center gap-3 px-3 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700 text-left group"
                >
                    <opt.icon className="w-5 h-5 text-gray-500 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-gray-100" />
                    <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900 dark:text-gray-300 dark:group-hover:text-gray-100 flex-1">
                        {opt.label}
                    </span>
                    {opt.isNew && (
                        <span className="bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                            New
                        </span>
                    )}
                </button>
            ))}
        </div>
    );
}
