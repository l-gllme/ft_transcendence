import { OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
import { ChatService } from 'src/chat/chat.service';
import { UsersService } from 'src/users/users.service';
import { Game } from '../game/game.service';
declare enum userState {
    Idle = "idle",
    InQueue = "inQueue",
    Busy = "busy"
}
export declare class WebsocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private prisma;
    private readonly chatService;
    private readonly userService;
    server: Server;
    private logger;
    private userToSocketMap;
    private userStates;
    private games;
    private idToGameIdMap;
    private matchQueue;
    constructor(prisma: PrismaService, chatService: ChatService, userService: UsersService);
    handleJoinQueue(client: Socket, difficulty: number): void;
    handleGameOnInvite(client: Socket, user2Id: number): Promise<void>;
    startGame(user1Id: number, user2Id: number, difficulty: number): void;
    gameLoop(game: Game): void;
    emitGameState(game: Game, isLead: boolean): void;
    emitUserState(userId: number, newState: userState, delay: number): Promise<void>;
    handleStopGame(client: Socket): void;
    emitGameOver(game: Game, userId: number | null): Promise<void>;
    handleMovePaddle(client: Socket, key: string): void;
    getUserToSocketMap(): Map<number, Socket<import("socket.io/dist/typed-events").DefaultEventsMap, import("socket.io/dist/typed-events").DefaultEventsMap, import("socket.io/dist/typed-events").DefaultEventsMap, any>>;
    handleDisconnect(client: Socket): void;
    handleConnection(client: Socket, ...args: any[]): void;
    afterInit(server: Server): void;
    handleMessage(client: Socket, messageData: {
        text: string;
        sender: string;
        roomId: number;
        invite: boolean;
    }): Promise<void>;
    handleCurrentRoom(client: Socket, roomId: string): Promise<void>;
    handleKickFromRoom(client: Socket, data: {
        userToKick: any;
        roomId: any;
        bool: boolean;
    }): Promise<void>;
}
export {};
