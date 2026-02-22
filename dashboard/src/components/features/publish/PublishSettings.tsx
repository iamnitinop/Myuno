"use client";

import React, { useState } from "react";
import { Banner } from "@/lib/types";
import { CheckCircle2, Radio, Globe, Code2, ArrowRight } from "lucide-react";
import Link from "next/link";

interface PublishProps {
    banner: Banner;
    accountId: string;
    onPublish: () => void;
    onUnpublish: () => void;
}

export function PublishSettings({ banner, accountId, onPublish, onUnpublish }: PublishProps) {
    const [showUnpublishConfirm, setShowUnpublishConfirm] = useState(false);
    const published = banner.status === "published";

    const handlePublish = () => {
        onPublish();
    };

    const handleUnpublish = () => {
        if (showUnpublishConfirm) {
            onUnpublish();
            setShowUnpublishConfirm(false);
        } else {
            setShowUnpublishConfirm(true);
            setTimeout(() => setShowUnpublishConfirm(false), 4000);
        }
    };

    return (
        <div className="space-y-5 max-w-2xl mx-auto">

            {/* Status Card */}
            {published ? (
                /* ── PUBLISHED STATE ── */
                <div className="relative overflow-hidden rounded-2xl border border-green-200 dark:border-green-800/50 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/20 p-6">
                    {/* Glow orb */}
                    <div className="absolute -top-8 -right-8 w-32 h-32 bg-green-400/20 rounded-full blur-2xl pointer-events-none" />

                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-green-500/30">
                            <CheckCircle2 className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <h2 className="text-lg font-bold text-green-900 dark:text-green-100">Campaign is Live!</h2>
                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/20 text-green-700 dark:text-green-400 text-xs font-semibold">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                    Live
                                </span>
                            </div>
                            <p className="text-sm text-green-700 dark:text-green-300">
                                <strong>{banner.name}</strong> is published and actively serving to your website visitors.
                            </p>
                        </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-green-200 dark:border-green-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                            <Globe className="w-4 h-4" />
                            <span>Visible on all pages where the runtime script is installed</span>
                        </div>
                        <button
                            onClick={handleUnpublish}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${showUnpublishConfirm
                                    ? "bg-red-600 hover:bg-red-700 text-white shadow-lg"
                                    : "bg-white/70 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-900 border border-gray-200 dark:border-gray-800"
                                }`}
                        >
                            {showUnpublishConfirm ? "Click again to confirm unpublish" : "Unpublish Campaign"}
                        </button>
                    </div>
                </div>
            ) : (
                /* ── DRAFT STATE ── */
                <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                            <Radio className="w-6 h-6 text-gray-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-lg font-bold mb-1">Publish Campaign</h2>
                            <p className="text-sm text-gray-500">
                                Publishing makes <strong className="text-gray-700 dark:text-gray-300">{banner.name}</strong> immediately visible to visitors on websites that have the Justuno runtime script installed.
                            </p>
                        </div>
                    </div>

                    <div className="mt-4 space-y-2">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                            Campaign design will be served to your visitors
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                            Targeting rules will be applied automatically
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                            Goes live instantly — no deployment needed
                        </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                        <button
                            onClick={handlePublish}
                            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30"
                        >
                            <Globe className="w-4 h-4" />
                            Publish Campaign
                        </button>
                    </div>
                </div>
            )}

            {/* Embed Script Reminder */}
            <Link
                href="/embed-code"
                className="flex items-center gap-4 p-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all group"
            >
                <div className="w-9 h-9 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
                    <Code2 className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        Need to install the runtime script?
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Add one universal script to your website to serve all published campaigns → View Embed Code
                    </p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors flex-shrink-0" />
            </Link>
        </div>
    );
}
