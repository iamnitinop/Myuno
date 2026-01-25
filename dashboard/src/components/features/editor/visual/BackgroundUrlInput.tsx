import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/Input";

export function BackgroundUrlInput({ value, onChange }: { value: string, onChange: (val: string) => void }) {
    const [localValue, setLocalValue] = useState(value?.startsWith("blob:") ? "" : value || "");

    useEffect(() => {
        setLocalValue(value?.startsWith("blob:") ? "" : value || "");
    }, [value]);

    return (
        <div className="flex gap-2">
            <div className="flex-1">
                <Input
                    value={localValue}
                    placeholder="https://"
                    onChange={(e) => setLocalValue(e.target.value)}
                    onBlur={() => onChange(localValue)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            onChange(localValue);
                            (e.target as HTMLInputElement).blur();
                        }
                    }}
                />
            </div>
            <button
                onClick={() => onChange(localValue)}
                className="px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-xs font-medium rounded border border-gray-200 dark:border-gray-700"
            >
                Apply
            </button>
        </div>
    );
}
