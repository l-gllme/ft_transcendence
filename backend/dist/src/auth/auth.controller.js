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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
const users_service_1 = require("../users/users.service");
const ft_auth_guard_1 = require("./utils/ft/ft.auth.guard");
const jwt_auth_guard_1 = require("./utils/jwt/jwt.auth.guard");
const google_auth_guard_1 = require("./utils/google/google.auth.guard");
let AuthController = exports.AuthController = class AuthController {
    constructor(authService, usersService) {
        this.authService = authService;
        this.usersService = usersService;
    }
    async ftLogin() {
    }
    async ftCallback(req, res) {
        const token = await this.authService.login(req.user);
        res.cookie('token', token.access_token, { httpOnly: true })
            .redirect('http://localhost:3000');
    }
    async googleLogin() {
    }
    async googleCallback(req, res) {
        const token = await this.authService.login(req.user);
        res.cookie('token', token.access_token, { httpOnly: true })
            .redirect('http://localhost:3000');
    }
    async profile(req) {
        return await this.usersService.getUserById(req.user.userId);
    }
    async logout(req, res) {
        res
            .clearCookie('token')
            .redirect('http://localhost:3000/login');
    }
    async disable2FA(req, res) {
        await this.authService.disable2FA(req.user);
        return res.status(200).json({ message: '2FA disabled' });
    }
    async enable2FA(req, res) {
        const { secret, otpauthUrl } = await this.authService.generate2FASecret(req.user);
        const qrCodeDataURL = await this.authService.generateQrCodeDataURL(otpauthUrl);
        return res.status(200).json({ secret, qrCodeDataURL });
    }
    async is2FAEnabled(req, res) {
        if (!req.user) {
            return res.status(401);
        }
        const user = await this.usersService.getUserById(req.user.userId);
        if (user.twoFAEnabled)
            return res.status(200).json({ message: '2FA is enabled' });
        else
            return res.status(201).json({ message: '2FA is not enabled' });
    }
    async verify2fa(req, res) {
        const isCodeValid = await this.authService.is2FASecretValid(await this.usersService.getUserById(req.user.userId), req.body.code2FA);
        if (isCodeValid) {
            await this.authService.loginWith2fa(req.user);
            return res.status(200).json({ message: '2FA is valid' });
        }
        else {
            return res.status(401).json({ message: '2FA is not valid' });
        }
    }
};
__decorate([
    (0, common_1.UseGuards)(ft_auth_guard_1.FtAuthGuard),
    (0, common_1.Get)('42/login'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "ftLogin", null);
__decorate([
    (0, common_1.UseGuards)(ft_auth_guard_1.FtAuthGuard),
    (0, common_1.Get)('42/callback'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "ftCallback", null);
__decorate([
    (0, common_1.UseGuards)(google_auth_guard_1.GoogleAuthGuard),
    (0, common_1.Get)('google/login'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "googleLogin", null);
__decorate([
    (0, common_1.UseGuards)(google_auth_guard_1.GoogleAuthGuard),
    (0, common_1.Get)('google/callback'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "googleCallback", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('profile'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "profile", null);
__decorate([
    (0, common_1.Get)('logout'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('2fa/disable'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "disable2FA", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('2fa/enable'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "enable2FA", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('2fa/isEnabled'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "is2FAEnabled", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('2fa/check'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verify2fa", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        users_service_1.UsersService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map