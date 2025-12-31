import { cn } from "@/lib/utils";
import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    kind?: "primary" | "secondary" | "danger" | "success";
}

export function Button({
    children,
    className,
    kind = "primary",
    disabled,
    ...props
}: ButtonProps) {
    const kindStyles = {
        primary: "bg-blue-600 text-white hover:bg-blue-500",
        secondary: "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700",
        danger: "bg-red-500 text-white hover:bg-red-400",
        success: "bg-emerald-600 text-white hover:bg-emerald-500",
    };

    return (
        <button
            disabled={disabled}
            className={cn(
                "rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition disabled:opacity-50",
                kindStyles[kind],
                className
            )}
            {...props}
        >
            {children}
        </button>
    );
}
