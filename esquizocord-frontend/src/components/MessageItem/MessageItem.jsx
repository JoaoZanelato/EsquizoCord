// src/components/MessageItem/MessageItem.jsx
import React, { useState } from "react";
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
  EditedIndicator,
  EditInputContainer,
  EditInput,
  EditActions,
} from "./styles";

const ChatImage = styled.img`
  max-width: 400px;
  max-height: 300px;
  border-radius: 8px;
  margin-top: 4px;
  cursor: pointer;
`;

// Função de formatação de tempo robusta e à prova de falhas
const formatTime = (dateString) => {
  if (!dateString) return "";

  let date = new Date(dateString);

  // Se a data for inválida, é provável que seja o formato do MySQL (YYYY-MM-DD HH:MM:SS)
  if (isNaN(date.getTime()) && typeof dateString === "string") {
    // Substitui o primeiro espaço por 'T' e adiciona 'Z' para tratar como UTC
    // Isso cria um formato ISO 8601 que o JavaScript entende de forma fiável
    date = new Date(dateString.replace(" ", "T") + "Z");
  }

  // Se ainda assim for inválida, retorna uma string vazia para não quebrar a UI
  if (isNaN(date.getTime())) {
    return "";
  }

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
  onEdit,
  onViewProfile,
}) => {
  const { user: currentUser } = useAuth();
  const isSentByMe = message.id_usuario === currentUser.id_usuario;

  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.Conteudo);

  const handleEdit = () => {
    if (!editedContent.trim()) return;
    onEdit(message.id_mensagem, editedContent);
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleEdit();
    }
    if (e.key === "Escape") {
      setIsEditing(false);
      setEditedContent(message.Conteudo);
    }
  };

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
        {/* O cabeçalho só é renderizado para mensagens recebidas */}
        {!isSentByMe && (
          <MessageHeader>
            <AuthorName onClick={() => onViewProfile(message.id_usuario)}>
              {message.autorNome}
            </AuthorName>
            <Timestamp $isSentByMe={isSentByMe}>
              {formatTime(message.data_hora)}
            </Timestamp>
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

        {isEditing ? (
          <EditInputContainer>
            <EditInput
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={Math.min(10, editedContent.split("\n").length)}
              autoFocus
            />
            <EditActions>
              prima ESC para{" "}
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditedContent(message.Conteudo);
                }}
              >
                cancelar
              </button>{" "}
              • ENTER para <button onClick={handleEdit}>guardar</button>
            </EditActions>
          </EditInputContainer>
        ) : (
          <>
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
            {/* Timestamp para mensagens enviadas */}
            {isSentByMe && (
              <Timestamp
                $isSentByMe={isSentByMe}
                style={{ textAlign: "right", marginTop: "4px" }}
              >
                {formatTime(message.data_hora)}
                {message.foi_editada && (
                  <EditedIndicator>(editado)</EditedIndicator>
                )}
              </Timestamp>
            )}
          </>
        )}
      </MessageContent>

      <MessageActions>
        {isSentByMe && message.tipo === "texto" && (
          <ActionButton title="Editar" onClick={() => setIsEditing(true)}>
            <i className="fas fa-pencil-alt"></i>
          </ActionButton>
        )}
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
