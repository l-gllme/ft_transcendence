import { HttpException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import e = require('express');

@Injectable()
export class UsersService {

    constructor(private prisma: PrismaService) { }

    async createUser(user: any) {
        try {
            return await this.prisma.user.create({
                data: {
                    username: user.username,
                    display_name: user.displayName,
                    image: user.image,
                },
            });
        } catch (error) {
            throw new HttpException(error, 500);
        };
    };

    async updateGameResults(winnerId: number, loserId: number): Promise<void> {
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
        } catch (error) {
            throw new HttpException(error, 500);
        }
    }

    async getUserById(id: number) {
        try {
            return await this.prisma.user.findUnique({
                where: { id: id },
            });
        } catch (error) {
            throw new HttpException(error, 500);
        };
    }

    async getOne(id: number) {
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
        } catch (error) {
            throw new Error('Failed to retrieve user data.');
        }
    }


    async getUserByUsername(username: string) {
        try {
            return await this.prisma.user.findUnique({
                where: { username: username },
            });
        } catch (error) {
            throw new HttpException(error, 500);
        };
    }

    async getAllUsers() {
        try {
            return await this.prisma.user.findMany(
                {
                    select: {
                        id: true,
                        username: true,
                        display_name: true,
                        image: true,
                        connected: true,
                    }
                }
            );
        } catch (error) {
            throw new HttpException(error, 500);
        };
    }

    async updateUserDiplayName(id: number, displayName: string) {
        try {
            return await this.prisma.user.update({
                where: { id: id },
                data: { display_name: displayName },
            });
        } catch (error) {
            throw new HttpException(error, 500);
        };
    }

    async checkDisplayNameAvailability(display_name: string): Promise<boolean> {
        const existingUser = await this.prisma.user.findUnique({
            where: { display_name },
        });
        return !existingUser;
    }

    async updateUserImage(id: string, imageUrl: string) {
        try {
            const updatedUser = await this.prisma.user.update({
                where: { id: parseInt(id) },
                data: { image: imageUrl },
            });
            return updatedUser;
        } catch (error) {
            throw new HttpException('Failed to update user image', 500);
        }
    }

    async getFriends(userId: number) {
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
        } catch (error) {
            throw new HttpException(error, 500);
        }
    }


    async addFriend(userId: number, friendId: number): Promise<void> {
        try {
            const user = await this.prisma.user.findUnique({ where: { id: userId } });

            if (!user) {
                throw new HttpException('User not found.', 404);
            }

            if (user.friends.includes(friendId)) {
                throw new HttpException('User is already a friend.', 400);
            }

            await this.prisma.user.update({
                where: { id: userId },
                data: { friends: { push: friendId } },
            });
        } catch (error) {
            throw new HttpException('Failed to add user as a friend.', 500);
        }
    }

    async removeFriend(userId: number, friendId: number): Promise<void> {
        try {
            const user = await this.prisma.user.findUnique({ where: { id: userId } });

            if (!user) {
                throw new HttpException('User not found.', 404);
            }

            if (!user.friends.includes(friendId)) {
                throw new HttpException('User is not a friend.', 400);
            }

            await this.prisma.user.update({
                where: { id: userId },
                data: { friends: { set: user.friends.filter(id => id !== friendId) } },
            });
        } catch (error) {
            return error;
        }
    }

    async getUserGames(userId: string) {
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
        } catch (error) {
            return error;
        }
    }

    async getUserImage(userId: string) {
        try {
            return await this.prisma.user.findUnique({
                where: { id: parseInt(userId) },
            });
        } catch (error) {
            return error;
        }
    }

    async setConnected(userId: number) {
        try {
            await this.prisma.user.update({
                where: { id: userId },
                data: { connected: 1 },
            });


        } catch (error) {
            return error;
        }
    }

    async setDisconnected(userId: number) {
        try {
            await this.prisma.user.update({
                where: { id: userId },
                data: { connected: 0 },
            });
        } catch (error) {
            return error;
        }
    }

	async setInGame(userId: number) {
        try {
            await this.prisma.user.update({
                where: { id: userId },
                data: { connected: 2 },
            });
        } catch (error) {
            return error;
        }
    }

    async setOutGame(userId: number) {
        try {
            await this.prisma.user.update({
                where: { id: userId },
                data: { connected: 1 },
            });
        } catch (error) {
            return error;
        }
    }

    async getCurrentRoom(userId: number) {
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
        } catch (error) {
            return error;
        }
    }

    async setCurrentRoom(userId: number, roomId: number) {
        try {
            await this.prisma.user.update({
                where: { id: userId },
                data: { currentRoom: roomId },
            });
        } catch (error) {
            console.log(error);
        }
    }

    async RemoveCurrentRoom(userId: number) {
        try {
            await this.prisma.user.update({
                where: { id: userId },
                data: { currentRoom: null },
            });
        } catch (error) {
            return error;
        }
    }

    async blockUser(userId: number, blockId: number) {
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
        } catch (error) {
            return error;
        }
    }

    async getBlockedUsers(userId: number) {
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
        } catch (error) {
            return error;
        }
    }

    async turnOnTwoFactorAuthentication(userId: number) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { twoFAEnabled: true },
        });
    }
}
