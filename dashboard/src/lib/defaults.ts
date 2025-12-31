import { Banner, TargetingRules } from "./types";
import { uid } from "./utils";

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
        tablet: {
            height: 120,
            background: "#0b1020",
            layers: [
                {
                    id: "l_" + uid(),
                    type: "text",
                    name: "Headline",
                    visible: true,
                    content: "BLACK FRIDAY SALE — 50% OFF",
                    position: { x: 40, y: 35 },
                    size: { width: 350, height: 40 },
                    style: { color: "#ffffff", fontSize: "22px", fontWeight: "bold", fontFamily: "sans-serif", textAlign: "center" }
                },
                {
                    id: "l_" + uid(),
                    type: "button",
                    name: "CTA Button",
                    visible: true,
                    content: "Shop Now",
                    position: { x: 420, y: 35 },
                    size: { width: 120, height: 40 },
                    style: { backgroundColor: "#00a650", color: "#ffffff", borderRadius: "20px", border: "none", fontSize: "14px", fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }
                }
            ]
        },
        mobile: {
            height: 150,
            background: "#0b1020",
            layers: [
                {
                    id: "l_" + uid(),
                    type: "text",
                    name: "Mobile Headline",
                    visible: true,
                    content: "BLACK FRIDAY\n50% OFF",
                    position: { x: 20, y: 20 },
                    size: { width: 300, height: 60 },
                    style: { color: "#ffffff", fontSize: "20px", fontWeight: "bold", fontFamily: "sans-serif", textAlign: "center" }
                },
                {
                    id: "l_" + uid(),
                    type: "button",
                    name: "Mobile CTA",
                    visible: true,
                    content: "Shop Now",
                    position: { x: 100, y: 90 },
                    size: { width: 140, height: 40 },
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
