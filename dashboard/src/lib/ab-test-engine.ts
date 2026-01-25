import { ABTest } from "./types";
import { LS } from "./utils";

// Simple hash function to deterministically map a string to a number
function hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
}

// Get or create a persistent visitor ID
function getVisitorId(): string {
    if (typeof window === 'undefined') return 'server_side';

    let visitorId = localStorage.getItem('ab_visitor_id');
    if (!visitorId) {
        visitorId = 'v_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
        localStorage.setItem('ab_visitor_id', visitorId);
    }
    return visitorId;
}

/**
 * Determines which variant of an A/B test to show for the current visitor.
 * Uses consistent hashing so the same visitor always sees the same variant.
 */
export function selectABTestVariant(test: ABTest): string | null {
    const visitorId = getVisitorId();

    // Create a unique hash input specific to this test and visitor
    // This ensures a user might be in 'Control' for Test A but 'Variant 1' for Test B
    const hashInput = `${test.id}_${visitorId}`;
    const hash = hashString(hashInput);

    // Normalize to 0-100 scale
    const normalizedScore = hash % 100;

    // Determine range
    // 0 to baselinePercentage -> Baseline
    // baselinePercentage to baseline + variant1 -> Variant 1
    // etc.

    let currentThreshold = test.baselinePercentage;

    // Check Baseline
    if (normalizedScore < currentThreshold) {
        return test.baselineId;
    }

    // Check Variants
    for (const variant of test.variants) {
        currentThreshold += variant.percentage;
        if (normalizedScore < currentThreshold) {
            // Return banner ID, or null if control group
            return variant.bannerId === 'control' ? null : variant.bannerId;
        }
    }

    // Fallback (should theoretically not match if percentages add up to 100)
    return test.baselineId;
}

/**
 * Checks if there is an active A/B test running that should override the default display.
 * @param abTests List of all A/B tests
 * @param device Current device type
 * @returns The resolved banner ID to show (or null to show nothing/control), or undefined if no A/B test is active.
 */
export function checkActiveABTests(abTests: ABTest[], device: 'desktop' | 'mobile'): string | null | undefined {
    const now = new Date();

    // Find a running test for this device
    // Note: In reality, you might strictly match URLs, but here we simplify to device
    const activeTest = abTests.find(t =>
        t.status === 'running' &&
        t.device === device &&
        new Date(t.startDate) <= now &&
        new Date(t.endDate) > now
    );

    if (!activeTest) return undefined;

    return selectABTestVariant(activeTest);
}
