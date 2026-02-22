import { Controller, Get, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { PublicService } from './public.service';

@Controller('campaigns')
export class PublicController {
    constructor(private svc: PublicService) { }

    @Get('runtime')
    async runtime(@Query('domain') domain: string, @Res() res: Response) {
        const data = await this.svc.runtimeByDomain(domain);

        // Cache this response (small JSON). Your CDN can cache this too.
        const ttl = Number(process.env.PUBLIC_PAYLOAD_CACHE_SECONDS || 60);
        res.setHeader('Cache-Control', `public, max-age=${ttl}`);

        return res.json(data);
    }

    @Get('public')
    async getCampaigns(@Query('accountId') accountId: string, @Res() res: Response) {
        const data = await this.svc.listCampaigns(accountId);

        // Cache for 60 seconds
        res.setHeader('Cache-Control', 'public, max-age=60');
        res.setHeader('Access-Control-Allow-Origin', '*'); // CORS for embed

        return res.json(data);
    }
}
