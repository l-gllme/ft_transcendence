import {
    Controller,
    Get,
    Req,
    Res,
    UseGuards,
    Post,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from 'src/users/users.service';

import { FtAuthGuard } from './utils/ft/ft.auth.guard';
import { JwtAuthGuard } from './utils/jwt/jwt.auth.guard';
import { GoogleAuthGuard } from './utils/google/google.auth.guard';
import { compareSync } from 'bcrypt';
import e = require('express');

@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService,
        private usersService: UsersService,
    ) { }

    @UseGuards(FtAuthGuard)
    @Get('42/login')
    async ftLogin() {
    }

    @UseGuards(FtAuthGuard)
    @Get('42/callback')
    async ftCallback(@Req() req: any, @Res() res: any) {
        const token = await this.authService.login(req.user);
        res.cookie(
            'token',
            token.access_token,
            { httpOnly: true }
        )
            .redirect('http://localhost:3000')
    }

    @UseGuards(GoogleAuthGuard)
    @Get('google/login')
    async googleLogin() {
    }

    @UseGuards(GoogleAuthGuard)
    @Get('google/callback')
    async googleCallback(@Req() req: any, @Res() res: any) {
        const token = await this.authService.login(req.user);
        res.cookie(
            'token',
            token.access_token,
            { httpOnly: true }
        )
            .redirect('http://localhost:3000')
    }

    @UseGuards(JwtAuthGuard)
    @Get('profile')
    async profile(@Req() req) {
        return await this.usersService.getUserById(req.user.userId);
    }

    @Get('logout')
    async logout(@Req() req, @Res() res) {
        res
            .clearCookie('token')
            .redirect('http://localhost:3000/login');
    }

    @UseGuards(JwtAuthGuard)
    @Get('2fa/disable')
    async disable2FA(@Req() req, @Res() res) {
        await this.authService.disable2FA(req.user);
        return res.status(200).json({ message: '2FA disabled' });
    }

    @UseGuards(JwtAuthGuard)
    @Get('2fa/enable')
    async enable2FA(@Req() req, @Res() res) {
        const { secret, otpauthUrl } = await this.authService.generate2FASecret(
            req.user,
        );
        const qrCodeDataURL = await this.authService.generateQrCodeDataURL(
            otpauthUrl,
        );
        return res.status(200).json({ secret, qrCodeDataURL });
    }

    @UseGuards(JwtAuthGuard)
    @Get('2fa/isEnabled')
    async is2FAEnabled(@Req() req, @Res() res) {
        if (!req.user) {
            return res.status(401);
        }
        const user = await this.usersService.getUserById(req.user.userId);
        if (user.twoFAEnabled)
            return res.status(200).json({ message: '2FA is enabled' });
        else
            return res.status(201).json({ message: '2FA is not enabled' });
    }

    @UseGuards(JwtAuthGuard)
    @Post('2fa/check')
    async verify2fa(@Req() req: any, @Res() res: any) {
        const isCodeValid = await this.authService.is2FASecretValid(
            await this.usersService.getUserById(req.user.userId),
            req.body.code2FA,
        );
        if (isCodeValid) {
            await this.authService.loginWith2fa(req.user);
            return res.status(200).json({ message: '2FA is valid' });
        }
        else {
            return res.status(401).json({ message: '2FA is not valid' });
        }
    }
}
