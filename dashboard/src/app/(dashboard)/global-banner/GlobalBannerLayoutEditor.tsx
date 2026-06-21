"use client";

import React, { useState } from "react";
import { DndContext, useDraggable, useDroppable, PointerSensor, useSensor, useSensors, DragOverlay } from "@dnd-kit/core";
import { GlobalBannerLayout, GBFlexContainer, GBElement, GBElementType, GBDevice } from "@/lib/types";
import { uid } from "@/lib/utils";
import { previewGlobalBanner } from "@/lib/api";
import { GlobalBannerPreview } from "./GlobalBannerPreview";
import { resolve, istWallToInstant, formatInTz, TZ_OPTIONS } from "./bannerCss";
import { Pill } from "@/components/ui/Pill";
import { Loader2, Search, Plus, Trash2, ChevronUp, ChevronDown, GripVertical, Type, Image as ImageIcon, FileText, MousePointerClick, Ticket, Clock, X, Columns, Eye, EyeOff, Code2, Gift } from "lucide-react";

// ---------- field helpers ----------
function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return <label className="block"><span className="block text-[11px] font-semibold text-gray-500 mb-1">{label}</span>{children}</label>;
}
const inputCls = "w-full text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1.5";
const TextIn = (p: any) => <input className={inputCls} {...p} />;
const NumIn = ({ value, onChange, ...p }: any) => <input type="number" className={inputCls} value={value ?? ""} onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))} {...p} />;
function ColorIn({ value, onChange }: { value?: string; onChange: (v: string) => void }) {
    return <div className="flex items-center gap-2">
        <input type="color" value={value || "#000000"} onChange={(e) => onChange(e.target.value)} className="h-8 w-9 rounded border border-gray-300 dark:border-gray-700 bg-transparent shrink-0" />
        <input className={inputCls} value={value || ""} onChange={(e) => onChange(e.target.value)} />
    </div>;
}
function SelIn({ value, onChange, options }: { value?: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
    return <select className={inputCls} value={value || ""} onChange={(e) => onChange(e.target.value)}>{options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>;
}
function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
    return <div className="flex items-center justify-between"><span className="text-xs font-medium text-gray-600 dark:text-gray-300">{label}</span>
        <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${checked ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"}`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : "translate-x-0.5"}`} /></button></div>;
}
const ALIGN = [{ value: "left", label: "Left" }, { value: "center", label: "Center" }, { value: "right", label: "Right" }];
const JUSTIFY = [{ value: "flex-start", label: "Start" }, { value: "center", label: "Center" }, { value: "flex-end", label: "End" }, { value: "space-between", label: "Space between" }, { value: "space-around", label: "Space around" }];
const ALIGNI = [{ value: "center", label: "Center" }, { value: "flex-start", label: "Start" }, { value: "flex-end", label: "End" }, { value: "stretch", label: "Stretch" }];
const BG_TYPES = [{ value: "solid", label: "Solid color" }, { value: "gradient", label: "Gradient" }, { value: "image", label: "Image (URL)" }];
const BG_SIZE = [{ value: "cover", label: "Cover" }, { value: "contain", label: "Contain" }, { value: "auto", label: "Auto" }];
const BG_POS = [{ value: "center", label: "Center" }, { value: "top", label: "Top" }, { value: "bottom", label: "Bottom" }, { value: "left", label: "Left" }, { value: "right", label: "Right" }];
const BG_REPEAT = [{ value: "no-repeat", label: "No repeat" }, { value: "repeat", label: "Tile" }];

// Reusable background designer for the canvas (bar) and containers: solid / gradient / image-URL.
// When `perDevice` is provided, the Image section exposes one URL per breakpoint (Desktop /
// Tablet / Mobile) — tablet/mobile fall back to the larger breakpoint's image when left blank.
function BackgroundControls({ r, set, perDevice }: { r: any; set: (p: any) => void; perDevice?: { resp: any; setDev: (dev: GBDevice, patch: any) => void } }) {
    const type = r.bgType || "solid";
    return (
        <div className="space-y-2 rounded-md border border-gray-200 dark:border-gray-700 p-2.5">
            <Field label="Background type"><SelIn value={type} onChange={(v) => set({ bgType: v })} options={BG_TYPES} /></Field>
            {type === "solid" && <Field label="Color"><ColorIn value={r.background} onChange={(v) => set({ background: v })} /></Field>}
            {type === "gradient" && (<>
                <div className="grid grid-cols-2 gap-2">
                    <Field label="Style"><SelIn value={r.gradientType || "linear"} onChange={(v) => set({ gradientType: v })} options={[{ value: "linear", label: "Linear" }, { value: "radial", label: "Radial" }]} /></Field>
                    {(r.gradientType || "linear") === "linear" && <Field label="Angle°"><NumIn value={r.gradientAngle ?? 90} onChange={(v: number) => set({ gradientAngle: v })} /></Field>}
                </div>
                <div className="grid grid-cols-3 gap-2">
                    <Field label="From"><ColorIn value={r.gradientFrom} onChange={(v) => set({ gradientFrom: v })} /></Field>
                    <Field label="Via (opt)"><ColorIn value={r.gradientVia} onChange={(v) => set({ gradientVia: v })} /></Field>
                    <Field label="To"><ColorIn value={r.gradientTo} onChange={(v) => set({ gradientTo: v })} /></Field>
                </div>
            </>)}
            {type === "image" && (<>
                {perDevice ? (
                    <div className="space-y-1.5 rounded-md bg-gray-50 dark:bg-gray-900/40 p-2">
                        <div className="text-[10px] text-gray-500 leading-snug">Separate image per screen. Leave Tablet/Mobile blank to reuse the larger screen's image.</div>
                        {DEVICES.map((d) => (
                            <Field key={d} label={d[0].toUpperCase() + d.slice(1) + " image URL"}>
                                <TextIn value={perDevice.resp?.[d]?.bgImageUrl || ""} placeholder={d === "desktop" ? "https://…/desktop.jpg" : "blank = inherit larger screen"}
                                    onChange={(e: any) => perDevice.setDev(d, e.target.value ? { bgImageUrl: e.target.value, bgType: "image" } : { bgImageUrl: undefined })} />
                            </Field>
                        ))}
                    </div>
                ) : (
                    <Field label="Image URL"><TextIn value={r.bgImageUrl || ""} placeholder="https://…/bg.jpg" onChange={(e: any) => set({ bgImageUrl: e.target.value })} /></Field>
                )}
                <div className="grid grid-cols-2 gap-2">
                    <Field label="Size"><SelIn value={r.bgImageSize || "cover"} onChange={(v) => set({ bgImageSize: v })} options={BG_SIZE} /></Field>
                    <Field label="Position"><SelIn value={r.bgImagePosition || "center"} onChange={(v) => set({ bgImagePosition: v })} options={BG_POS} /></Field>
                </div>
                <Field label="Repeat"><SelIn value={r.bgImageRepeat || "no-repeat"} onChange={(v) => set({ bgImageRepeat: v })} options={BG_REPEAT} /></Field>
                <Field label="Dark overlay (optional — for text readability)"><TextIn value={r.bgOverlay || ""} placeholder="rgba(0,0,0,0.35)" onChange={(e: any) => set({ bgOverlay: e.target.value })} /></Field>
            </>)}
        </div>
    );
}

const PALETTE: { type: GBElementType; label: string; icon: any }[] = [
    { type: "text", label: "Text", icon: Type },
    { type: "sheetMessage", label: "Sheet message", icon: FileText },
    { type: "sheetImage", label: "Sheet image", icon: ImageIcon },
    { type: "image", label: "Image", icon: ImageIcon },
    { type: "button", label: "Button", icon: MousePointerClick },
    { type: "coupon", label: "Coupon", icon: Ticket },
    { type: "timer", label: "Timer", icon: Clock },
    { type: "close", label: "Close", icon: X },
    { type: "group", label: "Columns", icon: Columns },
    { type: "html", label: "HTML / Code", icon: Code2 },
    { type: "cartGoal", label: "Cart Goal", icon: Gift },
];

function newElement(type: GBElementType): GBElement {
    const id = "el_" + uid();
    switch (type) {
        case "text": return { id, type, content: "New text", responsive: { desktop: { color: "#ffffff", fontSize: 18, fontWeight: 600, textAlign: "left" } } };
        case "sheetMessage": return { id, type, sampleHtml: "<p>Sample offer <strong>20% Off</strong></p><p>Disclaimer line.</p>", responsive: { desktop: { color: "#ffffff", bodyColor: "#ffffff", fontSize: 16, textAlign: "center", lineHeight: 1.35, grow: 1, line2FontSize: 13, line2FontStyle: "italic" } } };
        case "sheetImage": return { id, type, responsive: { desktop: { width: 64, height: 64, radius: 50, fit: "cover" } } };
        case "image": return { id, type, sampleUrl: "", responsive: { desktop: { width: 80, height: 40, radius: 0, fit: "contain" } } };
        case "button": return { id, type, content: "Shop now", ctaUrl: "", afterAction: "cart", quantity: 1, responsive: { desktop: { color: "#111111", fontWeight: 700, fontSize: 14, paddingX: 14 } } };
        case "coupon": return { id, type, content: "SAVE20", couponCode: "SAVE20", responsive: { desktop: { color: "#ffffff", fontWeight: 700, fontSize: 14 } } };
        case "timer": return { id, type, timer: { mode: "days", endInstant: "", inputWall: "", timezone: "Asia/Kolkata", showLabels: true, onExpire: "hide" }, responsive: { desktop: { color: "#ffffff", boxColor: "rgba(255,255,255,0.15)", fontSize: 16 } } };
        case "close": return { id, type, responsive: { desktop: { color: "#ffffff", fontSize: 18 } } };
        case "group": return { id, type, children: [], responsive: { desktop: { direction: "row", justify: "center", align: "center", gap: 12, grow: 1 } } };
        case "html": return {
            id, type,
            html: '<div class="cc">Custom HTML 👋</div>',
            css: '.cc{padding:10px 14px;font:600 15px system-ui,sans-serif;color:#fff;background:#3a34f2;border-radius:8px;text-align:center}',
            js: '',
            responsive: { desktop: { grow: 1, heightPx: 48 } },
        };
        case "cartGoal": return {
            id, type,
            cartGoal: {
                threshold: 60, currencySymbol: "£",
                msgEmpty: "Today: free gift on orders above {threshold}",
                msgProgress: "Add <strong>{remaining}</strong> more to unlock your free gift",
                msgUnlocked: "🎉 Congratulations — you've unlocked your free gift!",
                previewTotal: 45,
            },
            responsive: { desktop: { color: "#ffffff", fontSize: 14, fontWeight: 600, textAlign: "center", grow: 1 } },
        };
        default: return { id, type, responsive: { desktop: {} } };
    }
}

// ---------- recursive element-tree helpers (group.children nesting) ----------
function elFind(els: GBElement[] | undefined, id: string): GBElement | null {
    for (const e of els || []) { if (e.id === id) return e; const r = elFind(e.children, id); if (r) return r; }
    return null;
}
function elPatch(els: GBElement[], id: string, patch: any): GBElement[] {
    return els.map((e) => (e.id === id ? { ...e, ...patch } : e.children ? { ...e, children: elPatch(e.children, id, patch) } : e));
}
function elPatchResp(els: GBElement[], id: string, mk: (resp: any) => any): GBElement[] {
    return els.map((e) => (e.id === id ? { ...e, responsive: mk(e.responsive) } : e.children ? { ...e, children: elPatchResp(e.children, id, mk) } : e));
}
function elRemove(els: GBElement[], id: string): GBElement[] {
    return els.filter((e) => e.id !== id).map((e) => (e.children ? { ...e, children: elRemove(e.children, id) } : e));
}
function elMove(els: GBElement[], id: string, dir: number): GBElement[] {
    const i = els.findIndex((e) => e.id === id);
    if (i >= 0) { const j = i + dir; if (j < 0 || j >= els.length) return els; const arr = els.slice(); const [m] = arr.splice(i, 1); arr.splice(j, 0, m); return arr; }
    return els.map((e) => (e.children ? { ...e, children: elMove(e.children, id, dir) } : e));
}
function elExtract(els: GBElement[], id: string): { rest: GBElement[]; moved: GBElement | null } {
    let moved: GBElement | null = null;
    const rest: GBElement[] = [];
    for (const e of els) {
        if (e.id === id) { moved = e; continue; }
        if (e.children && !moved) { const r = elExtract(e.children, id); if (r.moved) { moved = r.moved; rest.push({ ...e, children: r.rest }); continue; } }
        rest.push(e);
    }
    return { rest, moved };
}
function elAddInto(els: GBElement[], groupId: string, newEl: GBElement): GBElement[] {
    return els.map((e) => {
        if (e.id === groupId && e.type === "group") return { ...e, children: [...(e.children || []), newEl] };
        if (e.children) return { ...e, children: elAddInto(e.children, groupId, newEl) };
        return e;
    });
}
function newContainer(): GBFlexContainer {
    return { id: "c_" + uid(), elements: [], responsive: { desktop: { direction: "row", justify: "center", align: "center", gap: 12 } } };
}
const elLabel = (e: GBElement) => PALETTE.find((p) => p.type === e.type)?.label || e.type;

// ---------- DnD pieces ----------
function PaletteChip({ type, label, Icon }: { type: GBElementType; label: string; Icon: any }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: "new:" + type });
    return <button ref={setNodeRef} {...listeners} {...attributes}
        className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-medium cursor-grab active:cursor-grabbing hover:border-blue-400 ${isDragging ? "opacity-40" : ""}`}>
        <Icon className="w-3.5 h-3.5 text-gray-500" /> {label}</button>;
}
function ElementChip({ el, selected, hidden, onSelect, onDelete, onUp, onDown, onToggleVis }: any) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: el.id });
    return <div ref={setNodeRef} onClick={(e) => { e.stopPropagation(); onSelect(); }}
        className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md border text-xs cursor-pointer ${selected ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"} ${isDragging ? "opacity-40" : ""} ${hidden ? "opacity-50" : ""}`}>
        <span {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing text-gray-400"><GripVertical className="w-3.5 h-3.5" /></span>
        <span className={`flex-1 truncate font-medium ${hidden ? "line-through" : ""}`}>{elLabel(el)}</span>
        <button onClick={(e) => { e.stopPropagation(); onToggleVis(); }} title={hidden ? "Hidden on this screen — click to show" : "Visible — click to hide on this screen"} className={hidden ? "text-amber-500" : "text-gray-400 hover:text-gray-700"}>{hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}</button>
        <button onClick={(e) => { e.stopPropagation(); onUp(); }} className="text-gray-400 hover:text-gray-700"><ChevronUp className="w-3.5 h-3.5" /></button>
        <button onClick={(e) => { e.stopPropagation(); onDown(); }} className="text-gray-400 hover:text-gray-700"><ChevronDown className="w-3.5 h-3.5" /></button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
    </div>;
}
function ContainerDrop({ container, children, selected, hidden, onSelect, onDelete, onToggleVis }: any) {
    const { setNodeRef, isOver } = useDroppable({ id: container.id });
    return <div className={`rounded-lg border p-2 ${selected ? "border-green-500" : "border-dashed border-gray-300 dark:border-gray-700"} ${isOver ? "bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-400" : ""} ${hidden ? "opacity-50" : ""}`}
        onClick={(e) => { e.stopPropagation(); onSelect(); }}>
        <div className="flex items-center justify-between mb-1.5">
            <span className={`text-[11px] font-bold uppercase tracking-wide text-gray-500 ${hidden ? "line-through" : ""}`}>Container</span>
            <div className="flex items-center gap-1">
                <button onClick={(e) => { e.stopPropagation(); onToggleVis(); }} title={hidden ? "Hidden on this screen — click to show" : "Visible — click to hide on this screen"} className={hidden ? "text-amber-500" : "text-gray-400 hover:text-gray-700"}>{hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}</button>
                <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
        </div>
        <div ref={setNodeRef} className="space-y-1.5 min-h-[36px]">{children}</div>
    </div>;
}
// One row in the structure tree; if it's a group, renders a nested droppable for its children.
function ElementTreeNode({ el, sel, device, onSel, onDel, onUp, onDown, onVis }: any) {
    const hidden = !!(el.responsive?.[device]?.hidden);
    return (
        <>
            <ElementChip el={el} selected={sel.kind === "element" && sel.id === el.id} hidden={hidden}
                onSelect={() => onSel(el.id)} onDelete={() => onDel(el.id)} onUp={() => onUp(el.id)} onDown={() => onDown(el.id)} onToggleVis={() => onVis(el.id, !hidden)} />
            {el.type === "group" && <GroupDropArea group={el} sel={sel} device={device} onSel={onSel} onDel={onDel} onUp={onUp} onDown={onDown} onVis={onVis} />}
        </>
    );
}
function GroupDropArea({ group, sel, device, onSel, onDel, onUp, onDown, onVis }: any) {
    const { setNodeRef, isOver } = useDroppable({ id: group.id });
    return (
        <div ref={setNodeRef} className={`ml-3 mt-1 mb-1 pl-2 py-1 border-l-2 space-y-1.5 ${isOver ? "border-blue-400 bg-blue-50/60 dark:bg-blue-900/20" : "border-gray-200 dark:border-gray-700"}`}>
            <div className="text-[10px] font-semibold text-gray-400">COLUMNS — drop elements here</div>
            {(group.children || []).length === 0 && <div className="text-[10px] text-gray-400 italic py-1">empty</div>}
            {(group.children || []).map((ch: GBElement) => (
                <ElementTreeNode key={ch.id} el={ch} sel={sel} device={device} onSel={onSel} onDel={onDel} onUp={onUp} onDown={onDown} onVis={onVis} />
            ))}
        </div>
    );
}

