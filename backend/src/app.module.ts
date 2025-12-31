import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AccountsModule } from './accounts/accounts.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { PublishModule } from './publish/publish.module';
import { PublicModule } from './public/public.module';
import { EventsModule } from './events/events.module';
import { R2Module } from './r2/r2.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    PrismaModule,
    R2Module,
    AuthModule,
    AccountsModule,
    CampaignsModule,
    PublishModule,
    PublicModule,
    EventsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
