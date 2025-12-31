import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EventsService {
    constructor(private prisma: PrismaService) { }

    async ingest(evt: {
        domain: string;
        type: string;
        campaignId?: string;
        url?: string;
        referrer?: string;
        ua?: string;
        meta?: any;
    }) {
        const domain = evt.domain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
        const store = await this.prisma.store.findUnique({ where: { domain } });
        if (!store) return { ok: true }; // silently drop unknown domains (MVP)

        await this.prisma.eventRaw.create({
            data: {
                accountId: store.accountId,
                campaignId: evt.campaignId,
                type: evt.type,
                url: evt.url,
                referrer: evt.referrer,
                ua: evt.ua,
                meta: evt.meta ?? {},
            },
        });

        return { ok: true };
    }
}
