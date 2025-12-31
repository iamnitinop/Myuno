/**
 * Migration Utilities
 * 
 * Provides functions to migrate between old (separate desktop/mobile views)
 * and new (responsive properties) banner formats.
 */

import {
    Banner,
    Layer,
    ViewConfig,
    ResponsiveBanner,
    ResponsiveLayer,
    ResponsiveViewConfig,
    DeviceType
} from "./types";
import { createResponsiveProperty, toResponsive } from "./responsive";

/**
 * Migrate old banner format to new responsive format
 * Desktop becomes the base, mobile becomes an override
 */
export function migrateToResponsive(oldBanner: Banner): ResponsiveBanner {
    const desktopView = oldBanner.views.desktop;
    const mobileView = oldBanner.views.mobile;

    // Migrate layers
    const responsiveLayers: ResponsiveLayer[] = desktopView.layers.map((desktopLayer) => {
        // Find corresponding mobile layer (by ID or position)
        const mobileLayer = mobileView.layers.find(l => l.id === desktopLayer.id);

        return migrateLayerToResponsive(desktopLayer, mobileLayer);
    });

    // Add any mobile-only layers
    mobileView.layers.forEach((mobileLayer) => {
        const existsInDesktop = desktopView.layers.some(l => l.id === mobileLayer.id);
        if (!existsInDesktop) {
            // This is a mobile-only layer, create with mobile as base
            responsiveLayers.push(migrateLayerToResponsive(mobileLayer, undefined, true));
        }
    });

    // Migrate view config
    const responsiveView: ResponsiveViewConfig = {
        width: desktopView.width !== undefined ? createResponsiveProperty(desktopView.width) : undefined,
        height: migrateProperty(desktopView.height, mobileView.height),
        background: migrateProperty(desktopView.background, mobileView.background),
        backgroundImage: migrateOptionalProperty(desktopView.backgroundImage, mobileView.backgroundImage),
        backgroundOpacity: migrateOptionalProperty(desktopView.backgroundOpacity, mobileView.backgroundOpacity),
        borderWidth: migrateOptionalProperty(desktopView.borderWidth, mobileView.borderWidth),
        borderColor: migrateOptionalProperty(desktopView.borderColor, mobileView.borderColor),
        borderStyle: migrateOptionalProperty(desktopView.borderStyle, mobileView.borderStyle),
        borderRadius: migrateOptionalProperty(desktopView.borderRadius, mobileView.borderRadius),
        boxShadow: migrateOptionalProperty(desktopView.boxShadow, mobileView.boxShadow),
        padding: migrateOptionalProperty(desktopView.padding, mobileView.padding),
        layers: responsiveLayers,
    };

    return {
        id: oldBanner.id,
        name: oldBanner.name,
        status: oldBanner.status,
        type: oldBanner.type,
        view: responsiveView,
        canvasSizes: {
            desktop: { width: desktopView.width || 1200, height: desktopView.height },
            tablet: { width: 768, height: desktopView.height },
            mobile: { width: mobileView.width || 375, height: mobileView.height },
        },
    };
}

/**
 * Migrate a single layer to responsive format
 */
function migrateLayerToResponsive(
    desktopLayer: Layer,
    mobileLayer?: Layer,
    mobileIsBase: boolean = false
): ResponsiveLayer {
    const baseLayer = mobileIsBase ? mobileLayer! : desktopLayer;
    const overrideLayer = mobileIsBase ? undefined : mobileLayer;

    return {
        id: baseLayer.id,
        type: baseLayer.type,
        name: baseLayer.name,
        visible: baseLayer.visible,
        content: baseLayer.content,
        position: migrateProperty(
            desktopLayer.position,
            overrideLayer?.position
        ),
        size: migrateProperty(
            desktopLayer.size,
            overrideLayer?.size
        ),
        style: migrateProperty(
            desktopLayer.style,
            overrideLayer?.style
        ),
        metadata: desktopLayer.metadata || overrideLayer?.metadata
            ? migrateProperty(
                desktopLayer.metadata || {},
                overrideLayer?.metadata
            )
            : undefined,
    };
}

/**
 * Create a responsive property from desktop and mobile values
 */
function migrateProperty<T>(desktopValue: T, mobileValue?: T) {
    const prop = createResponsiveProperty(desktopValue);

    if (mobileValue !== undefined && JSON.stringify(mobileValue) !== JSON.stringify(desktopValue)) {
        prop.overrides = { mobile: mobileValue };
    }

    return prop;
}

/**
 * Migrate optional property
 */
function migrateOptionalProperty<T>(desktopValue?: T, mobileValue?: T) {
    if (desktopValue === undefined && mobileValue === undefined) {
        return undefined;
    }
    return migrateProperty(desktopValue as T, mobileValue);
}

/**
 * Convert responsive banner back to old format (for backward compatibility)
 */
