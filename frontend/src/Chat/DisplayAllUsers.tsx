import React, { useState, useEffect } from "react";
import { useAuth } from '../Auth/AuthContext';
import { useNavigate } from "react-router-dom";

interface User {
  id: number;
  display_name: string;
  image: string;
  connected: number;
}

async function fetchUserImages(users: User[]) {
  const imageFetchPromises: Promise<string | null>[] = users.map((user) => {
    if (isValidUrl(user.image)) {
      return Promise.resolve(user.image);
    } else {
      return fetch(`http://localhost:4000/users/getImage?userId=${user.id}`, {
        method: 'GET',
        credentials: 'include',
      })
        .then((response) => response.blob())
        .then((blob) => URL.createObjectURL(blob))
        .catch((error) => {
          console.error(`Error fetching image for user ${user.display_name}:`, error);
          return null;
        });
    }
  });

  const imageUrls = await Promise.all(imageFetchPromises);

  const updatedUsersWithImages = users.map((user, index) => ({
    ...user,
    image: imageUrls[index] || user.image,
  }));

  return updatedUsersWithImages;
}

function isValidUrl(url: string) {
  const pattern = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;
  return pattern.test(url);
}

export default function DisplayAllUsers() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const navigate = useNavigate();
  const [blockedUsers, setBlockedUsers] = useState<number[]>([]);

  useEffect(() => {
    fetchBlockedUsers();
    fetch("http://localhost:4000/users/all", {
      method: "GET",
      credentials: "include",
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch users.");
        }
        return response.json();
      }) // Update the isRoomOwner state
      .then(async (data: User[]) => {
        const updatedUsers = data.filter((u) => u.id !== user?.id);
        const usersWithImages = await fetchUserImages(updatedUsers);
        setUsers(usersWithImages);
      })
      .catch((error) => console.error(error));
  }, [user]);

  const fetchBlockedUsers = async () => {
    try {
      const response = await fetch(
        "http://localhost:4000/users/getBlockedUsers",
        {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setBlockedUsers(data);
      } else {
        console.error("Failed to fetch blocked users.");
      }
    } catch (error) {
      console.error(error);
    }
  };

  async function createRoom(userId: number) {
    if (userId === null) {
      console.error("No user selected.");
      return null;
    }

    try {
      const selectedUser = users.find((u) => u.id === userId);

      if (selectedUser) {
        const roomName = `Private room`;

        const createRoomResponse = await fetch("http://localhost:4000/chat/createRoom", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: roomName,
            privacy: "private",
            userId,
          }),
        });

        if (createRoomResponse.ok) {
          const roomData = await createRoomResponse.json();
          const createdRoomId = roomData.id;
          handleChatClick(createdRoomId);
        } else {
          console.log("Failed to create a room.");
        }
      }
    } catch (error) {
      console.error(error);
    }
  }

  const handleChatClick = (roomId: number) => {
    try {
      fetch("http://localhost:4000/chat/joinRoom", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomId,
        }),
      }).then((response) => {
        if (!response.ok) {
          alert("Failed to join the room.");
          return;
        }
        navigate(`/chat/${roomId}`);
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleUnblockUser = (userId: number) => {

    try {
      fetch("http://localhost:4000/users/blockUser", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          blockId: userId,
        }),
      }).then((response) => {
        if (response.ok) {
          setBlockedUsers((prevBlockedUsers) =>
            prevBlockedUsers.filter((id) => id !== userId)
          );
        } else {
          alert("Failed to unblock the user.");
        }
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="w-1/2 p-10 mx-4 h-96 bg-gray-600 pt-4 rounded-lg">
      <h1 className="text-amber-50 font-semibold text-3xl">Users</h1>
      <ul className={`max-h-${users.length >= 5 ? 'md' : 'auto'}
        overflow-y-scroll bg-gray-600 rounded-lg`}
        style={{ height: users.length >= 5 ? '20rem' : 'auto' }}>
        {users.map((user) => (
          <li className="flex items-center p-4 border-b" key={user.id}>
            <img
              src={user.image}
              alt={`Avatar of ${user.display_name}`}
              className="w-12 h-12 rounded-full object-cover object-center"
            />
            <div className="ml-6 flex flex-col items-center md:flex-row w-full">
              <div className="text-lg font-semibold text-amber-50 ml-4">
                {user.display_name}
              </div>
            </div>
            <div className="ml-auto">
              <div
                className={`w-6 h-6 rounded-full ml-2 ${user?.connected === 0
                    ? 'bg-red-500'
                    : user?.connected === 1
                      ? 'bg-green-500'
                      : user?.connected === 2
                        ? 'bg-blue-500'
                        : ''
                  }`}
              />

            </div>
            {blockedUsers.includes(user.id) && (
              <button
                className="text-white hover:text-red-700 hover:bg-transparent ml-2"
                onClick={() => handleUnblockUser(user.id)}
              >
                Unblock
              </button>
            )}

            <button
              className="text-red-500 hover:text-red-700 hover:bg-transparent ml-2"
              onClick={() => createRoom(user.id)}
            >
              Chat
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
