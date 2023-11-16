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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let UsersService = exports.UsersService = class UsersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createUser(user) {
        try {
            return await this.prisma.user.create({
                data: {
                    username: user.username,
                    display_name: user.displayName,
                    image: user.image,
                },
            });
        }
        catch (error) {
            throw new common_1.HttpException(error, 500);
        }
        ;
    }
    ;
    async updateGameResults(winnerId, loserId) {
        try {
            await this.prisma.user.update({
                where: {
                    id: winnerId,
                },
                data: {
                    gamesWon: { increment: 1 },
                }
            });
            await this.prisma.user.update({
                where: {
                    id: loserId,
                },
                data: {
                    gamesLost: { increment: 1 },
                }
            });
        }
        catch (error) {
            throw new common_1.HttpException(error, 500);
        }
    }
    async getUserById(id) {
        try {
            return await this.prisma.user.findUnique({
                where: { id: id },
            });
        }
        catch (error) {
            throw new common_1.HttpException(error, 500);
        }
        ;
    }
    async getOne(id) {
        try {
            return await this.prisma.user.findUnique({
                where: { id: id },
                select: {
                    id: true,
                    username: true,
                    display_name: true,
                    image: true,
                    connected: true,
                    games: true,
                },
            });
        }
        catch (error) {
            throw new Error('Failed to retrieve user data.');
        }
    }
    async getUserByUsername(username) {
        try {
            return await this.prisma.user.findUnique({
                where: { username: username },
            });
        }
        catch (error) {
            throw new common_1.HttpException(error, 500);
        }
        ;
    }
    async getAllUsers() {
        try {
            return await this.prisma.user.findMany({
                select: {
                    id: true,
                    username: true,
                    display_name: true,
                    image: true,
                    connected: true,
                }
            });
        }
        catch (error) {
            throw new common_1.HttpException(error, 500);
        }
        ;
    }
    async updateUserDiplayName(id, displayName) {
        try {
            return await this.prisma.user.update({
                where: { id: id },
                data: { display_name: displayName },
            });
        }
        catch (error) {
            throw new common_1.HttpException(error, 500);
        }
        ;
    }
    async checkDisplayNameAvailability(display_name) {
        const existingUser = await this.prisma.user.findUnique({
            where: { display_name },
        });
        return !existingUser;
    }
    async updateUserImage(id, imageUrl) {
        try {
            const updatedUser = await this.prisma.user.update({
                where: { id: parseInt(id) },
                data: { image: imageUrl },
            });
            return updatedUser;
        }
        catch (error) {
            throw new common_1.HttpException('Failed to update user image', 500);
        }
    }
    async getFriends(userId) {
        try {
            const user = await this.prisma.user.findUnique({ where: { id: userId } });
            const friendUsers = await this.prisma.user.findUnique({
                where: {
                    id: userId
                },
                select: {
                    friends: true
                },
            });
            return friendUsers.friends;
        }
        catch (error) {
            throw new common_1.HttpException(error, 500);
        }
    }
    async addFriend(userId, friendId) {
        try {
            const user = await this.prisma.user.findUnique({ where: { id: userId } });
            if (!user) {
                throw new common_1.HttpException('User not found.', 404);
            }
            if (user.friends.includes(friendId)) {
                throw new common_1.HttpException('User is already a friend.', 400);
            }
            await this.prisma.user.update({
                where: { id: userId },
                data: { friends: { push: friendId } },
            });
        }
        catch (error) {
            throw new common_1.HttpException('Failed to add user as a friend.', 500);
        }
    }
    async removeFriend(userId, friendId) {
        try {
            const user = await this.prisma.user.findUnique({ where: { id: userId } });
            if (!user) {
                throw new common_1.HttpException('User not found.', 404);
            }
            if (!user.friends.includes(friendId)) {
                throw new common_1.HttpException('User is not a friend.', 400);
            }
            await this.prisma.user.update({
                where: { id: userId },
                data: { friends: { set: user.friends.filter(id => id !== friendId) } },
            });
        }
        catch (error) {
            return error;
        }
    }
    async getUserGames(userId) {
        try {
            return await this.prisma.user.findUnique({
                where: { id: parseInt(userId) },
                include: {
                    games: {
                        include: {
                            users: true
                        }
                    }
                }
            });
        }
        catch (error) {
            return error;
        }
    }
    async getUserImage(userId) {
        try {
            return await this.prisma.user.findUnique({
                where: { id: parseInt(userId) },
            });
        }
        catch (error) {
            return error;
        }
    }
    async setConnected(userId) {
        try {
            await this.prisma.user.update({
                where: { id: userId },
                data: { connected: 1 },
            });
        }
        catch (error) {
            return error;
        }
    }
    async setDisconnected(userId) {
        try {
            await this.prisma.user.update({
                where: { id: userId },
                data: { connected: 0 },
            });
        }
        catch (error) {
            return error;
        }
    }
    async setInGame(userId) {
        try {
            await this.prisma.user.update({
                where: { id: userId },
                data: { connected: 2 },
            });
        }
        catch (error) {
            return error;
        }
    }
    async setOutGame(userId) {
        try {
            await this.prisma.user.update({
                where: { id: userId },
                data: { connected: 1 },
            });
        }
        catch (error) {
            return error;
        }
    }
    async getCurrentRoom(userId) {
        try {
            const user = await this.prisma.user.findUnique({ where: { id: userId } });
            const currentRoom = await this.prisma.user.findUnique({
                where: {
                    id: userId
                },
                select: {
                    currentRoom: true
                },
            });
            return currentRoom.currentRoom;
        }
        catch (error) {
            return error;
        }
    }
    async setCurrentRoom(userId, roomId) {
        try {
            await this.prisma.user.update({
                where: { id: userId },
                data: { currentRoom: roomId },
            });
        }
        catch (error) {
            console.log(error);
        }
    }
    async RemoveCurrentRoom(userId) {
        try {
            await this.prisma.user.update({
                where: { id: userId },
                data: { currentRoom: null },
            });
        }
        catch (error) {
            return error;
        }
    }
    async blockUser(userId, blockId) {
        try {
            const user = await this.prisma.user.findUnique({ where: { id: userId } });
            if (!user) {
                return 'User not found.';
            }
            if (user.blocked.includes(blockId)) {
                await this.prisma.user.update({
                    where: { id: userId },
                    data: { blocked: { set: user.blocked.filter(id => id !== blockId) } },
                });
                return 'User unblocked.';
            }
            await this.prisma.user.update({
                where: { id: userId },
                data: { blocked: { push: blockId } },
            });
        }
        catch (error) {
            return error;
        }
    }
    async getBlockedUsers(userId) {
        try {
            const user = await this.prisma.user.findUnique({ where: { id: userId } });
            const blockedUsers = await this.prisma.user.findUnique({
                where: {
                    id: userId
                },
                select: {
                    blocked: true
                },
            });
            return blockedUsers.blocked;
        }
        catch (error) {
            return error;
        }
    }
    async turnOnTwoFactorAuthentication(userId) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { twoFAEnabled: true },
        });
    }
};
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map