"use client";

import React, { useMemo, useState } from "react";
import { Banner } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface PublishProps {
    banner: Banner;
    accountId: string;
    onPublish: () => void;
    onUnpublish: () => void;
}

export function PublishSettings({ banner, accountId, onPublish, onUnpublish }: PublishProps) {
    const [copyMsg, setCopyMsg] = useState("");
    const published = banner.status === "published";

    const embedSnippet = useMemo(() => {
        return `<!-- Your Banner Embed (paste before </head> or before </body>) -->\n<script>\n(function(){\n  var account = "${accountId}";\n  var s = document.createElement('script');\n  s.async = true;\n  s.src = 'https://cdn.yourapp.com/runtime.js';\n  s.onload = function(){\n    window.BannerRuntime && window.BannerRuntime.init({ account: account });\n  };\n  document.head.appendChild(s);\n})();\n</script>`;
    }, [accountId]);

    const copy = async () => {
        setCopyMsg("");
        try {
            await navigator.clipboard.writeText(embedSnippet);
            setCopyMsg("Copied!");
            setTimeout(() => setCopyMsg(""), 1200);
        } catch {
            setCopyMsg("Copy failed");
        }
    };

    return (
        <Card
            title="Publish"
            right={
                <div className="flex items-center gap-2">
                    {copyMsg && <span className="text-xs text-green-500 animate-fade-in">{copyMsg}</span>}
                    {published ? (
                        <Button kind="danger" onClick={onUnpublish}>Unpublish</Button>
                    ) : (
                        <Button onClick={onPublish}>Publish</Button>
                    )}
                </div>
            }
        >
            <div className="flex items-center gap-3 mb-6">
                <div
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${published ? "bg-green-100 text-green-700 border border-green-200" : "bg-gray-100 text-gray-600 border border-gray-200"
                        }`}
                >
                    {published ? "Live" : "Draft"}
                </div>
                <div className="text-sm text-gray-500">Banner: <span className="font-medium text-gray-900 dark:text-gray-100">{banner.name}</span></div>
            </div>

            <div className="space-y-4">
                <div>
                    <div className="mb-2 text-sm font-semibold">Embed script</div>
                    <div className="relative group">
                        <pre className="overflow-auto rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-4 text-xs font-mono leading-5 text-gray-600 dark:text-gray-300">
                            {embedSnippet}
                        </pre>
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button kind="secondary" onClick={copy} className="text-xs py-1 px-2 h-auto">Copy</Button>
                        </div>
                    </div>
                </div>

                <div className="rounded-xl bg-blue-50 dark:bg-blue-900/10 p-4 text-xs text-blue-600 dark:text-blue-400">
                    <strong>Integration:</strong> Copy this code and paste it into your website's HTML (usually in the head or just before the closing body tag).
                </div>
            </div>
        </Card>
    );
}