// Box-model side inputs (T/R/B/L) with an optional link-all toggle.
function SideInputs({ r, set, keys }: { r: any; set: (p: any) => void; keys: string[] }) {
    const [linked, setLinked] = useState(false);
    const labels = ["T", "R", "B", "L"];
    const onChange = (k: string, v: number | undefined) => {
        if (linked) { const all: any = {}; keys.forEach((kk) => (all[kk] = v)); set(all); }
        else set({ [k]: v });
    };
    return (
        <div>
            <div className="flex justify-end mb-1">
                <button type="button" onClick={() => setLinked(!linked)} title="Link all sides"
                    className={`text-[10px] px-1.5 py-0.5 rounded border ${linked ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 dark:border-gray-700 text-gray-500"}`}>{linked ? "🔗 linked" : "per-side"}</button>
            </div>
            <div className="grid grid-cols-4 gap-1">
                {keys.map((k, i) => (
                    <div key={k}>
                        <div className="text-[10px] text-gray-400 text-center mb-0.5">{labels[i]}</div>
                        <input type="number" className="w-full text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-1 py-1 text-center"
                            value={r[k] ?? ""} onChange={(e) => onChange(k, e.target.value === "" ? undefined : Number(e.target.value))} />
                    </div>
                ))}
            </div>
        </div>
    );
}
function SpacingControls({ r, set, margin }: { r: any; set: (p: any) => void; margin?: boolean }) {
    return (
        <div className="space-y-2 rounded-md border border-gray-200 dark:border-gray-700 p-2.5">
            <div className="text-[11px] font-semibold text-gray-500">Padding (inner)</div>
            <SideInputs r={r} set={set} keys={["padTop", "padRight", "padBottom", "padLeft"]} />
            {margin && (<>
                <div className="text-[11px] font-semibold text-gray-500 pt-1">Margin (outer)</div>
                <SideInputs r={r} set={set} keys={["marginTop", "marginRight", "marginBottom", "marginLeft"]} />
            </>)}
        </div>
    );
}

