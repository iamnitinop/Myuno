"use client";

import React from "react";
import { TargetingRules, Banner, RuleCondition } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { TargetingSimulator } from "./TargetingSimulator";

interface TargetingProps {
    banner: Banner;
    rules: TargetingRules;
    onChange: (rules: TargetingRules) => void;
}

export function TargetingBuilder({ banner, rules, onChange }: TargetingProps) {
    const r = rules;

    const setCond = (idx: number, patch: Partial<RuleCondition>) => {
        const next = {
            ...r,
            conditions: r.conditions.map((c, i) => (i === idx ? { ...c, ...patch } : c)),
        };
        onChange(next);
    };

    const newConditionForType = (type: string): RuleCondition => {
        if (type === "current_url") return { type, op: "does_not_contain", value: "checkout" };
        if (type === "referring_url") return { type, op: "does_not_contain", value: "facebook.com" };
        if (type === "previous_domain_referring_url") return { type, op: "does_not_contain", value: "google.com" };
        if (type === "first_url_session") return { type, op: "does_not_contain", value: "checkout" };
        if (type === "first_url_all_time") return { type, op: "does_not_contain", value: "checkout" };
        if (type === "device") return { type, op: "equals", value: "desktop" };
        return { type: "frequency", op: "once_per_session" };
    };

    const addCond = (type: string) => {
        onChange({ ...r, conditions: [...r.conditions, newConditionForType(type)] });
    };

    const removeCond = (idx: number) => {
        onChange({ ...r, conditions: r.conditions.filter((_, i) => i !== idx) });
    };

    const urlOps = [
        { value: "contains", label: "contains" },
        { value: "does_not_contain", label: "does not contain" },
        { value: "equals", label: "equals" },
        { value: "starts_with", label: "starts with" },
    ];

    const titleMap: Record<string, string> = {
        current_url: "Current URL",
        referring_url: "Referring URL",
        previous_domain_referring_url: "Previous Domain Referring URL",
        first_url_session: "First URL visitor came to this session",
        first_url_all_time: "First URL visitor came to all time",
        device: "Device",
        frequency: "Frequency",
    };

    return (
        <div className="grid gap-6 lg:grid-cols-2">
            <Card
                title="Targeting Rules"
                right={
                    <div className="flex items-center gap-2">
                        <div className="w-32">
                            <Select
                                value={r.enabled ? "on" : "off"}
                                onChange={(e) => onChange({ ...r, enabled: e.target.value === "on" })}
                                options={[
                                    { value: "on", label: "Enabled" },
                                    { value: "off", label: "Disabled" },
                                ]}
                            />
                        </div>
                    </div>
                }
            >
                <div className="space-y-4">
                    {r.conditions.map((c, idx) => {
                        const type = c.type === "url" ? "current_url" : c.type;
                        const isUrlLike =
                            type === "current_url" ||
                            type === "referring_url" ||
                            type === "previous_domain_referring_url" ||
                            type === "first_url_session" ||
                            type === "first_url_all_time";

                        return (
                            <div key={idx} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-4 transition-all hover:bg-white dark:hover:bg-gray-900 hover:shadow-sm">
                                <div className="mb-3 flex items-center justify-between">
                                    <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        {titleMap[type] || type} <span className="text-gray-400 font-normal ml-1">#{idx + 1}</span>
                                    </div>
                                    <Button kind="danger" onClick={() => removeCond(idx)} className="text-xs px-2 py-1 h-auto">
                                        Remove
                                    </Button>
                                </div>

                                <div className="grid gap-3">
                                    <Select
                                        label="Rule Type"
                                        value={type}
                                        onChange={(e) => setCond(idx, newConditionForType(e.target.value))}
                                        options={[
                                            { value: "current_url", label: "Current URL" },
                                            { value: "referring_url", label: "Referring URL" },
                                            { value: "previous_domain_referring_url", label: "Previous Domain Referring URL" },
                                            { value: "first_url_session", label: "First URL visitor came to this session" },
                                            { value: "first_url_all_time", label: "First URL visitor came to all time" },
                                            { value: "device", label: "Device" },
                                            { value: "frequency", label: "Frequency" },
                                        ]}
                                    />

                                    {isUrlLike && (
                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                            <Select
                                                label="Operator"
                                                value={c.op}
                                                onChange={(e) => setCond(idx, { op: e.target.value })}
                                                options={urlOps}
                                            />
                                            <Input
                                                label={type === "previous_domain_referring_url" ? "Domain (host)" : "Value"}
                                                value={c.value}
                                                onChange={(e) => setCond(idx, { value: e.target.value })}
                                                placeholder={type === "previous_domain_referring_url" ? "google.com" : "checkout"}
                                            />
                                        </div>
                                    )}

                                    {type === "device" && (
                                        <Select
                                            label="Device"
                                            value={c.value}
                                            onChange={(e) => setCond(idx, { value: e.target.value })}
                                            options={[
                                                { value: "desktop", label: "Desktop" },
                                                { value: "mobile", label: "Mobile" },
                                            ]}
                                        />
                                    )}

                                    {type === "frequency" && (
                                        <Select
                                            label="Frequency"
                                            value={c.op}
                                            onChange={(e) => setCond(idx, { op: e.target.value })}
                                            options={[
                                                { value: "once_per_session", label: "Once per session" },
                                                { value: "once_per_day", label: "Once per day" },
                                            ]}
                                        />
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-800">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Add Condition</div>
                    <div className="flex flex-wrap gap-2">
                        <Button kind="secondary" onClick={() => addCond("current_url")}>+ Current URL</Button>
                        <Button kind="secondary" onClick={() => addCond("referring_url")}>+ Referring URL</Button>
                        <Button kind="secondary" onClick={() => addCond("device")}>+ Device</Button>
                        <Button kind="secondary" onClick={() => addCond("frequency")}>+ Frequency</Button>
                        <Button kind="secondary" onClick={() => addCond("first_url_session")}>+ First URL (session)</Button>
                    </div>
                </div>
            </Card>

            <Card title="Rule Simulator">
                <TargetingSimulator banner={banner} rules={rules as any} />
            </Card>
        </div>
    );
}
