import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface WebSocketContextType {
  socket: Socket | null;
}

export const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketContextProviderProps {
  children: React.ReactNode;
}

export const WebSocketContextProvider: React.FC<WebSocketContextProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const connectSocket = async () => {
      try {
        const response = await fetch('http://localhost:4000/auth/profile', {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {
          const userData = await response.json();
          const userId = userData.id;

          const newSocket = io('http://localhost:4000', {
            query: {
              userId: userId.toString(),
            },
          });

          setSocket(newSocket);
        } else {}
      } catch (error) {}
    };
    connectSocket();
  }, []);

  return (
    <WebSocketContext.Provider value={{ socket }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketContextProvider');
  }
  return context;
};
