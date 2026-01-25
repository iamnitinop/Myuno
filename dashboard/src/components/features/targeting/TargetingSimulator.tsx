import React, { useState, useMemo, useEffect } from "react";
import { Banner, AdvancedTargetingRules, AccountData } from "@/lib/types";
import { isDesktopByWidth, LS } from "@/lib/utils";
import { evalAdvancedRules, FIRST_URL_SESSION_KEY, FIRST_URL_ALLTIME_KEY, ensureFirstUrls } from "@/lib/runtime";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { RenderBanner } from "@/components/features/editor/RenderBanner";
import { checkActiveABTests } from "@/lib/ab-test-engine";

interface SimulatorProps {
    banner: Banner;
    rules: AdvancedTargetingRules;
}

const KEY_DATA = (accountId: string) => `demo_account_${accountId}_data_v3`;

export function TargetingSimulator({ banner: initialBanner, rules }: SimulatorProps) {
    const [path, setPath] = useState("/collections/all");
    const [referrer, setReferrer] = useState("https://google.com/search?q=demo");
    const [w, setW] = useState(1200);
    const device = isDesktopByWidth(w) ? "desktop" : "mobile";

    const [shown, setShown] = useState(false);
    const [lastDecision, setLastDecision] = useState<boolean | null>(null);

    // A/B Test State
    const [activeBanner, setActiveBanner] = useState<Banner>(initialBanner);
    const [abTestInfo, setAbTestInfo] = useState<{ testName: string, variantRole: string } | null>(null);

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
        // 1. Evaluate Targeting Rules (always based on the BASELINE/Initial banner's rules)
        const decision = evalAdvancedRules({
            rules,
            url: path,
            referrer,
            storage: { session: sessionFake, local: localFake },
            device,
        });
        setLastDecision(decision);
        setShown(decision);

        if (decision) {
            // 2. If showing, check A/B Tests
            const accountId = "ACC_DEMO_001";
            const data: AccountData = LS.get(KEY_DATA(accountId), {
                accountId, banners: [], rules: [], abTests: [], events: []
            });

            // Find if there is an active test where this banner is the BASELINE
            // (We only trigger tests from the baseline usually, or we check global tests)
            // Our engine `checkActiveABTests` iterates ALL tests to find a match.
            // But we specifically want to know if *this* banner triggers a test.

            // Filter tests that involve this banner as baseline
            const relevantTests = (data.abTests || []).filter(t => t.baselineId === initialBanner.id);

            // Check if any are active for this device
            const variantId = checkActiveABTests(relevantTests, device);

            if (variantId !== undefined) {
                // A/B Test is Active!
                if (variantId === initialBanner.id) {
                    // Winner is Baseline
                    setActiveBanner(initialBanner);
                    setAbTestInfo({ testName: relevantTests[0].name, variantRole: 'Baseline' });
                } else if (variantId === null) {
                    // Winner is Control Group (Show Nothing)
                    setShown(false);
                    setAbTestInfo({ testName: relevantTests[0].name, variantRole: 'Control Group (Hidden)' });
                } else {
                    // Winner is a Variant
                    const variantBanner = data.banners.find(b => b.id === variantId);
                    if (variantBanner) {
                        setActiveBanner(variantBanner);
                        setAbTestInfo({ testName: relevantTests[0].name, variantRole: 'Variant: ' + variantBanner.name });
                    }
                }
            } else {
                // No active test for this banner
                setActiveBanner(initialBanner);
                setAbTestInfo(null);
            }
        }
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
    }, [path, referrer, rules, device]); // Added device dependency

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
                    {abTestInfo && (
                        <div className="rounded-full px-3 py-1 text-xs font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                            A/B Test Active: {abTestInfo.variantRole}
                        </div>
                    )}
                </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-black/20">
                <div className="border-b border-gray-200 dark:border-gray-800 px-4 py-3 text-xs text-gray-500">Banner Render</div>
                <div className={device === "desktop" ? "" : "max-w-[420px] mx-auto border-x border-gray-200 dark:border-gray-800"}>
                    {shown
                        ? <RenderBanner banner={activeBanner} device={device} onClose={() => setShown(false)} />
                        : (
                            <div className="p-6 text-sm text-gray-400 text-center">
                                {abTestInfo?.variantRole.includes('Control')
                                    ? "Banner hidden due to Control Group assignment."
                                    : "No banner rendered based on current targeting."}
                            </div>
                        )}
                </div>
            </div>
        </div>
    );
}
