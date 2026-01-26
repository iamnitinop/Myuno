import { cn } from "@/lib/utils";
import React from "react";

interface PillProps {
    active?: boolean;
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
}

export function Pill({ active, children, onClick, className }: PillProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold transition",
                active
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700",
                className
            )}
        >
            {children}
        </button>
    );
}
