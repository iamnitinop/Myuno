import { Body, Controller, Post, Req } from '@nestjs/common';
import { EventsService } from './events.service';

@Controller('public')
export class EventsController {
    constructor(private svc: EventsService) { }

    @Post('events')
    ingest(@Body() body: any, @Req() req: any) {
        return this.svc.ingest({
            domain: body.domain,
            type: body.type,
            campaignId: body.campaignId,
            url: body.url,
            referrer: body.referrer,
            ua: req.headers['user-agent'],
            meta: body.meta,
        });
    }
}
