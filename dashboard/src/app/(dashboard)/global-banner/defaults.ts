import { Banner, GlobalBannerLayout } from "@/lib/types";

export const OFFER_TEXT_ID = "offer_text";
export const OFFER_IMAGE_ID = "offer_image";

// Default responsive flex layout (reference look): royal-blue bar; one row container
// holding heading + sheet message (grows) + product image; close pinned top-right.
export function defaultGlobalBannerLayout(): GlobalBannerLayout {
    return {
        bar: {
            mobileStack: true,
            couponCode: "",
            responsive: {
                desktop: { background: "#3a34f2", paddingX: 24, paddingY: 10, gap: 20, minHeight: 64, align: "center", direction: "row", maxWidth: 1200 },
            },
        },
        containers: [
            {
                id: "c_main",
                responsive: { desktop: { direction: "row", justify: "center", align: "center", gap: 20, grow: 1 } },
                elements: [
                    {
                        id: "el_heading", type: "text", content: "LIMITED TIME OFFER",
                        responsive: { desktop: { color: "#ffd400", fontSize: 20, fontWeight: 700, textAlign: "left", lineHeight: 1.2 }, mobile: { fontSize: 16 } },
                    },
                    {
                        id: "el_msg", type: "sheetMessage",
                        sampleHtml: "<p>If you buy this product today, you get <strong>23% Off + Free gift</strong></p><p>Free gift gets added in your cart. No coupon needed. Offer valid until stocks last.</p>",
                        responsive: {
                            desktop: { color: "#ffffff", headingColor: "#ffd400", bodyColor: "#ffffff", fontSize: 16, fontWeight: 400, textAlign: "center", lineHeight: 1.35, grow: 1, line2Color: "#ffffff", line2FontSize: 13, line2FontStyle: "italic" },
                            mobile: { fontSize: 13, line2FontSize: 11 },
                        },
                    },
                    {
                        id: "el_img", type: "sheetImage", sampleUrl: "",
                        responsive: { desktop: { width: 64, height: 64, radius: 50, fit: "cover" }, mobile: { width: 48, height: 48 } },
                    },
                    {
                        id: "el_close", type: "close",
                        responsive: { desktop: { color: "#ffffff", fontSize: 18 } },
                    },
                ],
            },
        ],
    };
}

// Reference-matching default: royal-blue bar, centered offer text, product image
// on the right, close button, yellow bottom accent. Tweak in the Design Shell.
export function defaultGlobalBanner(): Banner {
    const mk = (
        width: number,
        height: number,
        text: { x: number; y: number; w: number; h: number },
        img: { x: number; y: number; w: number; h: number },
        close: { x: number; y: number; w: number; h: number },
    ): any => ({
        width,
        height,
        background: "#3a34f2",
        layers: [
            {
                id: OFFER_TEXT_ID, type: "text", name: "Offer Text", visible: true,
                content: "<h1>LIMITED TIME OFFER</h1><p>If you buy this product today, you get <strong>your offer</strong></p><p><em>Free gift gets added in your cart. No coupon needed. Hurry!</em></p>",
                position: { x: text.x, y: text.y }, size: { width: text.w, height: text.h },
                style: { textAlign: "center", fontFamily: "'Open Sans', Arial, sans-serif", lineHeight: "1.3" },
            },
            {
                id: OFFER_IMAGE_ID, type: "image", name: "Product Image", visible: true,
                content: "",
                position: { x: img.x, y: img.y }, size: { width: img.w, height: img.h },
                style: { borderRadius: "50%", overflow: "hidden" },
            },
            {
                id: "offer_close", type: "close_button", name: "Close", visible: true,
                content: "✕",
                position: { x: close.x, y: close.y }, size: { width: close.w, height: close.h },
                style: { color: "#ffffff", fontSize: "18px", fontWeight: "bold", cursor: "pointer" },
            },
        ],
    });

    return {
        id: "global-banner", name: "Global Banner", status: "draft", type: "top_bar",
        views: {
            desktop: mk(1200, 96, { x: 220, y: 8, w: 720, h: 80 }, { x: 1000, y: 13, w: 70, h: 70 }, { x: 1160, y: 8, w: 30, h: 30 }),
            mobile: mk(420, 150, { x: 8, y: 6, w: 300, h: 138 }, { x: 320, y: 40, w: 80, h: 80 }, { x: 390, y: 4, w: 24, h: 24 }),
        },
    } as Banner;
}
