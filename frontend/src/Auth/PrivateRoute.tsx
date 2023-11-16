import React, { useEffect } from "react";
import { useAuth, User } from "./AuthContext";
import { Navigate } from "react-router-dom";
import { useWebSocket } from "../WebSockets/WebSocketsContext";

export const Private = ({ children }: { children: any }) => {

  const { user }: { user: User | null } = useAuth();
  const { socket } = useWebSocket();
  useEffect(() => {
    socket?.on("gameOnInvite", () => {
      window.location.href = "/game";
    });
  },);

  if (!user) {
    return <Navigate to="/login" />;
  }
  return children;
};

export default Private;
