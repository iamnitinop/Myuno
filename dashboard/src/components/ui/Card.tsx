import { cn } from "@/lib/utils";
import React from "react";

interface CardProps {
    title?: string;
    children: React.ReactNode;
    right?: React.ReactNode;
    className?: string;
}

export function Card({ title, children, right, className }: CardProps) {
    return (
        <div className={cn("rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm", className)}>
            {(title || right) && (
                <div className="mb-4 flex items-center justify-between gap-3">
                    {title && <div className="text-base font-semibold">{title}</div>}
                    {right && <div>{right}</div>}
                </div>
            )}
            {children}
        </div>
    );
}
