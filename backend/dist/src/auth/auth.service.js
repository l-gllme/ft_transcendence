"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("../users/users.service");
const jwt_1 = require("@nestjs/jwt");
const otplib_1 = require("otplib");
const prisma_service_1 = require("../prisma/prisma.service");
const qrcode_1 = require("qrcode");
let AuthService = exports.AuthService = class AuthService {
    constructor(usersService, jwtService, prisma) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.prisma = prisma;
    }
    async login(user) {
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
    async loginWith2fa(user) {
        await this.prisma.user.update({
            where: { id: user.userId },
            data: { twoFAEnabled: true, twoFAlogin: true, },
        });
    }
    async registerOrRetrieveUser(user) {
        let userFound = await this.usersService.getUserByUsername(user.username);
        if (!userFound) {
            userFound = await this.usersService.createUser(user);
        }
        return userFound;
    }
    async generate2FASecret(user) {
        const secret = otplib_1.authenticator.generateSecret();
        const otpauthUrl = await otplib_1.authenticator.keyuri(user.username, '2FA', secret);
        await this.prisma.user.update({
            where: { id: user.userId },
            data: { twoFASecret: secret }
        });
        return { secret, otpauthUrl };
    }
    async generateQrCodeDataURL(otpAuthUrl) {
        return (0, qrcode_1.toDataURL)(otpAuthUrl);
    }
    async is2FASecretValid(user, token) {
        if (!user.twoFASecret) {
            return true;
        }
        return otplib_1.authenticator.verify({
            token,
            secret: user.twoFASecret,
        });
    }
    async disable2FA(user) {
        await this.prisma.user.update({
            where: { id: user.userId },
            data: { twoFASecret: null, twoFAEnabled: false, twoFAlogin: false },
        });
    }
    async is2FAEnabled(user) {
        return user.twoFAEnabled;
    }
};
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        prisma_service_1.PrismaService])
], AuthService);
//# sourceMappingURL=auth.service.js.map