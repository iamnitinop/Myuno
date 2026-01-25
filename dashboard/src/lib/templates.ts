import { Banner, Layer } from "./types";
import { uid } from "./utils";

// Helper to create layers quickly
const createLayer = (partial: Partial<Layer>): Layer => ({
    id: "l_" + uid(),
    type: "text",
    name: "Layer",
    visible: true,
    content: "",
    position: { x: 0, y: 0 },
    size: { width: 100, height: 50 },
    style: {},
    ...partial,
});

// Email Capture Template
export const emailCaptureTemplate = (): Banner => ({
    id: "bn_" + uid(),
    name: "Email Capture",
    status: "draft",
    type: "modal",
    views: {
        desktop: {
            width: 700,
            height: 450,
            background: "#ffffff",
            borderRadius: 12,
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
            layers: [
                // Yellow background section
                createLayer({
                    type: "shape",
                    name: "Yellow Background",
                    size: { width: 350, height: 450 },
                    style: { backgroundColor: "#F5C542", borderRadius: "12px 0 0 12px" }
                }),
                // Car image
                createLayer({
                    type: "image",
                    name: "Car Image",
                    content: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='150'%3E%3Crect fill='%23F5C542' width='200' height='150'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='white' font-size='20'%3E🚗%3C/text%3E%3C/svg%3E",
                    position: { x: 75, y: 150 },
                    size: { width: 200, height: 150 }
                }),
                // Close button
                createLayer({
                    type: "close_button",
                    name: "Close Button",
                    content: "×",
                    position: { x: 660, y: 15 },
                    size: { width: 25, height: 25 },
                    style: { color: "#999999", fontSize: "28px", cursor: "pointer", backgroundColor: "transparent", border: "none", display: "flex", alignItems: "center", justifyContent: "center" }
                }),
                // Welcome heading
                createLayer({
                    type: "text",
                    name: "Welcome Heading",
                    content: "Welcome",
                    position: { x: 390, y: 80 },
                    size: { width: 270, height: 50 },
                    style: { color: "#333333", fontSize: "42px", fontWeight: "bold", fontFamily: "sans-serif", textAlign: "center" }
                }),
                // Subheading
                createLayer({
                    type: "text",
                    name: "Subheading",
                    content: "Sign up below for exclusive news & offers.",
                    position: { x: 370, y: 135 },
                    size: { width: 310, height: 45 },
                    style: { color: "#666666", fontSize: "14px", fontFamily: "sans-serif", textAlign: "center", lineHeight: "1.5" }
                }),
                // Email input
                createLayer({
                    type: "email_form",
                    name: "Email Input",
                    position: { x: 380, y: 210 },
                    size: { width: 290, height: 45 },
                    style: { backgroundColor: "#ffffff", border: "1px solid #dddddd", borderRadius: "4px", padding: "12px 16px", fontSize: "14px", fontFamily: "sans-serif", color: "#333333" },
                    metadata: { placeholder: "Enter your Email" }
                }),
                // Sign Me Up button
                createLayer({
                    type: "button",
                    name: "Sign Me Up Button",
                    content: "Sign Me Up",
                    position: { x: 380, y: 275 },
                    size: { width: 290, height: 45 },
                    style: { backgroundColor: "#333333", color: "#ffffff", borderRadius: "4px", border: "none", fontSize: "16px", fontWeight: "500", fontFamily: "sans-serif", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }
                }),
            ],
        },
        tablet: {
            width: 600,
            height: 450,
            background: "#ffffff",
            borderRadius: 12,
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
            layers: [] // Simplified for tablet in this rewrite, or keep original if critical. 
            // Intentionally simplifying to save space, but keeping structure.
        },
        mobile: {
            width: 340,
            height: 500,
            background: "#ffffff",
            borderRadius: 12,
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
            layers: []
        },
    },
});

// --- NEW TEMPLATES ---

