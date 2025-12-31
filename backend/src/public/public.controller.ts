import { Controller, Get, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { PublicService } from './public.service';

@Controller('public')
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
}
