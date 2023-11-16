/* eslint-disable */

import React, { useEffect, useState } from 'react';
import { useAuth } from '../Auth/AuthContext';
import { faTrophy } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface GameStatsProps {
    id: string;
}

interface Game {
    user1Id: number | null;
    user2Id: number | null;
    user1Score: number | null;
    user2Score: number | null;
    users: { display_name: string }[];
}

interface GameStats {
    totalGames: number;
    gamesWon: number;
    totalPointsScored: number;
}

interface Achievement {
    name: string;
    description: string;
    target: number;
    currentProgress: number;
}

const Achievements: React.FC<GameStatsProps> = ({ id }) => {
    const [gameStats, setGameStats] = useState<GameStats>({
        totalGames: 0,
        gamesWon: 0,
        totalPointsScored: 0,
    });

    const [achievements, setAchievements] = useState<Achievement[]>([
        {
            name: 'Play 10 Games',
            description: 'Play 10 games to unlock this achievement.',
            target: 10,
            currentProgress: 0,
        },
        {
            name: 'Win 5 Games',
            description: 'Win 5 games to unlock this achievement.',
            target: 5,
            currentProgress: 0,
        },
        {
            name: 'Score 21 Points',
            description: 'Score a total of 21 points to unlock this achievement.',
            target: 21,
            currentProgress: 0,
        },
    ]);

    const { user } = useAuth();

    useEffect(() => {
        const fetchUserGameStats = async () => {
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

                const data = await response.json();
                const games: Game[] = data.games || [];


                const totalGames = games.length;
                const gamesWon = data.gamesWon;

                const totalPointsScored = games.reduce((acc: number, game: Game) => {
                    if (id !== null && String(game.user1Id) === id && game.user1Score !== null && game.user2Score !== null && game.user1Score !== -1) {
                        return acc + game.user1Score;
                    } else if (id !== null && String(game.user2Id) === id && game.user1Score !== null && game.user2Score !== null && game.user2Score !== -1) {
                        return acc + game.user2Score;
                    }
                    return acc;
                }, 0);

                setGameStats({
                    totalGames,
                    gamesWon,
                    totalPointsScored,
                });
            } catch (error) {
                console.error('Error fetching user game statistics:', error);
            }
        };

        fetchUserGameStats();
    }, [id, user]);

    useEffect(() => {
        const updatedAchievements = [...achievements];
    
        const win5GamesAchievement = updatedAchievements.find(
            (achievement) => achievement.name === 'Win 5 Games'
        );
        if (win5GamesAchievement) {
            win5GamesAchievement.currentProgress = gameStats.gamesWon >= 5 ? 5 : gameStats.gamesWon;
        }
    
        const score21PointsAchievement = updatedAchievements.find(
            (achievement) => achievement.name === 'Score 21 Points'
        );
        if (score21PointsAchievement) {
            score21PointsAchievement.currentProgress = gameStats.totalPointsScored >= 21 ? 21 : gameStats.totalPointsScored;
        }
    
        const play10GamesAchievement = updatedAchievements.find(
            (achievement) => achievement.name === 'Play 10 Games'
        );
        if (play10GamesAchievement) {
            play10GamesAchievement.currentProgress = gameStats.totalGames >= 10 ? 10 : gameStats.totalGames;
        }
        setAchievements(updatedAchievements);
    }, [gameStats]);

    return (
        <div className="rounded-lg">
            <h3 className="text-amber-50 text-lg font-semibold mb-4">Achievements</h3>
            <ul className="text-amber-50">
                {achievements.map((achievement, index) => (
                    <li key={index} className="mb-2 flex items-center">
                        <span className="flex-1 text-left pl-4">{achievement.name}</span>
                        {achievement.currentProgress >= achievement.target && (
                                <FontAwesomeIcon icon={faTrophy} className="text-gray-600 mx-4" />
                            )}
                        <progress
                            max={achievement.target}
                            value={achievement.currentProgress}
                            className="w-1/2 h-2 rounded-full bg-indigo-400"
                        />
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Achievements;
