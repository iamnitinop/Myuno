/**
 * Responsive Property Utilities
 * 
 * This module provides utilities for managing responsive properties across devices.
 * Properties can have a base value (desktop) with optional overrides for tablet and mobile.
 */

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
 * Create a responsive property from a base value
 */
export function createResponsiveProperty<T>(baseValue: T): ResponsiveProperty<T> {
    return { base: baseValue };
}

/**
 * Get the effective value for a device, following the inheritance chain:
 * mobile -> tablet -> desktop (base)
 */
export function getResponsiveValue<T>(
    property: ResponsiveProperty<T>,
    device: DeviceType
): T {
    if (device === "mobile" && property.overrides?.mobile !== undefined) {
        return property.overrides.mobile;
    }
    if ((device === "mobile" || device === "tablet") && property.overrides?.tablet !== undefined) {
        return property.overrides.tablet;
    }
    return property.base;
}

/**
 * Check if a device has an override for this property
 */
export function hasOverride<T>(
    property: ResponsiveProperty<T>,
    device: DeviceType
): boolean {
    if (device === "desktop") return false;
    return property.overrides?.[device] !== undefined;
}

/**
 * Set an override value for a specific device
 */
export function setResponsiveOverride<T>(
    property: ResponsiveProperty<T>,
    device: DeviceType,
    value: T
): ResponsiveProperty<T> {
    if (device === "desktop") {
        // Setting desktop value updates the base
        return { ...property, base: value };
    }

    return {
        ...property,
        overrides: {
            ...property.overrides,
            [device]: value,
        },
    };
}

/**
 * Remove an override for a specific device (revert to inherited value)
 */
export function removeResponsiveOverride<T>(
    property: ResponsiveProperty<T>,
    device: DeviceType
): ResponsiveProperty<T> {
    if (device === "desktop") {
        // Can't remove desktop (base) value
        return property;
    }

    const newOverrides = { ...property.overrides };
    delete newOverrides[device];

    return {
        ...property,
        overrides: Object.keys(newOverrides).length > 0 ? newOverrides : undefined,
    };
}

/**
 * Update the base value (desktop) of a responsive property
 */
export function updateResponsiveBase<T>(
    property: ResponsiveProperty<T>,
    value: T
): ResponsiveProperty<T> {
    return { ...property, base: value };
}

/**
 * Check if a property is synced across all devices (no overrides)
 */
export function isFullySynced<T>(property: ResponsiveProperty<T>): boolean {
    return !property.overrides || Object.keys(property.overrides).length === 0;
}

/**
 * Get the source device for a value (where it's defined)
 */
export function getValueSource<T>(
    property: ResponsiveProperty<T>,
    device: DeviceType
): DeviceType {
    if (device === "mobile" && property.overrides?.mobile !== undefined) {
        return "mobile";
    }
    if ((device === "mobile" || device === "tablet") && property.overrides?.tablet !== undefined) {
        return "tablet";
    }
    return "desktop";
}

/**
 * Merge two responsive properties (useful for partial updates)
 */
export function mergeResponsiveProperties<T>(
    original: ResponsiveProperty<T>,
    updates: Partial<ResponsiveProperty<T>>
): ResponsiveProperty<T> {
    return {
        base: updates.base !== undefined ? updates.base : original.base,
        overrides: updates.overrides !== undefined
            ? { ...original.overrides, ...updates.overrides }
            : original.overrides,
    };
}

/**
 * Convert a plain value to a responsive property
 */
export function toResponsive<T>(value: T): ResponsiveProperty<T> {
    return createResponsiveProperty(value);
}

/**
 * Check if a value is already a responsive property
 */
export function isResponsiveProperty<T>(value: any): value is ResponsiveProperty<T> {
    return value && typeof value === 'object' && 'base' in value;
}

/**
 * Ensure a value is a responsive property (convert if needed)
 */
export function ensureResponsive<T>(value: T | ResponsiveProperty<T>): ResponsiveProperty<T> {
    return isResponsiveProperty(value) ? value : toResponsive(value);
}
