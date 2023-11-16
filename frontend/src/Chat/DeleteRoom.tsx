import React from "react";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { faTrashAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
/* eslint-disable */
export default function DeleteRoom() {
    const [isRoomOwner, setIsRoomOwner] = useState(false);
    const { roomId } = useParams<{ roomId?: string }>() || {};

    const navigate = useNavigate();


    const checkRoomOwnership = async () => {
        try {
            const response = await fetch("http://localhost:4000/chat/isOwnerOfRoom", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ roomId: +roomId! }),
            });

            if (response.ok) {
                const data = await response.json();
                if (data === true)
                    setIsRoomOwner(data);
            } else  {
              return ;
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        checkRoomOwnership();
    }, []);

    const handleDeleteRoom = async () => {
        try {
            const response = await fetch("http://localhost:4000/chat/deleteRoom", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ roomId: +roomId! }),
            });

            if (response.ok) {
                navigate("/chat");
            } else {
                console.error("Failed to delete the room.");
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <>
            {isRoomOwner && (
                <FontAwesomeIcon
                icon={faTrashAlt}
                className="ml-2 clickable-icon text-amber-50 hover:text-orange-500"
                onClick={handleDeleteRoom}
              />
            )}
        </>
    );
}
