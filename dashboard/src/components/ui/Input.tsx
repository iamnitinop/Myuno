import { cn } from "@/lib/utils";
import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
}

export function Input({ label, className, ...props }: InputProps) {
    return (
        <label className="block w-full">
            {label && <div className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">{label}</div>}
            <input
                className={cn(
                    "w-full rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
                    className
                )}
                {...props}
            />
        </label>
    );
}
