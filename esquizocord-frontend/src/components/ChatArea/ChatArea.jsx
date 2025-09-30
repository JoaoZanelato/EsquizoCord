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

const ChatArea = ({
  chatInfo,
  onViewProfile,
  replyingTo,
  onReply,
  onCancelReply,
  onDeleteMessage,
}) => {
  const { user: currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const socket = useSocket();
  const messagesEndRef = useRef(null);

  // Ref para guardar a informação do chat atual e evitar re-execuções desnecessárias
  const currentChatRef = useRef(chatInfo);
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

    // Deixa a sala anterior antes de entrar numa nova
    leavePreviousRoom(currentChatRef.current);

    if (!chatInfo) {
      setMessages([]);
      return;
    }

    let url = "";
    // Entra na sala apropriada e define o URL para buscar mensagens
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
      apiClient
        .get(url)
        .then((response) => setMessages(response.data))
        .catch((error) => console.error("Erro ao buscar mensagens:", error))
        .finally(() => setLoading(false));
    } else {
      setMessages([]);
    }

    // Cleanup: sai da sala quando o componente é desmontado ou o chat muda
    return () => {
      leavePreviousRoom(chatInfo);
    };
  }, [chatInfo, socket, currentUser.id_usuario]);

  // Efeito para lidar com eventos do Socket.IO em tempo real
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMessage) => {
      setMessages((prev) => [...prev, newMessage]);
    };

    // --- INÍCIO DAS NOVAS ADIÇÕES ---
    const handleMessageDeleted = ({ messageId }) => {
      setMessages((prev) =>
        prev.filter((msg) => msg.id_mensagem !== messageId)
      );
    };

    socket.on("new_dm", handleNewMessage);
    socket.on("new_group_message", handleNewMessage);
    socket.on("dm_message_deleted", handleMessageDeleted);
    socket.on("group_message_deleted", handleMessageDeleted);

    return () => {
      socket.off("new_dm", handleNewMessage);
      socket.off("new_group_message", handleNewMessage);
      socket.off("dm_message_deleted", handleMessageDeleted);
      socket.off("group_message_deleted", handleMessageDeleted);
    };
    // --- FIM DAS NOVAS ADIÇÕES ---
  }, [socket, currentUser.id_usuario]);

  useEffect(scrollToBottom, [messages]);

  if (!chatInfo) {
    return (
      <ChatAreaContainer>
        <WelcomeMessage>
          <h2>Selecione uma conversa para começar.</h2>
        </WelcomeMessage>
      </ChatAreaContainer>
    );
  }

  // Verifica se o usuário atual é admin do grupo
  const isGroupAdmin =
    chatInfo.type === "group" &&
    chatInfo.group?.members?.some(
      (m) => m.id_usuario === currentUser.id_usuario && m.isAdmin
    );

  // Renderização do cabeçalho
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
              isGroupAdmin={isGroupAdmin}
              onViewProfile={onViewProfile}
              // --- INÍCIO DAS NOVAS PROPS ---
              onReply={onReply}
              onDelete={onDeleteMessage}
              // --- FIM DAS NOVAS PROPS ---
            />
          ))}
        <div ref={messagesEndRef} />
      </MessagesContainer>
      <ChatInput
        chatInfo={chatInfo}
        // --- INÍCIO DAS NOVAS PROPS ---
        replyingTo={replyingTo}
        onCancelReply={onCancelReply}
        // --- FIM DAS NOVAS PROPS ---
      />
    </ChatAreaContainer>
  );
};

export default ChatArea;
