/**
 * React Hooks for Responsive Properties
 * 
 * Custom hooks to manage responsive properties in React components
 */

import { useState, useCallback, useMemo } from "react";
import { DeviceType, ResponsiveProperty } from "@/lib/types";
import {
    getResponsiveValue,
    hasOverride,
    setResponsiveOverride,
    removeResponsiveOverride,
    isFullySynced,
    getValueSource,
} from "@/lib/responsive";

/**
 * Hook to manage a responsive property
 * Returns the current value and functions to update it
 */
export function useResponsiveProperty<T>(
    property: ResponsiveProperty<T>,
    device: DeviceType,
    onChange: (newProperty: ResponsiveProperty<T>) => void
) {
    // Get the effective value for current device
    const value = useMemo(
        () => getResponsiveValue(property, device),
        [property, device]
    );

    // Check if current device has an override
    const isOverridden = useMemo(
        () => hasOverride(property, device),
        [property, device]
    );

    // Check if property is fully synced (no overrides at all)
    const isSynced = useMemo(
        () => isFullySynced(property),
        [property]
    );

    // Get the source device for the current value
    const source = useMemo(
        () => getValueSource(property, device),
        [property, device]
    );

    // Update the value for current device
    const setValue = useCallback(
        (newValue: T) => {
            const updated = setResponsiveOverride(property, device, newValue);
            onChange(updated);
        },
        [property, device, onChange]
    );

    // Remove override for current device (revert to inherited)
    const resetOverride = useCallback(() => {
        const updated = removeResponsiveOverride(property, device);
        onChange(updated);
    }, [property, device, onChange]);

    // Set override for current device (break sync)
    const setOverride = useCallback(
        (newValue: T) => {
            if (device === "desktop") {
                // Can't override desktop, just update base
                setValue(newValue);
            } else {
                const updated = setResponsiveOverride(property, device, newValue);
                onChange(updated);
            }
        },
        [device, setValue, property, onChange]
    );

    return {
        value,
        setValue,
        isOverridden,
        isSynced,
        source,
        resetOverride,
        setOverride,
    };
}

/**
 * Hook to check override status across multiple properties
 * Useful for showing bulk override indicators
 */
export function useOverrideStatus(
    properties: ResponsiveProperty<any>[],
    device: DeviceType
) {
    const hasAnyOverride = useMemo(
        () => properties.some(prop => hasOverride(prop, device)),
        [properties, device]
    );

    const allOverridden = useMemo(
        () => properties.every(prop => hasOverride(prop, device)),
        [properties, device]
    );

    const allSynced = useMemo(
        () => properties.every(prop => isFullySynced(prop)),
        [properties]
    );

    return {
        hasAnyOverride,
        allOverridden,
        allSynced,
    };
}

/**
 * Hook to manage device switching with responsive awareness
 */
export function useResponsiveDevice(initialDevice: DeviceType = "desktop") {
    const [device, setDevice] = useState<DeviceType>(initialDevice);

    const switchDevice = useCallback((newDevice: DeviceType) => {
        setDevice(newDevice);
    }, []);

    const isDesktop = device === "desktop";
    const isTablet = device === "tablet";
    const isMobile = device === "mobile";

    return {
        device,
        setDevice: switchDevice,
        isDesktop,
        isTablet,
        isMobile,
    };
}
