import React, { useState, useEffect } from "react";
import { useWebSocket } from "../WebSockets/WebSocketsContext";
import { useAuth } from "../Auth/AuthContext";
import { useParams, useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import DeleteRoom from "./DeleteRoom";
import MessageActions from "./MessageActions";
import ChangePassword from "./ChangePassword";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGamepad } from '@fortawesome/free-solid-svg-icons';
/* eslint-disable */
interface Message {
  text: string;
  sender: string;
  authorName: string;
  content: string;
  createdAt: string;
  roomId: number;
  id: number;
  invite: boolean;
  authorId?: number;
}

interface RoomInfo {
  name: string;
}

const MAX_MESSAGES = 500;

export default function Room() {
  const { socket } = useWebSocket();
  const { user } = useAuth();
  const { roomId } = useParams<{ roomId?: string }>() || {};
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [blockedUsers, setBlockedUsers] = useState<number[]>([]);

  const [showMessageActions, setShowMessageActions] = useState(false);

  const navigate = useNavigate();

  const getRoomInfo = async () => {
    try {
      const response = await fetch("http://localhost:4000/chat/getRoomById", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ roomId: +roomId! }),
      });
      if (response.ok) {
        const data = await response.json();
        setRoomInfo(data);
      } else {
        console.error("Failed to fetch room information.");
      }
    } catch (error) {
      console.error(error);
    }
  };

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

  const getOldMessages = () => {
    fetch("http://localhost:4000/chat/getOldMessages", {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ roomId: +roomId! }),
    })
      .then((response) => {
        if (!response.ok) {
          throw Error("Failed to fetch old messages.");
        }
        return response.json();
      })
      .then((data: Message[]) => {
        setMessages(data);
      })
      .catch((error) => console.error(error));
  };

  const checkUserInRoom = async () => {
    try {
      const response = await fetch("http://localhost:4000/chat/isInRoom", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ roomId: +roomId! }),
      });

      if (!response.ok) {
        navigate("/chat");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const scrollToBottom = (id: string) => {
    const element = document.getElementById(id);

    if (element) {
      setTimeout(() => {
        element.scrollTop = element.scrollHeight;
      }, 0);
    }
  };

  useEffect(() => {
    socket?.on("msgToClient", (messageData: Message) => {
      if (messageData === null) {
        navigate("/chat");
        alert("Room was deleted or password was changed.")
        return;
      }
      if (messageData.roomId === +roomId!) {
        setMessages((prevMessages) => [...prevMessages, messageData]);

        scrollToBottom("chat-box");
      }
    });

    socket?.emit("joinCurrentRoom", roomId);

    socket?.on("getKicked", (kicked: boolean) => {
      if (kicked) {
        navigate("/chat");
        alert("You were kicked from the room.")
      }
      else {
        navigate("/chat");
        alert("You were banned from the room.")
      }
    });

    checkUserInRoom();
    getRoomInfo();
    getOldMessages();
    fetchBlockedUsers();

    return () => {
      socket?.off("msgToClient");
      socket?.off("getKicked");
    };
  }, [socket, roomId, navigate]);

  const handleSendMessage = () => {
    if (newMessage.trim() === "") return;

    const newMessageData: Message = {
      text: newMessage,
      sender: user?.display_name || "",
      authorName: user?.display_name || "",
      content: newMessage,
      createdAt: new Date().toISOString(),
      roomId: +roomId!,
      id: 0,
      invite: false,
    };

    socket?.emit("msgToServer", newMessageData);
    setNewMessage("");
    scrollToBottom("chat-box");
  };

  const handleSendInvite = () => {
    const inviteMessage: Message = {
      text: "",
      sender: user?.display_name || "",
      authorName: user?.display_name || "",
      content: "",
      createdAt: new Date().toISOString(),
      roomId: +roomId!,
      id: 0,
      invite: true,
    };
    socket?.emit("msgToServer", inviteMessage);
    scrollToBottom("chat-box");
  };

  const handleMessageClick = (message: Message) => {
    setSelectedMessage(message);
    setShowMessageActions(true);
  };

  const handleInvite = async () => {
    if (selectedMessage) {
      try {
        console.log(selectedMessage.id);
        const response = await fetch("http://localhost:4000/chat/getUserIdByMessageId", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ messageId: selectedMessage.id }),
        });

        if (response.ok) {
          const data = await response.json();
          const userId = data;
          console.log(userId);
          socket?.emit("gameOnInvite", userId);
        } else {
          console.error("Failed to get userId by messageId.");
        }
      } catch (error) {
        console.error(error);
      }
    }
  };

  const isOwnInviteMessage = (message: Message) => {
    return message.authorName === user?.display_name && message.invite;
  };

  return (
    <div className="bg-gray-800 min-h-screen items-center mt-4 md:mt-0">
      <h1 className="text-amber-50 font-semibold text-3xl pt-3 md:pt-6">
        Current Room
      </h1>
      <h1 className="text-blue-500 font-semibold text-3xl">
        {" "}
        {roomInfo?.name}
      </h1>

      <Link to="/chat" className="text-red-500 hover:text-red-700 mt-2 md:mt-4">
        Leave
      </Link>

      <div className="flex items-center justify-center mt-4 md:mt-6">
        <div className="rounded-lg bg-gray-600 w-1/2 p-6 md:p-10 mx-2 md:mx-4">
          <div id="chat-box" className="chat-box h-96 min-h-96 max-h-96 overflow-y-scroll">
            {messages
              .filter((message) => {
                const isMessageBlocked = blockedUsers.includes(message.id);
                const isAuthorBlocked = message.authorId && blockedUsers.includes(message.authorId);
                return !isMessageBlocked && !isAuthorBlocked;
              })
              .map((message, index) => (
                <div
                  key={index}
                  className={`message flex flex-col ${message.authorName === user?.display_name ? "sent" : "received"
                    } ${index % 2 === 0
                      ? "bg-gray-800 text-gray-600"
                      : "bg-gray-600"
                    }`}
                  style={{ wordWrap: "break-word" }}
                >
                  <div className="flex justify-between items-center">
                    <span
                      className={`font-semibold hover:cursor-pointer ${message.authorName === user?.display_name ? "text-blue-500" : "text-orange-500"
                        }`}
                      onClick={() => handleMessageClick(message)}
                    >
                      {message.authorName || message.sender}
                    </span>
                    {showMessageActions && selectedMessage === message && (
                      <div className="flex items-center space-x-4 mr-4">
                        {message.authorName === user?.display_name && (
                          <MessageActions
                            selectedMessage={selectedMessage}
                            userId={selectedMessage?.id || 0}
                          />
                        )}
                        {isOwnInviteMessage(message) ? (
                          <FontAwesomeIcon
                            icon={faGamepad}
                            className={`clickable-icon text-amber-50 cursor-not-allowed hover:text-orange-500
                              }`}
                          />
                        ) : message.invite ? (
                          <FontAwesomeIcon
                            icon={faGamepad}
                            className={`clickable-icon text-amber-50 cursor-pointer hover:text-blue-300
                              }`}
                            onClick={() => handleInvite()}
                            title="Join Game Invite"
                          />
                        ) : null}
                        {message.authorName !== user?.display_name && (
                          <MessageActions
                            selectedMessage={selectedMessage}
                            userId={selectedMessage?.id || 0}
                          />
                        )}
                      </div>
                    )}
                  </div>
                  <span className="text-center">{isOwnInviteMessage(message) ? "You have sent an invite" : message.content}</span>
                </div>
              ))
            }
          </div>



          <div className="input-container mt-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
            >
              <input
                type="text"
                placeholder="Type your message..."
                className="bg-gray-700 text-amber-50 rounded-md p-2 focus:outline-none focus:ring focus:ring-sky-500 focus:ring-opacity-50"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <button
                type="submit"
                className="bg-sky-500 text-amber-50 rounded-md p-2 hover:bg-sky-600 focus:outline-none focus:ring focus:ring-sky-500 focus:ring-opacity-50"
              >
                Send
              </button>
            </form>
          </div>
          <div className="py-2">
            <FontAwesomeIcon
              icon={faGamepad}
              className="clickable-icon text-sky-500 cursor-pointer hover:text-blue-300 mr-2"
              onClick={handleSendInvite}
              title="Game Invite"
            />
            <DeleteRoom />
          </div>
          <ChangePassword />
        </div>
      </div>
    </div>
  );
}
