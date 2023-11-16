import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
export declare class AuthService {
    private usersService;
    private jwtService;
    private prisma;
    constructor(usersService: UsersService, jwtService: JwtService, prisma: PrismaService);
    login(user: any): Promise<{
        access_token: string;
    }>;
    loginWith2fa(user: any): Promise<void>;
    registerOrRetrieveUser(user: any): Promise<{
        id: number;
        gamesWon: number;
        gamesLost: number;
        username: string;
        display_name: string;
        image: string;
        friends: number[];
        connected: number;
        blocked: number[];
        currentRoom: number;
        twoFASecret: string;
        twoFAEnabled: boolean;
        twoFAlogin: boolean;
    }>;
    generate2FASecret(user: any): Promise<{
        secret: string;
        otpauthUrl: string;
    }>;
    generateQrCodeDataURL(otpAuthUrl: string): Promise<string>;
    is2FASecretValid(user: any, token: string): Promise<boolean>;
    disable2FA(user: any): Promise<void>;
    is2FAEnabled(user: any): Promise<any>;
}
