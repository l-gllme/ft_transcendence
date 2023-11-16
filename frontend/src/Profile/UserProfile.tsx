import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import GameInfo from './GameInfo';
import GameStats from './GameStats';
import Achievements from './Achievements';

interface User {
  id: number;
  display_name: string;
  image: string;
  connected: number;
}

const UserProfile: React.FC = () => {
  const { display_name } = useParams<{ display_name: string }>();

  const [user, setUser] = useState<User | null>(null);
  const [userImage, setUserImage] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://localhost:4000/users/all", {
          method: "GET",
          credentials: "include",
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const usersData: User[] = await response.json();
          const matchingUser = usersData.find((u) => u.display_name === display_name);

          if (matchingUser) {
            setUser(matchingUser);

            if (isValidUrl(matchingUser.image)) {
              setUserImage(matchingUser.image);
            } else {
              const queryParams = new URLSearchParams({ userId: matchingUser.id.toString() }).toString();
              const imageUrl = `http://localhost:4000/users/getImage?${queryParams}`;

              fetch(imageUrl, {
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
          } else {
            console.log(`No user found with display name: ${display_name}`);
          }
        } else {
          console.log('Error fetching users:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchData();
  }, [display_name]);

  if (!user) {
    return     <div className="bg-gray-800 min-h-screen flex flex-col items-center mt-4"><h1 className="text-amber-50 font-semibold text-3xl pt-3">No User Found</h1></div>;
  }

  return (
    <div className="bg-gray-800 min-h-screen flex flex-col items-center mt-4">
      <div className="bg-gray-600 w-1/2 rounded-lg mt-5 relative">
        <h1 className="text-amber-50 font-semibold text-3xl pt-3">{user.display_name}'s Profile</h1>

        <div className="flex flex-col items-center justify-center mt-4 space-y-6 px-10 pb-10">
          <div className="rounded-lg bg-gray-500 w-full p-4 mx-2 relative  shadow-md">
				<div
					className={`absolute top-4 right-4 w-6 h-6 rounded-full ml-2 ${
						user?.connected === 0
						? 'bg-red-500'
						: user?.connected === 1
						? 'bg-green-500'
						: user?.connected === 2
						? 'bg-blue-500'
						: ''
					}`}
				/>
            <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden aspect-w-1 aspect-h-1">
              {userImage && (
                <img
                  src={userImage}
                  className="object-cover object-center w-full h-full"
                  alt="Profile"
                />
              )}
            </div>
            <p className="text-amber-50 font-semibold text-center">{user.display_name}</p>
          </div>

          <div className="rounded-lg bg-gray-500 w-full p-4 mx-2">
            <GameInfo id={user?.id ? user.id.toString() : ''} />
          </div>
          <div className="rounded-lg bg-gray-500 w-full p-4 mx-2">
            <GameStats id={user?.id ? user.id.toString() : ''} />
          </div>
          <div className="rounded-lg bg-gray-500 w-full p-4 mx-2">
            <Achievements id={user?.id ? user.id.toString() : ''} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;

function isValidUrl(url: string) {
  const pattern = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;
  return pattern.test(url);
}

