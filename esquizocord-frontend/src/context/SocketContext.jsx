// src/context/SocketContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import io from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // ALTERAÇÃO AQUI: Use a variável de ambiente VITE_API_URL
      const socketUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const newSocket = io(socketUrl, {
        withCredentials: true,
      });
      setSocket(newSocket);

      return () => newSocket.close();
    } else {
      if (socket) {
        socket.close();
        setSocket(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    // Fornece a instância do socket diretamente
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};
