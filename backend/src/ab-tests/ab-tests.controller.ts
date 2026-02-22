import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/jwt.guard';
import { AbTestsService } from './ab-tests.service';
import { CreateABTestDto, UpdateABTestDto } from './dto';

@Controller('ab-tests')
@UseGuards(JwtGuard)
export class AbTestsController {
    constructor(private svc: AbTestsService) { }

    @Get()
    list(@Req() req: any) {
        return this.svc.list(req.user.accountId);
    }

    @Get(':id')
    get(@Req() req: any, @Param('id') id: string) {
        return this.svc.get(req.user.accountId, id);
    }

    @Post()
    create(@Req() req: any, @Body() dto: CreateABTestDto) {
        return this.svc.create(req.user.accountId, dto);
    }

    @Patch(':id')
    update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateABTestDto) {
        return this.svc.update(req.user.accountId, id, dto);
    }

    @Delete(':id')
    remove(@Req() req: any, @Param('id') id: string) {
        return this.svc.delete(req.user.accountId, id);
    }
}
