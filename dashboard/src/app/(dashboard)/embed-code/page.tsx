"use client";

import React, { useState, useMemo } from "react";
import { Copy, Check, Code2, Globe, AlertTriangle, Zap } from "lucide-react";
import { LS } from "@/lib/utils";

const ASSET_HOST = "//web-production-75bfb.up.railway.app/";

export default function EmbedCodePage() {
    const accountId: string = LS.get("accountId", "");
    const [copied, setCopied] = useState(false);

    const embedSnippet = useMemo(() => {
        return `<script data-cfasync="false">window.ju_num="${accountId}";window.asset_host='${ASSET_HOST}';(function(i,s,o,g,r,a,m){i[r]=i[r]||function(){(i[r].q=i[r].q||[]).push(arguments)};a=s.createElement(o),m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)})(window,document,'script',asset_host+'vck.js','juapp');</script>`;
    }, [accountId]);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(embedSnippet);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // fallback
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold">Embed Code</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Add this one-time script to your website to enable all your published campaigns.
                </p>
            </div>

            {/* Account Number Banner */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-900 dark:bg-gray-900 border border-gray-800">
                <div className="w-9 h-9 rounded-lg bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-4 h-4 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-0.5">Justuno Account Number</p>
                    <p className="font-mono text-red-400 text-sm truncate select-all">{accountId || "Loading..."}</p>
                </div>
            </div>

            {/* Main Embed Card */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
                {/* Card Header */}
                <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                    <div className="w-9 h-9 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                        <Code2 className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-sm">Runtime Script</h2>
                        <p className="text-xs text-gray-500">Universal — loads all published campaigns automatically</p>
                    </div>
                </div>

                {/* Instructions */}
                <div className="px-6 pt-5">
                    <div className="flex items-start gap-2.5 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
                        <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
                            Copy and paste this code into the <strong>{"<head>"}</strong> or <strong>footer</strong> of your website. You only need to add it <strong>once</strong> — it will automatically serve all of your published campaigns.
                        </p>
                    </div>
                </div>

                {/* Code Block */}
                <div className="px-6 pt-4 pb-6">
                    <div className="relative group">
                        <pre className="overflow-x-auto whitespace-pre-wrap rounded-xl bg-gray-950 dark:bg-black p-5 text-[11.5px] font-mono text-emerald-400 border border-gray-800 leading-relaxed">
                            {embedSnippet}
                        </pre>
                        <div className="absolute top-3 right-3">
                            <button
                                onClick={handleCopy}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shadow-sm ${copied
                                        ? "bg-green-500 text-white"
                                        : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                                    }`}
                            >
                                {copied ? (
                                    <>
                                        <Check className="w-3.5 h-3.5" />
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-3.5 h-3.5" />
                                        Copy Code
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Important Note */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/40">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
                    <strong>Platform integrations:</strong> If you installed through Shopify, LightSpeed, WordPress, or Weebly, this code has already been added automatically — you do NOT need to add it manually.
                </p>
            </div>

            {/* Steps */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
                <h3 className="font-semibold mb-4">How it works</h3>
                <div className="space-y-3">
                    {[
                        { step: "1", title: "Add the script once", desc: "Paste the embed code into your website's <head> or footer section." },
                        { step: "2", title: "Create & publish campaigns", desc: "Go to Campaigns → create a promotion → hit Publish. It goes live instantly." },
                        { step: "3", title: "Campaigns load automatically", desc: "The runtime script checks your account and serves all published campaigns to your visitors." },
                    ].map(({ step, title, desc }) => (
                        <div key={step} className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                                {step}
                            </div>
                            <div>
                                <p className="text-sm font-medium">{title}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
