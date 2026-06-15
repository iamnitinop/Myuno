import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PublicService {
    constructor(private prisma: PrismaService) { }

    async runtimeByDomain(domain: string) {
        const d = domain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
        const store = await this.prisma.store.findUnique({ where: { domain: d } });
        if (!store) throw new NotFoundException('Unknown domain');

        // find latest published snapshot among published campaigns for this account
        const latest = await this.prisma.publishSnapshot.findFirst({
            where: { campaign: { accountId: store.accountId, status: 'published' } },
            orderBy: { createdAt: 'desc' },
            include: { campaign: true },
        });

        if (!latest) throw new NotFoundException('No published payload');

        return {
            accountId: store.accountId,
            version: latest.version,
            payloadUrl: latest.payloadUrl,
        };
    }

    async previewCampaign(campaignId: string) {
        const campaign = await this.prisma.campaign.findUnique({
            where: { id: campaignId },
            select: { id: true, name: true, type: true, creativeJson: true, rulesJson: true },
        });
        if (!campaign) throw new NotFoundException('Campaign not found');
        return { campaigns: [campaign], abTests: [] };
    }

    async listCampaigns(accountId: string) {
        if (!accountId) return { campaigns: [], abTests: [] };

        const campaigns = await this.prisma.campaign.findMany({
            where: {
                accountId,
                status: 'published',
            },
            select: {
                id: true,
                name: true,
                type: true,
                creativeJson: true,
                rulesJson: true,
            },
        });

        const now = new Date();
        const abTests = await this.prisma.aBTest.findMany({
            where: {
                accountId,
                status: 'running',
                startDate: { lte: now },
                endDate: { gte: now }
            },
            select: {
                id: true,
                baselineId: true,
                baselinePercentage: true,
                variants: true
            }
        });

        return { campaigns, abTests };
    }
}
