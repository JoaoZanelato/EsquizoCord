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
      // O `withCredentials: true` é VITAL para que o backend possa ler a cookie de sessão
      const newSocket = io("http://localhost:3000", {
        withCredentials: true,
      });
      setSocket(newSocket);

      // A boa prática é desconectar-se quando o componente é desmontado ou o utilizador muda
      return () => newSocket.close();
    } else {
      // Se não houver utilizador, garante que não há conexão de socket ativa
      if (socket) {
        socket.close();
        setSocket(null);
      }
    }
    // A dependência de 'user' garante que a conexão seja refeita no login/logout
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    // Fornece a instância do socket diretamente
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};
