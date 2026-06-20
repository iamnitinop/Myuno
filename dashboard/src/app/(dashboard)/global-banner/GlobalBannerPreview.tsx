"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GlobalBannerLayout, GBElement } from "@/lib/types";
import { buildBannerCss, formatCountdown, countdownHtml, formatInTz, buildHtmlSrcdoc, cartGoalMessage } from "./bannerCss";

/**
 * Pure-CSS preview: renders the SAME DOM tree as the live embed and styles it with
 * the SAME generated CSS (bannerCss.buildBannerCss). No inline styles → the editor
 * preview is 1:1 with the live banner for the selected breakpoint.
 */
export type GBResizeInfo = { kind: "container" | "element"; id: string; type?: string };
export type GBResizeChange = { side: "left" | "right" | "top" | "bottom"; px: number; pct: number };

export function GlobalBannerPreview({
    layout, device, offerHtml, offerImageUrl, onSelect, selectedId, onResize,
}: {
    layout: GlobalBannerLayout;
    device: "desktop" | "tablet" | "mobile";
    offerHtml?: string;
    offerImageUrl?: string;
    onSelect?: (id: string) => void;
    selectedId?: string;
    onResize?: (info: GBResizeInfo, change: GBResizeChange) => void;
}) {
    const scopeId = "jugbprev";
    const css = useMemo(() => buildBannerCss(layout, { scope: "#" + scopeId, mode: "preview", device }), [layout, device]);

    // tick so timer elements count down live in the preview
    const [, setTick] = useState(0);
    useEffect(() => {
        const hasTimer = (layout.containers || []).some((c) => (c.elements || []).some((e) => e.type === "timer" && e.timer?.endInstant));
        if (!hasTimer) return;
        const t = setInterval(() => setTick((n) => n + 1), 1000);
        return () => clearInterval(t);
    }, [layout]);

    // ---- resize handles (editor-only overlay; does NOT touch shared CSS / live) ----
    // 4-direction: left/right = width, top/bottom = height. Works for a selected
    // CONTAINER (band) or ELEMENT; the editor decides what each change maps to.
    const rootRef = useRef<HTMLDivElement>(null);
    const stacked = device === "mobile" && !!layout.bar?.mobileStack;
    const sel = useMemo<GBResizeInfo | null>(() => {
        if (!selectedId) return null;
        if ((layout.containers || []).some((c) => c.id === selectedId)) return { kind: "container", id: selectedId };
        const find = (els?: GBElement[]): GBElement | null => {
            for (const e of els || []) { if (e.id === selectedId) return e; const r = find(e.children); if (r) return r; }
            return null;
        };
        for (const c of layout.containers || []) {
            const el = find(c.elements);
            if (el) return { kind: "element", id: selectedId, type: el.type };
        }
        return null;
    }, [layout, selectedId]);
    // containers can't be width-resized when force-stacked; the close button isn't resizable
    const canResize = !!sel && !!onResize && sel.type !== "close";
    const canWidth = canResize && !(sel!.kind === "container" && stacked);
    const [box, setBox] = useState<{ left: number; top: number; width: number; height: number; pct: number } | null>(null);

    // target element + its size reference (parent for width%)
    const targets = useCallback(() => {
        const root = rootRef.current;
        if (!root || !sel) return null;
        const target = root.querySelector(sel.kind === "container" ? `[data-cid="${sel.id}"]` : `[data-eid="${sel.id}"]`) as HTMLElement | null;
        if (!target) return null;
        const ref = sel.kind === "container"
            ? (root.querySelector(".jugb-inner") as HTMLElement | null)
            : (target.parentElement as HTMLElement | null);
        return { root, target, ref };
    }, [sel]);

    const measure = useCallback(() => {
        if (!canResize) { setBox(null); return; }
        const t = targets();
        if (!t) { setBox(null); return; }
        const rr = t.root.getBoundingClientRect();
        const er = t.target.getBoundingClientRect();
        if (er.width === 0 && er.height === 0) { setBox(null); return; } // hidden on this breakpoint
        const refW = t.ref ? t.ref.getBoundingClientRect().width : er.width;
        setBox({ left: er.left - rr.left, top: er.top - rr.top, width: er.width, height: er.height, pct: refW ? Math.round((er.width / refW) * 100) : 100 });
    }, [canResize, targets]);

    useEffect(() => { measure(); }, [measure, layout, device]);
    useEffect(() => {
        if (!canResize) return;
        window.addEventListener("resize", measure);
        return () => window.removeEventListener("resize", measure);
    }, [canResize, measure]);

    const startDrag = (side: "left" | "right" | "top" | "bottom") => (e: React.PointerEvent) => {
        e.preventDefault(); e.stopPropagation();
        const t = targets(); if (!t || !sel || !onResize) return;
        const horizontal = side === "left" || side === "right";
        const refW = (t.ref ? t.ref.getBoundingClientRect().width : 0) || 1;
        const er = t.target.getBoundingClientRect();
        const aL = er.left, aR = er.right, aT = er.top, aB = er.bottom;
        const prevUserSelect = document.body.style.userSelect;
        document.body.style.userSelect = "none"; document.body.style.cursor = horizontal ? "col-resize" : "row-resize";
        const move = (ev: PointerEvent) => {
            const px = horizontal
                ? Math.max(8, side === "right" ? ev.clientX - aL : aR - ev.clientX)
                : Math.max(8, side === "bottom" ? ev.clientY - aT : aB - ev.clientY);
            const pct = Math.max(5, Math.min(100, Math.round((px / refW) * 100)));
            onResize(sel, { side, px: Math.round(px), pct });
        };
        const up = () => {
            window.removeEventListener("pointermove", move);
            window.removeEventListener("pointerup", up);
            document.body.style.userSelect = prevUserSelect; document.body.style.cursor = "";
        };
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", up);
    };

    if (!layout?.bar) return null;

    // vertical edges (width) and horizontal edges (height)
    const vHandle = (left: number): React.CSSProperties => ({
        position: "absolute", left: left - 4, top: box!.top, height: box!.height, width: 8,
        cursor: "col-resize", zIndex: 20, display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(59,130,246,0.18)", touchAction: "none",
    });
    const hHandle = (top: number): React.CSSProperties => ({
        position: "absolute", top: top - 4, left: box!.left, width: box!.width, height: 8,
        cursor: "row-resize", zIndex: 20, display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(59,130,246,0.18)", touchAction: "none",
    });
    const vGrip: React.CSSProperties = { width: 4, height: Math.min(28, box ? box.height - 6 : 20), borderRadius: 3, background: "#3b82f6", boxShadow: "0 0 0 1px rgba(255,255,255,0.7)" };
    const hGrip: React.CSSProperties = { height: 4, width: Math.min(28, box ? box.width - 6 : 20), borderRadius: 3, background: "#3b82f6", boxShadow: "0 0 0 1px rgba(255,255,255,0.7)" };

    const renderEl = (e: GBElement) => {
        const ring: React.CSSProperties = selectedId === e.id ? { outline: "2px solid #3b82f6", outlineOffset: 1 } : {};
        const cls = `jugb-el jugb-${e.type}${e.type === "sheetMessage" ? " jugb-msg" : ""}`;
        const click = onSelect ? (ev: React.MouseEvent) => { ev.stopPropagation(); onSelect(e.id); } : undefined;
        const baseProps: any = { "data-eid": e.id, className: cls, onClick: click, style: { cursor: onSelect ? "pointer" : undefined, ...ring } };

        if (e.type === "image" || e.type === "sheetImage") {
            const url = (e.type === "sheetImage" ? (offerImageUrl || e.sampleUrl) : e.sampleUrl) || "";
            return <div key={e.id} {...baseProps}>{url
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={url} alt="" />
                : <span style={{ fontSize: 10, opacity: 0.5 }}>image</span>}</div>;
        }
        if (e.type === "timer") {
            const t = e.timer;
            if (!t || !t.endInstant) return <div key={e.id} {...baseProps}><span style={{ fontSize: 10, opacity: 0.5 }}>timer — set end time</span></div>;
            const ms = new Date(t.endInstant).getTime() - Date.now();
            if (ms <= 0 && t.onExpire === "hide") return null;
            const inner = countdownHtml(formatCountdown(ms, t.mode || "days"));
            const label = t.timezone ? `<div style="font-size:10px;opacity:.8;margin-top:3px;">Ends ${formatInTz(t.endInstant, t.timezone)}</div>` : "";
            return <div key={e.id} {...baseProps} dangerouslySetInnerHTML={{ __html: inner + label }} />;
        }
        if (e.type === "close") return <div key={e.id} {...baseProps}>×</div>;
        if (e.type === "html") {
            // sandboxed iframe; pointer-events:none so clicks select the element in the editor
            return <div key={e.id} {...baseProps}><iframe sandbox="allow-scripts" title="custom-html" scrolling="no" srcDoc={buildHtmlSrcdoc(e)} style={{ pointerEvents: "none" }} /></div>;
        }
        if (e.type === "cartGoal") {
            const cg = e.cartGoal || ({} as any);
            return <div key={e.id} {...baseProps} dangerouslySetInnerHTML={{ __html: cartGoalMessage(cg, Number(cg.previewTotal) || 0) }} />;
        }
        if (e.type === "group") {
            const kids = e.children || [];
            return <div key={e.id} {...baseProps}>{kids.length ? kids.map(renderEl) : <span style={{ fontSize: 10, opacity: 0.5 }}>empty group — drop elements</span>}</div>;
        }
        const html = e.type === "sheetMessage" ? (offerHtml || e.sampleHtml || "")
            : e.type === "button" ? (e.content || "Shop now")
            : e.type === "coupon" ? (e.content || e.couponCode || "")
            : (e.content || "");
        return <div key={e.id} {...baseProps} dangerouslySetInnerHTML={{ __html: html }} />;
    };

    return (
        <div id={scopeId} ref={rootRef}>
            <style dangerouslySetInnerHTML={{ __html: css }} />
            <div className="jugb-inner">
                {(layout.containers || []).map((c) => (
                    <div key={c.id} data-cid={c.id} className="jugb-cont"
                        onClick={onSelect ? (ev) => { ev.stopPropagation(); onSelect(c.id); } : undefined}
                        style={selectedId === c.id ? { outline: "2px dashed #22c55e", outlineOffset: 2 } : undefined}>
                        <div className="jugb-cwrap">{(c.elements || []).map(renderEl)}</div>
                    </div>
                ))}
            </div>
            {canResize && box && (
                <>
                    {canWidth && <div onPointerDown={startDrag("left")} style={vHandle(box.left)} title="Drag to resize width"><span style={vGrip} /></div>}
                    {canWidth && <div onPointerDown={startDrag("right")} style={vHandle(box.left + box.width)} title="Drag to resize width"><span style={vGrip} /></div>}
                    <div onPointerDown={startDrag("top")} style={hHandle(box.top)} title="Drag to resize height"><span style={hGrip} /></div>
                    <div onPointerDown={startDrag("bottom")} style={hHandle(box.top + box.height)} title="Drag to resize height"><span style={hGrip} /></div>
                    {canWidth && <div style={{ position: "absolute", left: box.left + box.width / 2 - 20, top: Math.max(2, box.top + 2), zIndex: 21, pointerEvents: "none", background: "#3b82f6", color: "#fff", fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 4 }}>{box.pct}%</div>}
                </>
            )}
        </div>
    );
}
