import {
	SubscribeMessage,
	WebSocketGateway,
	OnGatewayInit,
	WebSocketServer,
	OnGatewayConnection,
	OnGatewayDisconnect,
	MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Socket, Server } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
import { ChatService } from 'src/chat/chat.service';
import { UsersService } from 'src/users/users.service';
import { use } from 'passport';
import { Game, GameState } from '../game/game.service'

enum userState {
	Idle = 'idle',
	InQueue = 'inQueue',
	Busy = 'busy',
}

@WebSocketGateway({
	cors: {
		origin: '*',
	},
})

export class WebsocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
	@WebSocketServer() server: Server;
	private logger: Logger = new Logger('WebsocketGateway');
	private userToSocketMap = new Map<number, Socket>();
	private userStates: Record<number, userState> = {};
	private games: Record<string, Game> = {};
	private idToGameIdMap = new Map<number, string>();
	private matchQueue: { userId: number; difficulty: number }[] = [];

	constructor(
		private prisma: PrismaService,
		private readonly chatService: ChatService,
		private readonly userService: UsersService,
	) { }

	@SubscribeMessage('joinQueue')
	handleJoinQueue(client: Socket, difficulty: number): void {
		const userId = parseInt(client.handshake.query.userId as string, 10);
		if (!this.userToSocketMap.has(userId)) {
			this.logger.log("handleJoinQueue: userId not connected");
			return;
		}
		if (this.userStates[userId] !== userState.Idle) {
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

	@SubscribeMessage('gameOnInvite')
	async handleGameOnInvite(client: Socket, user2Id: number): Promise<void> {
		const user1Id = parseInt(client.handshake.query.userId as string, 10);
		if (!this.userToSocketMap.has(user1Id) || !this.userToSocketMap.has(user2Id)) {
			this.logger.log("handleJoinQueue: one user is not connected");
			return;
		}
		if (user1Id === user2Id)
			return ;
		const socket = await this.userToSocketMap.get(user2Id);
		const socket1 = await this.userToSocketMap.get(user1Id);
		if (!socket || !socket1) {
			this.logger.log("gameOnInvite: socket doesnt exist");
			return;
		}
		if (this.userStates[user1Id] != userState.Idle || this.userStates[user2Id] != userState.Idle) {
			this.logger.log("gameOnInvite: one of the users is not Idle");
			return;
		}
		socket.emit('gameOnInvite', user1Id);
		socket1.emit('gameOnInvite', user2Id);
		setTimeout(() => { this.startGame(user1Id, user2Id, 1); }, 500);

	}

	startGame(user1Id: number, user2Id: number, difficulty: number) {
		let specialGame: boolean;
		if (user1Id === user2Id)
			return ;
		if (difficulty == 1)
			specialGame = false;
		else
			specialGame = true
		const game = new Game(user1Id, user2Id, 2, specialGame);
		const gameId = game.getGameId();
		this.emitUserState(user1Id, userState.Busy, 0);
		this.emitUserState(user2Id, userState.Busy, 0);
		this.idToGameIdMap.set(user1Id, gameId);
		this.idToGameIdMap.set(user2Id, gameId);
		this.games[gameId] = game;
		this.gameLoop(game);

	}

	gameLoop(game: Game): void {
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

	emitGameState(game: Game, isLead: boolean): void {
		if (!game) {
			this.logger.log("emitGameState: game does not exist")
			return;
		}
		const gamestate: GameState = game.getGameState(isLead);
		const socket = this.userToSocketMap.get(game.getUserId(isLead));
		if (!socket) {
			this.logger.log("emitGameState: socket does not exist");
			return;
		}
		socket.emit('gameState', gamestate);
	}


	async emitUserState(userId: number, newState: userState, delay: number) {
		if (newState == userState.Busy)
			this.userService.setInGame(userId);
		else if (this.userStates[userId] == userState.Busy && newState == userState.Idle)
			this.userService.setOutGame(userId);
		this.userStates[userId] = newState;
		const userSocket = this.userToSocketMap.get(userId);
		if (!userSocket) {
			this.logger.log("emitUserState: socket does not exist");
			return;
		}
		if (delay)
			await new Promise(resolve => setTimeout(resolve, delay));
		if (newState == this.userStates[userId])
			userSocket.emit('userState', newState);
	}



	@SubscribeMessage('stopGame')
	handleStopGame(client: Socket): void {
		const userId = parseInt(client.handshake.query.userId as string, 10);
		if (!this.userToSocketMap.has(userId)) {
			this.logger.log("handleStopGame: userId not connected");
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
				this.logger.log("handleStopGame: gameId does not exist")
				return;
			}
			const game = this.games[gameId];
			if (!game) {
				this.logger.log("handleStopGame: game does not exist")
				return;
			}
			game.abandonned(game.isLead(userId));
			this.emitGameOver(game, userId);
		}
	}

	async emitGameOver(game: Game, userId: number | null) {
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
				await this.userService.updateGameResults(user1Id, user2Id)
			else
				await this.userService.updateGameResults(user2Id, user1Id);

		} catch (error) {
			this.logger.log('Error creating game:', error);
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

	@SubscribeMessage('movePaddle')
	handleMovePaddle(client: Socket, key: string): void {
		const userId = parseInt(client.handshake.query.userId as string, 10);
		if (!this.userToSocketMap.has(userId)) {
			this.logger.log("handleMovePaddle: userId not connected");
			return;
		}
		const gameId = this.idToGameIdMap.get(userId);

		if (!gameId) {
			this.logger.log(`Invalid gameId for user ${userId}.`);
			return;
		}

		const game = this.games[gameId];
		if (!game) {
			this.logger.log("handleMovePaddle: game does not exist");
			return;
		}
		if (this.userStates[userId] !== userState.Busy) {
			this.logger.log(`User ${userId} is not in the correct state.`);
			return;
		}
		game.isLead(userId) ? game.movePaddle(key, true) : game.movePaddle(key, false);
	}

	getUserToSocketMap() {
		return this.userToSocketMap;
	}
	/* Chat ******************************************************** */

	handleDisconnect(client: Socket) {
		const userId = parseInt(client.handshake.query.userId as string, 10);
		if (!this.userToSocketMap.has(userId)) {
			this.logger.log("handleDisconnect: userId not connected");
			return;
		}
		this.handleStopGame(client);
		this.userService.setDisconnected(userId)
		this.userToSocketMap.delete(userId);
	}

	handleConnection(client: Socket, ...args: any[]) {
		const userId = parseInt(client.handshake.query.userId as string, 10);
		this.userToSocketMap.set(userId, client);
		this.userService.setConnected(userId);
		this.userStates[userId] = userState.Idle;
	}

	afterInit(server: Server) {
		this.logger.log('WebSocket gateway initialized.');
	}

	@SubscribeMessage('msgToServer')
	async handleMessage(client: Socket, messageData: { text: string, sender: string, roomId: number, invite: boolean }): Promise<void> {
		const userId = parseInt(client.handshake.query.userId as string)
		if (!await this.chatService.getRoomById(messageData.roomId) || !await this.chatService.isInRoom(userId, messageData.roomId)) {
			const socket = await this.userToSocketMap.get(userId);

			if (socket) {
				socket.emit('msgToClient', null);
			}
			return;
		}
		if (await this.chatService.isUserMuted(userId, messageData.roomId)) return ;
		const message = await this.chatService.createMessage(userId, messageData.roomId, messageData.text, messageData.invite);
		const ids = await this.chatService.getIdOfUserInRoom(messageData.roomId);
		const users = ids.users;

		const sender = parseInt(client.handshake.query.userId as string);
		for (const user of users) {
			const userId = user.id;

			const socket = await this.userToSocketMap.get(userId);

			if (socket) {
				if (!await this.chatService.isBlocked(userId, sender))
					socket.emit('msgToClient', message);
			}
		}
	}

	@SubscribeMessage('joinCurrentRoom')
	async handleCurrentRoom(client: Socket, roomId: string): Promise<void> {
		const userId = parseInt(client.handshake.query.userId as string);
		const rId = parseInt(roomId as string);
		await this.userService.setCurrentRoom(userId, rId);

	}

	@SubscribeMessage('kickFromRoom')
	async handleKickFromRoom(client: Socket, data: { userToKick, roomId, bool: boolean }): Promise<void> {
		const userId = parseInt(client.handshake.query.userId as string);
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
}
