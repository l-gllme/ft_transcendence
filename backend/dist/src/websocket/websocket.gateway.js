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
exports.WebsocketGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const common_1 = require("@nestjs/common");
const socket_io_1 = require("socket.io");
const prisma_service_1 = require("../prisma/prisma.service");
const chat_service_1 = require("../chat/chat.service");
const users_service_1 = require("../users/users.service");
const game_service_1 = require("../game/game.service");
var userState;
(function (userState) {
    userState["Idle"] = "idle";
    userState["InQueue"] = "inQueue";
    userState["Busy"] = "busy";
})(userState || (userState = {}));
let WebsocketGateway = exports.WebsocketGateway = class WebsocketGateway {
    constructor(prisma, chatService, userService) {
        this.prisma = prisma;
        this.chatService = chatService;
        this.userService = userService;
        this.logger = new common_1.Logger('WebsocketGateway');
        this.userToSocketMap = new Map();
        this.userStates = {};
        this.games = {};
        this.idToGameIdMap = new Map();
        this.matchQueue = [];
    }
    handleJoinQueue(client, difficulty) {
        const userId = parseInt(client.handshake.query.userId, 10);
        if (!this.userToSocketMap.has(userId)) {
            this.logger.error("handleJoinQueue: userId not connected");
            return;
        }
        if (this.userStates[userId] === userState.InQueue) {
            return;
        }
        this.emitUserState(userId, userState.InQueue, 0);
        this.matchQueue.push({ userId, difficulty });
        if (this.matchQueue.length >= 2) {
            const user1 = this.matchQueue.find(user => user.difficulty === difficulty);
            const index1 = this.matchQueue.indexOf(user1);
            if (index1 !== -1) {
                this.matchQueue.splice(index1, 1);
                const user2 = this.matchQueue.find(user => user.difficulty === difficulty);
                const index2 = this.matchQueue.indexOf(user2);
                if (index2 !== -1) {
                    this.matchQueue.splice(index2, 1);
                    this.startGame(user1.userId, user2.userId, user1.difficulty);
                }
            }
        }
    }
    async handleGameOnInvite(client, user2Id) {
        const user1Id = parseInt(client.handshake.query.userId, 10);
        if (!this.userToSocketMap.has(user1Id) || !this.userToSocketMap.has(user2Id)) {
            this.logger.error("handleJoinQueue: one user is not connected");
            return;
        }
        const socket = await this.userToSocketMap.get(user2Id);
        const socket1 = await this.userToSocketMap.get(user1Id);
        if (!socket || !socket1) {
            this.logger.error("gameOnInvite: socket doesnt exist");
            return;
        }
        if (this.userStates[user1Id] != userState.Idle || this.userStates[user2Id] != userState.Idle) {
            this.logger.error("gameOnInvite: one of the users is not Idle");
            return;
        }
        socket.emit('gameOnInvite', user1Id);
        socket1.emit('gameOnInvite', user2Id);
        setTimeout(() => { this.startGame(user1Id, user2Id, 1); }, 1000);
    }
    startGame(user1Id, user2Id, difficulty) {
        let specialGame;
        if (difficulty == 1)
            specialGame = false;
        else
            specialGame = true;
        const game = new game_service_1.Game(user1Id, user2Id, 2, specialGame);
        const gameId = game.getGameId();
        this.emitUserState(user1Id, userState.Busy, 0);
        this.emitUserState(user2Id, userState.Busy, 0);
        this.idToGameIdMap.set(user1Id, gameId);
        this.idToGameIdMap.set(user2Id, gameId);
        this.games[gameId] = game;
        this.gameLoop(game);
    }
    gameLoop(game) {
        const interval = setInterval(() => {
            this.emitGameState(game, false);
            this.emitGameState(game, true);
            if (!game.gameOn()) {
                clearInterval(interval);
                return;
            }
            if (game.isScoreMax()) {
                clearInterval(interval);
                this.emitGameOver(game, null);
                return;
            }
            if (!game.getBallStatus())
                game.resetBallValues();
            game.calculateNextBallPosition();
            if (game.getBallStatus() == -1) {
                clearInterval(interval);
                return;
            }
        }, 1000 / 60);
    }
    emitGameState(game, isLead) {
        if (!game) {
            this.logger.error("emitGameState: game does not exist");
            return;
        }
        const gamestate = game.getGameState(isLead);
        const socket = this.userToSocketMap.get(game.getUserId(isLead));
        if (!socket) {
            this.logger.error("emitGameState: socket does not exist");
            return;
        }
        socket.emit('gameState', gamestate);
    }
    async emitUserState(userId, newState, delay) {
        if (newState == userState.Busy)
            this.userService.setInGame(userId);
        else if (this.userStates[userId] == userState.Busy && newState == userState.Idle)
            this.userService.setOutGame(userId);
        this.userStates[userId] = newState;
        const userSocket = this.userToSocketMap.get(userId);
        if (!userSocket) {
            this.logger.error("emitUserState: socket does not exist");
            return;
        }
        if (delay)
            await new Promise(resolve => setTimeout(resolve, delay));
        if (newState == this.userStates[userId])
            userSocket.emit('userState', newState);
    }
    handleStopGame(client) {
        const userId = parseInt(client.handshake.query.userId, 10);
        if (!this.userToSocketMap.has(userId)) {
            this.logger.error("handleStopGame: userId not connected");
            return;
        }
        if (this.userStates[userId] === userState.Idle) {
            return;
        }
        else if (this.userStates[userId] === userState.InQueue) {
            const index = this.matchQueue.findIndex(user => user.userId === userId);
            if (index !== -1) {
                this.matchQueue.splice(index, 1);
            }
            this.emitUserState(userId, userState.Idle, 0);
        }
        else if (this.userStates[userId] === userState.Busy) {
            const gameId = this.idToGameIdMap.get(userId);
            if (!gameId) {
                this.logger.error("handleStopGame: gameId does not exist");
                return;
            }
            const game = this.games[gameId];
            if (!game) {
                this.logger.error("handleStopGame: game does not exist");
                return;
            }
            game.abandonned(game.isLead(userId));
            this.emitGameOver(game, userId);
        }
    }
    async emitGameOver(game, userId) {
        let user1Delay = 5000;
        let user2Delay = 5000;
        game.gameOver();
        const user1Id = game.getUserId(true);
        const user2Id = game.getUserId(false);
        if (userId)
            userId == user1Id ? user1Delay = 0 : user2Delay = 0;
        const user1Score = game.getScore(true);
        const user2Score = game.getScore(false);
        try {
            const game = await this.prisma.game.create({
                data: {
                    startTime: new Date(),
                    user1Id: user1Id,
                    user2Id: user2Id,
                    user1Score: user1Score,
                    user2Score: user2Score,
                    users: {
                        connect: [{ id: user1Id }, { id: user2Id }]
                    }
                }
            });
            if (user1Score > user2Score)
                await this.userService.updateGameResults(user1Id, user2Id);
            else
                await this.userService.updateGameResults(user2Id, user1Id);
        }
        catch (error) {
            this.logger.error('Error creating game:', error);
        }
        const user1GameOverInfos = game.getGameOverInfos(true);
        const user2GameOverInfos = game.getGameOverInfos(false);
        const user1Socket = this.userToSocketMap.get(user1Id);
        const user2Socket = this.userToSocketMap.get(user2Id);
        if (user1Socket)
            user1Socket.emit('gameOver', user1GameOverInfos);
        if (user2Socket)
            user2Socket.emit('gameOver', user2GameOverInfos);
        this.emitUserState(user1Id, userState.Idle, user1Delay);
        this.emitUserState(user2Id, userState.Idle, user2Delay);
    }
    handleMovePaddle(client, key) {
        const userId = parseInt(client.handshake.query.userId, 10);
        if (!this.userToSocketMap.has(userId)) {
            this.logger.error("handleMovePaddle: userId not connected");
            return;
        }
        const gameId = this.idToGameIdMap.get(userId);
        if (!gameId) {
            this.logger.error(`Invalid gameId for user ${userId}.`);
            return;
        }
        const game = this.games[gameId];
        if (!game) {
            this.logger.error("handleMovePaddle: game does not exist");
            return;
        }
        if (this.userStates[userId] !== userState.Busy) {
            this.logger.error(`User ${userId} is not in the correct state.`);
            return;
        }
        game.isLead(userId) ? game.movePaddle(key, true) : game.movePaddle(key, false);
    }
    getUserToSocketMap() {
        return this.userToSocketMap;
    }
    handleDisconnect(client) {
        const userId = parseInt(client.handshake.query.userId, 10);
        if (!this.userToSocketMap.has(userId)) {
            this.logger.error("handleDisconnect: userId not connected");
            return;
        }
        this.handleStopGame(client);
        this.userService.setDisconnected(userId);
        this.userToSocketMap.delete(userId);
    }
    handleConnection(client, ...args) {
        const userId = parseInt(client.handshake.query.userId, 10);
        this.userToSocketMap.set(userId, client);
        this.userService.setConnected(userId);
        this.userStates[userId] = userState.Idle;
    }
    afterInit(server) {
        this.logger.log('WebSocket gateway initialized.');
    }
    async handleMessage(client, messageData) {
        const userId = parseInt(client.handshake.query.userId);
        if (!await this.chatService.getRoomById(messageData.roomId) || !await this.chatService.isInRoom(userId, messageData.roomId)) {
            const socket = await this.userToSocketMap.get(userId);
            if (socket) {
                socket.emit('msgToClient', null);
            }
            return;
        }
        if (await this.chatService.isUserMuted(userId, messageData.roomId))
            return;
        const message = await this.chatService.createMessage(userId, messageData.roomId, messageData.text, messageData.invite);
        const ids = await this.chatService.getIdOfUserInRoom(messageData.roomId);
        const users = ids.users;
        const sender = parseInt(client.handshake.query.userId);
        for (const user of users) {
            const userId = user.id;
            const socket = await this.userToSocketMap.get(userId);
            if (socket) {
                if (!await this.chatService.isBlocked(userId, sender))
                    socket.emit('msgToClient', message);
            }
        }
    }
    async handleCurrentRoom(client, roomId) {
        const userId = parseInt(client.handshake.query.userId);
        const rId = parseInt(roomId);
        await this.userService.setCurrentRoom(userId, rId);
    }
    async handleKickFromRoom(client, data) {
        const userId = parseInt(client.handshake.query.userId);
        const currentRoom = await this.userService.getCurrentRoom(data.userToKick);
        if (currentRoom === data.roomId) {
            const socket = await this.userToSocketMap.get(data.userToKick);
            if (socket) {
                if (data.bool)
                    socket.emit('getKicked', false);
                else
                    socket.emit('getKicked', true);
            }
        }
    }
};
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], WebsocketGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinQueue'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Number]),
    __metadata("design:returntype", void 0)
], WebsocketGateway.prototype, "handleJoinQueue", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('gameOnInvite'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Number]),
    __metadata("design:returntype", Promise)
], WebsocketGateway.prototype, "handleGameOnInvite", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('stopGame'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], WebsocketGateway.prototype, "handleStopGame", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('movePaddle'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, String]),
    __metadata("design:returntype", void 0)
], WebsocketGateway.prototype, "handleMovePaddle", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('msgToServer'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], WebsocketGateway.prototype, "handleMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinCurrentRoom'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, String]),
    __metadata("design:returntype", Promise)
], WebsocketGateway.prototype, "handleCurrentRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('kickFromRoom'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], WebsocketGateway.prototype, "handleKickFromRoom", null);
exports.WebsocketGateway = WebsocketGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
        },
    }),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        chat_service_1.ChatService,
        users_service_1.UsersService])
], WebsocketGateway);
//# sourceMappingURL=websocket.gateway.js.map