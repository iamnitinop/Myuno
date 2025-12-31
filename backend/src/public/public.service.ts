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
}
