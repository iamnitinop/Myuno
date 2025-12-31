import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(private prisma: PrismaService, private jwt: JwtService) { }

    private signAccessToken(userId: string, accountId: string) {
        const secret = (process.env.JWT_ACCESS_SECRET || 'changeme_access_secret') as string;
        const expiresIn = (process.env.JWT_ACCESS_TTL || '15m') as string;
        return this.jwt.sign(
            { sub: userId, accountId },
            { secret, expiresIn } as any,
        );
    }

    private signRefreshToken(userId: string, accountId: string) {
        const secret = (process.env.JWT_REFRESH_SECRET || 'changeme_refresh_secret') as string;
        const expiresIn = (process.env.JWT_REFRESH_TTL || '30d') as string;
        return this.jwt.sign(
            { sub: userId, accountId },
            { secret, expiresIn } as any,
        );
    }

    async signup(email: string, password: string, storeDomain: string) {
        const existing = await this.prisma.user.findUnique({ where: { email } });
        if (existing) throw new UnauthorizedException('User already exists');

        const passwordHash = await bcrypt.hash(password, 12);

        const account = await this.prisma.account.create({
            data: { name: storeDomain.replace(/^www\./, '') },
        });

        const user = await this.prisma.user.create({
            data: { email, passwordHash },
        });

        await this.prisma.membership.create({
            data: { userId: user.id, accountId: account.id, role: 'owner' },
        });

        // MVP: trust domain string
        const domain = storeDomain.toLowerCase().trim();
        await this.prisma.store.create({
            data: { accountId: account.id, domain: domain, verified: true },
        });

        return {
            accessToken: this.signAccessToken(user.id, account.id),
            refreshToken: this.signRefreshToken(user.id, account.id),
            accountId: account.id,
            userId: user.id,
        };
    }

    async login(email: string, password: string) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) throw new UnauthorizedException('Invalid credentials');

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) throw new UnauthorizedException('Invalid credentials');

        // pick first membership account for MVP
        const membership = await this.prisma.membership.findFirst({ where: { userId: user.id } });
        if (!membership) throw new UnauthorizedException('No account found for user');

        return {
            accessToken: this.signAccessToken(user.id, membership.accountId),
            refreshToken: this.signRefreshToken(user.id, membership.accountId),
            accountId: membership.accountId,
            userId: user.id,
        };
    }

    async refresh(refreshToken: string) {
        try {
            const payload = this.jwt.verify(refreshToken, { secret: process.env.JWT_REFRESH_SECRET || 'changeme_refresh_secret' });
            return {
                accessToken: this.signAccessToken(payload.sub, payload.accountId),
                refreshToken: this.signRefreshToken(payload.sub, payload.accountId),
            };
        } catch {
            throw new UnauthorizedException('Invalid refresh token');
        }
    }
}
