import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
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

import { AbTestsModule } from './ab-tests/ab-tests.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, 'public', 'public'),
      serveRoot: '/', // Served at root level so /vck.js works
    }),
    PrismaModule,
    AuthModule,
    AccountsModule,
    PublicModule,
    CampaignsModule,
    R2Module,
    EventsModule,
    PublishModule,
    EmailCaptureModule,
    AbTestsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})

export class AppModule { }
