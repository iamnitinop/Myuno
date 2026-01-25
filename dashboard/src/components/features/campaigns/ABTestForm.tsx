"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Monitor, Smartphone } from "lucide-react";
import { LS } from "@/lib/utils";
import { AccountData, ABTest } from "@/lib/types";
import { Input } from "@/components/ui/Input";

const KEY_DATA = (accountId: string) => `demo_account_${accountId}_data_v3`;

interface ABTestFormProps {
    initialData?: ABTest;
    onSave: (test: ABTest) => void;
}

export function ABTestForm({ initialData, onSave }: ABTestFormProps) {
    const router = useRouter();
    const accountId = "ACC_DEMO_001";
    const [data, setData] = useState<AccountData | null>(null);

    // Form State
    const [name, setName] = useState(initialData?.name || "");
    const [device, setDevice] = useState<"desktop" | "mobile">(initialData?.device || "mobile");
    const [startDate, setStartDate] = useState(initialData?.startDate ? new Date(initialData.startDate).toISOString().slice(0, 16) : "");
    const [endDate, setEndDate] = useState(initialData?.endDate ? new Date(initialData.endDate).toISOString().slice(0, 16) : "");
    const [baselineId, setBaselineId] = useState<string | null>(initialData?.baselineId || null);
    const [baselinePercentage, setBaselinePercentage] = useState(initialData?.baselinePercentage || 50);

    // Derived Variant state
    const [selectedVariantIds, setSelectedVariantIds] = useState<string[]>([]);
    const [controlGroupPercentage, setControlGroupPercentage] = useState(0);

    useEffect(() => {
        const accountData: AccountData = LS.get(KEY_DATA(accountId), {
            accountId,
            banners: [],
            rules: [],
            abTests: [],
            events: [],
        });
        setData(accountData);

        if (!initialData) {
            // Pre-fill dates for new test
            const start = new Date();
            start.setMinutes(start.getMinutes() - start.getTimezoneOffset());
            setStartDate(start.toISOString().slice(0, 16));

            const end = new Date();
            end.setDate(end.getDate() + 7);
            end.setMinutes(end.getMinutes() - end.getTimezoneOffset());
            setEndDate(end.toISOString().slice(0, 16));
        } else {
            // Reconstruct variant state from initialData
            const variantIds = initialData.variants.map(v => v.bannerId);
            setSelectedVariantIds(variantIds);
            const controlVariant = initialData.variants.find(v => v.bannerId === 'control');
            if (controlVariant) {
                setControlGroupPercentage(controlVariant.percentage);
            }
        }
    }, [initialData]);

    if (!data) return <div>Loading...</div>;

    const availablePromotions = data.banners.filter(b => true); // All banners

    const handleSaveInternal = () => {
        if (!name) return alert("Please enter a test name");
        if (!baselineId) return alert("Please select a baseline promotion");
        if (selectedVariantIds.length === 0) return alert("Please select at least one variant");

        const variants = selectedVariantIds.map(id => ({
            bannerId: id,
            percentage: id === 'control' ? controlGroupPercentage : (100 - baselinePercentage - controlGroupPercentage) / (selectedVariantIds.length - (selectedVariantIds.includes('control') ? 1 : 0))
        }));

        const now = new Date();
        const start = new Date(startDate);
        const end = new Date(endDate);

        let status: 'draft' | 'scheduled' | 'running' | 'ended' = 'draft';

        if (start > now) {
            status = 'scheduled';
        } else if (start <= now && end > now) {
            status = 'running';
        } else if (end <= now) {
            status = 'ended';
        }

        const testToSave: ABTest = {
            id: initialData?.id || "ab_" + Date.now(),
            name,
            device,
            startDate: start.toISOString(),
            endDate: end.toISOString(),
            baselineId,
            baselinePercentage,
            variants,
            status: status
        };

        onSave(testToSave);
    };

    const toggleVariant = (id: string) => {
        if (selectedVariantIds.includes(id)) {
            setSelectedVariantIds(prev => prev.filter(v => v !== id));
        } else {
            setSelectedVariantIds(prev => [...prev, id]);
        }
    };

    return (
        <div className="max-w-5xl mx-auto pb-20">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-900">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-2xl font-bold">{initialData ? "Edit A/B Test" : "New A/B Test"}</h1>
                </div>
                <button
                    onClick={handleSaveInternal}
                    className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded font-medium transition-colors"
                >
                    Save
                </button>
            </div>

            <div className="space-y-12">
                {/* 1. Name */}
                <div className="max-w-2xl mx-auto text-center space-y-2">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
                        A/B Test Name: <span className="text-red-500">*</span>
                    </label>
                    <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Test my promotion"
                        className="text-center"
                    />
                </div>

                {/* 2. Device Selection */}
                <div className="text-center space-y-4">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
                        Select Device: <span className="text-red-500">*</span>
                    </label>
                    <div className="flex justify-center gap-6">
                        <button
                            onClick={() => setDevice("desktop")}
                            className={`flex flex-col items-center justify-center w-40 h-32 rounded-lg border-2 transition-all ${device === "desktop"
                                ? "border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-600"
                                : "border-gray-200 dark:border-gray-700 text-gray-400 hover:border-gray-300"
                                }`}
                        >
                            <Monitor className="w-10 h-10 mb-2" />
                            <span className="font-semibold">Desktop / Tablet</span>
                        </button>
                        <button
                            onClick={() => setDevice("mobile")}
                            className={`flex flex-col items-center justify-center w-40 h-32 rounded-lg border-2 transition-all ${device === "mobile"
                                ? "border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                                : "border-gray-200 dark:border-gray-700 text-gray-400 hover:border-gray-300"
                                }`}
                        >
                            <Smartphone className="w-10 h-10 mb-2" />
                            <span className="font-semibold">Mobile</span>
                        </button>
                    </div>
                </div>

                {/* 3. Date Time */}
                <div className="max-w-3xl mx-auto grid grid-cols-2 gap-8 text-center">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
                            Start Date & Time: <span className="text-red-500">*</span>
                        </label>
                        <Input
                            type="datetime-local"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                        <p className="text-xs text-gray-400">(in PDT GMT-08:00)</p>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
                            End Date & Time: <span className="text-red-500">*</span>
                        </label>
                        <Input
                            type="datetime-local"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                        <p className="text-xs text-gray-400">(in PDT GMT-08:00)</p>
                    </div>
                </div>

                {/* Note */}
                <div className="text-center text-[10px] text-gray-500 italic max-w-lg mx-auto">
                    Please note: targeting rules set for the Base promotion will be applied to all variants.
                    We do not support the ability to test different audiences against each other.
                </div>

                {/* 4. Selection Area */}
                <div className="grid grid-cols-2 gap-0 border-t border-gray-200 dark:border-gray-800">
                    {/* Baseline Column */}
                    <div className="border-r border-gray-200 dark:border-gray-800">
                        {/* Header */}
                        <div className="bg-cyan-500 text-white px-4 py-3 font-semibold text-sm flex items-center gap-2">
                            <div className="vertical-text writing-mode-vertical text-[10px] uppercase opacity-70">Base</div>
                            Select a Baseline Promotion *
                        </div>
                        {/* List */}
                        <div className="bg-white dark:bg-black">
                            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 dark:border-gray-800 text-xs font-bold text-gray-500">
                                <span>Promotion</span>
                                <span>% of Sessions</span>
                            </div>
                            <div className="max-h-[400px] overflow-y-auto">
                                {availablePromotions.map((promo) => (
                                    <div
                                        key={promo.id}
                                        className={`flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors cursor-pointer border-b border-gray-100 dark:border-gray-800 ${baselineId === promo.id ? "bg-blue-50 dark:bg-blue-900/10" : ""
                                            }`}
                                        onClick={() => setBaselineId(promo.id)}
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${baselineId === promo.id ? "border-blue-500" : "border-gray-300"
                                                }`}>
                                                {baselineId === promo.id && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                                            </div>
                                            <span className="text-sm truncate">{promo.name}</span>
                                        </div>
                                        <div className="w-20 pl-4">
                                            {baselineId === promo.id ? (
                                                <div className="flex items-center gap-1">
                                                    <input
                                                        type="number"
                                                        className="w-12 h-8 border rounded text-center text-sm"
                                                        value={baselinePercentage}
                                                        onChange={(e) => setBaselinePercentage(Number(e.target.value))}
                                                    />
                                                    <span className="text-sm text-gray-500">%</span>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-gray-300">0 %</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Variant Column */}
                    <div>
                        {/* Header */}
                        <div className="bg-indigo-600 text-white px-4 py-3 font-semibold text-sm flex items-center gap-2">
                            <div className="vertical-text writing-mode-vertical text-[10px] uppercase opacity-70">Variants</div>
                            Select Variant Promotion(s) *
                        </div>
                        {/* List */}
                        <div className="bg-white dark:bg-black">
                            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 dark:border-gray-800 text-xs font-bold text-gray-500">
                                <span>Promotion</span>
                                <span>% of Sessions</span>
                            </div>
                            <div className="max-h-[400px] overflow-y-auto">
                                {/* Control Group Option */}
                                <div
                                    className={`flex items-center justify-between px-4 py-3 transition-colors border-b border-gray-100 dark:border-gray-800 cursor-pointer ${selectedVariantIds.includes('control') ? "bg-gray-600 text-white" : "bg-gray-500 text-white"
                                        }`}
                                    onClick={() => toggleVariant('control')}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 bg-white border-white`}>
                                            {selectedVariantIds.includes('control') && <div className="w-2 h-2 bg-gray-600" />}
                                        </div>
                                        <span className="text-sm font-medium">Include a Control Group</span>
                                    </div>
                                    <div className="w-20 pl-4" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center gap-1">
                                            <input
                                                type="number"
                                                className="w-12 h-8 border border-gray-400 bg-gray-500 text-white rounded text-center text-sm placeholder-gray-300"
                                                value={controlGroupPercentage}
                                                onChange={(e) => setControlGroupPercentage(Number(e.target.value))}
                                                disabled={!selectedVariantIds.includes('control')}
                                            />
                                            <span className="text-sm opacity-80">%</span>
                                        </div>
                                    </div>
                                </div>

                                {availablePromotions.map((promo) => {
                                    if (promo.id === baselineId) return null;

                                    const isSelected = selectedVariantIds.includes(promo.id);

                                    return (
                                        <div
                                            key={promo.id}
                                            className={`flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors cursor-pointer border-b border-gray-100 dark:border-gray-800 ${isSelected ? "bg-blue-50 dark:bg-blue-900/10" : ""
                                                }`}
                                            onClick={() => toggleVariant(promo.id)}
                                        >
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${isSelected ? "bg-blue-600 border-blue-600" : "border-gray-300"
                                                    }`}>
                                                    {isSelected && <div className="w-2 h-2 text-white font-bold leading-none flex items-center justify-center">✓</div>}
                                                </div>
                                                <span className="text-sm truncate">{promo.name}</span>
                                            </div>
                                            <div className="w-20 pl-4">
                                                {/* Auto-calc logic placeholder */}
                                                <span className="text-sm text-gray-400">{isSelected ? "Auto" : "0"} %</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
