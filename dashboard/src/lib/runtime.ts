import { Banner, BannerType, RuleCondition, TargetingRules, AdvancedTargetingRules, RuleGroup, AdvancedRuleCondition, RuleOperator } from "./types";

export const FIRST_URL_SESSION_KEY = "demo_first_url_session";
export const FIRST_URL_ALLTIME_KEY = "demo_first_url_alltime";

export function ensureFirstUrls(storage: { session: Storage; local: Storage }, currentUrl: string) {
    try {
        if (!storage?.session?.getItem(FIRST_URL_SESSION_KEY)) {
            storage.session.setItem(FIRST_URL_SESSION_KEY, String(currentUrl || ""));
        }
        if (!storage?.local?.getItem(FIRST_URL_ALLTIME_KEY)) {
            storage.local.setItem(FIRST_URL_ALLTIME_KEY, String(currentUrl || ""));
        }
    } catch {
        // ignore
    }
}

export function getHostSafe(u: string) {
    try {
        return new URL(u).host || "";
    } catch {
        return "";
    }
}

export function matchString(hay: string, op: string, needle: string) {
    hay = String(hay ?? "");
    needle = String(needle ?? "");
    if (op === "equals") return hay === needle;
    if (op === "starts_with") return hay.startsWith(needle);
    if (op === "contains") return hay.includes(needle);
    if (op === "does_not_contain") return !hay.includes(needle);
    return false;
}

export function evalRules({
    rules,
    url,
    referrer,
    device,
    storage,
}: {
    rules?: TargetingRules;
    url: string;
    referrer: string;
    device: string;
    storage: { session: any; local: any };
}) {
    if (!rules?.enabled) return false;

    ensureFirstUrls(storage as any, url);

    const firstUrlSession = storage?.session?.getItem(FIRST_URL_SESSION_KEY) || "";
    const firstUrlAllTime = storage?.local?.getItem(FIRST_URL_ALLTIME_KEY) || "";
    const previousDomainReferringUrl = getHostSafe(referrer);

    for (const c of rules.conditions || []) {
        const type = c.type === "url" ? "current_url" : c.type;

        if (type === "current_url") {
            if (!matchString(url, c.op, c.value || "")) return false;
        }

        if (type === "referring_url") {
            if (!matchString(referrer, c.op, c.value || "")) return false;
        }

        if (type === "previous_domain_referring_url") {
            if (!matchString(previousDomainReferringUrl, c.op, c.value || "")) return false;
        }

        if (type === "first_url_session") {
            if (!matchString(firstUrlSession, c.op, c.value || "")) return false;
        }

        if (type === "first_url_all_time") {
            if (!matchString(firstUrlAllTime, c.op, c.value || "")) return false;
        }

        if (type === "device") {
            if (c.op === "equals" && device !== c.value) return false;
        }

        if (type === "frequency") {
            const key = `banner_shown_${rules.bannerId}`;
            if (c.op === "once_per_session") {
                if (storage.session.getItem(key)) return false;
            }
            if (c.op === "once_per_day") {
                const stamp = storage.local.getItem(key);
                const today = new Date().toISOString().slice(0, 10);
                if (stamp === today) return false;
            }
        }
    }

    return true;
}

export function markShown({ rules, storage }: { rules: TargetingRules; storage: { session: any; local: any } }) {
    const key = `banner_shown_${rules.bannerId}`;
    const freq = (rules.conditions || []).find((c) => c.type === "frequency")?.op;
    if (freq === "once_per_session") storage.session.setItem(key, "1");
    if (freq === "once_per_day") {
        const today = new Date().toISOString().slice(0, 10);
        storage.local.setItem(key, today);
    }
}

// ============================================================================
// ADVANCED RULE ENGINE EVALUATION
// ============================================================================

/**
 * Evaluate a single advanced condition
 */
function evaluateAdvancedCondition(
    condition: AdvancedRuleCondition,
    context: {
        currentUrl: string;
        firstUrl: string;
        referringUrl: string;
        previousDomainReferringUrl: string;
    }
): boolean {
    let value = '';

    // Get the value to test based on condition type
    switch (condition.type) {
        case 'current_url':
            value = context.currentUrl;
            break;
        case 'first_url':
            value = context.firstUrl;
            break;
        case 'referring_url':
            value = context.referringUrl;
            break;
        case 'previous_domain_referring_url':
            value = context.previousDomainReferringUrl;
            break;
        default:
            return false;
    }

    // Apply the operator
    return applyOperator(value, condition.operator, condition.value);
}

/**
 * Apply an operator to compare two values
 */
function applyOperator(haystack: string, operator: RuleOperator, needle: string): boolean {
    haystack = String(haystack || '').toLowerCase();
    needle = String(needle || '').toLowerCase();

    switch (operator) {
        case 'contains':
            return haystack.includes(needle);

        case 'does_not_contain':
            return !haystack.includes(needle);

        case 'is_equal_to':
            return haystack === needle;

        case 'is_not_equal_to':
            return haystack !== needle;

        case 'matches_regex':
            try {
                const regex = new RegExp(needle);
                return regex.test(haystack);
            } catch {
                return false;
            }

        case 'matches_wildcard':
            // Convert wildcard to regex (* becomes .*, ? becomes .)
            const wildcardRegex = needle
                .replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escape special chars
                .replace(/\*/g, '.*') // * becomes .*
                .replace(/\?/g, '.'); // ? becomes .
            try {
                const regex = new RegExp(`^${wildcardRegex}$`);
                return regex.test(haystack);
            } catch {
                return false;
            }

        default:
            return false;
    }
}

/**
 * Evaluate a rule group (conditions combined with AND/OR)
 */
function evaluateRuleGroup(
    group: RuleGroup,
    context: {
        currentUrl: string;
        firstUrl: string;
        referringUrl: string;
        previousDomainReferringUrl: string;
    }
): boolean {
    if (group.conditions.length === 0) {
        return true; // Empty group passes
    }

    const results = group.conditions.map(cond => evaluateAdvancedCondition(cond, context));

    if (group.conditionOperator === 'AND') {
        return results.every(r => r === true);
    } else {
        return results.some(r => r === true);
    }
}

/**
 * Evaluate advanced targeting rules with nested groups
 */
export function evalAdvancedRules({
    rules,
    url,
    referrer,
    storage,
}: {
    rules?: AdvancedTargetingRules;
    url: string;
    referrer: string;
    storage: { session: any; local: any };
}): boolean {
    if (!rules?.enabled) return false;

    ensureFirstUrls(storage as any, url);

    const firstUrl = storage?.session?.getItem(FIRST_URL_SESSION_KEY) || '';

    const context = {
        currentUrl: url,
        firstUrl: firstUrl,
        referringUrl: referrer,
        previousDomainReferringUrl: getHostSafe(referrer),
    };

    if (rules.ruleGroups.length === 0) {
        return true; // No rules means show banner
    }

    const groupResults = rules.ruleGroups.map(group => evaluateRuleGroup(group, context));

    if (rules.groupOperator === 'AND') {
        return groupResults.every(r => r === true);
    } else {
        return groupResults.some(r => r === true);
    }
}
