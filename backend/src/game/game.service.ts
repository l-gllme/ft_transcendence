import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';


@Injectable()
export class GamesService {
    constructor(private prisma: PrismaService) {}

	async getMatchHistory(userId: number) {
		try {
			const matchHistory = await this.prisma.game.findMany({
				where: {
					OR: [
						{ user1Id: userId },
						{ user2Id: userId },
					],
				},
				select: {
					startTime: true,
					user1Score: true,
					user2Score: true,
					user1Id: true,
					user2Id: true,
					users: {
						select: {
							display_name: true,
						},
					},
				},
			});
	
			return matchHistory;
		} catch (error) {
			throw new HttpException('Failed to fetch match history', HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}
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


@Injectable()
export class Game {
	private difficulty: number;
	private	status: boolean;
	private id: string;
	private leadId: number;
	private opId: number;
	private windowHeight: number;
	private windowWidth: number;
	private leadPaddleSpeed: number;
	private ballHeight: number;
	private ballWidth: number;
	private opPaddleSpeed: number;
	private leadPaddleHeight: number;
	private paddleWidth: number;
	private opPaddleHeight: number;
	private leadPaddleX: number;
	private leadPaddleY: number;
	private opPaddleX: number;
	private opPaddleY: number;
	private ballSpeed: number;
	private collisionSpeedIncrease: number;
	private ballPosY: number;
	private ballPosX: number;
	private ballDirX: number;
	private ballDirY: number;
	private ballStartDirX: number;
	private ballStartDirY: number;
	private	leadScore: number;
	private opScore: number;
	private ballStatus: number;
	private	ballPassedPaddle: boolean;
	private specialGame: boolean;
	private specialWallY: number;
	private specialWallX: number;
	private specialWallDirY: number;
	

	constructor(user1Id: number, user2Id: number, difficulty: number, specialGame: boolean) {
		this.difficulty = difficulty;
		this.status = true;
		this.windowHeight = 1080;
		this.windowWidth = 1920;
		this.id = `${user1Id}_${user2Id}`;
		this.leadId = user1Id;
		this.opId = user2Id;
		this.leadPaddleSpeed = 10;
		this.opPaddleSpeed = 10;
		this.ballHeight = 20;
		this.ballWidth = 20;
		this.ballStartDirX = -1;
		this.ballStartDirY = 0;
		this.leadPaddleHeight = 300 / this.difficulty;
		this.opPaddleHeight = 300 / this.difficulty;
		this.paddleWidth = 30;
		this.leadPaddleX = this.windowWidth / 10;
		this.leadPaddleY = (this.windowHeight - this.leadPaddleHeight) / 2;
		this.opPaddleX = this.windowWidth * 9 / 10 - this.paddleWidth;
		this.opPaddleY = (this.windowHeight - this.opPaddleHeight) / 2;
	
		this.leadScore = 0;
		this.opScore = 0;

		this.specialGame = specialGame;
		this.specialWallY = 0;
		this.specialWallY = 885;
		this.specialWallDirY = -1;
	
		this.resetBallValues();
	}

	movePaddle(key: string, isLead: boolean): void {
		if (isLead) {
			const paddleSpeed = this.windowHeight / this.leadPaddleSpeed;
			let newPaddlePosition = key === 'ArrowUp' ? this.leadPaddleY - paddleSpeed : this.leadPaddleY + paddleSpeed;
			newPaddlePosition = Math.max(0, Math.min(this.windowHeight - this.leadPaddleHeight, newPaddlePosition));
			this.paddleInterval(newPaddlePosition, 'lead');

			return ;
		}
		const paddleSpeed = this.windowHeight / this.opPaddleSpeed;
		let newPaddlePosition = key === 'ArrowUp' ? this.opPaddleY - paddleSpeed : this.opPaddleY + paddleSpeed;
		newPaddlePosition = Math.max(0, Math.min(this.windowHeight - this.opPaddleHeight, newPaddlePosition));
		this.paddleInterval(newPaddlePosition, 'op');
	}

	getGameId() : string {
		return (this.id);
	}

	getGameState(isLead: boolean): GameState | undefined {
		const gameState: GameState = isLead ? this.getLeadGameState() : this.getOpGameState();
		if (!gameState)
			return undefined; 
		return gameState;
	}

	isLead(userId: number): boolean | null {
		if (userId == this.leadId)
			return (true);
		else if (userId == this.opId)
			return (false);
		return (null);
	}

	getUserId(isLead: boolean): number {
		let userId: number;
		isLead ? userId = this.leadId : userId = this.opId;
		return (userId);
	}

	getGameOverInfos(isLead: boolean): string {
		const userScore = isLead ? this.leadScore : this.opScore;
		const opScore =  isLead ? this.opScore : this.leadScore;
	
		if (userScore == opScore)
			return ('DRAW');
		if (userScore < opScore)
			return ('YOU LOST');
			return ('YOU WON');
	}

	gameOver() : void {
		this.status = false;
	}

	gameOn() : boolean {
		return (this.status);
	}

	isScoreMax() : boolean {
		if (this.leadScore == 5 || this.opScore == 5)
			return (true);
		return (false);
	}

	resetBallValues() : void {
		this.ballStartDirX *= -1;
		this.ballStartDirY *= -1
		this.ballSpeed = 5 * this.difficulty;
		this.ballPosY = this.windowHeight / 2;
		this.ballPosX = this.windowWidth / 2;
		this.ballDirX = this.ballStartDirX;
		this.ballDirY = this.ballStartDirY;
		this.ballStatus = -1;
		this.collisionSpeedIncrease = this.difficulty;
		this.ballPassedPaddle = false;
	}

	getBallStatus() : number {
		return (this.ballStatus);
	}

	getScore(isLead: boolean) : number {
		if (isLead) {
			return (this.leadScore);
		}
		return (this.opScore);
	}

	calculateNextBallPosition(): void {
	
		this.ballPosX = this.ballPosX + this.ballSpeed * this.ballDirX;
		this.ballPosY = this.ballPosY + this.ballSpeed * this.ballDirY;
		if (this.ballPosX <= -this.ballWidth) {
			this.opScore++;
			this.ballStatus = 0;
			if (this.specialGame)
				this.specialWallY = 0;
			return ;
		}
		if (this.ballPosX >= this.windowWidth) {
			this.leadScore++;
			this.ballStatus = 0;
			if (this.specialGame)
				this.specialWallY = 0;
			return ;
		}
		if (this.ballPosY <= 0) {
			this.ballPosY = 0;
			this.ballSpeed += this.collisionSpeedIncrease;
			this.ballDirY *= -1; 
			this.ballStatus = 1;
			return ; 
		}
		if (this.ballPosY >= this.windowHeight - this.ballHeight) {
			this.ballPosY = this.windowHeight - this.ballHeight;
			this.ballSpeed += this.collisionSpeedIncrease; 
			this.ballDirY *= -1;
			this.ballStatus = 1;
			return ;
		}
		if (this.ballPassedPaddle == false && this.ballPosX <= this.leadPaddleX + this.paddleWidth) {
			this.ballPassedPaddle = true;
	
			if (this.ballPosY + this.ballHeight >= this.leadPaddleY && this.ballPosY <= this.leadPaddleY + this.leadPaddleHeight) {
				this.ballPosX = this.leadPaddleX + this.paddleWidth;
				this.handlePaddleCollision(this.leadPaddleHeight, this.leadPaddleY, 1);
				this.ballPassedPaddle = false;
			}
		}
		else if (this.ballPassedPaddle == false && this.ballPosX + this.ballWidth >= this.opPaddleX) {
			this.ballPassedPaddle = true;
			if (this.ballPosY + this.ballHeight >= this.opPaddleY && this.ballPosY <= this.opPaddleY + this.opPaddleHeight) {
				this.ballPosX = this.opPaddleX - this.ballWidth;
				this.handlePaddleCollision(this.opPaddleHeight, this.opPaddleY, -1);
				this.ballPassedPaddle = false;
			}
		}

		if (this.specialGame) {
			this.specialWallY += 5 * this.specialWallDirY;
			if (this.specialWallY <= 0 || this.specialWallY >= this.windowHeight - 150) {
				this.specialWallDirY *= -1;
				this.specialWallY = Math.max(0, Math.min(this.windowHeight - 150, this.specialWallY));
			}
			this.checkCollisionWithSpecialWall();
		}
		this.ballStatus = 1;
	}

	private handlePaddleCollision(PaddleHeight: number, PaddleY: number, coeff: number): void {
		const ballMiddleY = this.ballPosY + this.ballHeight / 2;
		const PaddleMiddleY = PaddleY + PaddleHeight / 2;
		const yDifference = ballMiddleY - PaddleMiddleY;
		const maxDistance = PaddleHeight / 2;
		const normalizedDifference = yDifference / maxDistance;
		const maxAngleInRadians = (Math.PI / 4);
		const angleInRadians = Math.min(Math.max(normalizedDifference * maxAngleInRadians, -maxAngleInRadians), maxAngleInRadians);
		this.ballDirX = Math.cos(angleInRadians) * coeff;
		this.ballDirY = Math.sin(angleInRadians);
	}

	abandonned(isLead: boolean) : void {
		if (isLead)
			this.leadScore = -1;
		else
			this.opScore = -1;
	}
	  

	private getOpGameState(): GameState {
		const gameState: GameState = {
			paddle1Y: this.opPaddleY,
			paddle2Y: this.leadPaddleY,
			ballX: this.windowWidth - this.ballPosX - this.ballWidth,
			ballY: this.ballPosY,
			user1Score: this.opScore,
			user2Score: this.leadScore,
			specialWallY: this.specialWallY,
			specialWall: this.specialGame,
		};
		return gameState;
	}

	private getLeadGameState(): GameState {
		const gameState: GameState = {
			paddle1Y: this.leadPaddleY,
			paddle2Y: this.opPaddleY,
			ballX: this.ballPosX,
			ballY: this.ballPosY,
			user1Score: this.leadScore,
			user2Score: this.opScore,
			specialWallY: this.specialWallY,
			specialWall: this.specialGame,
		};
		return gameState;
	}

	private checkCollisionWithSpecialWall(): void {
		const specialWallX = 885;
		const specialWallY = this.specialWallY;
		const specialWallSize = 150;
	  
		const ballCenterX = this.ballPosX + this.ballWidth / 2;
		const ballCenterY = this.ballPosY + this.ballHeight / 2;
	  
		const halfWidth = this.ballWidth / 2;
		const halfHeight = this.ballHeight / 2;
	  
		const deltaX = Math.abs(ballCenterX - (specialWallX + specialWallSize / 2));
		const deltaY = Math.abs(ballCenterY - (specialWallY + specialWallSize / 2));
	  
		if (deltaX <= halfWidth + specialWallSize / 2 && deltaY <= halfHeight + specialWallSize / 2) {
		  const overlapX = halfWidth + specialWallSize / 2 - deltaX;
		  const overlapY = halfHeight + specialWallSize / 2 - deltaY;
		  if (overlapX >= overlapY) {
			if (ballCenterY < specialWallY + specialWallSize / 2) {
			  this.ballPosY -= overlapY;
			} else {
			  this.ballPosY += overlapY;
			}
			this.ballDirY *= -1;
		  } else {
			if (ballCenterX < specialWallX + specialWallSize / 2) {
			  this.ballPosX -= overlapX;
			} else {
			  this.ballPosX += overlapX;
			}
			this.ballDirX *= -1;
		  }
		  this.ballSpeed += this.collisionSpeedIncrease;
		}
	  }
	
	  private intervalId: NodeJS.Timeout;

	  private paddleInterval(newPos: number, paddleType: 'lead' | 'op'): void {
		  if (this.intervalId) {
			  clearInterval(this.intervalId);
		  }
	  
		  const initialPos = paddleType === 'lead' ? this.leadPaddleY : this.opPaddleY;
		  const duration = 100;
		  const framesPerSecond = 60;
		  const totalFrames = (duration / 1000) * framesPerSecond;
		  const increment = (newPos - initialPos) / totalFrames;
		  let currentFrame = 0;
	  
		  this.intervalId = setInterval(() => {
			  if (currentFrame < totalFrames) {
				  if (paddleType === 'lead') {
					  this.leadPaddleY += increment;
				  } else {
					  this.opPaddleY += increment;
				  }
				  currentFrame++;
			  } else {
				  clearInterval(this.intervalId);
			  }
		  }, 1000 / framesPerSecond);
	  }
}