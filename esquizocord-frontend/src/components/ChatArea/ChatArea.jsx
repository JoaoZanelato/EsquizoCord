// src/components/ChatArea/ChatArea.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import apiClient from '../../services/api';
import MessageItem from '../MessageItem/MessageItem';
import ChatInput from '../ChatInput/ChatInput';
import {
    ChatAreaContainer,
    Header,
    MessagesContainer,
    WelcomeMessage
} from './styles';

const ChatArea = ({ chatInfo }) => {
    const { user: currentUser } = useAuth();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const socket = useSocket();
    const messagesEndRef = useRef(null);
    const currentChatRef = useRef(null); // Ref para guardar o chatInfo atual

    // Atualiza a ref sempre que o chatInfo mudar
    useEffect(() => {
        currentChatRef.current = chatInfo;
    }, [chatInfo]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Efeito para buscar mensagens e gerir salas do Socket.IO
    useEffect(() => {
        if (!socket) return;

        // Função para sair da sala anterior
        const leavePreviousRoom = (prevChatInfo) => {
            if (prevChatInfo?.type === 'dm') {
                const ids = [currentUser.id_usuario, prevChatInfo.user.id_usuario].sort();
                const roomName = `dm-${ids[0]}-${ids[1]}`;
                socket.emit('leave_dm_room', roomName);
            }
            // Adicionar lógica para 'group' aqui depois
        };

        const fetchMessagesAndJoinRoom = async () => {
            if (!chatInfo) {
                setMessages([]);
                return;
            }

            setLoading(true);
            setMessages([]);
            try {
                let url = '';
                if (chatInfo.type === 'dm') {
                    // Entra na nova sala de DM
                    const ids = [currentUser.id_usuario, chatInfo.user.id_usuario].sort();
                    const roomName = `dm-${ids[0]}-${ids[1]}`;
                    socket.emit('join_dm_room', roomName);

                    url = `/friends/dm/${chatInfo.user.id_usuario}/messages`;
                }
                // Adicionar lógica para 'group' aqui depois

                if (url) {
                    const response = await apiClient.get(url);
                    setMessages(response.data);
                }
            } catch (error) {
                console.error("Erro ao buscar mensagens:", error);
            } finally {
                setLoading(false);
            }
        };

        // Antes de buscar novas mensagens e entrar numa nova sala, saímos da anterior
        leavePreviousRoom(currentChatRef.current);
        fetchMessagesAndJoinRoom();

        // Função de limpeza que será executada quando o componente for desmontado
        return () => {
            leavePreviousRoom(chatInfo);
        }

    }, [chatInfo, socket, currentUser.id_usuario]);

    // Efeito para OUVIR por novas mensagens em tempo real
    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (newMessage) => {
            const activeChat = currentChatRef.current; // Usa a ref para obter o chatInfo mais atual
            if (!activeChat) return;

            const isChatActive = activeChat.type === 'dm' &&
                (
                    (newMessage.id_remetente === activeChat.user.id_usuario && newMessage.id_destinatario === currentUser.id_usuario) ||
                    (newMessage.id_remetente === currentUser.id_usuario && newMessage.id_destinatario === activeChat.user.id_usuario)
                );

            if (isChatActive) {
                setMessages(prevMessages => [...prevMessages, newMessage]);
            }
        };

        socket.on('new_dm', handleNewMessage);

        return () => {
            socket.off('new_dm', handleNewMessage);
        };
    }, [socket, currentUser.id_usuario]); // A dependência do chatInfo foi removida daqui para evitar re-registos desnecessários

    // Efeito para fazer scroll para o fundo
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    if (!chatInfo) {
        return (
            <ChatAreaContainer>
                <WelcomeMessage>
                    <h2>Selecione um amigo para começar a conversar.</h2>
                </WelcomeMessage>
            </ChatAreaContainer>
        );
    }
    
    const headerInfo = chatInfo.type === 'dm' ? chatInfo.user : chatInfo.group;

    return (
        <ChatAreaContainer>
            <Header>
                <img src={headerInfo.FotoPerfil || headerInfo.Foto || '/images/logo.png'} alt={headerInfo.Nome} />
                <h3>
                    {headerInfo.Nome}
                    {chatInfo.type === 'dm' && <span className="user-tag">#{headerInfo.id_usuario}</span>}
                </h3>
            </Header>
            <MessagesContainer>
                {loading && <p>A carregar mensagens...</p>}
                {!loading && messages.map(msg => (
                    <MessageItem key={msg.id_mensagem} message={msg} />
                ))}
                <div ref={messagesEndRef} />
            </MessagesContainer>
            <ChatInput chatInfo={chatInfo} />
        </ChatAreaContainer>
    );
};

export default ChatArea;