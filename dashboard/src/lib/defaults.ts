import { Banner, TargetingRules } from "./types";
import { uid } from "./utils";

export const KEY_DATA = (accountId: string) => `demo_account_${accountId}_data_v5`;

export const defaultBanner = (bannerId: string): Banner => ({
    id: bannerId,
    name: "Sitewide Top Bar",
    status: "draft",
    type: "top_bar",
    views: {
        desktop: {
            height: 100,
            background: "#0b1020",
            layers: [
                {
                    id: "l_" + uid(),
                    type: "text",
                    name: "Headline",
                    visible: true,
                    content: "BLACK FRIDAY SALE — 50% OFF",
                    position: { x: 50, y: 30 },
                    size: { width: 400, height: 40 },
                    style: { color: "#ffffff", fontSize: "24px", fontWeight: "bold", fontFamily: "sans-serif", textAlign: "center" }
                },
                {
                    id: "l_" + uid(),
                    type: "button",
                    name: "CTA Button",
                    visible: true,
                    content: "Shop Now",
                    position: { x: 500, y: 30 },
                    size: { width: 120, height: 40 },
                    style: { backgroundColor: "#00a650", color: "#ffffff", borderRadius: "20px", border: "none", fontSize: "14px", fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }
                }
            ]
        },
    },
});

export const defaultRules = (bannerId: string): TargetingRules => ({
    bannerId,
    enabled: true,
    conditions: [
        { type: "current_url", op: "does_not_contain", value: "checkout" },
        { type: "frequency", op: "once_per_session" },
    ],
});
