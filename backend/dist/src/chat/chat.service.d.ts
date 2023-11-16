import { PrismaService } from "../prisma/prisma.service";
import { UsersService } from "src/users/users.service";
export declare class ChatService {
    private prisma;
    private usersService;
    constructor(prisma: PrismaService, usersService: UsersService);
    getRoomById(id: number): Promise<any>;
    createRoom(body: any, userid: number): Promise<any>;
    checkPassword(roomId: number, password: string): Promise<boolean>;
    doesRoomAsPassword(roomId: number): Promise<boolean>;
    checkIsRoomPrivate(roomId: number): Promise<any>;
    putUserInRoom(userId: number, roomId: number, userId2: number): Promise<any>;
    getAllRooms(): Promise<any>;
    getOldMessages(roomId: number): Promise<any>;
    createMessage(userId: number, roomId: number, content: string, invite: boolean): Promise<{
        id: number;
        content: string;
        createdAt: Date;
        authorName: string;
        authorId: number;
        roomId: number;
        invite: boolean;
    }>;
    getIdOfUserInRoom(roomId: number): Promise<any>;
    isInRoom(userId: number, roomId: number): Promise<any>;
    isOwner(userId: number, roomId: number): Promise<any>;
    isAdmin(userId: number, roomId: number): Promise<any>;
    setAdmin(userId: number, roomId: number): Promise<any>;
    checkPrivateRoomUsingTwoUsers(userId1: number, userId2: number): Promise<any>;
    isBlocked(receiver: number, sender: number): Promise<any>;
    getUserIdFromMessage(messageId: number): Promise<any>;
    isUserBanned(userId: number, roomId: number): Promise<any>;
    BanUser(userId: number, roomId: number): Promise<any>;
    deleteRoom(roomId: number): Promise<any>;
    ChangePassword(roomId: number, password: string): Promise<any>;
    removeAllUsersFromRoomExceptOne(roomId: number, userIdToKeep: number): Promise<any>;
    muteUser(userId: number, roomId: number): Promise<any>;
    isUserMuted(userId: number, roomId: number): Promise<any>;
}