// Auto height (fit content) vs a fixed/min height. Auto sets an explicit 0 on THIS breakpoint —
// 0 reads as "no min height → fit content" AND overrides any height inherited from a larger
// breakpoint (clearing to undefined would just re-inherit it). Best-practice default.
function HeightControl({ value, onChange, autoLabel = "Auto height (fit content)", fixedLabel = "Fixed height (px)" }: { value?: number; onChange: (v: number | undefined) => void; autoLabel?: string; fixedLabel?: string }) {
    const auto = !value;
    return (
        <div className="space-y-1.5 rounded-md border border-gray-200 dark:border-gray-700 p-2.5">
            <Toggle label={autoLabel} checked={auto} onChange={(v) => onChange(v ? 0 : (value || 80))} />
            {!auto && <Field label={fixedLabel + " — or drag top/bottom edge"}><NumIn value={value} onChange={(v: number) => onChange(v)} /></Field>}
        </div>
    );
}

const DEVICES: GBDevice[] = ["desktop", "tablet", "mobile"];

export function GlobalBannerLayoutEditor({ layout, onChange, id, sheetUrl }: { layout: GlobalBannerLayout; onChange: (l: GlobalBannerLayout) => void; id: string; sheetUrl: string }) {
    const [device, setDevice] = useState<GBDevice>("desktop");
    const [sel, setSel] = useState<{ kind: "bar" | "container" | "element"; id: string }>({ kind: "bar", id: "bar" });
    const [testHandle, setTestHandle] = useState("");
    const [fetched, setFetched] = useState<{ offerHtml?: string; offerImageUrl?: string }>({});
    const [fetching, setFetching] = useState(false);
    const [fetchMsg, setFetchMsg] = useState("");
    const [activeDrag, setActiveDrag] = useState<string | null>(null);
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    const bar = layout.bar;
    const containers = layout.containers || [];

    // write a style patch into responsive[device] (only that breakpoint)
    const patchResp = (resp: any, patch: any): any => {
        if (device === "desktop") return { ...resp, desktop: { ...resp.desktop, ...patch } };
        return { ...resp, [device]: { ...(resp[device] || {}), ...patch } };
    };
    const setBarStyle = (patch: any) => onChange({ ...layout, bar: { ...bar, responsive: patchResp(bar.responsive, patch) } });
    const setBar = (patch: any) => onChange({ ...layout, bar: { ...bar, ...patch } });
    const setContainers = (cs: GBFlexContainer[]) => onChange({ ...layout, containers: cs });
    const setContStyle = (cid: string, patch: any) => setContainers(containers.map((c) => (c.id === cid ? { ...c, responsive: patchResp(c.responsive, patch) } : c)));
    const updateElement = (eid: string, patch: any) => setContainers(containers.map((c) => ({ ...c, elements: elPatch(c.elements, eid, patch) })));
    const setElStyle = (eid: string, patch: any) => setContainers(containers.map((c) => ({ ...c, elements: elPatchResp(c.elements, eid, (resp) => patchResp(resp, patch)) })));

    // Same as above but targeting an ARBITRARY device's bucket (for per-device background images).
    const patchRespDev = (resp: any, dev: GBDevice, patch: any): any =>
        dev === "desktop" ? { ...resp, desktop: { ...resp.desktop, ...patch } } : { ...resp, [dev]: { ...(resp[dev] || {}), ...patch } };
    const setBarStyleDev = (dev: GBDevice, patch: any) => onChange({ ...layout, bar: { ...bar, responsive: patchRespDev(bar.responsive, dev, patch) } });
    const setContStyleDev = (cid: string, dev: GBDevice, patch: any) => setContainers(containers.map((c) => (c.id === cid ? { ...c, responsive: patchRespDev(c.responsive, dev, patch) } : c)));
    const setElStyleDev = (eid: string, dev: GBDevice, patch: any) => setContainers(containers.map((c) => ({ ...c, elements: elPatchResp(c.elements, eid, (resp) => patchRespDev(resp, dev, patch)) })));

    const addContainer = () => { const c = newContainer(); setContainers([...containers, c]); setSel({ kind: "container", id: c.id }); };
    const removeContainer = (cid: string) => { setContainers(containers.filter((c) => c.id !== cid)); setSel({ kind: "bar", id: "bar" }); };
    const removeElement = (eid: string) => setContainers(containers.map((c) => ({ ...c, elements: elRemove(c.elements, eid) })));
    const moveElementIdx = (eid: string, dir: number) => setContainers(containers.map((c) => ({ ...c, elements: elMove(c.elements, eid, dir) })));

    const onDragEnd = (event: any) => {
        setActiveDrag(null);
        const activeId = String(event.active?.id || "");
        const overId = event.over?.id ? String(event.over.id) : "";
        if (!overId) return;
        const isContainer = !!containers.find((c) => c.id === overId);
        const overEl = isContainer ? null : elFind(containers.flatMap((c) => c.elements), overId);
        const isGroup = !!overEl && overEl.type === "group";
        if (!isContainer && !isGroup) return;
        if (activeId.indexOf("new:") === 0) {
            const el = newElement(activeId.slice(4) as GBElementType);
            if (isContainer) setContainers(containers.map((c) => (c.id === overId ? { ...c, elements: [...c.elements, el] } : c)));
            else setContainers(containers.map((c) => ({ ...c, elements: elAddInto(c.elements, overId, el) })));
            setSel({ kind: "element", id: el.id });
        } else {
            // guard: never drop a group into itself or its own descendant
            const peek = elFind(containers.flatMap((c) => c.elements), activeId);
            if (peek && (peek.id === overId || (peek.children && elFind(peek.children, overId)))) return;
            let moved: GBElement | null = null;
            const stripped = containers.map((c) => { const r = elExtract(c.elements, activeId); if (r.moved) moved = r.moved; return { ...c, elements: r.rest }; });
            if (!moved) return;
            const m = moved as GBElement;
            if (isContainer) setContainers(stripped.map((c) => (c.id === overId ? { ...c, elements: [...c.elements, m] } : c)));
            else setContainers(stripped.map((c) => ({ ...c, elements: elAddInto(c.elements, overId, m) })));
        }
    };

    const fetchHandle = async () => {
        if (!testHandle.trim()) return;
        setFetching(true); setFetchMsg("");
        try {
            const res = await previewGlobalBanner(id, testHandle.trim(), sheetUrl.trim() || undefined);
            if (res && res.found) { setFetched({ offerHtml: res.offerHtml || "", offerImageUrl: res.offerImageUrl || "" }); setFetchMsg(`Loaded "${testHandle.trim()}" · Sale Active: ${res.saleActive ? "TRUE" : "FALSE"}`); }
            else { setFetched({}); setFetchMsg(res?.reason === "sheet-fetch-failed" ? "Sheet not public/readable" : "No matching row — showing sample"); }
        } catch (e) { setFetchMsg((e as Error).message); } finally { setFetching(false); }
    };

    const selEl = sel.kind === "element" ? elFind(containers.flatMap((c) => c.elements), sel.id) : null;
    const selCont = sel.kind === "container" ? containers.find((c) => c.id === sel.id) : null;
    const barR: any = resolve(bar.responsive, device);

    return (
        <DndContext sensors={sensors} onDragStart={(e) => setActiveDrag(String(e.active.id))} onDragEnd={onDragEnd}>
            <div className="flex h-full">
                {/* LEFT: palette + structure */}
                <div className="w-[300px] shrink-0 overflow-y-auto border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-3 space-y-4">
                    <div>
                        <div className="text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-2">Elements — drag into a container</div>
                        <div className="grid grid-cols-2 gap-1.5">{PALETTE.map((p) => <PaletteChip key={p.type} type={p.type} label={p.label} Icon={p.icon} />)}</div>
                    </div>
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <div className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Containers</div>
                            <button onClick={addContainer} className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"><Plus className="w-3.5 h-3.5" /> Add</button>
                        </div>
                        <div className="space-y-2">
                            {containers.map((c) => (
                                <ContainerDrop key={c.id} container={c} selected={sel.kind === "container" && sel.id === c.id} hidden={!!(c.responsive?.[device]?.hidden)}
                                    onSelect={() => setSel({ kind: "container", id: c.id })} onDelete={() => removeContainer(c.id)} onToggleVis={() => setContStyle(c.id, { hidden: !(c.responsive?.[device]?.hidden) })}>
                                    {c.elements.length === 0 && <div className="text-[11px] text-gray-400 italic px-1 py-2">Drop elements here</div>}
                                    {c.elements.map((e) => (
                                        <ElementTreeNode key={e.id} el={e} sel={sel} device={device}
                                            onSel={(id: string) => setSel({ kind: "element", id })}
                                            onDel={(id: string) => removeElement(id)} onUp={(id: string) => moveElementIdx(id, -1)} onDown={(id: string) => moveElementIdx(id, 1)}
                                            onVis={(id: string, hide: boolean) => setElStyle(id, { hidden: hide })} />
                                    ))}
                                </ContainerDrop>
                            ))}
                        </div>
                    </div>
                </div>

                {/* CENTER: preview */}
                <div className="flex-1 overflow-y-auto bg-gray-100 dark:bg-black/30">
                    <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-2.5 border-b border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur">
                        <button onClick={() => setSel({ kind: "bar", id: "bar" })} className={`text-xs font-medium px-2.5 py-1.5 rounded-md ${sel.kind === "bar" ? "bg-blue-600 text-white" : "border border-gray-300 dark:border-gray-700"}`}>Canvas</button>
                        <div className="flex items-center gap-1">
                            {DEVICES.map((d) => <Pill key={d} active={device === d} onClick={() => setDevice(d)}>{d[0].toUpperCase() + d.slice(1)}</Pill>)}
                        </div>
                        <div className="flex items-center gap-2 ml-auto">
                            <input className={inputCls + " w-40"} placeholder="test handle" value={testHandle} onChange={(e) => setTestHandle(e.target.value)} />
                            <button onClick={fetchHandle} disabled={fetching} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 text-white text-xs font-medium disabled:opacity-60">
                                {fetching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />} Fetch from sheet
                            </button>
                        </div>
                    </div>
                    <div className="px-4 py-1.5 text-xs text-gray-500">Editing <b className="text-blue-600">{device}</b> — changes apply only to this breakpoint. {fetchMsg}</div>
                    <div className="p-6">
                        <div className={(device === "mobile" ? "max-w-[420px]" : device === "tablet" ? "max-w-[820px]" : "max-w-full") + " mx-auto rounded-lg overflow-hidden shadow-lg border border-gray-300 dark:border-gray-700"}>
                            <GlobalBannerPreview layout={layout} device={device} offerHtml={fetched.offerHtml} offerImageUrl={fetched.offerImageUrl}
                                selectedId={sel.kind !== "bar" ? sel.id : undefined}
                                onSelect={(eid) => { const isC = containers.some((c) => c.id === eid); setSel({ kind: isC ? "container" : "element", id: eid }); }}
                                onResize={(info, ch) => {
                                    const horizontal = ch.side === "left" || ch.side === "right";
                                    if (info.kind === "container") {
                                        if (horizontal) setContStyle(info.id, { widthPct: ch.pct, grow: 0 });
                                        else setContStyle(info.id, { minHeight: Math.max(0, ch.px) });
                                    } else if (info.type === "image" || info.type === "sheetImage") {
                                        setElStyle(info.id, horizontal ? { width: Math.max(8, ch.px) } : { height: Math.max(8, ch.px) });
                                    } else {
                                        if (horizontal) setElStyle(info.id, { widthPct: ch.pct, grow: 0 });
                                        else setElStyle(info.id, { heightPx: Math.max(0, ch.px) });
                                    }
                                }} />
                            <div className="bg-white dark:bg-gray-900 p-6">
                                <div className="h-7 w-40 rounded bg-gray-200 dark:bg-gray-800 mb-3" />
                                <div className="space-y-2"><div className="h-3 w-5/6 rounded bg-gray-100 dark:bg-gray-800" /><div className="h-3 w-3/6 rounded bg-gray-100 dark:bg-gray-800" /></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT: properties (operate on the active breakpoint) */}
                <div className="w-[300px] shrink-0 overflow-y-auto border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-3 space-y-3">
                    <div className="text-[10px] text-gray-400">Editing breakpoint: <b className="text-gray-600 dark:text-gray-300">{device}</b></div>
                    {sel.kind === "bar" && (
                        <>
                            <div className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Canvas (the bar that holds all containers)</div>
                            <BackgroundControls r={barR} set={setBarStyle} perDevice={{ resp: bar.responsive, setDev: setBarStyleDev }} />
                            <Field label="Gap"><NumIn value={barR.gap} onChange={(v: number) => setBarStyle({ gap: v })} /></Field>
                            <HeightControl value={barR.minHeight} onChange={(v) => setBarStyle({ minHeight: v })} autoLabel="Auto height (canvas fits content)" />
                            <Field label="Content max width (px, 0=full)"><NumIn value={barR.maxWidth} onChange={(v: number) => setBarStyle({ maxWidth: v })} /></Field>
                            <SpacingControls r={barR} set={setBarStyle} />
                            <div className="grid grid-cols-2 gap-2">
                                <Field label="Direction"><SelIn value={barR.direction || "row"} onChange={(v) => setBarStyle({ direction: v })} options={[{ value: "row", label: "Row" }, { value: "column", label: "Column" }]} /></Field>
                                <Field label="Align"><SelIn value={barR.align} onChange={(v) => setBarStyle({ align: v })} options={ALIGNI} /></Field>
                            </div>
                            <Toggle label="Stack on mobile (global)" checked={!!bar.mobileStack} onChange={(v) => setBar({ mobileStack: v })} />
                            <Field label="Coupon code (auto-applied on show — global)"><TextIn value={bar.couponCode || ""} onChange={(e: any) => setBar({ couponCode: e.target.value })} /></Field>
                        </>
                    )}

                    {selCont && (() => { const cr: any = resolve(selCont.responsive, device); return (
                        <>
                            <div className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Container (flex)</div>
                            <Toggle label={`Visible on ${device}`} checked={!(selCont.responsive?.[device]?.hidden)} onChange={(v) => setContStyle(selCont.id, { hidden: !v })} />
                            <Field label="Direction"><SelIn value={cr.direction} onChange={(v) => setContStyle(selCont.id, { direction: v })} options={[{ value: "row", label: "Row" }, { value: "column", label: "Column" }]} /></Field>
                            <Field label="Justify content"><SelIn value={cr.justify} onChange={(v) => setContStyle(selCont.id, { justify: v })} options={JUSTIFY} /></Field>
                            <Field label="Align items"><SelIn value={cr.align} onChange={(v) => setContStyle(selCont.id, { align: v })} options={ALIGNI} /></Field>
                            <div className="grid grid-cols-2 gap-2">
                                <Field label="Gap"><NumIn value={cr.gap} onChange={(v: number) => setContStyle(selCont.id, { gap: v })} /></Field>
                                <Field label="Grow"><NumIn value={cr.grow} onChange={(v: number) => setContStyle(selCont.id, { grow: v })} /></Field>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <Field label="Width % (100 = full screen)"><NumIn value={cr.widthPct} onChange={(v: number) => setContStyle(selCont.id, { widthPct: v })} /></Field>
                                <Field label="Corner radius (px)"><NumIn value={cr.radius} onChange={(v: number) => setContStyle(selCont.id, { radius: v })} /></Field>
                            </div>
                            <HeightControl value={cr.minHeight} onChange={(v) => setContStyle(selCont.id, { minHeight: v })} autoLabel="Auto height (fits content)" />
                            <div className="flex items-center"><Toggle label="Wrap items" checked={!!cr.wrap} onChange={(v) => setContStyle(selCont.id, { wrap: v })} /></div>
                            <SpacingControls r={cr} set={(p) => setContStyle(selCont.id, p)} margin />
                            <div className="text-[11px] font-bold uppercase tracking-wide text-gray-500 pt-1">Background</div>
                            <BackgroundControls r={cr} set={(p) => setContStyle(selCont.id, p)} perDevice={{ resp: selCont.responsive, setDev: (d, p) => setContStyleDev(selCont.id, d, p) }} />
                        </>
                    ); })()}

                    {selEl && (<>
                        <Toggle label={`Visible on ${device}`} checked={!(selEl.responsive?.[device]?.hidden)} onChange={(v) => setElStyle(selEl.id, { hidden: !v })} />
                        <ElementProps el={selEl} r={resolve(selEl.responsive, device)} setStyle={(p: any) => setElStyle(selEl.id, p)} setEl={(p: any) => updateElement(selEl.id, p)}
                            perDevice={{ resp: selEl.responsive, setDev: (d: GBDevice, p: any) => setElStyleDev(selEl.id, d, p) }} />
                    </>)}
                </div>
            </div>

            <DragOverlay>{activeDrag ? <div className="px-2.5 py-2 rounded-lg bg-blue-600 text-white text-xs font-medium shadow-lg">{activeDrag.indexOf("new:") === 0 ? PALETTE.find((p) => p.type === activeDrag.slice(4))?.label : "Move element"}</div> : null}</DragOverlay>
        </DndContext>
    );
}

