import React, { useEffect, useState } from 'react';
import { useAuth } from '../Auth/AuthContext';
import { faMedal } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface GameInfoProps {
    id: string;
}

interface Game {
    startTime: string;
    user1Id: number | null;
    user2Id: number | null;
    user1Score: number | null;
    user2Score: number | null;
    users: { display_name: string }[];
}

const GameInfo: React.FC<GameInfoProps> = ({ id }) => {
    const [matchHistory, setMatchHistory] = useState<Game[]>([]);
    const { user } = useAuth();

    useEffect(() => {
        const fetchUserMatchHistory = async () => {
            try {
                const queryParams = new URLSearchParams();
                queryParams.append('id', id);

                const response = await fetch(`http://localhost:4000/users/getGames?${queryParams}`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                const data = await response.json();
                setMatchHistory(data.games);
            } catch (error) {
                console.error('Error fetching match history:', error);
            }
        };

        fetchUserMatchHistory();
    }, [id]);

    const timeAgo = (startTime: string) => {
        const gameTime = new Date(startTime);
        const currentTime = new Date();
        const timeDifference = currentTime.getTime() - gameTime.getTime();

        const seconds = Math.floor(timeDifference / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) {
            return `${days} days ago`;
        } else if (hours > 0) {
            return `${hours} hours ago`;
        } else if (minutes > 0) {
            return `${minutes} minutes ago`;
        } else {
            return `${seconds} seconds ago`;
        }
    };

    return (
        <div>
            <h2 className="text-amber-50 text-xl font-semibold mb-4">Match History</h2>
            {matchHistory && matchHistory.length > 0 ? (
                <ul className="max-h-md overflow-y-scroll bg-gray-600 rounded-lg" style={{ maxHeight: matchHistory.length >= 5 ? '11rem' : 'auto', display: 'flex', flexDirection: 'column-reverse', padding: '0' }}>
                    {matchHistory.map((game, index) => (
                        <li key={index} className="flex items-center border-b relative" >
                            <div className="flex items-center justify-center space-x-4 w-full text-center" style={{ padding: '8px' }}>
                                {game.users && game.users.length >= 2 && (
                                    <>
                                        <div className="text-lg font-semibold text-amber-50">
                                            {game.users[0].display_name === user?.display_name ? game.users[0].display_name : game.users[1].display_name}
                                        </div>
                                        {game.user1Id !== null && game.user2Id !== null && (
                                            <>
                                                <div className="text-lg text-amber-50">
                                                    {game.user1Id === user?.id ? game.user1Score : game.user2Score}
                                                    {game.user1Id === user?.id && game.user1Score !== null && game.user2Score !== null && (
                                                        <>
                                                            {game.user1Score > game.user2Score && (
                                                                <FontAwesomeIcon icon={faMedal} className="text-gold ml-2" />
                                                            )}
                                                        </>
                                                    )}
                                                    {game.user1Id !== user?.id && game.user1Score !== null && game.user2Score !== null && (
                                                        <>
                                                            {game.user1Score < game.user2Score && (
                                                                <FontAwesomeIcon icon={faMedal} className="text-gold ml-2" />
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                                <span className="text-lg text-amber-50 font-semibold">vs</span>
                                                <div className="text-lg text-amber-50">
                                                    {game.user1Id === user?.id && game.user1Score !== null && game.user2Score !== null && (
                                                        <>
                                                            {game.user1Score < game.user2Score && (
                                                                <FontAwesomeIcon icon={faMedal} className="text-gold mr-2" />
                                                            )}
                                                        </>
                                                    )}
                                                    {game.user1Id !== user?.id && game.user1Score !== null && game.user2Score !== null && (
                                                        <>
                                                            {game.user1Score > game.user2Score && (
                                                                <FontAwesomeIcon icon={faMedal} className="text-gold mr-2" />
                                                            )}
                                                        </>
                                                    )}
                                                    {game.user1Id === user?.id ? game.user2Score : game.user1Score}
                                                </div>
                                            </>
                                        )}
                                        <div className="text-lg font-semibold text-amber-50">
                                            {game.users[0].display_name === user?.display_name ? game.users[1].display_name : game.users[0].display_name}
                                        </div>
                                    </>
                                )}
                                <span className="text-xs text-amber-50/30 absolute top-1 right-1">
                                    {timeAgo(game.startTime)}
                                </span>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-amber-50 text-center">No match history available.</p>
            )}
        </div>


    );
};

export default GameInfo;