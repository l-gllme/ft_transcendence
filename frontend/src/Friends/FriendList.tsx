import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../Auth/AuthContext';

interface User {
  id: number;
  username: string;
  display_name: string;
  image: string;
  connected: number;
}

export default function FriendList() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [friendIds, setFriendIds] = useState<number[]>([]);

  const id = user?.id;

  useEffect(() => {
    setFriendIds([]);
    setUsers([]);

    if (id) {
      fetch("http://localhost:4000/users/getFriends", {
        method: "GET",
        credentials: "include",
        headers: {
          'Content-Type': 'application/json',
        },
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.json();
        })
        .then((data) => {
          setFriendIds(data);
        })
        .catch((error) => {
          console.error('Error fetching friend IDs:', error);
        });
    }

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
      })
      .then(async (data: User[]) => {
        const imageFetchPromises: Promise<string | null>[] = [];

        for (const usr of data) {
          if (isValidUrl(usr.image)) {
            imageFetchPromises.push(Promise.resolve(usr.image));
          } else {
            imageFetchPromises.push(
              fetch(`http://localhost:4000/users/getImage?userId=${usr.id}`, {
                method: 'GET',
                credentials: 'include',
              })
                .then((response) => response.blob())
                .then((blob) => URL.createObjectURL(blob))
                .catch((error) => {
                  console.error(`Error fetching image for user ${usr.display_name}:`, error);
                  return null;
                })
            );
          }
        }

        const imageUrls = await Promise.all(imageFetchPromises);

        const updatedUsers = data.map((usr, index) => ({
          ...usr,
          image: imageUrls[index] || usr.image,
        }));

        setUsers(updatedUsers);
      })
      .catch((error) => console.error(error));
  }, [id]);

  function isValidUrl(url: string) {
    const pattern = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;
    return pattern.test(url);
  }

  const handleSearch = async () => {
    try {
      const updatedFriendList = await fetch("http://localhost:4000/users/getFriends", {
        method: "GET",
        credentials: "include",
        headers: {
          'Content-Type': 'application/json',
        },
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.json();
        })
        .catch((error) => {
          console.error('Error fetching updated friend IDs:', error);
        });

      setFriendIds(updatedFriendList);

      const updatedUsers = await fetch('http://localhost:4000/users/all', {
        method: "GET",
        credentials: "include",
        headers: {
          'Content-Type': 'application/json',
        },
      })
        .then((response) => {
          return response.json();
        })
        .catch((error) => {
          console.error('Error fetching all users:', error);
        });

      const imageFetchPromises: Promise<string | null>[] = updatedUsers.map((usr: User) => {
        if (isValidUrl(usr.image)) {
          return Promise.resolve(usr.image);
        } else {
          return fetch(`http://localhost:4000/users/getImage?userId=${usr.id}`, {
            method: 'GET',
            credentials: 'include',
          })
            .then((response) => response.blob())
            .then((blob) => URL.createObjectURL(blob))
            .catch((error) => {
              console.error(`Error fetching image for user ${usr.display_name}:`, error);
              return null;
            });
        }
      });

      const imageUrls = await Promise.all(imageFetchPromises);

      const updatedUsersWithImages = updatedUsers.map((usr: User, index: number) => ({
        ...usr,
        image: imageUrls[index] || usr.image,
      }));

      setUsers(updatedUsersWithImages);

      const userToAdd = updatedUsers.find((foundUser: User) =>
        foundUser.display_name === searchQuery
      );

      if (userToAdd && userToAdd.id !== Number(id)) {
        if (friendIds && !friendIds.includes(userToAdd.id)) {
          const addId = userToAdd.id;
          await fetch(
            "http://localhost:4000/users/addFriend",
            {
              method: "POST",
              credentials: "include",
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ addId }),
            });

          setFriendIds((prevFriendIds) => [...prevFriendIds, userToAdd.id]);
        } else {
          console.log('User is already a friend.');
        }
      }
    } catch (error) {
      console.error('Error adding friend:', error);
    }
  }

  const handleRemoveFriend = async (friendId: number) => {
    try {
      await fetch(
        `http://localhost:4000/users/removeFriend`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ friendId }),
        }
      );

      setFriendIds((prevFriendIds) =>
        prevFriendIds.filter((id) => id !== friendId)
      );
    } catch (error) {
      console.error('Error removing friend:', error);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="w-full mx-auto h-full">
      <div className="flex items-center justify-center  my-10">
        <input
          type="text"
          className="placeholder:italic placeholder:text-slate-400 block bg-white border 
          border-slate-300 rounded-md py-2 pl-2 pr-5 text-gray-400
          shadow-sm focus:outline-none focus:border-sky-500 focus:ring-sky-500 focus:ring-1"
          placeholder="Add a friend by name"
          value={searchQuery}
          onChange={handleSearchChange}
        />
        <button className="bg-transparent text-amber-50 border border-solid border-white px-4 py-2 rounded-lg 
        hover:bg-white hover:text-black hover:border-transparent hover:border-solid"
          onClick={handleSearch}>Add</button>
      </div>
      <div className="w-1/3 mx-auto h-5 my-auto">
        <ul className={`max-h-${users.length >= 5 ? 'md' : 'auto'}
        overflow-y-scroll bg-gray-600 rounded-lg`}
          style={{ height: users.length >= 5 ? '20rem' : 'auto' }}>
          {users
            .filter((usr) => (friendIds || []).includes(usr.id))
            .map((usr) => (
              <li key={usr.id} className="flex items-center p-4 border-b">
                <img
                  src={usr.image}
                  alt={`Avatar of ${usr.display_name}`}
                  className="w-12 h-12 rounded-full object-cover object-center"
                />
                <div className="ml-10 flex flex-col items-center md:flex-row md:items-center w-full">
                  <Link to={`/profile/${usr.display_name}`}>
                    <div className="text-lg font-semibold text-amber-50 hover:text-blue-500">
                      {usr.display_name}
                    </div>
                  </Link>
                  <div className="ml-auto">
				  	<div
						className={`w-6 h-6 rounded-full ml-2 ${
							usr?.connected === 0
							? 'bg-red-500'
							: usr?.connected === 1
							? 'bg-green-500'
							: usr?.connected === 2
							? 'bg-blue-500'
							: ''
						}`}
					/>
                  </div>
                  {usr.id && (
                    <button
                      className="text-orange-500 hover:text-orange-700 hover:bg-transparent md:ml-auto"
                      onClick={() => {
                        if (friendIds.includes(usr.id)) {
                          handleRemoveFriend(usr.id);
                        }
                      }}
                    >
                      Remove Friend
                    </button>
                  )}
                </div>
              </li>
            ))}
        </ul>
      </div>
    </div>

  );
}