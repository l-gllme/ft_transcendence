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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("./users.service");
const game_service_1 = require("../game/game.service");
const multer_1 = require("@nestjs/platform-express/multer");
const fs = require("fs");
const path = require("path");
const jwt_auth_guard_1 = require("../auth/utils/jwt/jwt.auth.guard");
let UsersController = exports.UsersController = class UsersController {
    constructor(usersService, gamesService) {
        this.usersService = usersService;
        this.gamesService = gamesService;
    }
    async uploadAvatar(req, file, res) {
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
        }
        catch (error) {
            console.error('Failed to save the uploaded file:', error);
            return res.status(500).send('Failed to upload the file');
        }
    }
    async updateDisplayName(req, res) {
        const { display_name } = req.body;
        const user = await this.usersService.updateUserDiplayName(req.user.userId, display_name);
        return res.status(200).json(user);
    }
    async checkDisplayName(req, res) {
        const { display_name } = req.body;
        if (!display_name || display_name.trim(' ').length === 0) {
            return res.status(400).send('Empty display name provided.');
        }
        else if (display_name.length > 12) {
            return res.status(400).send('Too long display name provided. Keep it under 12.');
        }
        else if (/[\!\[\]\{\}\(\)\;\/\?\'\\]/g.test(display_name)) {
            return res.status(400).send('Invalid characters in the display name.');
        }
        const isAvailable = await this.usersService.checkDisplayNameAvailability(display_name);
        if (isAvailable) {
            return res.status(200).send();
        }
        else {
            return res.status(400).send('This name is already in use. Please choose another.');
        }
    }
    async getUserGames(req, res) {
        const userId = req.query.id;
        const user = await this.usersService.getUserGames(userId);
        return res.status(200).json(user);
    }
    async getUserImage(req, res) {
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
            function getContentType(filePath) {
                var _a;
                const extension = (_a = filePath.split('.').pop()) === null || _a === void 0 ? void 0 : _a.toLowerCase();
                const contentTypeMap = {
                    jpg: 'image/jpg',
                    jpeg: 'image/jpeg',
                    png: 'image/png',
                };
                return contentTypeMap[extension];
            }
            const contentType = getContentType(imageFilePath);
            if (contentType) {
                res.setHeader('Content-Type', contentType);
            }
            else {
                return res.status(415).send('Unsupported Media Type');
            }
            res.status(200).send(image);
        }
        catch (error) {
            return res.status(500).send('Failed to fetch user image');
        }
    }
    async getMatchHistory(req, res) {
        const userId = req.user.userId;
        try {
            const matchHistory = await this.gamesService.getMatchHistory(userId);
            return res.status(200).json(matchHistory);
        }
        catch (error) {
            return res.status(500).json({ message: 'Failed to fetch match history.' });
        }
    }
    async getAllUsers(req, res) {
        const users = await this.usersService.getAllUsers();
        return res.status(200).json(users);
    }
    async getOne(req, res) {
        const userId = req.body.userId;
        const user = await this.usersService.getOne(userId);
        return res.status(200).json(user);
    }
    async getFriends(req, res) {
        const userId = req.user.userId;
        try {
            const friendIds = await this.usersService.getFriends(userId);
            return res.status(200).json(friendIds);
        }
        catch (error) {
            return res.status(500).json({ message: 'Failed to fetch friends.' });
        }
    }
    async addFriend(req, res) {
        const userId = req.user.userId;
        const friendId = req.body.addId;
        try {
            await this.usersService.addFriend(userId, friendId);
            res.status(200).send('User added as a friend.');
        }
        catch (error) {
            throw new common_1.BadRequestException('Failed to add user as a friend.');
        }
    }
    async removeFriend(req, res) {
        const userId = req.user.userId;
        const friendId = req.body.friendId;
        try {
            await this.usersService.removeFriend(userId, friendId);
            res.status(200).send('User added as a friend.');
        }
        catch (error) {
            throw new common_1.BadRequestException('Failed to add user as a friend.');
        }
    }
    async blockUser(req, res) {
        const userId = req.user.userId;
        const blockId = req.body.blockId;
        try {
            await this.usersService.blockUser(userId, blockId);
            res.status(200).send('User blocked.');
        }
        catch (error) {
            console.error(error);
        }
    }
    async getBlockedUsers(req, res) {
        const userId = req.user.userId;
        try {
            const blockedUsers = await this.usersService.getBlockedUsers(userId);
            res.status(200).json(blockedUsers);
        }
        catch (error) {
            console.error(error);
        }
    }
};
__decorate([
    (0, common_1.Post)('upload'),
    (0, common_1.UseInterceptors)((0, multer_1.FileInterceptor)('image')),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "uploadAvatar", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('displayname'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateDisplayName", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('checkdisplayname'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "checkDisplayName", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('getGames'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getUserGames", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('getImage'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getUserImage", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('getHistory'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getMatchHistory", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('all'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getAllUsers", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('one'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getOne", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('getFriends'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getFriends", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('addFriend'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "addFriend", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('removeFriend'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "removeFriend", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('blockUser'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "blockUser", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('getBlockedUsers'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getBlockedUsers", null);
exports.UsersController = UsersController = __decorate([
    (0, common_1.Controller)('users'),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        game_service_1.GamesService])
], UsersController);
//# sourceMappingURL=users.controller.js.map