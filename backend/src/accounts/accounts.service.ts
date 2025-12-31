import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AccountsService {
    constructor(private prisma: PrismaService) { }

    async addStore(accountId: string, domain: string) {
        return this.prisma.store.upsert({
            where: { domain: domain.toLowerCase() },
            update: { accountId, verified: true },
            create: { accountId, domain: domain.toLowerCase(), verified: true },
        });
    }

    async me(accountId: string) {
        const account = await this.prisma.account.findUnique({
            where: { id: accountId },
            include: { stores: true },
        });
        return account;
    }
}
