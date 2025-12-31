import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { R2Module } from '../r2/r2.module';
import { CampaignsModule } from '../campaigns/campaigns.module';
import { PublishController } from './publish.controller';
import { PublishService } from './publish.service';

@Module({
    imports: [PrismaModule, R2Module, CampaignsModule],
    controllers: [PublishController],
    providers: [PublishService],
})
export class PublishModule { }
