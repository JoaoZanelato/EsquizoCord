// src/components/MessageItem/MessageItem.jsx
import React from "react";
import { useAuth } from "../../context/AuthContext";
import { marked } from "marked";
import DOMPurify from "dompurify";
import {
  MessageContainer,
  Avatar,
  MessageContent,
  MessageHeader,
  AuthorName,
  Timestamp,
  MessageText,
  MessageActions,
  ActionButton,
  ReplyContext,
  ReplyAuthor,
  ReplyContent,
} from "./styles";

const formatTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const MessageItem = ({
  message,
  canDelete, // Recebe a permissão diretamente
  onReply,
  onDelete,
  onViewProfile,
}) => {
  const { user: currentUser } = useAuth();
  const isSentByMe = message.id_usuario === currentUser.id_usuario;

  const handleAvatarClick = () => {
    if (!isSentByMe && onViewProfile) {
      onViewProfile(message.id_usuario);
    }
  };

  const sanitizedContent = DOMPurify.sanitize(
    marked.parse(message.Conteudo || "")
  );

  return (
    <MessageContainer $isSentByMe={isSentByMe}>
      {!isSentByMe && (
        <Avatar
          src={message.autorFoto || "/images/logo.png"}
          alt={message.autorNome}
          onClick={handleAvatarClick}
          style={{ cursor: "pointer" }}
        />
      )}

      <MessageContent $isSentByMe={isSentByMe}>
        {!isSentByMe && (
          <MessageHeader>
            <AuthorName
              onClick={handleAvatarClick}
              style={{ cursor: "pointer" }}
            >
              {message.autorNome}
            </AuthorName>
            <Timestamp>{formatTime(message.DataHora)}</Timestamp>
          </MessageHeader>
        )}

        {message.repliedTo && (
          <ReplyContext>
            <ReplyAuthor>{message.repliedTo.autorNome}</ReplyAuthor>
            <ReplyContent
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(
                  marked.parse(message.repliedTo.Conteudo || "")
                ),
              }}
            />
          </ReplyContext>
        )}

        <MessageText
          $isSentByMe={isSentByMe}
          dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        />
      </MessageContent>

      <MessageActions>
        <ActionButton title="Responder" onClick={() => onReply(message)}>
          <i className="fas fa-reply"></i>
        </ActionButton>
        {canDelete && (
          <ActionButton
            title="Apagar"
            onClick={() => onDelete(message.id_mensagem)}
          >
            <i className="fas fa-trash"></i>
          </ActionButton>
        )}
      </MessageActions>
    </MessageContainer>
  );
};

export default MessageItem;
