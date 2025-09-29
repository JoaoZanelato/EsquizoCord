// src/components/ChatArea/ChatArea.jsx
import React, { useState, useEffect } from "react";
import apiClient from "../../services/api";
import ChatInput from "../ChatInput/ChatInput";
import MessageItem from "../MessageItem/MessageItem"; // Importe o novo componente
import {
  ChatAreaContainer,
  Header,
  MessagesContainer,
  WelcomeMessage,
} from "./styles";

const ChatArea = ({ chatInfo }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!chatInfo) {
        setMessages([]);
        return;
      }

      setLoading(true);
      setMessages([]); // Limpa as mensagens antigas
      try {
        let url = "";
        if (chatInfo.type === "dm") {
          url = `/friends/dm/${chatInfo.user.id_usuario}/messages`;
        } else if (chatInfo.type === "group") {
          // Assumimos que o primeiro canal é o chat ativo por agora
          // Lógica mais complexa de seleção de canal virá depois
          const firstChannelId = chatInfo.group.details?.channels[0]?.id_chat;
          if (firstChannelId) {
            url = `/groups/chats/${firstChannelId}/messages`;
          }
        }

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

    fetchMessages();
  }, [chatInfo]); // Este efeito é executado sempre que o chatInfo muda

  if (!chatInfo) {
    return (
      <ChatAreaContainer>
        <WelcomeMessage>
          <h2>Selecione um amigo para começar a conversar.</h2>
        </WelcomeMessage>
      </ChatAreaContainer>
    );
  }

  const titleUser = chatInfo.user; // Para DMs

  return (
    <ChatAreaContainer>
      <Header>
        <img
          src={titleUser.FotoPerfil || "/images/logo.png"}
          alt={titleUser.Nome}
        />
        <h3>
          {titleUser.Nome}
          <span className="user-tag">#{titleUser.id_usuario}</span>
        </h3>
      </Header>
      <MessagesContainer>
        {loading && <p>A carregar mensagens...</p>}
        {!loading &&
          messages.map((msg) => (
            <MessageItem key={msg.id_mensagem} message={msg} />
          ))}
      </MessagesContainer>
      <ChatInput chatInfo={chatInfo} />
    </ChatAreaContainer>
  );
};

export default ChatArea;
