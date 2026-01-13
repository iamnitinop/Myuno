"use client";

import React from "react";
import { Banner, AdvancedTargetingRules, AdvancedTargetingConfig, TriggerType } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button"; // We might need a simpler button or custom styling
import { Select } from "@/components/ui/Select"; // Or native select
import {
    MousePointerClick,
    Files,
    LogOut,
    ArrowDown
} from "lucide-react";

interface AdvancedTargetingProps {
    banner: Banner;
    rules: AdvancedTargetingRules;
    onChange: (rules: AdvancedTargetingRules) => void;
}

const defaultConfig: AdvancedTargetingConfig = {
    trigger: { type: 'specific_page' },
    pageRules: {
        showOn: { mode: 'any', urls: [{ op: 'contains', value: '' }] },
        dontShowOn: { urls: [{ op: 'contains', value: '' }] }
    },
    frequency: {
        onEveryPage: false,
        oncePerSession: true,
        onceEver: false,
        againEveryXDays: { enabled: false, days: 3 }
    },
    stopShowing: {
        never: false,
        afterClosedThisVisit: true,
        afterEngagementThis: true,
        afterEngagementAny: false,
        afterShownVisit: { enabled: true, times: 1 },
        afterShownEver: { enabled: true, times: 2 }
    },
    audience: {
        mode: 'all',
        returningSinceDays: 3
    },
    trafficSource: {
        showFrom: { all: true, email: false, facebook: false, googleOrganic: false, googleAdwords: false, others: false },
        dontShowFrom: { email: false, facebook: false, googleOrganic: false, googleAdwords: false, others: false }
    },
    delay: { enabled: false, seconds: 20 }
};

