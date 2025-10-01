// src/components/MessageItem/MessageItem.jsx
import React from "react";
import { useAuth } from "../../context/AuthContext";
import { marked } from "marked";
import DOMPurify from "dompurify";
import styled from "styled-components";
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

const ChatImage = styled.img`
  max-width: 400px;
  max-height: 300px;
  border-radius: 8px;
  margin-top: 4px;
  cursor: pointer;
`;

const formatTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const MessageItem = ({
  message,
  canDelete,
  onReply,
  onDelete,
  onViewProfile,
}) => {
  const { user: currentUser } = useAuth();
  const isSentByMe = message.id_usuario === currentUser.id_usuario;

  const sanitizedContent =
    message.tipo === "texto"
      ? DOMPurify.sanitize(marked.parse(message.Conteudo || ""))
      : "";

  return (
    <MessageContainer $isSentByMe={isSentByMe}>
      {!isSentByMe && (
        <Avatar
          src={message.autorFoto || "/images/logo.png"}
          alt={message.autorNome}
          onClick={() => onViewProfile(message.id_usuario)}
        />
      )}
      <MessageContent $isSentByMe={isSentByMe}>
        {!isSentByMe && (
          <MessageHeader>
            <AuthorName onClick={() => onViewProfile(message.id_usuario)}>
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

        {message.tipo === "imagem" ? (
          <ChatImage
            src={message.Conteudo}
            alt="Imagem enviada"
            onClick={() => window.open(message.Conteudo, "_blank")}
          />
        ) : (
          <MessageText
            $isSentByMe={isSentByMe}
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          />
        )}
      </MessageContent>

      <MessageActions>
        {message.tipo === "texto" && (
          <ActionButton title="Responder" onClick={() => onReply(message)}>
            <i className="fas fa-reply"></i>
          </ActionButton>
        )}
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