function ElementProps({ el, r, setStyle, setEl, perDevice }: { el: GBElement; r: any; setStyle: (p: any) => void; setEl: (p: any) => void; perDevice?: { resp: any; setDev: (dev: GBDevice, patch: any) => void } }) {
    const typography = (
        <>
            <Field label="Color"><ColorIn value={r.color} onChange={(v) => setStyle({ color: v })} /></Field>
            <div className="grid grid-cols-2 gap-2">
                <Field label="Font size"><NumIn value={r.fontSize} onChange={(v: number) => setStyle({ fontSize: v })} /></Field>
                <Field label="Weight"><NumIn value={r.fontWeight} onChange={(v: number) => setStyle({ fontWeight: v })} /></Field>
            </div>
            <Field label="Align"><SelIn value={r.textAlign} onChange={(v) => setStyle({ textAlign: v })} options={ALIGN} /></Field>
        </>
    );
    return (
        <>
            <div className="text-[11px] font-bold uppercase tracking-wide text-gray-500">{elLabel(el)}</div>
            {el.type !== "image" && el.type !== "sheetImage" && el.type !== "close" ? (
                <div className="grid grid-cols-2 gap-2">
                    <Field label="Width % (drag edges)"><NumIn value={r.widthPct} onChange={(v: number) => setStyle({ widthPct: v, grow: v ? 0 : r.grow })} /></Field>
                    <Field label="Grow (fill)"><NumIn value={r.grow} onChange={(v: number) => setStyle({ grow: v, widthPct: v ? undefined : r.widthPct })} /></Field>
                </div>
            ) : el.type !== "close" ? (
                <Field label="Grow (fill width)"><NumIn value={r.grow} onChange={(v: number) => setStyle({ grow: v })} /></Field>
            ) : null}
            {!!r.widthPct && el.type !== "image" && el.type !== "sheetImage" && (
                <button type="button" onClick={() => setStyle({ widthPct: undefined })} className="text-[11px] text-blue-600 hover:text-blue-700">↺ Reset to auto width</button>
            )}

            {el.type === "text" && (<><Field label="Text / HTML"><TextIn value={el.content || ""} onChange={(e: any) => setEl({ content: e.target.value })} /></Field>{typography}</>)}

            {el.type === "sheetMessage" && (<>
                <Field label="Sample text (editor only — live uses sheet)"><textarea className={inputCls + " h-20"} value={el.sampleHtml || ""} onChange={(e) => setEl({ sampleHtml: e.target.value })} /></Field>
                <div className="grid grid-cols-2 gap-2">
                    <Field label="Heading color"><ColorIn value={r.headingColor} onChange={(v) => setStyle({ headingColor: v })} /></Field>
                    <Field label="Body color"><ColorIn value={r.bodyColor} onChange={(v) => setStyle({ bodyColor: v })} /></Field>
                </div>
                {typography}
                <div className="mt-1 pt-2 border-t border-gray-200 dark:border-gray-700 text-[11px] font-bold uppercase tracking-wide text-gray-500">Second line</div>
                <Field label="Color"><ColorIn value={r.line2Color} onChange={(v) => setStyle({ line2Color: v })} /></Field>
                <div className="grid grid-cols-2 gap-2">
                    <Field label="Font size"><NumIn value={r.line2FontSize} onChange={(v: number) => setStyle({ line2FontSize: v })} /></Field>
                    <Field label="Style"><SelIn value={r.line2FontStyle} onChange={(v) => setStyle({ line2FontStyle: v })} options={[{ value: "normal", label: "Normal" }, { value: "italic", label: "Italic" }]} /></Field>
                </div>
            </>)}

            {(el.type === "image" || el.type === "sheetImage") && (<>
                {el.type === "image" && <Field label="Image URL"><TextIn value={el.sampleUrl || ""} onChange={(e: any) => setEl({ sampleUrl: e.target.value })} /></Field>}
                {el.type === "sheetImage" && <Field label="Sample URL (editor only)"><TextIn value={el.sampleUrl || ""} onChange={(e: any) => setEl({ sampleUrl: e.target.value })} /></Field>}
                <div className="grid grid-cols-2 gap-2">
                    <Field label="Width"><NumIn value={r.width} onChange={(v: number) => setStyle({ width: v })} /></Field>
                    <Field label="Height"><NumIn value={r.height} onChange={(v: number) => setStyle({ height: v })} /></Field>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <Field label="Radius %"><NumIn value={r.radius} onChange={(v: number) => setStyle({ radius: v })} /></Field>
                    <Field label="Fit"><SelIn value={r.fit} onChange={(v) => setStyle({ fit: v })} options={[{ value: "cover", label: "cover" }, { value: "contain", label: "contain" }]} /></Field>
                </div>
            </>)}

            {el.type === "button" && (<>
                <Field label="Button text"><TextIn value={el.content || ""} onChange={(e: any) => setEl({ content: e.target.value })} /></Field>
                <Field label="CTA URL (blank = add-to-cart)"><TextIn value={el.ctaUrl || ""} onChange={(e: any) => setEl({ ctaUrl: e.target.value })} /></Field>
                <Field label="Variant ID (add to cart)"><TextIn value={el.variantId || ""} onChange={(e: any) => setEl({ variantId: e.target.value })} /></Field>
                <div className="grid grid-cols-2 gap-2">
                    <Field label="Quantity"><NumIn value={el.quantity} onChange={(v: number) => setEl({ quantity: v })} /></Field>
                    <Field label="After add"><SelIn value={el.afterAction} onChange={(v) => setEl({ afterAction: v })} options={[{ value: "cart", label: "Cart" }, { value: "checkout", label: "Checkout" }, { value: "stay", label: "Stay" }]} /></Field>
                </div>
                {typography}
            </>)}

            {el.type === "coupon" && (<>
                <Field label="Displayed code"><TextIn value={el.content || ""} onChange={(e: any) => setEl({ content: e.target.value })} /></Field>
                <Field label="Shopify discount to apply"><TextIn value={el.couponCode || ""} onChange={(e: any) => setEl({ couponCode: e.target.value })} /></Field>
                {typography}
            </>)}

            {el.type === "timer" && <TimerProps el={el} r={r} setStyle={setStyle} setEl={setEl} />}

            {el.type === "group" && (<>
                <Field label="Layout"><SelIn value={r.direction || "row"} onChange={(v) => setStyle({ direction: v })} options={[{ value: "row", label: "Columns (side by side)" }, { value: "column", label: "Rows (stacked)" }]} /></Field>
                <Field label="Justify content"><SelIn value={r.justify} onChange={(v) => setStyle({ justify: v })} options={JUSTIFY} /></Field>
                <Field label="Align items"><SelIn value={r.align} onChange={(v) => setStyle({ align: v })} options={ALIGNI} /></Field>
                <div className="grid grid-cols-2 gap-2">
                    <Field label="Gap"><NumIn value={r.gap} onChange={(v: number) => setStyle({ gap: v })} /></Field>
                    <div className="flex items-end pb-1"><Toggle label="Wrap" checked={!!r.wrap} onChange={(v) => setStyle({ wrap: v })} /></div>
                </div>
                <div className="text-[11px] font-bold uppercase tracking-wide text-gray-500 pt-1">Background</div>
                <BackgroundControls r={r} set={setStyle} perDevice={perDevice} />
                <Field label="Corner radius (px)"><NumIn value={r.boxRadius} onChange={(v: number) => setStyle({ boxRadius: v })} /></Field>
                <div className="text-[10px] text-gray-400">Drag elements into this group from the left panel to make columns.</div>
            </>)}

            {el.type === "cartGoal" && <CartGoalProps el={el} r={r} setStyle={setStyle} setEl={setEl} />}

            {el.type === "html" && (<>
                <div className="text-[11px] text-gray-500 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-2 leading-relaxed">Runs in an isolated sandbox (its CSS/JS can't affect the rest of the banner or page). Set the box height under <b>Spacing &amp; size</b> below.</div>
                <Field label="HTML"><textarea spellCheck={false} className={inputCls + " h-24 font-mono text-xs"} value={el.html || ""} onChange={(e) => setEl({ html: e.target.value })} /></Field>
                <Field label="CSS"><textarea spellCheck={false} className={inputCls + " h-24 font-mono text-xs"} value={el.css || ""} onChange={(e) => setEl({ css: e.target.value })} /></Field>
                <Field label="JavaScript"><textarea spellCheck={false} className={inputCls + " h-24 font-mono text-xs"} value={el.js || ""} onChange={(e) => setEl({ js: e.target.value })} placeholder="// runs inside the sandbox" /></Field>
            </>)}

            {el.type === "close" && (<><Field label="Color"><ColorIn value={r.color} onChange={(v) => setStyle({ color: v })} /></Field><Field label="Font size"><NumIn value={r.fontSize} onChange={(v: number) => setStyle({ fontSize: v })} /></Field></>)}

            {el.type !== "close" && el.type !== "group" && el.type !== "image" && el.type !== "sheetImage" && (
                <div className="pt-2 mt-1 border-t border-gray-200 dark:border-gray-700 space-y-2">
                    <div className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Element background (this breakpoint)</div>
                    <BackgroundControls r={r} set={setStyle} perDevice={perDevice} />
                    <Field label="Corner radius (px)"><NumIn value={r.boxRadius} onChange={(v: number) => setStyle({ boxRadius: v })} /></Field>
                </div>
            )}

            {el.type !== "close" && (
                <div className="pt-2 mt-1 border-t border-gray-200 dark:border-gray-700 space-y-2">
                    <div className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Spacing & size</div>
                    {el.type !== "image" && el.type !== "sheetImage" && (
                        <HeightControl value={r.heightPx} onChange={(v) => setStyle({ heightPx: v })} autoLabel="Auto height (fit content)" />
                    )}
                    <SpacingControls r={r} set={setStyle} margin />
                </div>
            )}
        </>
    );
}

function TimerProps({ el, r, setStyle, setEl }: { el: GBElement; r: any; setStyle: (p: any) => void; setEl: (p: any) => void }) {
    const t = el.timer || ({} as any);
    const setTimer = (patch: any) => setEl({ timer: { ...t, ...patch } });
    const onWall = (wall: string) => setTimer({ inputWall: wall, endInstant: istWallToInstant(wall) });
    return (
        <>
            <Field label="Mode"><SelIn value={t.mode || "days"} onChange={(v) => setTimer({ mode: v })} options={[{ value: "days", label: "Days + Hrs + Min + Sec" }, { value: "hours", label: "Hours + Min + Sec (no days)" }]} /></Field>
            <Field label="End date/time (entered as IST)"><input type="datetime-local" className={inputCls} value={t.inputWall || ""} onChange={(e) => onWall(e.target.value)} /></Field>
            <Field label="Show / convert to timezone"><SelIn value={t.timezone || "Asia/Kolkata"} onChange={(v) => setTimer({ timezone: v })} options={TZ_OPTIONS} /></Field>
            {t.endInstant && (
                <div className="text-[11px] text-gray-500 rounded-md bg-gray-50 dark:bg-gray-900 p-2 leading-relaxed">
                    IST: <b>{formatInTz(t.endInstant, "Asia/Kolkata")}</b><br />
                    {t.timezone && t.timezone !== "Asia/Kolkata" && <>Converted: <b>{formatInTz(t.endInstant, t.timezone)}</b></>}
                </div>
            )}
            <Toggle label="Show labels (days/hrs…)" checked={t.showLabels !== false} onChange={(v) => setTimer({ showLabels: v })} />
            <Field label="When it hits 0"><SelIn value={t.onExpire || "hide"} onChange={(v) => setTimer({ onExpire: v })} options={[{ value: "hide", label: "Hide timer" }, { value: "stop", label: "Freeze at 00" }]} /></Field>
            <div className="mt-1 pt-2 border-t border-gray-200 dark:border-gray-700 text-[11px] font-bold uppercase tracking-wide text-gray-500">Style (this breakpoint)</div>
            <div className="grid grid-cols-2 gap-2">
                <Field label="Digit color"><ColorIn value={r.color} onChange={(v) => setStyle({ color: v })} /></Field>
                <Field label="Box color"><ColorIn value={r.boxColor} onChange={(v) => setStyle({ boxColor: v })} /></Field>
            </div>
            <Field label="Digit size"><NumIn value={r.fontSize} onChange={(v: number) => setStyle({ fontSize: v })} /></Field>
        </>
    );
}

function CartGoalProps({ el, r, setStyle, setEl }: { el: GBElement; r: any; setStyle: (p: any) => void; setEl: (p: any) => void }) {
    const cg = (el.cartGoal || {}) as any;
    const setCG = (patch: any) => setEl({ cartGoal: { ...cg, ...patch } });
    return (
        <>
            <div className="text-[11px] text-gray-500 rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-2 leading-relaxed">
                Reads the live Shopify cart total and switches between the 3 messages automatically. Placeholders: <code>{"{remaining}"}</code>, <code>{"{total}"}</code>, <code>{"{threshold}"}</code>. HTML allowed (e.g. <code>&lt;span style=&quot;color:gold&quot;&gt;</code>) to colour any specific words.
            </div>
            <div className="grid grid-cols-2 gap-2">
                <Field label="Unlock threshold"><NumIn value={cg.threshold} onChange={(v: number) => setCG({ threshold: v })} /></Field>
                <Field label="Currency symbol"><TextIn value={cg.currencySymbol ?? "£"} onChange={(e: any) => setCG({ currencySymbol: e.target.value })} /></Field>
            </div>
            <Field label="① Empty cart (total = 0)"><textarea className={inputCls + " h-16"} value={cg.msgEmpty || ""} onChange={(e) => setCG({ msgEmpty: e.target.value })} /></Field>
            <Field label="② In progress (below threshold)"><textarea className={inputCls + " h-16"} value={cg.msgProgress || ""} onChange={(e) => setCG({ msgProgress: e.target.value })} /></Field>
            <Field label="③ Unlocked (at/above threshold)"><textarea className={inputCls + " h-16"} value={cg.msgUnlocked || ""} onChange={(e) => setCG({ msgUnlocked: e.target.value })} /></Field>
            <Field label="Preview cart total (editor only)"><NumIn value={cg.previewTotal} onChange={(v: number) => setCG({ previewTotal: v })} /></Field>

            <div className="mt-1 pt-2 border-t border-gray-200 dark:border-gray-700 text-[11px] font-bold uppercase tracking-wide text-gray-500">Text style (this breakpoint)</div>
            <Toggle label="Keep on one line (wrap only if too narrow)" checked={!cg.wrap} onChange={(v) => setCG({ wrap: !v })} />
            <Field label="Text color (whole message)"><ColorIn value={r.color} onChange={(v) => setStyle({ color: v })} /></Field>
            <div className="grid grid-cols-2 gap-2">
                <Field label="Font size"><NumIn value={r.fontSize} onChange={(v: number) => setStyle({ fontSize: v })} /></Field>
                <Field label="Weight"><NumIn value={r.fontWeight} onChange={(v: number) => setStyle({ fontWeight: v })} /></Field>
            </div>
            <Field label="Align"><SelIn value={r.textAlign} onChange={(v) => setStyle({ textAlign: v })} options={ALIGN} /></Field>
            <div className="mt-1 pt-1 text-[11px] font-bold uppercase tracking-wide text-gray-500">Amount highlight ({"{remaining}"} / {"{total}"} / {"{threshold}"})</div>
            <div className="grid grid-cols-2 gap-2">
                <Field label="Color"><ColorIn value={r.cgHighlightColor} onChange={(v) => setStyle({ cgHighlightColor: v })} /></Field>
                <Field label="Weight"><NumIn value={r.cgHighlightWeight} onChange={(v: number) => setStyle({ cgHighlightWeight: v })} /></Field>
            </div>
        </>
    );
}
