import { CSSProperties } from "react";

export type BannerType = "top_bar" | "modal";
export type BannerStatus = "draft" | "published";

export type LayerType =
    | "text"
    | "image"
    | "icon"
    | "button"
    | "email_form"
    | "consent_checkbox"
    | "push_notification"
    | "sms_signup"
    | "video"
    | "coupon_box"
    | "close_button"
    | "commerce_ai"
    | "spin_to_win"
    | "timer"
    | "slot_machine"
    | "scratch_off"
    | "text_ticker"
    | "fb_messenger"
    | "html"
    | "shape"
    | "input"; // for plugins and legacy generic

export interface Layer {
    id: string;
    type: LayerType;
    name: string; // User-friendly name
    visible: boolean; // Toggle visibility
    content: string; // text content or image URL
    position: { x: number; y: number };
    positionUnits?: { x: 'px' | '%'; y: 'px' | '%' }; // Default to 'px'
    size: { width: number; height: number };
    sizeUnits?: { width: 'px' | '%'; height: 'px' | '%' }; // Default to 'px'

    style: CSSProperties;
    rotation?: number; // deg
    scaleX?: number; // 1 or -1
    scaleY?: number; // 1 or -1
    fixedPosition?: string; // e.g., 'top-left'
    metadata?: Record<string, any>; // For extra configs like timer display settings
}

export interface ViewConfig {
    width?: number; // Canvas width (mostly for mobile/desktop simulation)
    height: number;
    background: string;
    backgroundImage?: string;
    backgroundOpacity?: number; // 0-1
    // Border & Spacing
    borderWidth?: number;
    borderColor?: string;
    borderStyle?: string;
    borderRadius?: number;
    boxShadow?: string;
    padding?: number;
    layers: Layer[];
}

export interface Banner {
    id: string;
    name: string;
    status: BannerStatus;
    type: BannerType;
    views: {
        desktop: ViewConfig;
        tablet?: ViewConfig;
        mobile?: ViewConfig;
    };
}

export interface GlobalBannerConfig {
    id: string;
    name: string;
    enabled: boolean;
    sheetUrl: string;
    creativeJson: Banner;
    offerLayerId?: string | null;
    offerImageLayerId?: string | null;
    styleJson?: { headingColor?: string; bodyColor?: string } | null;
    rulesJson?: any;
    layoutJson?: GlobalBannerLayout | null;
    priority?: number;
}

// ---- Flex layout builder (responsive, per-breakpoint) ------------------
export type GBDevice = "desktop" | "tablet" | "mobile";
export type GBElementType =
    | "text" | "sheetMessage" | "sheetImage" | "image"
    | "button" | "coupon" | "timer" | "close"
    | "group" // a nested flex group: holds child elements as columns (row) or rows (column)
    | "html" // custom HTML/CSS/JS, rendered in a sandboxed iframe (isolated)
    | "cartGoal"; // cart-value threshold messaging (reads Shopify /cart.js live)

// A value with per-breakpoint overrides; mobile inherits tablet inherits desktop.
export interface GBResponsive<T> { desktop: T; tablet?: Partial<T>; mobile?: Partial<T>; }

// Independent per-side padding & margin (T/R/B/L). Falls back to legacy paddingX/paddingY.
export interface GBSpacing {
    padTop?: number; padRight?: number; padBottom?: number; padLeft?: number;
    marginTop?: number; marginRight?: number; marginBottom?: number; marginLeft?: number;
    hidden?: boolean; // per-breakpoint visibility (own-bucket, NOT inherited): hide on this device
}

// Note: extends GBBackground so any element can carry its own background box
// (solid / gradient / image) plus boxRadius — independent of the banner/container bg.
export interface GBElStyle extends GBBackground, GBSpacing {
    color?: string; headingColor?: string; bodyColor?: string;
    fontSize?: number; fontWeight?: number | string; fontStyle?: string;
    textAlign?: string; lineHeight?: number | string; fontFamily?: string;
    paddingX?: number; boxColor?: string; heightPx?: number; // heightPx = element min-height
    boxRadius?: number; // per-element background-box corner radius (px)
    cgHighlightColor?: string; cgHighlightWeight?: number | string; // cartGoal: style for substituted amounts ({remaining}/{total}/{threshold})
    grow?: number; alignSelf?: string; widthPct?: number; // widthPct = element track width as % of its container
    // group ("columns") layout — how a group arranges its children
    direction?: "row" | "column"; justify?: string; align?: string; gap?: number; wrap?: boolean;
    // image / sheetImage box metrics
    width?: number; height?: number; radius?: number; fit?: string;
    // sheetMessage 2nd line (disclaimer)
    line2Color?: string; line2FontSize?: number; line2FontWeight?: number | string; line2FontStyle?: string;
}

