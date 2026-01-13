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
        tablet: ViewConfig;
        mobile: ViewConfig;
    };
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
    // We keep specific fields for runtime efficiency if needed, but config is the source of truth for this editor
}

export interface TargetingRules {
    bannerId: string;
    enabled: boolean;
    conditions: RuleCondition[];
}

export interface AccountData {
    accountId: string;
    banners: Banner[];
    rules: (TargetingRules | AdvancedTargetingRules)[];
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
