import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/jwt.guard';
import { AccountsService } from './accounts.service';

@Controller('accounts')
@UseGuards(JwtGuard)
export class AccountsController {
    constructor(private svc: AccountsService) { }

    @Get('me')
    me(@Req() req: any) {
        return this.svc.me(req.user.accountId);
    }

    @Post('store')
    addStore(@Req() req: any, @Body() body: { domain: string }) {
        return this.svc.addStore(req.user.accountId, body.domain);
    }
}
