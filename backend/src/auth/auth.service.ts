import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { authenticator } from 'otplib';
import { PrismaService } from '../prisma/prisma.service';
import { toDataURL } from 'qrcode';
import { compareSync } from 'bcrypt';


@Injectable()
export class AuthService {

    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private prisma: PrismaService,
    ) { }

    async login(user: any) {
        const payload = {
            sub: user.id,
            isTwoFactorAuthenticated: false,
            twoFAEnabled: user.twoFAEnabled,
        };
        if (user.twoFAEnabled) {
            await this.prisma.user.update({
                where: { id: user.id },
                data: { twoFAlogin: false },
            });
        }
        return {
            access_token: this.jwtService.sign(payload),
        };
    }

    async loginWith2fa(user: any) {
        await this.prisma.user.update({
            where: { id: user.userId },
            data: { twoFAEnabled: true, twoFAlogin: true, },
        });
    }

    async registerOrRetrieveUser(user: any) {
        let userFound = await this.usersService.getUserByUsername(user.username);
        if (!userFound) {
            userFound = await this.usersService.createUser(user);
        }
        return userFound;
    }

    async generate2FASecret(user: any) {
        const secret = authenticator.generateSecret();

        const otpauthUrl = await authenticator.keyuri(user.username, '2FA', secret);

        await this.prisma.user.update({
            where: { id: user.userId },
            data: { twoFASecret: secret }
        });

        return { secret, otpauthUrl };
    }

    async generateQrCodeDataURL(otpAuthUrl: string) {
        return toDataURL(otpAuthUrl);
    }


    async is2FASecretValid(user: any, token: string) {
        if (!user.twoFASecret) {
            return true;
        }
        return authenticator.verify({
            token,
            secret: user.twoFASecret,
        });
    }

    async disable2FA(user: any) {
        await this.prisma.user.update({
            where: { id: user.userId },
            data: { twoFASecret: null, twoFAEnabled: false, twoFAlogin: false },
        });
    }

    async is2FAEnabled(user: any) {
        return user.twoFAEnabled;
    }
}
