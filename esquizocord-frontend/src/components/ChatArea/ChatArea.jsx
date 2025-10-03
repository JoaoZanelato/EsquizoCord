// src/components/ChatArea/ChatArea.jsx
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import apiClient from "../../services/api";
import MessageItem from "../MessageItem/MessageItem";
import ChatInput from "../ChatInput/ChatInput";
import VoiceChannel from "../VoiceChannel/VoiceChannel"; // Importar o novo componente
import {
  ChatAreaContainer,
  Header,
  MessagesContainer,
  WelcomeMessage,
  MobileMenuButton,
} from "./styles";

const ChatArea = ({
  chatInfo,
  onViewProfile,
  replyingTo,
  onReply,
  onCancelReply,
  onDeleteMessage,
  onEditMessage,
  onMenuClick,
  onSelectChat,
}) => {
  const { user: currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const socket = useSocket();
  const messagesEndRef = useRef(null);

  const currentChatRef = useRef(chatInfo);
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
    } else if (
      chatInfo.type === "group" &&
      chatInfo.channelId &&
      chatInfo.channelType === "TEXTO"
    ) {
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

    return () => {
      leavePreviousRoom(chatInfo);
    };
  }, [chatInfo, socket, currentUser.id_usuario]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMessage) => {
      setMessages((prev) => [...prev, newMessage]);
    };

    const handleMessageDeleted = ({ messageId }) => {
      setMessages((prev) =>
        prev.filter((msg) => msg.id_mensagem !== messageId)
      );
    };

    const handleMessageEdited = ({ messageId, newContent }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id_mensagem === messageId
            ? { ...msg, Conteudo: newContent, foi_editada: 1 }
            : msg
        )
      );
    };

    socket.on("new_dm", handleNewMessage);
    socket.on("new_group_message", handleNewMessage);
    socket.on("dm_message_deleted", handleMessageDeleted);
    socket.on("group_message_deleted", handleMessageDeleted);
    socket.on("dm_message_edited", handleMessageEdited);
    socket.on("group_message_edited", handleMessageEdited);

    return () => {
      socket.off("new_dm", handleNewMessage);
      socket.off("new_group_message", handleNewMessage);
      socket.off("dm_message_deleted", handleMessageDeleted);
      socket.off("group_message_deleted", handleMessageDeleted);
      socket.off("dm_message_edited", handleMessageEdited);
      socket.off("group_message_edited", handleMessageEdited);
    };
  }, [socket, currentUser.id_usuario]);

  useEffect(scrollToBottom, [messages]);

  const userPermissions =
    chatInfo?.type === "group" ? chatInfo.group.currentUserPermissions : 0;
  const canDeleteMessages = (userPermissions & 4) > 0;

  if (!chatInfo) {
    return (
      <ChatAreaContainer>
        <Header>
          <MobileMenuButton onClick={onMenuClick}>&#9776;</MobileMenuButton>
        </Header>
        <WelcomeMessage>
          <h2>Selecione uma conversa para começar.</h2>
        </WelcomeMessage>
      </ChatAreaContainer>
    );
  }

  let headerContent;
  let chatContent;

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
          src={chatInfo.user.fotoPerfil || "/images/logo.png"}
          alt={chatInfo.user.nome}
        />
        <h3>
          {chatInfo.user.nome}
          <span className="user-tag">#{chatInfo.user.id_usuario}</span>
        </h3>
      </div>
    );
    chatContent = (
      <>
        {loading && <p>A carregar mensagens...</p>}
        {!loading &&
          messages.map((msg) => (
            <MessageItem
              key={msg.id_mensagem}
              message={msg}
              canDelete={
                msg.id_usuario === currentUser.id_usuario || canDeleteMessages
              }
              onViewProfile={onViewProfile}
              onReply={onReply}
              onDelete={onDeleteMessage}
              onEdit={onEditMessage}
            />
          ))}
      </>
    );
  } else if (chatInfo.type === "group") {
    if (chatInfo.channelType === "VOZ") {
      headerContent = (
        <h3>
          <i
            className="fas fa-volume-up"
            style={{ color: "var(--text-muted)" }}
          ></i>{" "}
          {chatInfo.channelName}
        </h3>
      );
      // Renderiza o novo componente VoiceChannel
      chatContent = (
        <VoiceChannel
          channelId={chatInfo.channelId}
          members={chatInfo.group.members}
          onDisconnect={() => {
            // Encontra o primeiro canal de texto para ser o padrão ao sair
            const defaultTextChannel = chatInfo.group.channels.find(
              (ch) => ch.tipo === "TEXTO"
            );
            if (defaultTextChannel && onSelectChat) {
              // Muda o chat ativo de volta para o canal de texto
              onSelectChat({
                ...chatInfo,
                channelId: defaultTextChannel.id_chat,
                channelName: defaultTextChannel.nome,
                channelType: "TEXTO",
              });
            }
          }}
        />
      );
    } else {
      // Canal de texto
      headerContent = (
        <h3>
          <i
            className="fas fa-hashtag"
            style={{ color: "var(--text-muted)" }}
          ></i>{" "}
          {chatInfo.channelName || "Selecione um canal"}
        </h3>
      );
      chatContent = (
        <>
          {loading && <p>A carregar mensagens...</p>}
          {!loading &&
            messages.map((msg) => (
              <MessageItem
                key={msg.id_mensagem}
                message={msg}
                canDelete={
                  msg.id_usuario === currentUser.id_usuario || canDeleteMessages
                }
                onViewProfile={onViewProfile}
                onReply={onReply}
                onDelete={onDeleteMessage}
                onEdit={onEditMessage}
              />
            ))}
        </>
      );
    }
  }

  return (
    <ChatAreaContainer>
      <Header>
        <MobileMenuButton onClick={onMenuClick}>&#9776;</MobileMenuButton>
        {headerContent}
      </Header>
      <MessagesContainer>
        {chatContent}
        <div ref={messagesEndRef} />
      </MessagesContainer>
      <ChatInput
        chatInfo={{
          ...chatInfo,
          disabled: chatInfo?.channelType === "VOZ",
          placeholder:
            chatInfo?.type === "dm"
              ? `Conversar com @${chatInfo.user.nome}`
              : chatInfo?.channelType === "VOZ"
              ? "Canais de voz não permitem mensagens."
              : `Conversar em #${chatInfo.channelName}`,
        }}
        replyingTo={replyingTo}
        onCancelReply={onCancelReply}
      />
    </ChatAreaContainer>
  );
};

export default ChatArea;
