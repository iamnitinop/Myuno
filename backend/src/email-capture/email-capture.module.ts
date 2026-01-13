import { Module } from '@nestjs/common';
import { EmailCaptureController } from './email-capture.controller';
import { EmailCaptureService } from './email-capture.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [EmailCaptureController],
    providers: [EmailCaptureService],
    exports: [EmailCaptureService],
})
export class EmailCaptureModule { }
