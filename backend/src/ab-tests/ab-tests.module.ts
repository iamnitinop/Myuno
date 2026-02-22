import { Module } from '@nestjs/common';
import { AbTestsController } from './ab-tests.controller';
import { AbTestsService } from './ab-tests.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [AbTestsController],
    providers: [AbTestsService],
    exports: [AbTestsService],
})
export class AbTestsModule { }
