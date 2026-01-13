import {
    Controller,
    Post,
    Get,
    Body,
    Query,
    Req,
    Res,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { EmailCaptureService } from './email-capture.service';
import { CreateEmailCaptureDto, GetEmailCapturesQueryDto } from './dto';

@Controller('email-capture')
export class EmailCaptureController {
    constructor(private emailCaptureService: EmailCaptureService) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() dto: CreateEmailCaptureDto, @Req() req: Request) {
        // For demo purposes, using a default account ID
        // In production, this should come from authenticated user
        const accountId = 'ACC_DEMO_001';

        const userAgent = req.headers['user-agent'];
        const ipAddress = req.ip || req.socket.remoteAddress;

        return this.emailCaptureService.create(accountId, dto, userAgent, ipAddress);
    }

    @Get()
    async findAll(@Query() query: GetEmailCapturesQueryDto) {
        const accountId = 'ACC_DEMO_001';
        return this.emailCaptureService.findAll(accountId, query);
    }

    @Get('export/csv')
    async exportCSV(@Query() query: GetEmailCapturesQueryDto, @Res() res: Response) {
        const accountId = 'ACC_DEMO_001';

        const csv = await this.emailCaptureService.exportToCSV(accountId, query);

        const filename = `email-captures-${new Date().toISOString().split('T')[0]}.csv`;

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csv);
    }
}
