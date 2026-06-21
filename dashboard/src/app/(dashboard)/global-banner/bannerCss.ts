// SINGLE SOURCE OF TRUTH for global-banner styling + countdown.
// The dashboard preview imports this; vck.js mirrors the SAME logic so the
// editor preview is 1:1 with the live banner.
//
// Structure (both preview & live): a root element with `scope` id, an inner
// `.jugb-inner` flex, containers `[data-cid]`, elements `[data-eid]`.

import { GlobalBannerLayout, GBResponsive, GBDevice } from "@/lib/types";

export const TZ_OPTIONS: { value: string; label: string }[] = [
    { value: "Asia/Kolkata", label: "IST (India)" },
    { value: "America/Los_Angeles", label: "PST/PDT (US Pacific)" },
    { value: "America/New_York", label: "EST/EDT (US Eastern)" },
    { value: "America/Chicago", label: "CST/CDT (US Central)" },
    { value: "Europe/London", label: "GMT/BST (London)" },
    { value: "Europe/Paris", label: "CET/CEST (Central Europe)" },
    { value: "UTC", label: "UTC" },
    { value: "Asia/Dubai", label: "GST (Dubai)" },
    { value: "Australia/Sydney", label: "AET (Sydney)" },
];

// Does this element subtree contain a close button? (close is absolutely positioned at the
// banner's top-right, so its space must be reserved symmetrically to keep content centered.)
export function anyClose(els: any[]): boolean {
    return (els || []).some((e) => e.type === "close" || anyClose(e.children));
}

// Own-bucket visibility (NOT inherited): true only if THIS device's bucket sets hidden.
// Each device's CSS re-emits display, so the @media cascade makes visibility independent.
export function ownHidden(r: any, device: GBDevice): boolean {
    return !!(r && r[device] && r[device].hidden);
}

// Resolve effective style for a device with inheritance: mobile ← tablet ← desktop.
export function resolve<T extends object>(r: GBResponsive<T> | undefined, device: GBDevice): T {
    const d: any = (r && r.desktop) || {};
    if (device === "desktop") return { ...d };
    const t: any = { ...d, ...((r && r.tablet) || {}) };
    if (device === "tablet") return t;
    return { ...t, ...((r && r.mobile) || {}) };
}

const jc = (v?: string) => (v === "left" ? "flex-start" : v === "right" ? "flex-end" : v || "center");
const n = (v: any, d = 0) => (v == null ? d : v);

