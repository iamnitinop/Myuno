import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertGlobalBannerDto } from './dto';
import { getSheetMap, normalizeHandle, clearSheetCache, cleanOfferHtml } from './sheet.util';

export interface RuntimeCandidate {
    id: string;
    name: string;
    priority: number;
    rulesJson: any;
    creativeJson: any;
    offerLayerId: string | null;
    offerImageLayerId: string | null;
    style: any;
    layoutJson: any;
    offerHtml: string;
    offerImageUrl: string;
}

@Injectable()
export class GlobalBannerService {
    private readonly logger = new Logger(GlobalBannerService.name);

    constructor(private prisma: PrismaService) { }

    // --- Dashboard CRUD ----------------------------------------------------

    list(accountId: string) {
        return this.prisma.globalBanner.findMany({
            where: { accountId },
            orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
        });
    }

    async get(accountId: string, id: string) {
        const banner = await this.prisma.globalBanner.findFirst({ where: { id, accountId } });
        if (!banner) throw new NotFoundException('Global banner not found');
        return banner;
    }

    create(accountId: string, dto: UpsertGlobalBannerDto) {
        return this.prisma.globalBanner.create({
            data: {
                accountId,
                name: dto.name ?? 'Banner',
                enabled: dto.enabled ?? false,
                sheetUrl: dto.sheetUrl ?? '',
                creativeJson: dto.creativeJson ?? {},
                offerLayerId: dto.offerLayerId ?? null,
                offerImageLayerId: dto.offerImageLayerId ?? null,
                styleJson: dto.styleJson ?? undefined,
                rulesJson: dto.rulesJson ?? undefined,
                layoutJson: dto.layoutJson ?? undefined,
                priority: dto.priority ?? 0,
            },
        });
    }

    async update(accountId: string, id: string, dto: UpsertGlobalBannerDto) {
        // Ensure ownership before updating
        await this.get(accountId, id);
        return this.prisma.globalBanner.update({
            where: { id },
            data: {
                ...(dto.name !== undefined ? { name: dto.name } : {}),
                ...(dto.enabled !== undefined ? { enabled: dto.enabled } : {}),
                ...(dto.sheetUrl !== undefined ? { sheetUrl: dto.sheetUrl } : {}),
                ...(dto.creativeJson !== undefined ? { creativeJson: dto.creativeJson } : {}),
                ...(dto.offerLayerId !== undefined ? { offerLayerId: dto.offerLayerId } : {}),
                ...(dto.offerImageLayerId !== undefined ? { offerImageLayerId: dto.offerImageLayerId } : {}),
                ...(dto.styleJson !== undefined ? { styleJson: dto.styleJson } : {}),
                ...(dto.rulesJson !== undefined ? { rulesJson: dto.rulesJson } : {}),
                ...(dto.layoutJson !== undefined ? { layoutJson: dto.layoutJson } : {}),
                ...(dto.priority !== undefined ? { priority: dto.priority } : {}),
            },
        });
    }

    async remove(accountId: string, id: string) {
        await this.get(accountId, id);
        await this.prisma.globalBanner.delete({ where: { id } });
        return { ok: true };
    }

    /** Clear a banner's cached sheet so the live site picks up edits immediately. */
    async refresh(accountId: string, id: string) {
        const banner = await this.get(accountId, id);
        if (banner.sheetUrl) clearSheetCache(banner.sheetUrl);
        else clearSheetCache();
        return { ok: true };
    }

    /**
     * Dashboard test-preview: resolve a handle against a banner's sheet (or an
     * override URL), ignoring enabled/rules. Always fetches fresh.
     */
    async previewById(accountId: string, id: string, handle: string, sheetUrlOverride?: string) {
        let sheetUrl = sheetUrlOverride && sheetUrlOverride.trim();
        if (!sheetUrl) {
            const banner = await this.get(accountId, id);
            sheetUrl = banner.sheetUrl?.trim() || '';
        }
        if (!sheetUrl) return { found: false, reason: 'no-sheet-url' };
        try {
            const map = await getSheetMap(sheetUrl, Date.now(), true);
            const row = map.get(normalizeHandle(handle));
            if (!row) return { found: false, reason: 'no-match' };
            return {
                found: true,
                saleActive: String(row.saleActive).trim().toUpperCase() === 'TRUE',
                offerHtml: cleanOfferHtml(row.promotionText || ''),
                offerImageUrl: (row.imageUrl || '').trim(),
                product: row.product || '',
                discount: row.discount || '',
            };
        } catch (err) {
            return { found: false, reason: 'sheet-fetch-failed', message: (err as Error).message };
        }
    }

    // --- Public runtime ----------------------------------------------------

    /**
     * Return every enabled banner that has an active matching sheet row for the
     * handle, as a candidate the embed can rule-filter client-side. Never throws.
     */
    async runtimeCandidates(accountId: string, handle: string): Promise<{ banners: RuntimeCandidate[] }> {
        try {
            if (!accountId) return { banners: [] };
            const banners = await this.prisma.globalBanner.findMany({
                where: { accountId, enabled: true },
                orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
            });
            if (!banners.length) return { banners: [] };

            const norm = normalizeHandle(handle);
            const out: RuntimeCandidate[] = [];

            for (const b of banners) {
                if (!b.sheetUrl) continue;
                try {
                    const map = await getSheetMap(b.sheetUrl, Date.now());
                    const row = map.get(norm);
                    if (!row) continue;
                    if (String(row.saleActive).trim().toUpperCase() !== 'TRUE') continue;
                    const offerHtml = cleanOfferHtml((row.promotionText || '').trim());
                    if (!offerHtml) continue;

                    out.push({
                        id: b.id,
                        name: b.name,
                        priority: b.priority,
                        rulesJson: b.rulesJson ?? null,
                        creativeJson: b.creativeJson,
                        offerLayerId: b.offerLayerId ?? null,
                        offerImageLayerId: b.offerImageLayerId ?? null,
                        style: b.styleJson ?? null,
                        layoutJson: b.layoutJson ?? null,
                        offerHtml,
                        offerImageUrl: (row.imageUrl || '').trim(),
                    });
                } catch (err) {
                    this.logger.warn(`sheet resolve failed for banner ${b.id}: ${(err as Error).message}`);
                }
            }
            return { banners: out };
        } catch (err) {
            this.logger.warn(`runtimeCandidates failed for account ${accountId}: ${(err as Error).message}`);
            return { banners: [] };
        }
    }
}
