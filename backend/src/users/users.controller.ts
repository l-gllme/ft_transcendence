import {
    Controller,
    Get,
    Post,
    Req,
    Res,
    UseGuards,
    BadRequestException,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { GamesService } from '../game/game.service';
import { FileInterceptor } from '@nestjs/platform-express/multer';
import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

import { Express } from 'express';

import { JwtAuthGuard } from 'src/auth/utils/jwt/jwt.auth.guard';

@Controller('users')

export class UsersController {

    constructor(
        private readonly usersService: UsersService,
        private readonly gamesService: GamesService
    ) { }

    @Post('upload')
    @UseInterceptors(FileInterceptor('image'))
    async uploadAvatar(@Req() req: Request, @UploadedFile() file: Express.Multer.File, @Res() res: Response) {
        if (!file) {
            return res.status(400).send('No file uploaded');
        }

        const userId = req.body.userId;
        if (userId === undefined) {
            return res.status(400).send('Missing userId in the request body');
        }

        const uploadDir = path.join(__dirname, '../../../uploads');

        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const filePath = path.join(uploadDir, file.originalname);

        try {
            fs.writeFileSync(filePath, file.buffer);

            await this.usersService.updateUserImage(userId, filePath);

            return res.status(200).send('Image uploaded successfully');
        } catch (error) {
            console.error('Failed to save the uploaded file:', error);
            return res.status(500).send('Failed to upload the file');
        }
    }

    @UseGuards(JwtAuthGuard)
    @Post('displayname')
    async updateDisplayName(@Req() req, @Res() res) {
        const { display_name } = req.body;
        const user = await this.usersService.updateUserDiplayName(
            req.user.userId,
            display_name,
        );
        return res.status(200).json(user);
    }

    @UseGuards(JwtAuthGuard)
    @Post('checkdisplayname')
    async checkDisplayName(@Req() req, @Res() res): Promise<void> {
        const { display_name } = req.body;

        if (!display_name || display_name.trim(' ').length === 0) {
            return res.status(400).send('Empty display name provided.');
        } else if (display_name.length > 12) {
            return res.status(400).send('Too long display name provided. Keep it under 12.');
        } else if (/[\!\[\]\{\}\(\)\;\/\?\'\\]/g.test(display_name)) {
            return res.status(400).send('Invalid characters in the display name.');
        }

        const isAvailable = await this.usersService.checkDisplayNameAvailability(display_name);
        if (isAvailable) {
            return res.status(200).send();
        } else {
            return res.status(400).send('This name is already in use. Please choose another.');
        }
    }

    @UseGuards(JwtAuthGuard)
    @Get('getGames')
    async getUserGames(@Req() req, @Res() res) {
        const userId = req.query.id;
        const user = await this.usersService.getUserGames(userId);
        return res.status(200).json(user);
    }

    @UseGuards(JwtAuthGuard)
    @Get('getImage')
    async getUserImage(@Req() req, @Res() res) {
        const userId = req.query.userId;
        try {
            const user = await this.usersService.getUserImage(userId);

            if (!user || !user.image) {
                return res.status(404).send('User image not found');
            }

            const imageFilePath = user.image;

            if (!fs.existsSync(imageFilePath)) {
                return res.status(404).send('User image not found');
            }

            const image = fs.readFileSync(imageFilePath);

            function getContentType(filePath: string): string | undefined {
                const extension = filePath.split('.').pop()?.toLowerCase();

                const contentTypeMap: { [key: string]: string } = {
                    jpg: 'image/jpg',
                    jpeg: 'image/jpeg',
                    png: 'image/png',
                };

                return contentTypeMap[extension];
            }

            const contentType = getContentType(imageFilePath);

            if (contentType) {
                res.setHeader('Content-Type', contentType);
            } else {
                return res.status(415).send('Unsupported Media Type');
            }

            res.status(200).send(image);
        } catch (error) {
            return res.status(500).send('Failed to fetch user image');
        }
    }

    @UseGuards(JwtAuthGuard)
    @Get('getHistory')
    async getMatchHistory(@Req() req, @Res() res) {
        const userId = req.user.userId;

        try {
            const matchHistory = await this.gamesService.getMatchHistory(userId);
            return res.status(200).json(matchHistory);
        } catch (error) {
            return res.status(500).json({ message: 'Failed to fetch match history.' });
        }
    }

    @UseGuards(JwtAuthGuard)
    @Get('all')
    async getAllUsers(@Req() req, @Res() res) {
        const users = await this.usersService.getAllUsers();
        return res.status(200).json(users);
    }

    @UseGuards(JwtAuthGuard)
    @Post('one')
    async getOne(@Req() req, @Res() res) {
        const userId = req.body.userId;
        const user = await this.usersService.getOne(userId);
        return res.status(200).json(user);
    }

    @UseGuards(JwtAuthGuard)
    @Get('getFriends')
    async getFriends(@Req() req, @Res() res) {
        const userId = req.user.userId;

        try {
            const friendIds = await this.usersService.getFriends(userId);
            return res.status(200).json(friendIds);
        } catch (error) {
            return res.status(500).json({ message: 'Failed to fetch friends.' });
        }
    }


    @UseGuards(JwtAuthGuard)
    @Post('addFriend')
    async addFriend(@Req() req, @Res() res) {
        const userId = req.user.userId;
        const friendId = req.body.addId;

        try {
            await this.usersService.addFriend(userId, friendId);
            res.status(200).send('User added as a friend.');
        } catch (error) {
            throw new BadRequestException('Failed to add user as a friend.');
        }
    }

    @UseGuards(JwtAuthGuard)
    @Post('removeFriend')
    async removeFriend(@Req() req, @Res() res) {
        const userId = req.user.userId;
        const friendId = req.body.friendId;

        try {
            await this.usersService.removeFriend(userId, friendId);
            res.status(200).send('User added as a friend.');
        } catch (error) {
            throw new BadRequestException('Failed to add user as a friend.');
        }
    }

    @UseGuards(JwtAuthGuard)
    @Post('blockUser')
    async blockUser(@Req() req, @Res() res) {
        const userId = req.user.userId;
        const blockId = req.body.blockId;

        try {
            await this.usersService.blockUser(userId, blockId);
            res.status(200).send('User blocked.');
        } catch (error) {
            console.error(error);
        }
    }

    @UseGuards(JwtAuthGuard)
    @Get('getBlockedUsers')
    async getBlockedUsers(@Req() req, @Res() res) {
        const userId = req.user.userId;

        try {
            const blockedUsers = await this.usersService.getBlockedUsers(userId);
            res.status(200).json(blockedUsers);
        } catch (error) {
            console.error(error);
        }
    }

}