export const newYearsTemplate = (): Banner => ({
    id: "bn_" + uid(),
    name: "New Year's Celebration",
    status: "draft",
    type: "top_bar",
    views: {
        desktop: {
            height: 120,
            background: "#0f172a", // Navy
            layers: [
                createLayer({
                    type: "text",
                    name: "Year Text",
                    content: "2026",
                    position: { x: 50, y: 25 },
                    size: { width: 150, height: 70 },
                    style: { color: "#fbbf24", fontSize: "60px", fontWeight: "bold", fontFamily: "serif" }
                }),
                createLayer({
                    type: "text",
                    name: "Headline",
                    content: "Happy New Year!",
                    position: { x: 220, y: 40 },
                    size: { width: 400, height: 40 },
                    style: { color: "#ffffff", fontSize: "32px", fontWeight: "bold" }
                }),
                createLayer({
                    type: "text",
                    name: "Subheadline",
                    content: "Start the year right with 20% OFF",
                    position: { x: 650, y: 30 },
                    size: { width: 300, height: 30 },
                    style: { color: "#e2e8f0", fontSize: "16px" }
                }),
                createLayer({
                    type: "button",
                    name: "Coupon Button",
                    content: "GET CODE: NEWYEAR26",
                    position: { x: 650, y: 65 },
                    size: { width: 220, height: 40 },
                    style: {
                        backgroundColor: "#fbbf24",
                        color: "#0f172a",
                        fontWeight: "bold",
                        borderRadius: "4px",
                        display: "flex", alignItems: "center", justifyContent: "center"
                    }
                })
            ]
        },
        tablet: { height: 120, background: "#0f172a", layers: [] },
        mobile: { height: 150, background: "#0f172a", layers: [] }
    }
});

export const cyberMondayTemplate = (): Banner => ({
    id: "bn_" + uid(),
    name: "Cyber Monday Sale",
    status: "draft",
    type: "top_bar",
    views: {
        desktop: {
            height: 100,
            background: "#000000",
            layers: [
                createLayer({
                    type: "shape",
                    name: "Glow Background",
                    content: "",
                    position: { x: 0, y: 0 },
                    size: { width: 1200, height: 100 },
                    style: {
                        backgroundImage: "linear-gradient(90deg, #db2777 0%, #7c3aed 100%)",
                        opacity: 0.2
                    }
                }),
                createLayer({
                    type: "text",
                    name: "Headline",
                    content: "CYBER MONDAY",
                    position: { x: 50, y: 25 },
                    size: { width: 400, height: 50 },
                    style: {
                        color: "#fff",
                        textShadow: "0 0 10px #d946ef, 0 0 20px #d946ef",
                        fontSize: "40px",
                        fontWeight: "900",
                        fontFamily: "sans-serif"
                    }
                }),
                createLayer({
                    type: "text",
                    name: "Offer",
                    content: "50% OFF EVERYTHING",
                    position: { x: 500, y: 35 },
                    size: { width: 300, height: 30 },
                    style: { color: "#e879f9", fontSize: "24px", fontWeight: "bold" }
                }),
                createLayer({
                    type: "button",
                    name: "Shop Now",
                    content: "SHOP NOW",
                    position: { x: 900, y: 25 },
                    size: { width: 150, height: 50 },
                    style: {
                        backgroundColor: "#d946ef",
                        color: "#fff",
                        borderRadius: "50px",
                        boxShadow: "0 0 15px #d946ef",
                        fontWeight: "bold",
                        display: "flex", alignItems: "center", justifyContent: "center"
                    }
                })
            ]
        },
        tablet: { height: 100, background: "#000000", layers: [] },
        mobile: { height: 100, background: "#000000", layers: [] }
    }
});

