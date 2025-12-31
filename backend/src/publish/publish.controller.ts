import { Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/jwt.guard';
import { PublishService } from './publish.service';

@Controller('publish')
@UseGuards(JwtGuard)
export class PublishController {
    constructor(private svc: PublishService) { }

    @Post(':campaignId')
    publish(@Req() req: any, @Param('campaignId') campaignId: string) {
        return this.svc.publish(req.user.accountId, campaignId);
    }

    @Post(':campaignId/unpublish')
    unpublish(@Req() req: any, @Param('campaignId') campaignId: string) {
        return this.svc.unpublish(req.user.accountId, campaignId);
    }
}
