import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateABTestDto, UpdateABTestDto } from './dto';

@Injectable()
export class AbTestsService {
    constructor(private prisma: PrismaService) { }

    async list(accountId: string) {
        return this.prisma.aBTest.findMany({
            where: { accountId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async get(accountId: string, id: string) {
        const test = await this.prisma.aBTest.findUnique({
            where: { id },
        });
        if (!test || test.accountId !== accountId) throw new NotFoundException('A/B Test not found');
        return test;
    }

    async create(accountId: string, dto: CreateABTestDto) {
        return this.prisma.aBTest.create({
            data: {
                accountId,
                name: dto.name,
                device: dto.device,
                startDate: new Date(dto.startDate),
                endDate: new Date(dto.endDate),
                baselineId: dto.baselineId,
                baselinePercentage: dto.baselinePercentage,
                variants: dto.variants,
                status: dto.status || 'draft',
            },
        });
    }

    async update(accountId: string, id: string, dto: UpdateABTestDto) {
        // Verify owner
        await this.get(accountId, id);

        const data: any = {};
        if (dto.name !== undefined) data.name = dto.name;
        if (dto.device !== undefined) data.device = dto.device;
        if (dto.startDate !== undefined) data.startDate = new Date(dto.startDate);
        if (dto.endDate !== undefined) data.endDate = new Date(dto.endDate);
        if (dto.baselineId !== undefined) data.baselineId = dto.baselineId;
        if (dto.baselinePercentage !== undefined) data.baselinePercentage = dto.baselinePercentage;
        if (dto.variants !== undefined) data.variants = dto.variants;
        if (dto.status !== undefined) data.status = dto.status;

        return this.prisma.aBTest.update({
            where: { id },
            data,
        });
    }

    async delete(accountId: string, id: string) {
        await this.get(accountId, id);
        return this.prisma.aBTest.delete({
            where: { id },
        });
    }
}
