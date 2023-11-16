import React, { useEffect, useState } from 'react';

interface GameStatsProps {
    id: string;
}

interface Game {
    user1Id: number | null;
    user2Id: number | null;
    user1Score: number | null;
    user2Score: number | null;
}

interface GameStat {
    totalGames: number;
    gamesWon: number;
    totalPointsScored: number;
    totalPointsTaken: number;
}

const GameStats: React.FC<GameStatsProps> = ({ id }) => {
    const [gameStats, setGameStats] = useState<GameStat>({
        totalGames: 0,
        gamesWon: 0,
        totalPointsScored: 0,
        totalPointsTaken: 0,
    });

    useEffect(() => {
        const fetchUserGames = async () => {
            try {
                const queryParams = new URLSearchParams();
                queryParams.append('id', id);

                const response = await fetch(`http://localhost:4000/users/getGames?${queryParams}`, {
                    method: 'GET',
                    credentials: 'include',
                });

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                const userData = await response.json();
                const games: Game[] = userData.games || [];

                const totalGames = games.length;
                const gamesWon = userData.gamesWon;

                const totalPointsScored = games.reduce((acc, game) => {
                    if (game.user1Id === parseInt(id) && game.user1Score && game.user2Score && game.user1Score !== -1) {
                        return acc + game.user1Score;
                    } else if (game.user2Id === parseInt(id) && game.user1Score && game.user2Score && game.user2Score !== -1) {
                        return acc + game.user2Score;
                    }
                    return acc;
                }, 0);

                const totalPointsTaken = games.reduce((acc, game) => {
                    if (game.user1Id === parseInt(id) && game.user1Score && game.user2Score && game.user2Score !== -1) {
                        return acc + game.user2Score;
                    } else if (game.user2Id === parseInt(id) && game.user1Score && game.user2Score && game.user1Score !== -1) {
                        return acc + game.user1Score;
                    }
                    return acc;
                }, 0);

                setGameStats({ totalGames, gamesWon, totalPointsScored, totalPointsTaken });
            } catch (error) {
                console.error('Error fetching user games:', error);
            }
        };

        fetchUserGames();
    }, [id]);

    return (
        <div className="grid grid-cols-2 gap-2 mb-2 text-amber-50">
            <h2 className="text-amber-50 text-xl font-semibold col-span-2">Game Stats</h2>
            <ul>
                <li className=''>Games Played: {gameStats.totalGames}</li>
                <li className=''>Games Won: {gameStats.gamesWon}</li>
                <li className=''>Winrate: {gameStats.totalGames !== 0 ? ((gameStats.gamesWon * 100) / gameStats.totalGames).toFixed() : 0}%</li>
            </ul>
            <ul>
                <li className=''>Points Scored: {gameStats.totalPointsScored}</li>
                <li className=''>Points Taken: {gameStats.totalPointsTaken}</li>
            </ul>
        </div>
    );
};

export default GameStats;
