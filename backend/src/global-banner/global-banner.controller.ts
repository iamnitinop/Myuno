import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { JwtGuard } from '../auth/jwt.guard';
import { GlobalBannerService } from './global-banner.service';
import { UpsertGlobalBannerDto } from './dto';

@Controller('global-banner')
export class GlobalBannerController {
    constructor(private svc: GlobalBannerService) { }

    /**
     * Public endpoint hit by the embed (vck.js) on every page load. Returns all
     * enabled banners with an active sheet row for the handle, as rule-filterable
     * candidates. The embed evaluates targeting rules client-side and picks one.
     */
    @Get('runtime')
    async runtime(
        @Query('accountId') accountId: string,
        @Query('handle') handle: string,
        @Res() res: Response,
    ) {
        const data = await this.svc.runtimeCandidates(accountId, handle || '');
        // Very short browser cache so sheet/layout/targeting edits propagate to live
        // pages almost immediately, while still absorbing rapid repeat loads by one visitor.
        res.setHeader('Cache-Control', 'public, max-age=5');
        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.json(data);
    }

    // --- Dashboard CRUD (JWT) ----------------------------------------------

    @Get()
    @UseGuards(JwtGuard)
    list(@Req() req: any) {
        return this.svc.list(req.user.accountId);
    }

    @Post()
    @UseGuards(JwtGuard)
    create(@Req() req: any, @Body() dto: UpsertGlobalBannerDto) {
        return this.svc.create(req.user.accountId, dto);
    }

    @Get(':id')
    @UseGuards(JwtGuard)
    get(@Req() req: any, @Param('id') id: string) {
        return this.svc.get(req.user.accountId, id);
    }

    @Put(':id')
    @UseGuards(JwtGuard)
    update(@Req() req: any, @Param('id') id: string, @Body() dto: UpsertGlobalBannerDto) {
        return this.svc.update(req.user.accountId, id, dto);
    }

    @Delete(':id')
    @UseGuards(JwtGuard)
    remove(@Req() req: any, @Param('id') id: string) {
        return this.svc.remove(req.user.accountId, id);
    }

    @Post(':id/refresh')
    @UseGuards(JwtGuard)
    refresh(@Req() req: any, @Param('id') id: string) {
        return this.svc.refresh(req.user.accountId, id);
    }

    @Get(':id/preview')
    @UseGuards(JwtGuard)
    preview(
        @Req() req: any,
        @Param('id') id: string,
        @Query('handle') handle: string,
        @Query('sheetUrl') sheetUrl?: string,
    ) {
        return this.svc.previewById(req.user.accountId, id, handle || '', sheetUrl);
    }
}
