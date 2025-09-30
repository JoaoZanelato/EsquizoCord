// src/components/ChatArea/ChatArea.jsx
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import apiClient from "../../services/api";
import MessageItem from "../MessageItem/MessageItem";
import ChatInput from "../ChatInput/ChatInput";
import {
  ChatAreaContainer,
  Header,
  MessagesContainer,
  WelcomeMessage,
} from "./styles";

const ChatArea = ({ chatInfo, onViewProfile }) => {
  const { user: currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const socket = useSocket();
  const messagesEndRef = useRef(null);
  const currentChatRef = useRef(null);

  useEffect(() => {
    currentChatRef.current = chatInfo;
  }, [chatInfo]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!socket) return;

    const leavePreviousRoom = (prevChat) => {
      if (!prevChat) return;
      if (prevChat.type === "dm") {
        const ids = [currentUser.id_usuario, prevChat.user.id_usuario].sort();
        socket.emit("leave_dm_room", `dm-${ids[0]}-${ids[1]}`);
      } else if (prevChat.type === "group") {
        socket.emit(
          "leave_group_room",
          `group-${prevChat.group.details.id_grupo}`
        );
      }
    };

    const fetchMessagesAndJoinRoom = async () => {
      leavePreviousRoom(currentChatRef.current);

      if (!chatInfo) {
        setMessages([]);
        return;
      }

      let url = "";
      if (chatInfo.type === "dm") {
        const ids = [currentUser.id_usuario, chatInfo.user.id_usuario].sort();
        socket.emit("join_dm_room", `dm-${ids[0]}-${ids[1]}`);
        url = `/friends/dm/${chatInfo.user.id_usuario}/messages`;
      } else if (chatInfo.type === "group" && chatInfo.channelId) {
        socket.emit(
          "join_group_room",
          `group-${chatInfo.group.details.id_grupo}`
        );
        url = `/groups/chats/${chatInfo.channelId}/messages`;
      }

      if (url) {
        setLoading(true);
        setMessages([]);
        try {
          const response = await apiClient.get(url);
          setMessages(response.data);
        } catch (error) {
          console.error("Erro ao buscar mensagens:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setMessages([]);
      }
    };

    fetchMessagesAndJoinRoom();

    return () => {
      leavePreviousRoom(chatInfo);
    };
  }, [chatInfo, socket, currentUser.id_usuario]);

  useEffect(() => {
    if (!socket) return;
    const handleNewDM = (newMessage) => {
      /* ... (código existente sem alterações) ... */
    };
    const handleNewGroupMessage = (newMessage) => {
      /* ... (código existente sem alterações) ... */
    };
    socket.on("new_dm", handleNewDM);
    socket.on("new_group_message", handleNewGroupMessage);
    return () => {
      socket.off("new_dm", handleNewDM);
      socket.off("new_group_message", handleNewGroupMessage);
    };
  }, [socket, currentUser.id_usuario]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!chatInfo) {
    return (
      <ChatAreaContainer>
        <WelcomeMessage>
          <h2>Selecione uma conversa para começar.</h2>
        </WelcomeMessage>
      </ChatAreaContainer>
    );
  }

  let headerContent;
  if (chatInfo.type === "dm") {
    headerContent = (
      <div
        onClick={() => onViewProfile(chatInfo.user.id_usuario)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          cursor: "pointer",
        }}
      >
        <img
          src={chatInfo.user.FotoPerfil || "/images/logo.png"}
          alt={chatInfo.user.Nome}
        />
        <h3>
          {chatInfo.user.Nome}
          <span className="user-tag">#{chatInfo.user.id_usuario}</span>
        </h3>
      </div>
    );
  } else if (chatInfo.type === "group") {
    headerContent = (
      <h3>
        <i
          className="fas fa-hashtag"
          style={{ color: "var(--text-muted)" }}
        ></i>{" "}
        {chatInfo.channelName || "Selecione um canal"}
      </h3>
    );
  }

  return (
    <ChatAreaContainer>
      <Header>{headerContent}</Header>
      <MessagesContainer>
        {loading && <p>A carregar mensagens...</p>}
        {!loading &&
          messages.map((msg) => (
            <MessageItem
              key={msg.id_mensagem}
              message={msg}
              onViewProfile={onViewProfile}
            />
          ))}
        <div ref={messagesEndRef} />
      </MessagesContainer>
      <ChatInput chatInfo={chatInfo} />
    </ChatAreaContainer>
  );
};

export default ChatArea;
