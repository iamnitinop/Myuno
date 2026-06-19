import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { GlobalBannerController } from './global-banner.controller';
import { GlobalBannerService } from './global-banner.service';

@Module({
    imports: [PrismaModule],
    controllers: [GlobalBannerController],
    providers: [GlobalBannerService],
    exports: [GlobalBannerService],
})
export class GlobalBannerModule { }
