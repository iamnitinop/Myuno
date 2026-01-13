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

// ============================================================================
// ADVANCED RULE ENGINE EVALUATION
// ============================================================================

function checkUrlRules(url: string, rules: { op: string, value: string }[]) {
    if (!rules || rules.length === 0) return true;
    // If one matches, it's true (OR logic typically for inclusion lists)
    return rules.some(r => matchString(url, r.op, r.value));
}

function checkTrafficSource(referrer: string, sources: any) {
    if (sources.all) return true;

    // Simple heuristics for sources
    const ref = referrer.toLowerCase();
    const isGoogle = ref.includes('google.com') || ref.includes('google.');
    const isFacebook = ref.includes('facebook.com') || ref.includes('fb.com');
    // const isEmail = ref.includes('mail.') || ref.includes('outlook.') || ref.includes('gmail.'); // Hard to detect email strictly from referrer often, but let's try

    // For email, it's often UTM params, but we are checking referrer here. 
    // Let's assume URL params are passed in Context or we just check referrer for now.

    if (sources.googleOrganic && isGoogle && !ref.includes('aclk')) return true; // simplified
    if (sources.googleAdwords && isGoogle && ref.includes('aclk')) return true;
    if (sources.facebook && isFacebook) return true;
    // ... others

    // If others is selected and it matches none of high level
    if (sources.others && !isGoogle && !isFacebook) return true;

    return false;
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

    const config = rules.config;
    if (!config) return true; // Should not happen but fail open or closed? Open is usually better for testing.

    ensureFirstUrls(storage as any, url);

    // 1. Triggers (Simulator logic vs Real Runtime)
    // For specific page:
    if (config.trigger.type === 'specific_page') {
        // This is redundant with Page Rules usually, but if set, we treat it as an implicit "Show on this page" 
        // But usually Trigger "On Specific Page" implies "Any Page" unless Refine By says otherwise.
        // Let's assume Refine By is the source of truth for URL matching.
    }
    // For "After X pages"
    if (config.trigger.type === 'after_pages') {
        // Check session page view count. 
        // Note: Implementing page count tracking in simulator is out of scope for just this file, 
        // but we can assume if it's not implemented, we might skip.
        // Or simplified:
        const views = Number(storage.session.getItem('page_views') || 1);
        if (views < (config.trigger.value || 0)) return false;
    }

    // 2. Refine By - Page Rules
    if (config.pageRules.showOn.mode === 'others') {
        const matchesShow = checkUrlRules(url, config.pageRules.showOn.urls);
        if (!matchesShow) return false;
    }

    // Dont show on
    const matchesDontShow = checkUrlRules(url, config.pageRules.dontShowOn.urls);
    if (matchesDontShow && config.pageRules.dontShowOn.urls.length > 0 && config.pageRules.dontShowOn.urls[0].value) return false;


    // 3. Frequency & Stop Showing
    const shownKey = `banner_shown_${rules.bannerId}`;
    const closedKey = `banner_closed_${rules.bannerId}`;

    // Check "Stop Showing" - Never
    if (config.stopShowing.never) return false;

    // Stop: After closed this visit
    if (config.stopShowing.afterClosedThisVisit && storage.session.getItem(closedKey)) return false;

    // Frequency: Once per session
    if (config.frequency.oncePerSession && storage.session.getItem(shownKey)) return false;

    // Frequency: Once ever
    if (config.frequency.onceEver && storage.local.getItem(shownKey)) return false;

    // Frequency: Again every X days
    if (config.frequency.againEveryXDays.enabled) {
        const lastShown = storage.local.getItem(shownKey); // timestamp
        if (lastShown) {
            const daysDiff = (Date.now() - Number(lastShown)) / (1000 * 60 * 60 * 24);
            if (daysDiff < config.frequency.againEveryXDays.days) return false;
        }
    }

    // Stop: After shown X times THIS visit
    if (config.stopShowing.afterShownVisit.enabled) {
        const count = Number(storage.session.getItem(shownKey + '_count') || 0);
        if (count >= config.stopShowing.afterShownVisit.times) return false;
    }

    // Stop: After shown X times EVER
    if (config.stopShowing.afterShownEver.enabled) {
        const count = Number(storage.local.getItem(shownKey + '_count') || 0);
        if (count >= config.stopShowing.afterShownEver.times) return false;
    }


    // 4. Audience
    // New vs Returning
    const firstVisit = storage.local.getItem('first_visit_ts');
    const isNew = !firstVisit;

    if (config.audience.mode === 'new' && !isNew) return false;
    if (config.audience.mode === 'returning') {
        if (isNew) return false;
        // Check days
        if (firstVisit) {
            const days = (Date.now() - Number(firstVisit)) / (1000 * 60 * 60 * 24);
            if (days < (config.audience.returningSinceDays || 0)) return false;
        }
    }

    // 5. Traffic Source
    if (!config.trafficSource.showFrom.all) {
        if (!checkTrafficSource(referrer, config.trafficSource.showFrom)) return false;
    }
    if (checkTrafficSource(referrer, config.trafficSource.dontShowFrom) && !config.trafficSource.dontShowFrom.email && !config.trafficSource.dontShowFrom.facebook /* check if any exclusions are actually enabled */) {
        const sources = config.trafficSource.dontShowFrom;
        if (sources.email || sources.facebook || sources.googleOrganic || sources.googleAdwords || sources.others) {
            if (checkTrafficSource(referrer, sources)) return false;
        }
    }

    return true;
}

/**
 * Update storage after a banner is shown
 */
export function markAdvancedShown({ rules, storage }: { rules: AdvancedTargetingRules; storage: { session: any; local: any } }) {
    if (!rules?.enabled || !rules.config) return;

    const bannerId = rules.bannerId;
    const shownKey = `banner_shown_${bannerId}`;
    const timestamp = Date.now();

    // Session count
    const sessionCount = Number(storage.session.getItem(shownKey + '_count') || 0);
    storage.session.setItem(shownKey + '_count', String(sessionCount + 1));
    storage.session.setItem(shownKey, String(timestamp));

    // Lifetime check (Local Storage)
    const localCount = Number(storage.local.getItem(shownKey + '_count') || 0);
    storage.local.setItem(shownKey + '_count', String(localCount + 1));
    storage.local.setItem(shownKey, String(timestamp));

    // First visit tracking (if not set)
    if (!storage.local.getItem('first_visit_ts')) {
        storage.local.setItem('first_visit_ts', String(timestamp));
    }
}

/**
 * Update storage after a banner is closed
 */
export function markAdvancedClosed({ rules, storage }: { rules: AdvancedTargetingRules; storage: { session: any; local: any } }) {
    if (!rules?.enabled) return;
    const key = `banner_closed_${rules.bannerId}`;
    storage.session.setItem(key, "1");
}
