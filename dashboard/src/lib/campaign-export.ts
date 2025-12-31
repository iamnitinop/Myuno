import { Banner, AdvancedTargetingRules } from "./types";

export interface CampaignExport {
    version: string;
    campaign: {
        banner: Banner;
        rules: AdvancedTargetingRules;
        metadata: {
            exportedAt: string;
            exportedBy: string;
        };
    };
}

export function exportCampaign(
    banner: Banner,
    rules: AdvancedTargetingRules,
    userEmail: string = "user@example.com"
): void {
    const exportData: CampaignExport = {
        version: "1.0",
        campaign: {
            banner,
            rules,
            metadata: {
                exportedAt: new Date().toISOString(),
                exportedBy: userEmail,
            },
        },
    };

    // Create JSON blob
    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: "application/json" });

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${banner.name.replace(/\s+/g, "_")}_${banner.id}.json`;
    link.click();

    // Cleanup
    URL.revokeObjectURL(url);
}

export function validateCampaignImport(data: any): CampaignExport {
    if (!data || typeof data !== "object") {
        throw new Error("Invalid JSON format");
    }

    if (!data.campaign) {
        throw new Error("Missing campaign data");
    }

    if (!data.campaign.banner) {
        throw new Error("Missing banner configuration");
    }

    if (!data.campaign.banner.id || !data.campaign.banner.name) {
        throw new Error("Invalid banner format");
    }

    return data as CampaignExport;
}
