import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
/* eslint-disable */
export default function ChangePassword() {
    const [isRoomOwner, setIsRoomOwner] = useState(false);
    const [hasRoomPassword, setHasRoomPassword] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const { roomId } = useParams<{ roomId?: string }>() || {};


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
                if (data === true) {
                    setIsRoomOwner(data);
                }
            } else {
                return;
            }
        } catch (error) {
            console.error(error);
        }
    };

    const checkRoomHasPassword = async () => {
        try {
            const response = await fetch("http://localhost:4000/chat/doesRoomAsPassword", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ roomId: +roomId! }),
            });

            if (response.ok) {
                const data = await response.json();
                setHasRoomPassword(data);
            } else {
                return;
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        checkRoomOwnership();
        checkRoomHasPassword();
    }, []);

    const handleChangePassword = async () => {
        try {
            const response = await fetch("http://localhost:4000/chat/ChangePassword", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ roomId: +roomId!, password: newPassword }),
            });

            if (response.ok) {
                setNewPassword("");
            } else {
                console.error("Failed to change password.");
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <>
            {isRoomOwner && hasRoomPassword && (
                <div>
                    <input
                        type="password"
                        placeholder="New Password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="bg-gray-700 text-amber-50 rounded-md p-2 focus:outline-none focus:ring focus:ring-sky-500 focus:ring-opacity-50"
                    />
                    <button
                        onClick={handleChangePassword}
                        className="bg-sky-700 text-amber-50 rounded-md p-2 hover:bg-sky-600 focus:outline-none focus:ring focus:ring-sky-500 focus:ring-opacity-50"
                    >
                        Change Password
                    </button>
                </div>
            )}
        </>
    );
}