// Per-side padding string. Each side falls back: side → legacy paddingX/Y → provided default.
export function padDecl(s: any, def: { t?: number; r?: number; b?: number; l?: number } = {}): string {
    const t = n(s.padTop, n(s.paddingY, n(def.t, 0)));
    const r = n(s.padRight, n(s.paddingX, n(def.r, 0)));
    const b = n(s.padBottom, n(s.paddingY, n(def.b, 0)));
    const l = n(s.padLeft, n(s.paddingX, n(def.l, 0)));
    return (t || r || b || l) ? `padding:${t}px ${r}px ${b}px ${l}px;` : "";
}
// Build the sandboxed-iframe document for a custom HTML/CSS/JS element. Same string used
// by the editor preview and the live embed → identical render. Mirrored in vck.js (jugbSrcdoc).
export function buildHtmlSrcdoc(e: any): string {
    const css = e.css || "";
    const html = e.html || "";
    // Prevent a stray "</script>" in user JS from closing the wrapper script tag early.
    const js = (e.js || "").replace(/<\/script>/gi, "<\\/script>");
    return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;padding:0}${css}</style></head><body>${html}${js ? `<script>try{${js}}catch(e){if(window.console)console.error(e)}<\/script>` : ""}</body></html>`;
}

// Pick + fill the right cart-goal message for a given cart total (major units).
// Shared by the editor preview and the live embed (jugbCartGoalText) → identical text.
export function cartGoalMessage(cfg: any, totalMajor: number): string {
    if (!cfg) return "";
    const thr = Number(cfg.threshold) || 0;
    const sym = cfg.currencySymbol != null ? cfg.currencySymbol : "£";
    const fmt = (nv: number) => { const r = Math.round(nv * 100) / 100; return sym + (r % 1 === 0 ? String(r) : r.toFixed(2)); };
    const remaining = Math.max(0, thr - totalMajor);
    let t: string;
    if (thr > 0 && totalMajor >= thr) t = cfg.msgUnlocked || "";
    else if (totalMajor <= 0) t = cfg.msgEmpty || cfg.msgProgress || "";
    else t = cfg.msgProgress || "";
    // Wrap each substituted amount in a span so it can be styled independently
    // (highlight color/weight). Inherits surrounding styles when no highlight is set.
    const amt = (nv: number) => `<span class="jugb-cg-amt">${fmt(nv)}</span>`;
    return String(t).replace(/\{remaining\}/g, amt(remaining)).replace(/\{total\}/g, amt(totalMajor)).replace(/\{threshold\}/g, amt(thr));
}

// Per-side margin string (no legacy fallback).
export function marginDecl(s: any): string {
    const t = n(s.marginTop), r = n(s.marginRight), b = n(s.marginBottom), l = n(s.marginLeft);
    return (t || r || b || l) ? `margin:${t}px ${r}px ${b}px ${l}px;` : "";
}

// Compose a CSS `background` value from the rich background model (solid / gradient
// / image). Mirrored verbatim in vck.js (jugbBg) so preview === live.
export function composeBackground(s: any, fallback?: string): string {
    if (!s) return fallback || "";
    if (s.bgType === "gradient") {
        const stops = [s.gradientFrom || "#3a34f2", s.gradientVia, s.gradientTo || "#7b5cff"].filter(Boolean).join(", ");
        return s.gradientType === "radial"
            ? `radial-gradient(circle, ${stops})`
            : `linear-gradient(${s.gradientAngle != null ? s.gradientAngle : 90}deg, ${stops})`;
    }
    if (s.bgType === "image" && s.bgImageUrl) {
        const overlay = s.bgOverlay ? `linear-gradient(${s.bgOverlay}, ${s.bgOverlay}), ` : "";
        return `${overlay}url("${s.bgImageUrl}") ${s.bgImagePosition || "center"}/${s.bgImageSize || "cover"} ${s.bgImageRepeat || "no-repeat"}`;
    }
    return s.background || fallback || "";
}

// All CSS rules for ONE device, scoped under `scope` (e.g. "#ju-banner").
export function deviceRules(layout: GlobalBannerLayout, device: GBDevice, scope: string): string {
    const css: string[] = [];
    const bar: any = resolve(layout.bar.responsive, device);
    const stack = device === "mobile" && !!layout.bar.mobileStack;
    const padX = bar.paddingX ?? 24, padY = bar.paddingY ?? 10;

    // Bar: full-bleed (edge to edge). Vertical padding per-side (default padY); horizontal
    // stays 0 (gutter lives on the content wrapper) unless the user sets padLeft/padRight.
    const bpt = bar.padTop ?? padY, bpb = bar.padBottom ?? padY, bpl = bar.padLeft ?? 0, bpr = bar.padRight ?? 0;
    css.push(`${scope}{position:relative;box-sizing:border-box;width:100%;padding:${bpt}px ${bpr}px ${bpb}px ${bpl}px;background:${composeBackground(bar, "#000")};min-height:${bar.minHeight || 0}px;}`);
    const innerDir = stack ? "column" : (bar.direction || "row");
    const innerGap = stack ? Math.max(6, Math.round((bar.gap ?? 16) / 2)) : (bar.gap ?? 16);
    // For a column/stacked inner, justify-content is the VERTICAL axis — top-align so a tall
    // min-height never vertically-centers the content (which made editor≠live by width). Row stays centered.
    const innerJustify = innerDir === "column" ? "flex-start" : "center";
    css.push(`${scope} .jugb-inner{display:flex;flex-direction:${innerDir};align-items:${bar.align || "center"};justify-content:${innerJustify};gap:${innerGap}px;width:100%;box-sizing:border-box;}`);

    const contentMax = bar.maxWidth || 0;            // 0 => no cap (content also full width)
    // Symmetric horizontal gutter so centered content stays visually centered. Widen it
    // (still on BOTH sides) only when a close button exists, so the top-right close never overlaps.
    const gutterX = anyClose(layout.containers ? layout.containers.flatMap((c) => c.elements || []) : []) ? Math.max(padX, 40) : padX;
    const gutterL = gutterX, gutterR = gutterX;

    (layout.containers || []).forEach((c) => {
        const cs: any = resolve(c.responsive, device);
        const csel = `${scope} [data-cid="${c.id}"]`;
        const cwsel = `${csel} > .jugb-cwrap`;

        // Hidden on THIS device → collapse the band (skip its inner rules for this breakpoint).
        if (ownHidden(c.responsive, device)) { css.push(`${csel}{display:none;}`); return; }

        // BAND: width (% of full bar), background, radius. Centers the content wrapper horizontally
        // and TOP-aligns it (flex-start) so a tall min-height leaves empty space BELOW the content
        // instead of vertically centering it (which made the heading drift down + editor≠live).
        let band = `display:flex;justify-content:center;align-items:flex-start;box-sizing:border-box;`;
        if (stack) band += "width:100%;flex:0 0 auto;";
        else if (cs.widthPct) band += `flex:0 1 ${cs.widthPct}%;width:${cs.widthPct}%;`;
        else if (cs.grow) band += `flex:${cs.grow} 1 0%;`;
        else band += "flex:0 1 auto;";
        if (cs.bgType || cs.background) band += `background:${composeBackground(cs)};`;
        if (cs.radius) band += `border-radius:${cs.radius}px;overflow:hidden;`;
        if (cs.minHeight) band += `min-height:${cs.minHeight}px;`;
        band += marginDecl(cs);
        css.push(`${csel}{${band}}`);

        // CONTENT WRAPPER: the real flex layout; capped at content max-width and centered,
        // with a horizontal gutter (per-side padding overrides) so text never touches the edge / close.
        let cw = `display:flex;box-sizing:border-box;flex-direction:${cs.direction || "row"};justify-content:${jc(cs.justify)};align-items:${cs.align || "center"};gap:${cs.gap ?? 12}px;width:100%;`;
        if (contentMax) cw += `max-width:${contentMax}px;`;
        if (cs.wrap) cw += "flex-wrap:wrap;";
        cw += padDecl(cs, { t: 0, b: 0, l: gutterL, r: gutterR });
        css.push(`${cwsel}{${cw}}`);

        (c.elements || []).forEach((e) => emitElement(e, css, device, scope));
    });
    return css.join("");
}

// Emit CSS for one element (recurses into a group's children). Selectors are global
// `[data-eid]` so nesting needs no special scoping. Mirrored in vck.js (jugbEmitEl).
function emitElement(e: any, css: string[], device: GBDevice, scope: string) {
    const sel = `${scope} [data-eid="${e.id}"]`;
    // Hidden on THIS device → collapse; skip type-specific + child rules for this breakpoint.
    if (ownHidden(e.responsive, device)) { css.push(`${sel}{display:none;}`); return; }
    const s: any = resolve(e.responsive, device);
    const fixedImg = e.type === "image" || e.type === "sheetImage";
    const isGroup = e.type === "group";
    const isHtml = e.type === "html";
    // min-width:0 lets flex items shrink below content size (prevents off-canvas overflow).
    let r2 = `box-sizing:border-box;min-width:0;`;
    if (isHtml) r2 += "display:block;";
    else if (isGroup) {
        r2 += `display:flex;flex-direction:${s.direction || "row"};justify-content:${jc(s.justify)};align-items:${s.align || "center"};gap:${s.gap ?? 12}px;`;
        if (s.wrap) r2 += "flex-wrap:wrap;";
    } else if (e.type === "cartGoal") {
        // block (not column-flex) so the message text + amount spans flow as ONE inline line.
        // A flex container would turn each text-run/span into a separate item and stack them.
        r2 += `display:block;text-align:${s.textAlign || "center"};`;
    } else {
        r2 += "display:flex;flex-direction:column;justify-content:center;align-items:center;";
    }
    if (s.widthPct) r2 += `flex:0 1 ${s.widthPct}%;width:${s.widthPct}%;max-width:${s.widthPct}%;`;
    else if (s.grow) r2 += `flex:${s.grow} 1 0%;`;
    else r2 += fixedImg ? "flex:0 0 auto;" : "flex:0 1 auto;";
    if (e.type === "close") r2 += "position:absolute;top:8px;right:12px;cursor:pointer;line-height:1;z-index:2;";
    if (s.alignSelf) r2 += `align-self:${s.alignSelf};`;
    if (s.color) r2 += `color:${s.color};`;
    if (s.fontSize) r2 += `font-size:${s.fontSize}px;`;
    if (s.fontWeight) r2 += `font-weight:${s.fontWeight};`;
    if (s.fontStyle) r2 += `font-style:${s.fontStyle};`;
    if (s.lineHeight) r2 += `line-height:${s.lineHeight};`;
    if (s.fontFamily) r2 += `font-family:${s.fontFamily};`;
    // Per-element background box (any element type), independent of the banner/container bg.
    if (e.type !== "close" && (s.bgType || s.background)) r2 += `background:${composeBackground(s)};`;
    if (e.type !== "close" && s.boxRadius) r2 += `border-radius:${s.boxRadius}px;${s.bgType === "image" ? "overflow:hidden;" : ""}`;
    // Cart Goal: wrap naturally (so it stays one line when it fits and wraps + grows in
    // height when the screen is too narrow). Only force a single line if the user opts in.
    if (e.type === "cartGoal" && e.cartGoal && e.cartGoal.noWrap) r2 += "white-space:nowrap;";
    r2 += padDecl(s);
    r2 += marginDecl(s);
    if (s.heightPx && !isHtml) r2 += `min-height:${s.heightPx}px;`; // html: height goes on the iframe
    if (!isGroup && !isHtml && s.textAlign) r2 += `text-align:${s.textAlign};align-items:${jc(s.textAlign)};`;
    css.push(`${sel}{${r2}}`);
    if (isHtml) css.push(`${sel} iframe{display:block;width:100%;border:0;height:${s.heightPx || 80}px;background:transparent;}`);

    if (e.type === "sheetMessage") {
        css.push(`${sel} h1,${sel} h2,${sel} h3{margin:0;}${sel} p{margin:2px 0;}`);
        if (s.headingColor) css.push(`${sel} h1,${sel} h2,${sel} h3,${sel} h1 *,${sel} h2 *,${sel} h3 *{color:${s.headingColor} !important;}`);
        if (s.bodyColor) css.push(`${sel} p,${sel} p *{color:${s.bodyColor} !important;}`);
        let l2 = "";
        if (s.line2Color) l2 += `color:${s.line2Color} !important;`;
        if (s.line2FontSize) l2 += `font-size:${s.line2FontSize}px;`;
        if (s.line2FontWeight) l2 += `font-weight:${s.line2FontWeight};`;
        if (s.line2FontStyle) l2 += `font-style:${s.line2FontStyle};`;
        if (l2) css.push(`${sel} p:not(:first-of-type),${sel} p:not(:first-of-type) *{${l2}}`);
    }
    if (e.type === "image" || e.type === "sheetImage") {
        css.push(`${sel} img{width:${s.width || 64}px;height:${s.height || 64}px;object-fit:${s.fit || "cover"};border-radius:${s.radius || 0}%;display:block;}`);
    }
    if (e.type === "cartGoal") {
        // Highlight styling for the substituted amounts ({remaining}/{total}/{threshold}).
        let hl = "";
        if (s.cgHighlightColor) hl += `color:${s.cgHighlightColor};`;
        if (s.cgHighlightWeight) hl += `font-weight:${s.cgHighlightWeight};`;
        if (hl) css.push(`${sel} .jugb-cg-amt{${hl}}`);
    }
    if (e.type === "timer") {
        css.push(`${sel} .jugb-trow{display:inline-flex;gap:5px;align-items:center;}`);
        css.push(`${sel} .jugb-tbox{display:inline-flex;flex-direction:column;align-items:center;border-radius:6px;padding:3px 7px;min-width:32px;background:${s.boxColor || "rgba(255,255,255,0.15)"};}`);
        css.push(`${sel} .jugb-tbox b{font-size:${s.fontSize || 16}px;line-height:1;color:${s.color || "#fff"};}`);
        css.push(`${sel} .jugb-tlbl{font-size:9px;opacity:.8;color:${s.color || "#fff"};${e.timer && e.timer.showLabels === false ? "display:none;" : ""}}`);
    }
    if (isGroup) (e.children || []).forEach((ch: any) => emitElement(ch, css, device, scope));
}

// Full CSS. mode "preview" => resolved rules for `device` only (no @media), so the
// editor at a breakpoint shows exactly what live shows at that width. mode "live"
// => desktop base + tablet/mobile @media overrides.
export function buildBannerCss(layout: GlobalBannerLayout, opts: { scope: string; mode: "preview" | "live"; device?: GBDevice }): string {
    const scope = opts.scope;
    if (opts.mode === "preview") return deviceRules(layout, opts.device || "desktop", scope);
    return deviceRules(layout, "desktop", scope)
        + `@media (max-width:1023px){${deviceRules(layout, "tablet", scope)}}`
        + `@media (max-width:767px){${deviceRules(layout, "mobile", scope)}}`;
}

// ---- Countdown (shared) ----
export interface CountdownPart { value: number; label: string; }
export function formatCountdown(ms: number, mode: "days" | "hours"): CountdownPart[] {
    if (ms < 0) ms = 0;
    const s = Math.floor((ms % 60000) / 1000), m = Math.floor((ms % 3600000) / 60000);
    if (mode === "hours") {
        return [{ value: Math.floor(ms / 3600000), label: "hrs" }, { value: m, label: "min" }, { value: s, label: "sec" }];
    }
    return [
        { value: Math.floor(ms / 86400000), label: "days" },
        { value: Math.floor((ms % 86400000) / 3600000), label: "hrs" },
        { value: m, label: "min" }, { value: s, label: "sec" },
    ];
}
// Structural-only markup; all colors/sizes come from the generated CSS (so it's
// responsive + identical in preview & live).
export function countdownHtml(parts: CountdownPart[]): string {
    const box = (v: number, l: string) => `<span class="jugb-tbox"><b>${v < 10 ? "0" + v : v}</b><span class="jugb-tlbl">${l}</span></span>`;
    return `<span class="jugb-trow">${parts.map((p) => box(p.value, p.label)).join("")}</span>`;
}

// ---- Timezone helpers ----
// The user enters wall-clock time treated as IST (UTC+5:30, fixed, no DST).
export function istWallToInstant(wall: string): string {
    if (!wall) return "";
    // wall = "YYYY-MM-DDTHH:MM" (datetime-local). Interpret as +05:30.
    const iso = (wall.length === 16 ? wall + ":00" : wall) + "+05:30";
    const d = new Date(iso);
    return isNaN(d.getTime()) ? "" : d.toISOString();
}
// Format an absolute instant in a target IANA timezone (editor + live use Intl).
export function formatInTz(instantIso: string, tz: string): string {
    if (!instantIso) return "";
    try {
        return new Intl.DateTimeFormat("en-GB", {
            timeZone: tz || "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric",
            hour: "2-digit", minute: "2-digit", timeZoneName: "short",
        }).format(new Date(instantIso));
    } catch (e) { return new Date(instantIso).toUTCString(); }
}
