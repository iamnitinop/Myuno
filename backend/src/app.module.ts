import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { AccountsModule } from './accounts/accounts.module';
import { PrismaModule } from './prisma/prisma.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { PublicModule } from './public/public.module';
import { R2Module } from './r2/r2.module';
import { EventsModule } from './events/events.module';
import { PublishModule } from './publish/publish.module';
import { EmailCaptureModule } from './email-capture/email-capture.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    AccountsModule,
    CampaignsModule,
    PublicModule,
    R2Module,
    EventsModule,
    PublishModule,
    EmailCaptureModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
