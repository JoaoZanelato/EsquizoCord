// src/context/SocketContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const { user } = useAuth(); // Usamos o AuthContext para saber se o utilizador está logado

    useEffect(() => {
        if (user) {
            // Conecta-se ao servidor de sockets se o utilizador estiver autenticado
            // O `withCredentials: true` é VITAL para que o backend possa ler a cookie de sessão
            const newSocket = io('http://localhost:3000', { // !! VERIFIQUE A PORTA DO SEU BACKEND !!
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
    }, [user]); // Este efeito é executado sempre que o estado do 'user' muda

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};