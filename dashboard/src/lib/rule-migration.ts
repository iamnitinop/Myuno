/**
 * Rule Migration Utilities
 * 
 * Provides functions to migrate between old (flat conditions) and new (nested groups) rule formats.
 */

import {
    TargetingRules,
    AdvancedTargetingRules,
    RuleGroup,
    AdvancedRuleCondition,
    RuleType,
    RuleOperator
} from "./types";
import { uid } from "./utils";

/**
 * Migrate old flat rules to new nested group structure
 */
export function migrateToAdvancedRules(oldRules: TargetingRules): AdvancedTargetingRules {
    // Convert old conditions to advanced conditions
    const advancedConditions: AdvancedRuleCondition[] = oldRules.conditions.map(cond => ({
        id: `cond_${uid()}`,
        type: mapOldTypeToNew(cond.type),
        operator: mapOldOpToNew(cond.op),
        value: cond.value || '',
    }));

    // Create a single group with all conditions (AND logic by default)
    const singleGroup: RuleGroup = {
        id: `group_${uid()}`,
        conditions: advancedConditions,
        conditionOperator: 'AND',
    };

    return {
        bannerId: oldRules.bannerId,
        enabled: oldRules.enabled,
        ruleGroups: advancedConditions.length > 0 ? [singleGroup] : [],
        groupOperator: 'AND',
    };
}

/**
 * Map old rule type to new RuleType
 */
function mapOldTypeToNew(oldType: string): RuleType {
    switch (oldType) {
        case 'current_url':
            return 'current_url';
        case 'first_url':
        case 'first_url_session':
            return 'first_url';
        case 'referring_url':
        case 'referrer':
            return 'referring_url';
        default:
            return 'current_url'; // Default fallback
    }
}

/**
 * Map old operator to new RuleOperator
 */
function mapOldOpToNew(oldOp: string): RuleOperator {
    switch (oldOp) {
        case 'contains':
            return 'contains';
        case 'does_not_contain':
        case 'not_contains':
            return 'does_not_contain';
        case 'is':
        case 'equals':
        case 'is_equal_to':
            return 'is_equal_to';
        case 'is_not':
        case 'not_equals':
        case 'is_not_equal_to':
            return 'is_not_equal_to';
        case 'matches_regex':
        case 'regex':
            return 'matches_regex';
        case 'matches_wildcard':
        case 'wildcard':
            return 'matches_wildcard';
        default:
            return 'contains'; // Default fallback
    }
}

/**
 * Convert advanced rules back to old format (for backward compatibility)
 */
export function migrateFromAdvancedRules(advancedRules: AdvancedTargetingRules): TargetingRules {
    // Flatten all conditions from all groups
    const flatConditions = advancedRules.ruleGroups.flatMap(group =>
        group.conditions.map(cond => ({
            type: cond.type,
            op: cond.operator,
            value: cond.value,
        }))
    );

    return {
        bannerId: advancedRules.bannerId,
        enabled: advancedRules.enabled,
        conditions: flatConditions,
    };
}

/**
 * Check if rules are using the new advanced format
 */
export function isAdvancedRules(rules: any): rules is AdvancedTargetingRules {
    return rules && 'ruleGroups' in rules && Array.isArray(rules.ruleGroups);
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
 * Create a new empty rule group
 */
export function createEmptyRuleGroup(): RuleGroup {
    return {
        id: `group_${uid()}`,
        conditions: [],
        conditionOperator: 'AND',
    };
}

/**
 * Create a new empty condition
 */
export function createEmptyCondition(): AdvancedRuleCondition {
    return {
        id: `cond_${uid()}`,
        type: 'current_url',
        operator: 'contains',
        value: '',
    };
}

/**
 * Create default advanced rules for a banner
 */
export function createDefaultAdvancedRules(bannerId: string): AdvancedTargetingRules {
    return {
        bannerId,
        enabled: true,
        ruleGroups: [
            {
                id: `group_${uid()}`,
                conditions: [
                    {
                        id: `cond_${uid()}`,
                        type: 'current_url',
                        operator: 'does_not_contain',
                        value: 'checkout',
                    }
                ],
                conditionOperator: 'AND',
            }
        ],
        groupOperator: 'AND',
    };
}
