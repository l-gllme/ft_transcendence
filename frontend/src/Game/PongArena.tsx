import React, { useEffect, useState, useRef } from 'react';
import { useWebSocket } from '../WebSockets/WebSocketsContext';
/* eslint-disable */

interface GameState {
	paddle1Y: number;
	paddle2Y: number;
	ballX: number;
	ballY: number;
	user1Score: number;
	user2Score: number;
	specialWallY: number;
	specialWall: boolean;
}

const PongArena: React.FC = () => {
	const { socket } = useWebSocket();
	const [userState, setUserState] = useState<string>('idle');
	const [gameState, setGameState] = useState<GameState | null>(null);
	const [gameOverInfo, setGameOverInfo] = useState<string | null> (null);
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const [canvasSize, setCanvasSize] = useState<{ width: number; height: number }>({
		width: 0,
		height: 0,
	  });
	
	useEffect(() => {
		if (socket) {
			socket.on('userState', (state: string) => {
				if (state === 'idle') {
					setGameOverInfo(null);
				}
                setUserState(state);
            });
			socket.on('gameState', (gameState: GameState) => {
    			setGameState(gameState);
			});
			socket.on('gameOver', (result: string) => {
    			setGameOverInfo(`${result}`);
				console.log(result);
			});
	
			return () => {
				if (!socket)
					return ;
				setGameOverInfo(null);
				stopGame();
				socket.off('userState');
				socket.off('gameState');
				socket.off('gameOver');
			};
		}
	}, [socket]); 
	
	const handleJoinQueue = (difficulty: number) => {
		if (socket) {
			socket.emit('joinQueue', difficulty); 
		}
	};

	const stopGame = () => {
		if (!socket)
			return ;
		socket.emit('stopGame');
	}

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
		  if (userState === 'busy' && socket) {
			const { key } = event;
			if (key === 'ArrowUp' || key === 'ArrowDown') {
			  socket.emit('movePaddle', key);
			}
		  }
		};
	  
		window.addEventListener('keydown', handleKeyDown);
		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		 };
	}, [userState, socket]);

	useEffect(() => {
        if (!canvasRef.current || !gameState) return;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (!context) return;

        const drawCanvas = () => {
			context.fillStyle = 'black';
			context.fillRect(0, 0, canvas.width, canvas.height);
			
			const heightRatio: number = canvas.height / 1080;
			const widthRatio: number = canvas.width / 1920;
			
			const fontSizePercentage = 0.04; 
			const fontSize = canvas.width * fontSizePercentage;
		
			const gapPercentage = 0.1; 
			const gap = canvas.width * gapPercentage;
		
			const topOffsetPercentage = 0.1; 
			const topOffset = canvas.height * topOffsetPercentage;
		
			context.fillStyle = 'white';
			context.font = `${fontSize}px Arial`;
		
			const user1ScoreText = `${gameState.user1Score}`;
			const user2ScoreText = `${gameState.user2Score !== -1 ? gameState.user2Score : 'WASTED'}`;
		
			const user1ScoreWidth = context.measureText(user1ScoreText).width;
			const user2ScoreWidth = context.measureText(user2ScoreText).width;
		
			const user1ScoreX = canvas.width * 0.5 - gap - user1ScoreWidth * 0.5;
			const user2ScoreX = canvas.width * 0.5 + gap - user2ScoreWidth * 0.5;
		
			context.fillText(user1ScoreText, user1ScoreX, topOffset);
			context.fillText(user2ScoreText, user2ScoreX, topOffset);

			context.strokeStyle = 'white';
			context.setLineDash([5, 5]);
			context.beginPath();
			context.moveTo(canvas.width / 2, 0);
			context.lineTo(canvas.width / 2, canvas.height);
			context.stroke();
			
			context.setLineDash([]);
			
			context.fillStyle = 'red';

			if (gameState.specialWall)
				context.fillRect(885 * widthRatio, gameState.specialWallY * heightRatio, 150 * widthRatio, 150 * heightRatio);

			context.fillStyle = 'white';
			context.fillRect(192 * widthRatio, gameState.paddle1Y * heightRatio, 30 * widthRatio, 150 * heightRatio);
			context.fillRect(1698 * widthRatio, gameState.paddle2Y * heightRatio, 30 * widthRatio, 150 * heightRatio);
			context.fillRect(gameState.ballX * widthRatio, gameState.ballY * heightRatio, 20 * widthRatio, 20 * heightRatio);
			if (gameOverInfo) {
				context.textBaseline = 'middle'; 
    			context.textAlign = 'center';
				let text = gameOverInfo.toUpperCase(); 
		
				const x = canvas.width * 0.5; 
				const y = canvas.height * 0.5; 
		
				
				const gameOverFontSize = fontSize * 1.5;
				context.font = `${gameOverFontSize}px Arial`;
				context.fillStyle = 'white'; 
				context.fillText(text, x, y);
			}
		};

        drawCanvas();

        return () => {
            if (context) {
                context.clearRect(0, 0, canvas.width, canvas.height);
            }
        };
    }, [gameState, gameOverInfo]);

	useEffect(() => {
		const calculateCanvasSize = () => {
		  const maxWidth = window.innerWidth - 100;
		  const maxHeight = window.innerHeight - 200;
	
		  let width = maxWidth;
		  let height = (maxWidth * 9) / 16;
	
		  if (height > maxHeight) {
			height = maxHeight;
			width = (height * 16) / 9;
		  }
	
		  setCanvasSize({ width, height });
		};
	
		calculateCanvasSize();
	
		window.addEventListener('resize', calculateCanvasSize);
	
		return () => {
		  window.removeEventListener('resize', calculateCanvasSize);
		};
	  }, []);

	const renderContent = () => {
		if (userState === 'idle') {
			return (
				<div className="flex flex-col space-y-4 items-center pt-6">
      				<button 
					      className="bg-blue-500 hover:text-blue-400 text-amber-50 font-semibold py-2 px-4 rounded hover:bg-gray-900"
						  onClick={() => handleJoinQueue(1)}>NORMAL</button>
					<button 
					      className="bg-blue-500 hover:text-blue-400 text-amber-50 font-semibold py-2 px-4 rounded hover:bg-gray-900"
						  onClick={() => handleJoinQueue(2)}>SPECIAL</button>
				</div>
			  );
		}
		else if (userState === 'inQueue') {
			return (
				<div className="text-center mt-4">
					<button
						className="bg-orange-500 text-amber-50 font-semibold py-2 px-4 rounded hover:bg-orange-700"
						onClick={() => stopGame()}
					>
						LEAVE QUEUE
					</button>
				</div>
				);
		}
		else if (userState === 'busy' && gameState) {
			return (
				<canvas
					ref={canvasRef}
					width={canvasSize.width}
					height={canvasSize.height}
					style={{ backgroundColor: 'black' }}
			  	/>
			);
		}
		return null;
	};

	return <div>{renderContent()}</div>;
};

export default PongArena;
