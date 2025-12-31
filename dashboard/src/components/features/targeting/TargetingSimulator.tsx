import React, { useState, useMemo, useEffect } from "react";
import { Banner, AdvancedTargetingRules } from "@/lib/types";
import { isDesktopByWidth } from "@/lib/utils";
import { evalAdvancedRules, markShown, FIRST_URL_SESSION_KEY, FIRST_URL_ALLTIME_KEY, ensureFirstUrls } from "@/lib/runtime";
import { ensureAdvancedRules as _ensureAdvancedRules } from "@/lib/rule-migration";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { RenderBanner } from "@/components/features/editor/RenderBanner";

interface SimulatorProps {
    banner: Banner;
    rules: AdvancedTargetingRules;
}

export function TargetingSimulator({ banner, rules }: SimulatorProps) {
    const [path, setPath] = useState("/collections/all");
    const [referrer, setReferrer] = useState("https://google.com/search?q=demo");
    const [w, setW] = useState(1200);
    const device = isDesktopByWidth(w) ? "desktop" : "mobile";

    const [shown, setShown] = useState(false);
    const [lastDecision, setLastDecision] = useState<boolean | null>(null);

    // Fake storage for simulation
    const sessionFake = useMemo(() => {
        const m = new Map();
        return {
            getItem: (k: string) => (m.has(k) ? m.get(k) : null),
            setItem: (k: string, v: string) => m.set(k, String(v)),
            removeItem: (k: string) => m.delete(k),
        } as unknown as Storage;
    }, []);

    const localFake = useMemo(() => {
        const m = new Map();
        return {
            getItem: (k: string) => (m.has(k) ? m.get(k) : null),
            setItem: (k: string, v: string) => m.set(k, String(v)),
            removeItem: (k: string) => m.delete(k),
        } as unknown as Storage;
    }, []);

    const run = () => {
        const decision = evalAdvancedRules({
            rules,
            url: path,
            referrer,
            storage: { session: sessionFake, local: localFake },
        });
        setLastDecision(decision);
        setShown(decision);
        // markShown doesn't support advanced rules natively yet if I didn't update it, but let's check runtime.ts.
        // It uses rules.conditions. Advanced rules don't have conditions at top level.
        // I should probably update markShown too or skip it for now as it's just frequency caps which are not in the new UI yet.
    };

    const resetFirstUrls = () => {
        sessionFake.removeItem(FIRST_URL_SESSION_KEY);
        localFake.removeItem(FIRST_URL_ALLTIME_KEY);
        ensureFirstUrls({ session: sessionFake, local: localFake }, path);
        run();
    };

    useEffect(() => {
        run();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [path, referrer, rules]);

    return (
        <div className="grid gap-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input label="Current URL (path)" value={path} onChange={(e) => setPath(e.target.value)} placeholder="/products/abc" />
                <Input label="Referring URL" value={referrer} onChange={(e) => setReferrer(e.target.value)} placeholder="https://google.com/..." />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input label="Viewport width" value={String(w)} onChange={(e) => setW(Number(e.target.value || 0))} placeholder="1200" />
                <div className="flex items-end gap-2">
                    <Button kind="secondary" onClick={resetFirstUrls}>Reset first URLs</Button>
                </div>
            </div>

            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-black/20 p-4">
                <div className="mb-2 text-xs text-gray-500">Decision</div>
                <div className="flex items-center gap-3">
                    <div
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${lastDecision ? "bg-green-500 text-white" : "bg-gray-200 dark:bg-gray-800 text-gray-500"
                            }`}
                    >
                        {lastDecision ? "SHOW" : "DO NOT SHOW"}
                    </div>
                </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-black/20">
                <div className="border-b border-gray-200 dark:border-gray-800 px-4 py-3 text-xs text-gray-500">Banner Render</div>
                <div className={device === "desktop" ? "" : "max-w-[420px] mx-auto border-x border-gray-200 dark:border-gray-800"}>
                    {shown
                        ? <RenderBanner banner={banner} device={device} onClose={() => setShown(false)} />
                        : (
                            <div className="p-6 text-sm text-gray-400 text-center">No banner rendered based on current targeting.</div>
                        )}
                </div>
            </div>
        </div>
    );
}
