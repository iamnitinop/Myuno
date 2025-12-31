import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/jwt.guard';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto, UpdateCampaignDto } from './dto';

@Controller('campaigns')
@UseGuards(JwtGuard)
export class CampaignsController {
    constructor(private svc: CampaignsService) { }

    @Get()
    list(@Req() req: any) {
        return this.svc.list(req.user.accountId);
    }

    @Get(':id')
    get(@Req() req: any, @Param('id') id: string) {
        return this.svc.get(req.user.accountId, id);
    }

    @Post()
    create(@Req() req: any, @Body() dto: CreateCampaignDto) {
        return this.svc.create(req.user.accountId, dto);
    }

    @Patch(':id')
    update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateCampaignDto) {
        return this.svc.update(req.user.accountId, id, dto);
    }
}