// Rich background model shared by the canvas (bar) and containers.
// bgType "solid" => use `background` color; "gradient" => gradient* fields;
// "image" => bgImageUrl (+ optional overlay for readability).
export interface GBBackground {
    bgType?: "solid" | "gradient" | "image";
    background?: string;                       // solid color (also legacy fallback)
    gradientType?: "linear" | "radial";
    gradientAngle?: number;                    // deg, for linear
    gradientFrom?: string; gradientVia?: string; gradientTo?: string;
    bgImageUrl?: string;
    bgImageSize?: string;                      // cover | contain | auto
    bgImagePosition?: string;                  // center | top | bottom | left | right
    bgImageRepeat?: string;                    // no-repeat | repeat
    bgOverlay?: string;                        // rgba(...) overlay laid over the image
}

export interface GBContStyle extends GBBackground, GBSpacing {
    direction?: "row" | "column"; justify?: string; align?: string; gap?: number; wrap?: boolean;
    paddingX?: number; paddingY?: number; grow?: number; widthPct?: number; radius?: number; minHeight?: number;
}

export interface GBBarStyle extends GBBackground, GBSpacing {
    paddingX?: number; paddingY?: number; gap?: number;
    minHeight?: number; maxWidth?: number; direction?: "row" | "column"; align?: string;
}

export interface GBTimer {
    mode: "days" | "hours";       // days+h+m+s  OR  hours-only(+m+s)
    endInstant: string;            // absolute UTC ISO — the countdown target
    inputWall?: string;            // datetime-local string the user typed (assumed IST)
    timezone?: string;             // IANA tz for the displayed label (default Asia/Kolkata)
    showLabels?: boolean;
    onExpire?: "hide" | "stop";
}

// Cart-value threshold messaging. Placeholders in messages: {remaining} {total} {threshold}.
export interface GBCartGoal {
    threshold: number;            // unlock amount in major units (e.g. 60 = £60)
    currencySymbol?: string;      // prefix for amounts (default "£")
    msgEmpty?: string;            // cart total = 0
    msgProgress?: string;         // 0 < total < threshold (use {remaining})
    msgUnlocked?: string;         // total >= threshold
    previewTotal?: number;        // editor-only: sample cart total to preview a state
    wrap?: boolean;               // allow the message to wrap to multiple lines (default: single line / nowrap)
}

export interface GBElement {
    id: string;
    type: GBElementType;
    // global (device-independent) content
    content?: string; sampleHtml?: string; sampleUrl?: string;
    variantId?: string; ctaUrl?: string; ctaNewTab?: boolean; quantity?: number; afterAction?: string;
    couponCode?: string;
    timer?: GBTimer;
    children?: GBElement[]; // for type "group": nested elements laid out as columns/rows
    html?: string; css?: string; js?: string; // for type "html": custom code (sandboxed iframe)
    cartGoal?: GBCartGoal; // for type "cartGoal": cart-value threshold messaging
    // per-breakpoint style + box metrics
    responsive: GBResponsive<GBElStyle>;
}

export interface GBFlexContainer {
    id: string;
    elements: GBElement[];
    responsive: GBResponsive<GBContStyle>;
}

export interface GlobalBannerLayout {
    bar: {
        mobileStack?: boolean;     // stack containers vertically on mobile
        couponCode?: string;       // optional Shopify discount applied on show
        responsive: GBResponsive<GBBarStyle>;
    };
    containers: GBFlexContainer[];
}

export interface RuleCondition {
    type: string;
    op: string;
    value?: string;
}

// ============================================================================
// ADVANCED RULE ENGINE TYPES (New Architecture)
// ============================================================================

export type RuleType = 'current_url' | 'first_url' | 'referring_url' | 'previous_domain_referring_url';

export type RuleOperator =
    | 'contains'
    | 'does_not_contain'
    | 'is_equal_to'
    | 'is_not_equal_to'
    | 'matches_regex'
    | 'matches_wildcard';

export type LogicalOperator = 'AND' | 'OR';

/**
 * Individual rule condition with specific types
 */
export interface AdvancedRuleCondition {
    id: string;
    type: RuleType;
    operator: RuleOperator;
    value: string;
}

/**
 * Group of conditions combined with AND/OR
 */
export interface RuleGroup {
    id: string;
    conditions: AdvancedRuleCondition[];
    conditionOperator: LogicalOperator;  // How to combine conditions within this group
}

/**
 * Complete targeting rules with nested groups
 */
export type TriggerType = 'specific_page' | 'after_pages' | 'exit_intent' | 'scroll_depth';

export interface AdvancedTargetingConfig {
    // Triggers
    trigger: {
        type: TriggerType;
        value?: number; // for pages or scroll %
    };

