import { PrismaService } from '../prisma/prisma.service';
export declare class GamesService {
    private prisma;
    constructor(prisma: PrismaService);
    getMatchHistory(userId: number): Promise<{
        users: {
            display_name: string;
        }[];
        startTime: Date;
        user1Id: number;
        user2Id: number;
        user1Score: number;
        user2Score: number;
    }[]>;
}
export interface GameState {
    paddle1Y: number;
    paddle2Y: number;
    ballX: number;
    ballY: number;
    user1Score: number;
    user2Score: number;
    specialWallY: number;
    specialWall: boolean;
}
export declare class Game {
    private difficulty;
    private status;
    private id;
    private leadId;
    private opId;
    private windowHeight;
    private windowWidth;
    private leadPaddleSpeed;
    private ballHeight;
    private ballWidth;
    private opPaddleSpeed;
    private leadPaddleHeight;
    private paddleWidth;
    private opPaddleHeight;
    private leadPaddleX;
    private leadPaddleY;
    private opPaddleX;
    private opPaddleY;
    private ballSpeed;
    private collisionSpeedIncrease;
    private ballPosY;
    private ballPosX;
    private ballDirX;
    private ballDirY;
    private ballStartDirX;
    private ballStartDirY;
    private leadScore;
    private opScore;
    private ballStatus;
    private ballPassedPaddle;
    private specialGame;
    private specialWallY;
    private specialWallX;
    private specialWallDirY;
    constructor(user1Id: number, user2Id: number, difficulty: number, specialGame: boolean);
    movePaddle(key: string, isLead: boolean): void;
    getGameId(): string;
    getGameState(isLead: boolean): GameState | undefined;
    isLead(userId: number): boolean | null;
    getUserId(isLead: boolean): number;
    getGameOverInfos(isLead: boolean): string;
    gameOver(): void;
    gameOn(): boolean;
    isScoreMax(): boolean;
    resetBallValues(): void;
    getBallStatus(): number;
    getScore(isLead: boolean): number;
    calculateNextBallPosition(): void;
    private handlePaddleCollision;
    abandonned(isLead: boolean): void;
    private getOpGameState;
    private getLeadGameState;
    private checkCollisionWithSpecialWall;
    private intervalId;
    private paddleInterval;
}
