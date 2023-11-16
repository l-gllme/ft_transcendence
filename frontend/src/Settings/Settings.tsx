import React, { useEffect, useState } from 'react';
import DisplayName from './DisplayName';
import { useAuth } from '../Auth/AuthContext';
import AvatarUpload from './AvatarUpload';
import Toggle2FA from './Toggle2FA';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faIdBadge } from '@fortawesome/free-solid-svg-icons';

export default function Settings() {
    const { user } = useAuth();
    const [userImage, setUserImage] = useState('');

    useEffect(() => {
        if (user) {
            if (isValidUrl(user.image)) {
                setUserImage(user.image);
            } else {
                const queryParams = new URLSearchParams({ userId: user.id.toString() }).toString();
                fetch(`http://localhost:4000/users/getImage?${queryParams}`, {
                    method: 'GET',
                    credentials: 'include',
                })
                    .then((response) => response.blob())
                    .then((blob) => {
                        const imageURL = URL.createObjectURL(blob);
                        setUserImage(imageURL);
                    })
                    .catch((error) => console.error('Error fetching user image:', error));
            }
        }
    }, [user]);

    function isValidUrl(url: string) {
        const pattern = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;
        return pattern.test(url);
    }

    return (
        <div className="bg-gray-800 min-h-screen flex flex-col items-center mt-4">
            <div className="bg-gray-600 w-1/2 rounded-lg mt-5 relative">
                <h1 className="text-amber-50 font-semibold text-3xl pt-3">Settings</h1>

                <div className="flex flex-col items-center justify-center mt-4 space-y-6 px-10 pb-10">
                    <div className="rounded-lg bg-gray-500 w-full p-4 mx-2 relative shadow-md">
                        <Link to="/profile" className="absolute top-4 left-4 text-amber-50 hover:text-blue-300">
                            <FontAwesomeIcon icon={faIdBadge} size="lg" />
                        </Link>
                        <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden aspect-w-1 aspect-h-1">
                            {userImage && (
                                <img
                                    src={userImage}
                                    className="object-cover object-center w-full h-full"
                                    alt="Profile"
                                />
                            )}
                        </div>
                        <p className="text-amber-50 font-semibold text-center">{user?.display_name}</p>
                    </div>

                    <div className="rounded-lg bg-gray-500 w-full p-4 mx-2 shadow-md">
                        <h2 className="text-amber-50 text-xl font-semibold mb-4">Change Name</h2>
                        <DisplayName />
                    </div>
                    <div className="rounded-lg bg-gray-500 w-full p-4 mx-2 shadow-md">
                        <h2 className="text-amber-50 text-xl font-semibold mb-4">Change Avatar</h2>
                        <AvatarUpload />
                    </div>
                    <div className="rounded-lg bg-gray-500 w-full p-4 mx-2 shadow-md">
                        <h2 className="text-amber-50 text-xl font-semibold mb-4">Toggle 2FA</h2>
                        <Toggle2FA />
                    </div>
                </div>
            </div>
        </div>
    );
}
