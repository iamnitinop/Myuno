import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmailCaptureDto, GetEmailCapturesQueryDto } from './dto';

@Injectable()
export class EmailCaptureService {
    constructor(private prisma: PrismaService) { }

    async create(
        accountId: string,
        dto: CreateEmailCaptureDto,
        userAgent?: string,
        ipAddress?: string,
    ) {
        return this.prisma.emailCapture.create({
            data: {
                accountId,
                email: dto.email,
                phone: dto.phone,
                campaignId: dto.campaignId,
                source: dto.source,
                userAgent,
                ipAddress,
                metadata: dto.metadata || {},
            },
        });
    }

    async findAll(accountId: string, query: GetEmailCapturesQueryDto) {
        const where: any = { accountId };

        if (query.campaignId) {
            where.campaignId = query.campaignId;
        }

        if (query.email) {
            where.email = { contains: query.email, mode: 'insensitive' };
        }

        if (query.startDate || query.endDate) {
            where.createdAt = {};
            if (query.startDate) {
                where.createdAt.gte = new Date(query.startDate);
            }
            if (query.endDate) {
                where.createdAt.lte = new Date(query.endDate);
            }
        }

        return this.prisma.emailCapture.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });
    }

    async exportToCSV(accountId: string, query: GetEmailCapturesQueryDto): Promise<string> {
        const captures = await this.findAll(accountId, query);

        // CSV header
        const headers = ['Email', 'Phone', 'Campaign ID', 'Source', 'Created At', 'User Agent', 'IP Address'];
        const csvRows = [headers.join(',')];

        // CSV rows
        for (const capture of captures) {
            const row = [
                this.escapeCSV(capture.email),
                this.escapeCSV(capture.phone || ''),
                this.escapeCSV(capture.campaignId || ''),
                this.escapeCSV(capture.source || ''),
                this.escapeCSV(capture.createdAt.toISOString()),
                this.escapeCSV(capture.userAgent || ''),
                this.escapeCSV(capture.ipAddress || ''),
            ];
            csvRows.push(row.join(','));
        }

        return csvRows.join('\n');
    }

    private escapeCSV(value: string): string {
        if (!value) return '';
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
    }
}
