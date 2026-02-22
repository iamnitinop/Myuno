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

    async listCampaigns(accountId: string) {
        if (!accountId) return [];

        // For security, strictly validate UUID format if needed, but Prisma usually handles it.
        // We only return PUBLISHED campaigns.

        // Note: Ideally we should use the Snapshots logic, but assuming vck.js renders raw campaign for now:
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

        return campaigns;
    }
}