export function migrateFromResponsive(responsiveBanner: ResponsiveBanner): Banner {
    const view = responsiveBanner.view;

    // Extract desktop view
    const desktopView: ViewConfig = {
        width: view.width?.base,
        height: view.height.base,
        background: view.background.base,
        backgroundImage: view.backgroundImage?.base,
        backgroundOpacity: view.backgroundOpacity?.base,
        borderWidth: view.borderWidth?.base,
        borderColor: view.borderColor?.base,
        borderStyle: view.borderStyle?.base,
        borderRadius: view.borderRadius?.base,
        boxShadow: view.boxShadow?.base,
        padding: view.padding?.base,
        layers: view.layers.map(layer => extractLayerForDevice(layer, "desktop")),
    };

    // Extract tablet view
    const tabletView: ViewConfig = {
        width: view.width?.overrides?.tablet ?? view.width?.base,
        height: view.height.overrides?.tablet ?? view.height.base,
        background: view.background.overrides?.tablet ?? view.background.base,
        backgroundImage: view.backgroundImage?.overrides?.tablet ?? view.backgroundImage?.base,
        backgroundOpacity: view.backgroundOpacity?.overrides?.tablet ?? view.backgroundOpacity?.base,
        borderWidth: view.borderWidth?.overrides?.tablet ?? view.borderWidth?.base,
        borderColor: view.borderColor?.overrides?.tablet ?? view.borderColor?.base,
        borderStyle: view.borderStyle?.overrides?.tablet ?? view.borderStyle?.base,
        borderRadius: view.borderRadius?.overrides?.tablet ?? view.borderRadius?.base,
        boxShadow: view.boxShadow?.overrides?.tablet ?? view.boxShadow?.base,
        padding: view.padding?.overrides?.tablet ?? view.padding?.base,
        layers: view.layers.map(layer => extractLayerForDevice(layer, "tablet")),
    };

    // Extract mobile view
    const mobileView: ViewConfig = {
        width: view.width?.overrides?.mobile ?? view.width?.base,
        height: view.height.overrides?.mobile ?? view.height.base,
        background: view.background.overrides?.mobile ?? view.background.base,
        backgroundImage: view.backgroundImage?.overrides?.mobile ?? view.backgroundImage?.base,
        backgroundOpacity: view.backgroundOpacity?.overrides?.mobile ?? view.backgroundOpacity?.base,
        borderWidth: view.borderWidth?.overrides?.mobile ?? view.borderWidth?.base,
        borderColor: view.borderColor?.overrides?.mobile ?? view.borderColor?.base,
        borderStyle: view.borderStyle?.overrides?.mobile ?? view.borderStyle?.base,
        borderRadius: view.borderRadius?.overrides?.mobile ?? view.borderRadius?.base,
        boxShadow: view.boxShadow?.overrides?.mobile ?? view.boxShadow?.base,
        padding: view.padding?.overrides?.mobile ?? view.padding?.base,
        layers: view.layers.map(layer => extractLayerForDevice(layer, "mobile")),
    };

    return {
        id: responsiveBanner.id,
        name: responsiveBanner.name,
        status: responsiveBanner.status,
        type: responsiveBanner.type,
        views: {
            desktop: desktopView,
            tablet: tabletView,
            mobile: mobileView,
        },
    };
}

/**
 * Extract a layer for a specific device
 */
function extractLayerForDevice(responsiveLayer: ResponsiveLayer, device: DeviceType): Layer {
    return {
        id: responsiveLayer.id,
        type: responsiveLayer.type,
        name: responsiveLayer.name,
        visible: responsiveLayer.visible,
        content: responsiveLayer.content,
        position: getValueForDevice(responsiveLayer.position, device),
        size: getValueForDevice(responsiveLayer.size, device),
        style: getValueForDevice(responsiveLayer.style, device),
        metadata: responsiveLayer.metadata
            ? getValueForDevice(responsiveLayer.metadata, device)
            : undefined,
    };
}

/**
 * Get the effective value for a device
 */
function getValueForDevice<T>(prop: any, device: DeviceType): T {
    if (device === "mobile" && prop.overrides?.mobile !== undefined) {
        return prop.overrides.mobile;
    }
    if ((device === "mobile" || device === "tablet") && prop.overrides?.tablet !== undefined) {
        return prop.overrides.tablet;
    }
    return prop.base;
}

/**
 * Check if a banner is using the new responsive format
 */
export function isResponsiveBanner(banner: any): banner is ResponsiveBanner {
    return banner && 'view' in banner && !('views' in banner);
}

/**
 * Check if a banner is using the old format
 */
export function isLegacyBanner(banner: any): banner is Banner {
    return banner && 'views' in banner && !('view' in banner);
}

/**
 * Ensure a banner is in responsive format (migrate if needed)
 */
export function ensureResponsiveBanner(banner: Banner | ResponsiveBanner): ResponsiveBanner {
    if (isResponsiveBanner(banner)) {
        return banner;
    }
    return migrateToResponsive(banner as Banner);
}
