import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface Room {
  id: number;
  name: string;
  password: string;
}

export default function DisplayAllRooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomName, setRoomName] = useState<string>("");
  const [roomPrivacy, setRoomPrivacy] = useState<string>("normal");
  const [roomPassword, setRoomPassword] = useState<string>("");
  const [roomPasswords, setRoomPasswords] = useState<Record<number, string>>({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = () => {
    fetch("http://localhost:4000/chat/getAllRooms", {
      method: "GET",
      credentials: "include",
    })
      .then((response) => {
        if (!response.ok) {
          window.location.href = "http://localhost:3000/login";
        }
        return response.json();
      })
      .then((data: Room[]) => {
        setRooms(data);
      })
      .catch((error) => console.error(error));
  };

  async function createRoom(event: React.FormEvent) {
    event.preventDefault();

    if (!roomName) {
      alert("Please enter a room name.");
      return;
    }

    if (roomPrivacy === "password-protected" && !roomPassword) {
      alert("Please enter a room password.");
      return;
    }

    try {
      const createRoomResponse = await fetch("http://localhost:4000/chat/createRoom", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: roomName,
          privacy: roomPrivacy,
          password: roomPrivacy === "password-protected" ? roomPassword : undefined,
        }),
      });

      if (!createRoomResponse.ok) {
        throw new Error("Failed to create a room.");
      }

      setRoomName("");
      setRoomPrivacy("normal");
      setRoomPassword("");
      fetchRooms();
    } catch (error) {
      console.error(error);
    }
  }

  const handleJoinClick = (roomId: number) => {
    try {
      fetch("http://localhost:4000/chat/joinRoom", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomId,
          password: roomPasswords[roomId],
        }),
      }).then((response) => {
        if (response.status === 401) return (alert("Incorrect password."));
        if (response.status === 403) return (alert("You are banned from this room."));
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

  return (
    <>
      <div className="rounded-lg bg-gray-600 w-1/3 md:w-1/4 p-4 mx-4">
        <form className="space-y-4">
          <input
            type="text"
            placeholder="Room Name"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            className="block w-full rounded-md shadow-sm py-2 px-3 border border-slate-300 focus:ring focus:ring-sky-500 focus:ring-opacity-50 focus:outline-none"
          />
          <select
            value={roomPrivacy}
            onChange={(e) => {
              setRoomPrivacy(e.target.value);
            }}
            className="block w-full rounded-md shadow-sm py-2 px-3 border border-slate-300 focus:ring focus:ring-sky-500 focus:ring-opacity-50 focus:outline-none"
          >
            <option value="normal">Normal</option>
            <option value="password-protected">Password-Protected</option>
          </select>
          {roomPrivacy === "password-protected" && (
            <input
              type="text"
              placeholder="Room Password"
              value={roomPassword}
              onChange={(e) => setRoomPassword(e.target.value)}
              className="block w-full rounded-md shadow-sm py-2 px-3 border border-slate-300 focus:ring focus:ring-sky-500 focus:ring-opacity-50 focus:outline-none"
            />
          )}
          <button
            onClick={createRoom}
            className="w-full bg-gray-800 text-amber-50 font-semibold py-2 px-3 rounded-md 
            hover:bg-blue-300 hover:text-gray-800 focus:outline-none focus:ring focus:ring-sky-500 focus:ring-opacity-50"
          >
            Create Room
          </button>
        </form>
      </div>
      <div className="w-1/2 p-10 mx-4 h-96 bg-gray-600 pt-4 rounded-lg">
        <h1 className="text-amber-50 font-semibold text-3xl">Rooms</h1>
        <ul className={`max-h-${rooms.length >= 5 ? 'md' : 'auto'}
          overflow-y-scroll bg-gray-600 rounded-lg`}
          style={{ height: rooms.length >= 5 ? '20rem' : 'auto' }}>
          {rooms.map((room) => (
            <li className="flex items-center p-4 border-b" key={room.id}>
                <div className="text-lg font-semibold text-amber-50">
                  <p>{room.name}</p>
                </div>
                {room.password ? (
                  <div className="flex space-x-2 ml-auto">
                    <input
                      type="password"
                      placeholder="Password"
                      value={roomPasswords[room.id] || ""}
                      onChange={(e) => {
                        const newPasswords = { ...roomPasswords };
                        newPasswords[room.id] = e.target.value;
                        setRoomPasswords(newPasswords);
                      }}
                      className="block w-24 p-2 h-6 rounded-md bg-gray-300 text-gray-800 focus:ring-sky-500 focus:border-sky-500 focus:ring-1"
                    />
                    <button className="text-blue-500 hover:text-blue-300 hover:bg-transparent" onClick={() => handleJoinClick(room.id)}>
                      Join
                    </button>
                  </div>
                ) : (
                  <button className="text-blue-500 hover:text-blue-300 hover:bg-transparent ml-auto" onClick={() => handleJoinClick(room.id)}>
                    Join
                  </button>
                )}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