    // Refine By - Page Rules
    pageRules: {
        showOn: {
            mode: 'any' | 'others';
            urls: { op: 'contains' | 'equals' | 'does_not_contain'; value: string }[];
        };
        dontShowOn: {
            urls: { op: 'contains' | 'equals' | 'does_not_contain'; value: string }[];
        };
    };

    // Refine By - Frequency
    frequency: {
        onEveryPage: boolean;
        oncePerSession: boolean;
        onceEver: boolean;
        againEveryXDays: { enabled: boolean; days: number };
    };

    // Refine By - Stop Showing
    stopShowing: {
        never: boolean;
        afterClosedThisVisit: boolean;
        afterEngagementThis: boolean;
        afterEngagementAny: boolean;
        afterShownVisit: { enabled: boolean; times: number };
        afterShownEver: { enabled: boolean; times: number };
    };

    // Choose Who
    audience: {
        mode: 'all' | 'new' | 'returning';
        returningSinceDays?: number;
    };

    // Traffic Source
    trafficSource: {
        showFrom: {
            all: boolean;
            email: boolean;
            facebook: boolean;
            googleOrganic: boolean;
            googleAdwords: boolean;
            others: boolean;
        };
        dontShowFrom: {
            email: boolean;
            facebook: boolean;
            googleOrganic: boolean;
            googleAdwords: boolean;
            others: boolean;
        };
    };

    // Delay
    delay: {
        enabled: boolean;
        seconds: number;
    };
}

/**
 * Complete targeting rules with nested groups
 */
export interface AdvancedTargetingRules {
    bannerId: string;
    enabled: boolean;
    config: AdvancedTargetingConfig; // The specific UI state
    ruleGroups?: RuleGroup[]; // Custom rule groups from Rule Builder
    groupOperator?: LogicalOperator; // How to combine custom rule groups
}

export interface TargetingRules {
    bannerId: string;
    enabled: boolean;
    conditions: RuleCondition[];
}

export interface ABTest {
    id: string;
    name: string;
    device: 'desktop' | 'mobile';
    startDate: string; // ISO string
    endDate: string; // ISO string
    baselineId: string;
    baselinePercentage: number;
    variants: {
        bannerId: string; // 'control' for Control Group, or banner ID
        percentage: number;
    }[];
    status: 'draft' | 'scheduled' | 'running' | 'ended';
}

export interface AccountData {
    accountId: string;
    banners: Banner[];
    rules: (TargetingRules | AdvancedTargetingRules)[];
    abTests: ABTest[];
    events: any[];
}

// ============================================================================
// RESPONSIVE TYPES (New Architecture)
// ============================================================================

export type DeviceType = "desktop" | "tablet" | "mobile";

/**
 * A property that can have different values for different devices
 */
export interface ResponsiveProperty<T> {
    base: T; // Default value (typically desktop)
    overrides?: {
        tablet?: T;
        mobile?: T;
    };
}

/**
 * Layer with responsive properties
 * This is the new architecture that supports device-specific overrides
 */
export interface ResponsiveLayer {
    id: string;
    type: LayerType;
    name: string;
    visible: boolean;

    // Content is shared across devices (no responsive override needed typically)
    content: string;

    // Responsive properties
    position: ResponsiveProperty<{ x: number; y: number }>;
    size: ResponsiveProperty<{ width: number; height: number }>;
    style: ResponsiveProperty<CSSProperties>;
    metadata?: ResponsiveProperty<Record<string, any>>;
}

/**
 * View config with responsive properties
 */
export interface ResponsiveViewConfig {
    // Canvas-level responsive properties
    width?: ResponsiveProperty<number>;
    height: ResponsiveProperty<number>;
    background: ResponsiveProperty<string>;
    backgroundImage?: ResponsiveProperty<string>;
    backgroundOpacity?: ResponsiveProperty<number>;
    borderWidth?: ResponsiveProperty<number>;
    borderColor?: ResponsiveProperty<string>;
    borderStyle?: ResponsiveProperty<string>;
    borderRadius?: ResponsiveProperty<number>;
    boxShadow?: ResponsiveProperty<string>;
    padding?: ResponsiveProperty<number>;

    // Layers with responsive properties
    layers: ResponsiveLayer[];
}

/**
 * Banner with responsive architecture
 */
export interface ResponsiveBanner {
    id: string;
    name: string;
    status: BannerStatus;
    type: BannerType;

    // Single view config with responsive properties
    view: ResponsiveViewConfig;

    // Canvas dimensions for preview (not responsive, just viewport sizes)
    canvasSizes?: {
        desktop: { width: number; height: number };
        tablet: { width: number; height: number };
        mobile: { width: number; height: number };
    };
}
