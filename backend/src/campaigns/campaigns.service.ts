import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCampaignDto, UpdateCampaignDto } from './dto';

@Injectable()
export class CampaignsService {
    constructor(private prisma: PrismaService) { }

    list(accountId: string) {
        return this.prisma.campaign.findMany({
            where: { accountId },
            orderBy: { updatedAt: 'desc' },
        });
    }

    async get(accountId: string, id: string) {
        const c = await this.prisma.campaign.findFirst({ where: { id, accountId } });
        if (!c) throw new NotFoundException('Campaign not found');
        return c;
    }

    create(accountId: string, dto: CreateCampaignDto) {
        return this.prisma.campaign.create({
            data: {
                accountId,
                name: dto.name,
                type: dto.type,
                status: 'draft',
                creativeJson: dto.creativeJson,
                rulesJson: dto.rulesJson,
            },
        });
    }

    async update(accountId: string, id: string, dto: UpdateCampaignDto) {
        await this.get(accountId, id); // ensure exists and belongs to account
        return this.prisma.campaign.update({
            where: { id },
            data: {
                ...dto,
            },
        });
    }
}