export function AdvancedTargetingBuilder({ banner, rules, onChange }: AdvancedTargetingProps) {
    // Initialize config if missing (e.g. fresh upgrade)
    const config = rules.config || defaultConfig;

    const updateConfig = (patch: Partial<AdvancedTargetingConfig>) => {
        onChange({ ...rules, config: { ...config, ...patch } });
    };

    // Helper components for segments
    const SectionHeader = ({ title, optional }: { title: string, optional?: boolean }) => (
        <div className="bg-indigo-600 text-white px-4 py-2 text-sm font-semibold rounded-t-lg flex justify-between items-center mt-6">
            <span>{title} {optional && <span className="opacity-70 font-normal text-xs ml-1">(optional)</span>}</span>
            <div className="w-4 h-1 bg-white/20 rounded-full"></div>
        </div>
    );

    const TriggerOption = ({ type, icon: Icon, label, desc, hasInput, inputValue, onInputChange }: any) => {
        const isSelected = config.trigger.type === type;
        return (
            <div
                className={`flex flex-col items-center p-6 border rounded-lg cursor-pointer transition-all ${isSelected ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/10' : 'border-gray-200 hover:border-indigo-300'}`}
                onClick={() => updateConfig({ trigger: { type, value: inputValue } })}
            >
                <div className={`p-3 rounded-full mb-3 ${isSelected ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}>
                    <Icon className="w-8 h-8" />
                </div>
                <div className="font-semibold text-gray-800 dark:text-gray-200 mb-1 text-center">{label}</div>
                {hasInput ? (
                    <div className="flex items-center gap-2 mb-2">
                        <input
                            type="number"
                            className="w-16 h-8 border rounded text-center text-sm"
                            value={inputValue || 0}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                                const val = Number(e.target.value);
                                onInputChange(val);
                                updateConfig({ trigger: { type, value: val } });
                            }}
                        />
                        <span className="text-xs text-gray-500">{hasInput}</span>
                    </div>
                ) : null}
                <div className="text-xs text-gray-400 text-center max-w-[150px]">{desc}</div>
            </div>
        );
    };

    return (
        <div className="space-y-6 pb-20">
            {/* 1. Choose When (Triggers) */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Choose When</h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <TriggerOption
                        type="specific_page"
                        icon={MousePointerClick}
                        label="On Specific Page"
                        desc="Shows on any entrance page or a specified URL"
                    />
                    <TriggerOption
                        type="after_pages"
                        icon={Files}
                        label="After Pages"
                        hasInput="pages"
                        inputValue={config.trigger.value || 3}
                        onInputChange={(val: number) => updateConfig({ trigger: { ...config.trigger, type: 'after_pages', value: val } })}
                        desc="Shows after visitor has been to the specified amount of pages"
                    />
                    <TriggerOption
                        type="exit_intent"
                        icon={LogOut}
                        label="When exiting"
                        desc="Shows when visitor intends to leave the site"
                    />
                    <TriggerOption
                        type="scroll_depth"
                        icon={ArrowDown}
                        label="Scrolled %"
                        hasInput="% of page"
                        inputValue={config.trigger.value || 30}
                        onInputChange={(val: number) => updateConfig({ trigger: { ...config.trigger, type: 'scroll_depth', value: val } })}
                        desc="Shows when visitor scrolls the specified amount down the page"
                    />
                </div>
            </div>

            {/* 2. Refine By Options */}
            <SectionHeader title="Refine By Options" optional />
            <div className="bg-white dark:bg-gray-900 border-x border-b border-gray-200 dark:border-gray-700 p-6 rounded-b-lg grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Left Column: Page Rules */}
                <div className="space-y-6">
                    <div>
                        <h4 className="font-bold text-lg mb-2 text-gray-800 dark:text-white">Show on specific page(s)</h4>
                        <div className="space-y-2">
                            <label className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    checked={config.pageRules.showOn.mode === 'any'}
                                    onChange={() => updateConfig({ pageRules: { ...config.pageRules, showOn: { ...config.pageRules.showOn, mode: 'any' } } })}
                                />
                                <span className="text-sm">Any page</span>
                            </label>
                            <label className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    checked={config.pageRules.showOn.mode === 'others'}
                                    onChange={() => updateConfig({ pageRules: { ...config.pageRules, showOn: { ...config.pageRules.showOn, mode: 'others' } } })}
                                />
                                <span className="text-sm">Others</span>
                            </label>

                            {config.pageRules.showOn.mode === 'others' && (
                                <div className="space-y-2 ml-6">
                                    {config.pageRules.showOn.urls.map((url, idx) => (
                                        <div key={idx} className="flex gap-2">
                                            <select
                                                className="border rounded px-2 py-1 text-sm bg-white dark:bg-gray-800"
                                                value={url.op}
                                                onChange={(e) => {
                                                    const newUrls = [...config.pageRules.showOn.urls];
                                                    newUrls[idx].op = e.target.value as any;
                                                    updateConfig({ pageRules: { ...config.pageRules, showOn: { ...config.pageRules.showOn, urls: newUrls } } });
                                                }}
                                            >
                                                <option value="contains">contains</option>
                                                <option value="equals">equals</option>
                                            </select>
                                            <input
                                                className="border rounded px-2 py-1 text-sm flex-1 bg-white dark:bg-gray-800"
                                                value={url.value}
                                                placeholder="www.website.com/cart"
                                                onChange={(e) => {
                                                    const newUrls = [...config.pageRules.showOn.urls];
                                                    newUrls[idx].value = e.target.value;
                                                    updateConfig({ pageRules: { ...config.pageRules, showOn: { ...config.pageRules.showOn, urls: newUrls } } });
                                                }}
                                            />
                                        </div>
                                    ))}
                                    <button
                                        className="text-xs text-blue-500 hover:underline"
                                        onClick={() => updateConfig({ pageRules: { ...config.pageRules, showOn: { ...config.pageRules.showOn, urls: [...config.pageRules.showOn.urls, { op: 'contains', value: '' }] } } })}
                                    >
                                        + Add Another
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <h4 className="font-bold text-lg mb-2 text-gray-800 dark:text-white">Don't show on page(s)</h4>
                        <div className="space-y-2 ml-6">
                            {config.pageRules.dontShowOn.urls.map((url, idx) => (
                                <div key={idx} className="flex gap-2">
                                    <select
                                        className="border rounded px-2 py-1 text-sm bg-white dark:bg-gray-800"
                                        value={url.op}
                                        onChange={(e) => {
                                            const newUrls = [...config.pageRules.dontShowOn.urls];
                                            newUrls[idx].op = e.target.value as any;
                                            updateConfig({ pageRules: { ...config.pageRules, dontShowOn: { ...config.pageRules.dontShowOn, urls: newUrls } } });
                                        }}
                                    >
                                        <option value="contains">contains</option>
                                        <option value="equals">equals</option>
                                    </select>
                                    <input
                                        className="border rounded px-2 py-1 text-sm flex-1 bg-white dark:bg-gray-800"
                                        value={url.value}
                                        placeholder="www.website.com/cart"
                                        onChange={(e) => {
                                            const newUrls = [...config.pageRules.dontShowOn.urls];
                                            newUrls[idx].value = e.target.value;
                                            updateConfig({ pageRules: { ...config.pageRules, dontShowOn: { ...config.pageRules.dontShowOn, urls: newUrls } } });
                                        }}
                                    />
                                </div>
                            ))}
                            <button
                                className="text-xs text-blue-500 hover:underline"
                                onClick={() => updateConfig({ pageRules: { ...config.pageRules, dontShowOn: { ...config.pageRules.dontShowOn, urls: [...config.pageRules.dontShowOn.urls, { op: 'contains', value: '' }] } } })}
                            >
                                + Add Another
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Column: Frequency & Stop Showing */}
                <div className="space-y-8">
                    <div>
                        <h4 className="font-bold text-lg mb-2 text-gray-800 dark:text-white">Show:</h4>
                        <div className="space-y-2">
                            {[
                                { label: 'On every page', key: 'onEveryPage' },
                                { label: 'Once per visitor session', key: 'oncePerSession' },
                                { label: 'Once Ever', key: 'onceEver' },
                            ].map((opt: any) => (
                                <label key={opt.key} className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={(config.frequency as any)[opt.key]}
                                        onChange={(e) => updateConfig({ frequency: { ...config.frequency, [opt.key]: e.target.checked } })}
                                    />
                                    <span className="text-sm">{opt.label}</span>
                                </label>
                            ))}
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={config.frequency.againEveryXDays.enabled}
                                    onChange={(e) => updateConfig({ frequency: { ...config.frequency, againEveryXDays: { ...config.frequency.againEveryXDays, enabled: e.target.checked } } })}
                                />
                                <span className="text-sm">And again every</span>
                                <input
                                    type="number"
                                    className="w-12 h-6 border rounded text-center text-sm p-0"
                                    value={config.frequency.againEveryXDays.days}
                                    onChange={(e) => updateConfig({ frequency: { ...config.frequency, againEveryXDays: { ...config.frequency.againEveryXDays, days: Number(e.target.value) } } })}
                                />
                                <span className="text-sm">Days</span>
                            </label>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-bold text-lg mb-2 text-gray-800 dark:text-white">Stop showing</h4>
                        <div className="space-y-2">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={config.stopShowing.never}
                                    onChange={(e) => updateConfig({ stopShowing: { ...config.stopShowing, never: e.target.checked } })}
                                />
                                <span className="text-sm">Never</span>
                            </label>
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={config.stopShowing.afterClosedThisVisit}
                                    onChange={(e) => updateConfig({ stopShowing: { ...config.stopShowing, afterClosedThisVisit: e.target.checked } })}
                                />
                                <span className="text-sm">If promotion has been closed THIS visit</span>
                            </label>
                            {/* Skipping complex logic for brevity, implementing key interactions */}
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={config.stopShowing.afterShownVisit.enabled}
                                    onChange={(e) => updateConfig({ stopShowing: { ...config.stopShowing, afterShownVisit: { ...config.stopShowing.afterShownVisit, enabled: e.target.checked } } })}
                                />
                                <span className="text-sm">After shown</span>
                                <input
                                    type="number"
                                    className="w-12 h-6 border rounded text-center text-sm p-0"
                                    value={config.stopShowing.afterShownVisit.times}
                                    onChange={(e) => updateConfig({ stopShowing: { ...config.stopShowing, afterShownVisit: { ...config.stopShowing.afterShownVisit, times: Number(e.target.value) } } })}
                                />
                                <span className="text-sm">Times THIS visit</span>
                            </label>
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={config.stopShowing.afterShownEver.enabled}
                                    onChange={(e) => updateConfig({ stopShowing: { ...config.stopShowing, afterShownEver: { ...config.stopShowing.afterShownEver, enabled: e.target.checked } } })}
                                />
                                <span className="text-sm">After shown</span>
                                <input
                                    type="number"
                                    className="w-12 h-6 border rounded text-center text-sm p-0"
                                    value={config.stopShowing.afterShownEver.times}
                                    onChange={(e) => updateConfig({ stopShowing: { ...config.stopShowing, afterShownEver: { ...config.stopShowing.afterShownEver, times: Number(e.target.value) } } })}
                                />
                                <span className="text-sm">Times EVER</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Choose Who */}
            <SectionHeader title="Choose Who" optional />
            <div className="bg-white dark:bg-gray-900 border-x border-b border-gray-200 dark:border-gray-700 p-6 rounded-b-lg">
                <div className="flex gap-8 items-center">
                    <label className="flex items-center gap-2">
                        <input
                            type="radio"
                            checked={config.audience.mode === 'all'}
                            onChange={() => updateConfig({ audience: { ...config.audience, mode: 'all' } })}
                        />
                        <span className="text-sm font-medium">All visitors</span>
                    </label>
                    <label className="flex items-center gap-2">
                        <input
                            type="radio"
                            checked={config.audience.mode === 'new'}
                            onChange={() => updateConfig({ audience: { ...config.audience, mode: 'new' } })}
                        />
                        <span className="text-sm font-medium">New visitors</span>
                    </label>
                    <label className="flex items-center gap-2">
                        <input
                            type="radio"
                            checked={config.audience.mode === 'returning'}
                            onChange={() => updateConfig({ audience: { ...config.audience, mode: 'returning' } })}
                        />
                        <span className="text-sm font-medium">Returning visitor since</span>
                        <input
                            type="number"
                            className="w-14 h-7 border rounded text-center"
                            value={config.audience.returningSinceDays || 3}
                            onChange={(e) => updateConfig({ audience: { ...config.audience, returningSinceDays: Number(e.target.value) } })}
                        />
                        <span className="text-sm font-medium">days ago</span>
                    </label>
                </div>
            </div>

            {/* 4. Traffic Source */}
            <SectionHeader title="Target Traffic Source" optional />
            <div className="bg-white dark:bg-gray-900 border-x border-b border-gray-200 dark:border-gray-700 p-6 rounded-b-lg grid grid-cols-2 gap-8">
                <div>
                    <h4 className="font-bold text-lg mb-2 text-gray-800 dark:text-white">Show from sources</h4>
                    <div className="space-y-2">
                        <label className="flex items-center gap-2">
                            <input type="checkbox" checked={config.trafficSource.showFrom.all} onChange={(e) => updateConfig({ trafficSource: { ...config.trafficSource, showFrom: { ...config.trafficSource.showFrom, all: e.target.checked } } })} />
                            <span className="text-sm">All</span>
                        </label>
                        {/* Add other specific sources similarly */}
                        <label className="flex items-center gap-2">
                            <input type="checkbox" checked={config.trafficSource.showFrom.email} onChange={(e) => updateConfig({ trafficSource: { ...config.trafficSource, showFrom: { ...config.trafficSource.showFrom, email: e.target.checked } } })} />
                            <span className="text-sm">Email</span>
                        </label>
                        <label className="flex items-center gap-2">
                            <input type="checkbox" checked={config.trafficSource.showFrom.facebook} onChange={(e) => updateConfig({ trafficSource: { ...config.trafficSource, showFrom: { ...config.trafficSource.showFrom, facebook: e.target.checked } } })} />
                            <span className="text-sm">Facebook</span>
                        </label>
                    </div>
                </div>
                <div>
                    <h4 className="font-bold text-lg mb-2 text-gray-800 dark:text-white">Don't show from sources</h4>
                    <div className="space-y-2">
                        <label className="flex items-center gap-2">
                            <input type="checkbox" checked={config.trafficSource.dontShowFrom.email} onChange={(e) => updateConfig({ trafficSource: { ...config.trafficSource, dontShowFrom: { ...config.trafficSource.dontShowFrom, email: e.target.checked } } })} />
                            <span className="text-sm">Email</span>
                        </label>
                        <label className="flex items-center gap-2">
                            <input type="checkbox" checked={config.trafficSource.dontShowFrom.facebook} onChange={(e) => updateConfig({ trafficSource: { ...config.trafficSource, dontShowFrom: { ...config.trafficSource.dontShowFrom, facebook: e.target.checked } } })} />
                            <span className="text-sm">Facebook</span>
                        </label>
                    </div>
                </div>
            </div>

            {/* 5. Add Delay */}
            <SectionHeader title="Add Delay" optional />
            <div className="bg-white dark:bg-gray-900 border-x border-b border-gray-200 dark:border-gray-700 p-4 rounded-b-lg flex items-center gap-4">
                <label className="flex items-center gap-2">
                    <input
                        type="radio"
                        checked={!config.delay.enabled}
                        onChange={() => updateConfig({ delay: { ...config.delay, enabled: false } })}
                    />
                    <span className="text-sm">Show immediately</span>
                </label>
                <label className="flex items-center gap-2">
                    <input
                        type="radio"
                        checked={config.delay.enabled}
                        onChange={() => updateConfig({ delay: { ...config.delay, enabled: true } })}
                    />
                    <input
                        type="number"
                        className="w-14 h-7 border rounded text-center"
                        value={config.delay.seconds}
                        disabled={!config.delay.enabled}
                        onChange={(e) => updateConfig({ delay: { ...config.delay, seconds: Number(e.target.value) } })}
                    />
                    <span className="text-sm">seconds on page</span>
                </label>
            </div>
        </div>
    );
}
