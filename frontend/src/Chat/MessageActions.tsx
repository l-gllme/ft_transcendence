import React, { useState, useEffect } from "react";
import { useAuth } from "../Auth/AuthContext";
import { useNavigate } from "react-router-dom";
import { useWebSocket } from "../WebSockets/WebSocketsContext";
/* eslint-disable */
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faIdBadge, faEyeSlash, faPersonMilitaryPointing, faBan, faHandFist, faVolumeMute } from '@fortawesome/free-solid-svg-icons';

interface Message {
  authorName: string;
  id: number;
  roomId: number;
}

interface UserProfile {
  id: number;
  display_name: string;
}

const MessageActions: React.FC<{ selectedMessage: Message | null; userId: number }> = ({
  selectedMessage,
  userId,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messageUserId, setMessageUserId] = useState<number | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>();
  const [isAdmin, setIsAdmin] = useState(false);
  const { socket } = useWebSocket();

  const fetchUserIdByMessageId = async (messageId: number) => {
    try {
      const response = await fetch(`http://localhost:4000/chat/getUserIdByMessageId`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messageId }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessageUserId(data);
        fetchUserProfile(data);
      } else {
        console.error("Failed to fetch user ID by message ID.");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchUserProfile = async (userId: number) => {
    try {
      const response = await fetch(`http://localhost:4000/users/one`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        const data = await response.json();
        setUserProfile(data);
      } else {
        console.error("Failed to fetch user profile.");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const checkAdminStatus = async () => {
    try {
      const response = await fetch(`http://localhost:4000/chat/isAdminOfRoom`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ roomId: selectedMessage?.roomId }),
      });

      if (response.ok) {
        if (response.status === 202) {
          setIsAdmin(false);
          return;
        }
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const blockUser = async (userIdToBlock: number) => {
    try {
      console.log("ID to block:", userIdToBlock);
      const response = await fetch(`http://localhost:4000/users/blockUser`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ blockId: userIdToBlock }),
      });

      if (response.ok) {
        console.log("User blocked/unblocked.");
      } else {
        console.error("Failed to block user.");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const setAdmin = async (roomId: number) => {
    try {
      const response = await fetch(`http://localhost:4000/chat/setAdmin`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ roomId, userToSetAdmin: userProfile?.id }),
      });

      if (response.ok) {
        const txt = userProfile?.display_name + " is now admin.";
        alert(txt);
      } else {
        console.error("Failed to set admin.");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const banUser = async (userIdToBan: number) => {
    try {
      const response = await fetch(`http://localhost:4000/chat/BanUser`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ roomId: selectedMessage?.roomId, userToBan: userIdToBan }),
      });

      if (response.ok) {
        console.log("User banned.");
        socket?.emit("kickFromRoom", { userToKick: userProfile?.id, roomId: selectedMessage?.roomId, bool: true });

      } else {
        alert("Failed to ban user, your not admin or user is owner");
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (selectedMessage) {
      fetchUserIdByMessageId(selectedMessage.id);
      checkAdminStatus();
    }
  }, [selectedMessage]);

  const handleLinkToProfile = () => {
    if (userProfile) {
      navigate(`/profile/${userProfile.display_name}`);
    }
  };

  const handleKick = async (userToCheck: number) => {
    try {
      const response = await fetch(`http://localhost:4000/chat/isOwnerOfRoomForKick`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userToCheck: userToCheck, roomId: selectedMessage?.roomId }),
      });

      if (response.ok) {
        socket?.emit("kickFromRoom", { userToKick: userProfile?.id, roomId: selectedMessage?.roomId, bool: false });

      } else {
        alert("Failed to kick user, your not admin or user is owner");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleMute = async (userToMute: number) => {
    try {
      const response = await fetch(`http://localhost:4000/chat/muteUser`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userToMute: userToMute, roomId: selectedMessage?.roomId }),
      });

      if (response.ok) {
        alert("User muted.");
      } else {
        alert("Failed to mute user, your not admin or user is owner");
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (!selectedMessage) {
    return null;
  }

  return (
    <div className="flex items-center">
      <div className="flex items-center space-x-4">
        <FontAwesomeIcon
          icon={faIdBadge}
          className="clickable-icon text-amber-50 cursor-pointer hover:text-blue-300"
          onClick={handleLinkToProfile}
          title="View profile"
        />
        {messageUserId !== user?.id && (
          <FontAwesomeIcon
            icon={faEyeSlash}
            title="Block user"
            className="clickable-icon text-amber-50 cursor-pointer hover:text-blue-300"
            onClick={() => {
              if (userProfile) {
                blockUser(userProfile.id);
              }
            }}
          />
        )}
        {isAdmin && messageUserId !== user?.id && (
          <>
            <FontAwesomeIcon
              icon={faPersonMilitaryPointing}
              title="Set admin"
              className="clickable-icon text-amber-50 cursor-pointer hover:text-blue-300"
              onClick={() => setAdmin(selectedMessage?.roomId || 0)}
            />
            <FontAwesomeIcon
              icon={faBan}
              title="Ban user"
              className="clickable-icon text-amber-50 cursor-pointer hover:text-blue-300"
              onClick={() => banUser(userProfile?.id || 0)}
            />
            <FontAwesomeIcon
              icon={faHandFist}
              title="Kick user"
              className="clickable-icon text-amber-50 cursor-pointer hover:text-blue-300"
              onClick={() => handleKick(userProfile?.id || 0)}
            />
            <FontAwesomeIcon
              icon={faVolumeMute}
              title="Mute user"
              className="clickable-icon text-amber-50 cursor-pointer hover:text-blue-300"
              onClick={() => handleMute(userProfile?.id || 0)}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default MessageActions;
