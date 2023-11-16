import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UsersService } from "src/users/users.service";
import * as bcrypt from "bcrypt";

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService
  ) { }

  async getRoomById(id: number) {
    try {
      return await this.prisma.room.findUnique({
        where: { id: id },
      });
    } catch (error) {
      return error;
    }
  }

  async createRoom(body: any, userid: number) {
    try {
      let roomName = body.name;
      let password = body.password;
      if (roomName)
        if (roomName.length > 20) return false;
      if (password)
        if (password.length > 20) return false;
      const privateRoom = body.privacy;
      if (roomName === "") {
        roomName = "New Room";
      }
      if (password !== undefined && password !== "") {
        password = await bcrypt.hash(password, 10);
      }
      const roomData: any = {
        name: roomName,
        owner: userid,
      };
      if (privateRoom === "private") {
        roomData.private = true;
      }
      if (password) {
        roomData.password = password;
      }
      return await this.prisma.room.create({
        data: roomData,
      });
    } catch (error) {
      console.log(error);
      return error;
    }
  }

  async checkPassword(roomId: number, password: string) {
    try {
      const room = await this.prisma.room.findUnique({
        where: { id: roomId },
      });
      if (!room) {
        return false;
      }
      if (!room.password) return true;
      if (room.password && (password === "" || password === undefined)) {
        return false;
      }
      const isMatch = await bcrypt.compare(password, room.password);
      return isMatch;
    } catch (error) {
      return false;
    }
  }

  async doesRoomAsPassword(roomId: number) {
    try {
      const room = await this.prisma.room.findUnique({
        where: { id: roomId },
      });
      if (!room) {
        return false;
      }
      if (!room.password) return false;
      return true;
    } catch (error) {
      return false;
    }
  }

  async checkIsRoomPrivate(roomId: number) {
    try {
      const room = await this.prisma.room.findUnique({
        where: { id: roomId },
      });
      if (!room) {
        return new Error("Room not found.");
      }
      return room.private;
    } catch (error) {
      return error;
    }
  }

  async putUserInRoom(userId: number, roomId: number, userId2: number) {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { rooms: { connect: { id: roomId } } },
      });
      await this.prisma.room.update({
        where: { id: roomId },
        data: { users: { connect: { id: userId } } },
      });
      if (userId2 !== null && userId2 !== undefined) {
        await this.prisma.user.update({
          where: { id: userId2 },
          data: { rooms: { connect: { id: roomId } } },
        });
        await this.prisma.room.update({
          where: { id: roomId },
          data: { users: { connect: { id: userId2 } } },
        });
      }
    } catch (error) {
      console.log(error);
      return error;
    }
  }

  async getAllRooms() {
    try {
      return await this.prisma.room.findMany(
        {
          select: {
            id: true,
            name: true,
            private: true,
            password: true,
          },
        }
      );
    } catch (error) {
      return error;
    }
  }

  async getOldMessages(roomId: number) {
    try {
      const room = await this.prisma.room.findUnique({
        where: { id: roomId },
        select: {
          muted: true,
        },
      });

      const mutedUserIds = room.muted || [];

      return await this.prisma.message.findMany({
        where: {
          roomId: roomId,
          NOT: {
            authorId: {
              in: [...mutedUserIds],
            },
          },
        },
      });
    } catch (error) {
      return error;
    }
  }


  async createMessage(userId: number, roomId: number, content: string, invite: boolean) {
    try {
      const user = await this.usersService.getUserById(userId);
      if (!user) {
        throw new Error("User not found.");
      }

      if (invite) content = "Invite you to make a pong Game";

      const authorName = user.display_name || "";

      return await this.prisma.message.create({
        data: {
          content: content,
          invite: invite,
          authorId: user.id,
          author: {
            connect: { id: user.id },
          },
          room: {
            connect: { id: roomId },
          },
        },
      });
    } catch (error) {
      throw new Error("Failed to create a message.");
    }
  }

  async getIdOfUserInRoom(roomId: number) {
    try {
      return await this.prisma.room.findUnique({
        where: { id: roomId },
        select: {
          users: {
            select: {
              id: true,
            },
          },
        },
      });
    } catch (error) {
      return error;
    }
  }

  async isInRoom(userId: number, roomId: number) {
    try {
      const user = await this.getIdOfUserInRoom(roomId);
      if (!user) {
        return false;
      }
      for (let i = 0; i < user.users.length; i++) {
        if (user.users[i].id === userId) {
          return true;
        }
      }
      return false;
    } catch (error) {
      return error;
    }
  }

  async isOwner(userId: number, roomId: number) {
    try {
      const room = await this.prisma.room.findUnique({
        where: { id: roomId },
      });
      if (!room) {
        return false;
      }
      if (Number(room.owner) === userId) {
        return true;
      }
      return false;
    } catch (error) {
      return error;
    }
  }

  async isAdmin(userId: number, roomId: number) {
    try {
      const room = await this.prisma.room.findUnique({
        where: { id: roomId },
        select: {
          admin: true,
        },
      });

      if (!room) {
        return false;
      }

      return room.admin.includes(userId);
    } catch (error) {
      return error;
    }
  }

  async setAdmin(userId: number, roomId: number) {
    try {
      const room = await this.prisma.room.findUnique({
        where: { id: roomId },
        select: {
          admin: true,
        },
      });

      if (!room) {
        return false;
      }

      if (!room.admin.includes(userId)) {
        await this.prisma.room.update({
          where: { id: roomId },
          data: {
            admin: {
              push: userId,
            },
          },
        });
      }

      return true;
    } catch (error) {
      return error;
    }
  }

  async checkPrivateRoomUsingTwoUsers(userId1: number, userId2: number) {
    try {
      const rooms = await this.prisma.room.findMany({
        where: { private: true },
        include: {
          users: true,
        },
      });
      for (let i = 0; i < rooms.length; i++) {
        if (
          rooms[i].users[0].id === userId1 &&
          rooms[i].users[1].id === userId2
        ) {
          return rooms[i];
        }
        if (
          rooms[i].users[0].id === userId2 &&
          rooms[i].users[1].id === userId1
        ) {
          return rooms[i];
        }
      }
      return null;
    } catch (error) {
      return error;
    }
  }

  async isBlocked(receiver: number, sender: number) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: receiver },
        select: {
          blocked: true,
        },
      });
      if (!user) {
        return false;
      }
      return user.blocked.includes(sender);
    } catch (error) {
      return error;
    }
  }


  async getUserIdFromMessage(messageId: number) {
    try {
      const message = await this.prisma.message.findUnique({
        where: { id: messageId },
        select: {
          author: {
            select: { id: true },
          },
        },
      });

      const authorId = message?.author.id;
      return authorId;
    } catch (error) {
      return error;
    }
  }

  async isUserBanned(userId: number, roomId: number) {
    try {
      const room = await this.prisma.room.findUnique({
        where: { id: roomId },
        select: {
          banned: true,
        },
      });

      if (!room) {
        return false;
      }

      return room.banned.includes(userId);
    } catch (error) {
      return error;
    }
  }

  async BanUser(userId: number, roomId: number) {
    try {
      const room = await this.prisma.room.findUnique({
        where: { id: roomId },
        select: {
          banned: true,
        },
      });

      if (!room) {
        return false;
      }

      if (!room.banned.includes(userId)) {
        await this.prisma.room.update({
          where: { id: roomId },
          data: {
            banned: {
              push: userId,
            },
            users: {
              disconnect: {
                id: userId,
              },
            },
          },
        });
      }
      return true;
    } catch (error) {
      return error;
    }
  }

  async deleteRoom(roomId: number) {
    try {
      await this.prisma.room.delete({
        where: { id: roomId },
      });
      return true;
    } catch (error) {
      return error;
    }
  }

  async ChangePassword(roomId: number, password: string) {

    if (password === undefined && password === "") {
      return false;
    }
    try {
      password = await bcrypt.hash(password, 10);
      await this.prisma.room.update({
        where: { id: roomId },
        data: { password: password },
      });
      return true;
    } catch (error) {
      return error;
    }

  }

  async removeAllUsersFromRoomExceptOne(roomId: number, userIdToKeep: number) {
    try {
      const room = await this.prisma.room.findUnique({
        where: { id: roomId },
        include: { users: true },
      });

      if (!room) {
        throw new Error('Room not found');
      }

      const usersToDisconnect = room.users.map((user) => user.id).filter((id) => id !== userIdToKeep);

      await this.prisma.room.update({
        where: { id: roomId },
        data: {
          users: {
            disconnect: usersToDisconnect.map((id) => ({ id })),
          },
        },
      });
      return usersToDisconnect;
    }
    catch (error) {
      return error;
    }
  }

  async muteUser(userId: number, roomId: number) {
    try {
      await this.prisma.room.update({
        where: { id: roomId },
        data: {
          muted: {
            push: userId,
          },
        },
      });

      setTimeout(async () => {
        const room = await this.prisma.room.findUnique({
          where: { id: roomId },
          select: { muted: true },
        });

        if (room) {
          const updatedMuted = room.muted.filter((mutedUserId) => mutedUserId !== userId);

          await this.prisma.room.update({
            where: { id: roomId },
            data: {
              muted: updatedMuted,
            },
          });
        }
      }, 10000);

      return true;
    } catch (error) {
      return error;
    }
  }

  async isUserMuted(userId: number, roomId: number) {
    try {
      const room = await this.prisma.room.findUnique({
        where: { id: roomId },
        select: {
          muted: true,
        },
      });

      if (!room) {
        return false;
      }

      return room.muted.includes(userId);
    } catch (error) {
      return error;
    }
  }

}