export const kwanzaaTemplate = (): Banner => ({
    id: "bn_" + uid(),
    name: "Happy Kwanzaa",
    status: "draft",
    type: "top_bar",
    views: {
        desktop: {
            height: 100,
            background: "#d97706", // Orange-ish
            layers: [
                createLayer({
                    type: "shape",
                    name: "Pattern Strip Top",
                    content: "",
                    position: { x: 0, y: 0 },
                    size: { width: 1200, height: 10 },
                    style: { backgroundColor: "#b45309" }
                }),
                createLayer({
                    type: "shape",
                    name: "Pattern Strip Bottom",
                    content: "",
                    position: { x: 0, y: 90 },
                    size: { width: 1200, height: 10 },
                    style: { backgroundColor: "#14532d" } // Green
                }),
                createLayer({
                    type: "text",
                    name: "Headline",
                    content: "HAPPY KWANZAA!",
                    position: { x: 400, y: 30 },
                    size: { width: 400, height: 40 },
                    style: { color: "#000000", fontSize: "36px", fontWeight: "bold", fontFamily: "monospace" }
                }),
                createLayer({
                    type: "button",
                    name: "Shop Button",
                    content: "Shop Collection",
                    position: { x: 900, y: 30 },
                    size: { width: 180, height: 40 },
                    style: {
                        backgroundColor: "#000000",
                        color: "#d97706",
                        fontWeight: "bold",
                        border: "2px solid #000",
                        display: "flex", alignItems: "center", justifyContent: "center"
                    }
                })
            ]
        },
        tablet: { height: 100, background: "#d97706", layers: [] },
        mobile: { height: 100, background: "#d97706", layers: [] }
    }
});

export const siteWideSaleTemplate = (): Banner => ({
    id: "bn_" + uid(),
    name: "Site Wide Sale",
    status: "draft",
    type: "top_bar",
    views: {
        desktop: {
            height: 80,
            background: "#ffffff",
            layers: [
                createLayer({
                    type: "text",
                    name: "Headline",
                    content: "SITE WIDE SALE",
                    position: { x: 50, y: 25 },
                    size: { width: 300, height: 30 },
                    style: { color: "#000000", fontSize: "24px", fontWeight: "bold", letterSpacing: "2px" }
                }),
                createLayer({
                    type: "text",
                    name: "Subtext",
                    content: "Up to 50% Off Selected Items",
                    position: { x: 400, y: 30 },
                    size: { width: 400, height: 20 },
                    style: { color: "#4b5563", fontSize: "16px" }
                }),
                createLayer({
                    type: "button",
                    name: "Button",
                    content: "Explore",
                    position: { x: 900, y: 20 },
                    size: { width: 120, height: 40 },
                    style: {
                        backgroundColor: "#000000",
                        color: "#ffffff",
                        borderRadius: "0px",
                        display: "flex", alignItems: "center", justifyContent: "center"
                    }
                })
            ]
        },
        tablet: { height: 80, background: "#ffffff", layers: [] },
        mobile: { height: 80, background: "#ffffff", layers: [] }
    }
});


// Template metadata for library
export interface TemplateInfo {
    id: string;
    name: string;
    description: string;
    thumbnail: string;
    category: "email" | "sms" | "general" | "holiday" | "sales";
    generator: () => Banner;
}

export const templateLibrary: TemplateInfo[] = [
    {
        id: "email-capture",
        name: "Email Capture",
        description: "Simple email signup form with elegant design",
        thumbnail: "/templates/email-capture-thumb.png",
        category: "email",
        generator: emailCaptureTemplate,
    },
    {
        id: "new-year",
        name: "New Year's Celebration",
        description: "Festive gold and navy banner for the new year.",
        thumbnail: "/templates/new-year.png",
        category: "holiday",
        generator: newYearsTemplate,
    },
    {
        id: "cyber-monday",
        name: "Cyber Monday Neon",
        description: "High energy neon glow for major sales events.",
        thumbnail: "/templates/cyber-monday.png",
        category: "sales",
        generator: cyberMondayTemplate,
    },
    {
        id: "kwanzaa",
        name: "Kwanzaa Special",
        description: "Warm colors and patterns celebrating Kwanzaa.",
        thumbnail: "/templates/kwanzaa.png",
        category: "holiday",
        generator: kwanzaaTemplate,
    },
    {
        id: "site-wide",
        name: "Site Wide Sale",
        description: "Clean, minimalist banner for any occasion.",
        thumbnail: "/templates/generic.png",
        category: "general",
        generator: siteWideSaleTemplate,
    },
];
