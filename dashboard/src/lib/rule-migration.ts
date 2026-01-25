/**
 * Rule Migration Utilities
 * 
 * Provides functions to migrate between old formats and the new AdvancedTargetingConfig configuration.
 */

import {
    TargetingRules,
    AdvancedTargetingRules,
    AdvancedTargetingConfig
} from "./types";
import { uid } from "./utils";

const defaultConfig: AdvancedTargetingConfig = {
    trigger: { type: 'specific_page' },
    pageRules: {
        showOn: { mode: 'any', urls: [{ op: 'contains', value: '' }] },
        dontShowOn: { urls: [{ op: 'contains', value: '' }] }
    },
    frequency: {
        onEveryPage: false,
        oncePerSession: true,
        onceEver: false,
        againEveryXDays: { enabled: false, days: 3 }
    },
    stopShowing: {
        never: false,
        afterClosedThisVisit: true,
        afterEngagementThis: true,
        afterEngagementAny: false,
        afterShownVisit: { enabled: true, times: 1 },
        afterShownEver: { enabled: true, times: 2 }
    },
    audience: {
        mode: 'all',
        returningSinceDays: 3
    },
    trafficSource: {
        showFrom: { all: true, email: false, facebook: false, googleOrganic: false, googleAdwords: false, others: false },
        dontShowFrom: { email: false, facebook: false, googleOrganic: false, googleAdwords: false, others: false }
    },
    delay: { enabled: false, seconds: 20 }
};

/**
 * Migrate old flat rules to new config structure
 * Note: This determines a safe default state because mapping complex arbitrary rules to the fixed UI structure is ambiguous.
 */
export function migrateToAdvancedRules(oldRules: TargetingRules): AdvancedTargetingRules {
    // Attempt to preserve strict URL targeting if clear
    // But for safety and specific requirements, we default to a clean state 
    // and let the user configure the new powerful options.

    return {
        bannerId: oldRules.bannerId,
        enabled: oldRules.enabled,
        config: JSON.parse(JSON.stringify(defaultConfig)), // Deep copy default
    };
}

/**
 * Convert advanced rules back to old format (Legacy support)
 * This is lossy and primarily for fallbacks.
 */
export function migrateFromAdvancedRules(advancedRules: AdvancedTargetingRules): TargetingRules {
    // We can't easily map back complex config to flat list.
    // Return empty or basic conditions.
    return {
        bannerId: advancedRules.bannerId,
        enabled: advancedRules.enabled,
        conditions: [],
    };
}

/**
 * Check if rules are using the new advanced format
 */
export function isAdvancedRules(rules: any): rules is AdvancedTargetingRules {
    return rules && 'config' in rules;
}

/**
 * Check if rules are using the old format
 */
export function isLegacyRules(rules: any): rules is TargetingRules {
    return rules && 'conditions' in rules && Array.isArray(rules.conditions);
}

/**
 * Ensure rules are in advanced format (migrate if needed)
 */
export function ensureAdvancedRules(rules: TargetingRules | AdvancedTargetingRules): AdvancedTargetingRules {
    if (isAdvancedRules(rules)) {
        return rules;
    }
    return migrateToAdvancedRules(rules as TargetingRules);
}

/**
 * Create default advanced rules for a banner
 */
export function createDefaultAdvancedRules(bannerId: string): AdvancedTargetingRules {
    return {
        bannerId,
        enabled: true,
        config: JSON.parse(JSON.stringify(defaultConfig)),
    };
}

/**
 * Create a new empty rule group
 */
export function createEmptyRuleGroup(): import("./types").RuleGroup {
    return {
        id: uid(),
        conditionOperator: "AND",
        conditions: []
    };
}

/**
 * Create a new empty condition
 */
export function createEmptyCondition(): import("./types").AdvancedRuleCondition {
    return {
        id: uid(),
        type: "current_url",
        operator: "contains",
        value: ""
    };
}
