// src/components/ChatInput/ChatInput.jsx
import React, { useState, useEffect } from "react";
import apiClient from "../../services/api";
import {
  InputBarContainer,
  InputWrapper,
  MentionButton,
  InputField,
  ReplyBar,
  ReplyContent,
  CancelReplyButton,
} from "./styles";

const ChatInput = ({ chatInfo, replyingTo, onCancelReply }) => {
  const [message, setMessage] = useState("");
  const inputRef = React.useRef(null);

  useEffect(() => {
    if (replyingTo) {
      inputRef.current?.focus();
    }
  }, [replyingTo]);

  let placeholder = "Selecione uma conversa...";
  let disabled = true;
  if (chatInfo?.type === "dm") {
    placeholder = `Conversar com ${chatInfo.user.Nome}`;
    disabled = false;
  } else if (chatInfo?.type === "group" && chatInfo.channelName) {
    placeholder = `Conversar em #${chatInfo.channelName}`;
    disabled = false;
  }

  const handleSendMessage = async (e) => {
    if (e.key === "Enter" && message.trim() !== "" && !disabled) {
      e.preventDefault();
      const messageToSend = message.trim();
      setMessage("");
      if (onCancelReply) onCancelReply();

      let url = "";
      const body = {
        content: messageToSend,
        replyingToMessageId: replyingTo?.id_mensagem,
      };

      if (chatInfo.type === "dm") {
        url = `/friends/dm/${chatInfo.user.id_usuario}/messages`;
      } else if (chatInfo.type === "group") {
        url = `/groups/chats/${chatInfo.channelId}/messages`;
      }

      if (!url) {
        setMessage(messageToSend);
        return;
      }

      try {
        await apiClient.post(url, body);
      } catch (error) {
        console.error("Erro ao enviar mensagem:", error);
        alert("Não foi possível enviar a sua mensagem.");
        setMessage(messageToSend);
      }
    }
  };

  const handleMention = () => {
    setMessage((prev) => `@EsquizoIA ${prev}`);
    inputRef.current?.focus();
  };

  return (
    <InputBarContainer>
      {replyingTo && (
        <ReplyBar>
          <ReplyContent>
            Respondendo a <strong>{replyingTo.autorNome}</strong>
          </ReplyContent>
          <CancelReplyButton onClick={onCancelReply}>&times;</CancelReplyButton>
        </ReplyBar>
      )}
      <InputWrapper>
        {chatInfo?.type === "group" && (
          <MentionButton onClick={handleMention} title="Mencionar EsquizoIA">
            <i className="fas fa-robot"></i>
          </MentionButton>
        )}
        <InputField
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleSendMessage}
          disabled={disabled}
        />
      </InputWrapper>
    </InputBarContainer>
  );
};

export default ChatInput;
