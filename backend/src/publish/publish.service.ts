import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CampaignsService } from '../campaigns/campaigns.service';
import { R2Service } from '../r2/r2.service';

function isoVersion() {
    return new Date().toISOString();
}

@Injectable()
export class PublishService {
    constructor(
        private prisma: PrismaService,
        private campaigns: CampaignsService,
        private r2: R2Service,
    ) { }

    private compilePayload(accountId: string, campaign: any, version: string) {
        // Keep runtime payload minimal: no editor junk
        return {
            accountId,
            version,
            campaigns: [
                {
                    id: campaign.id,
                    name: campaign.name,
                    type: campaign.type,
                    creative: campaign.creativeJson,
                    rules: campaign.rulesJson,
                },
            ],
        };
    }

    async publish(accountId: string, campaignId: string) {
        const campaign = await this.campaigns.get(accountId, campaignId);

        const version = isoVersion();
        const key = `published/${accountId}/${campaignId}/${version}.json`;

        const payload = this.compilePayload(accountId, campaign, version);

        const cacheSeconds = Number(process.env.PUBLIC_PAYLOAD_CACHE_SECONDS || 60);
        const { url, key: payloadKey } = await this.r2.putJson(key, payload, cacheSeconds);

        const snap = await this.prisma.publishSnapshot.create({
            data: {
                campaignId: campaign.id,
                version,
                payloadKey,
                payloadUrl: url,
            },
        });

        await this.prisma.campaign.update({
            where: { id: campaign.id },
            data: { status: 'published' },
        });

        return { campaignId: campaign.id, version: snap.version, payloadUrl: snap.payloadUrl };
    }

    async unpublish(accountId: string, campaignId: string) {
        await this.campaigns.get(accountId, campaignId);
        await this.prisma.campaign.update({
            where: { id: campaignId },
            data: { status: 'draft' },
        });
        return { campaignId, status: 'draft' };
    }
}
