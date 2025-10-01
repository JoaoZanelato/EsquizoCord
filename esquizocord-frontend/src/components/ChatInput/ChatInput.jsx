// src/components/ChatInput/ChatInput.jsx
import React, { useState, useRef } from "react";
import apiClient from "../../services/api";
import {
  InputBarContainer,
  InputWrapper,
  UploadButton,
  InputField,
  ReplyBar,
  ReplyContent,
  CancelReplyButton,
  ImagePreviewContainer,
  PreviewImage,
  PreviewInfo,
  PreviewActions,
  SendButton,
  CancelButton,
} from "./styles";
import { MentionButton } from "./styles";

const ChatInput = ({ chatInfo, replyingTo, onCancelReply }) => {
  const [message, setMessage] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleSendMessage = async (content, type = "texto") => {
    if (content.trim() === "" || chatInfo.disabled) return;

    const messageToSend = content.trim();

    setMessage("");
    setImageFile(null);
    setImagePreview("");
    if (onCancelReply) onCancelReply();

    let url = "";
    const body = {
      content: messageToSend,
      replyingToMessageId: replyingTo?.id_mensagem,
      type: type,
    };

    if (chatInfo.type === "dm")
      url = `/friends/dm/${chatInfo.user.id_usuario}/messages`;
    else if (chatInfo.type === "group")
      url = `/groups/chats/${chatInfo.channelId}/messages`;

    if (!url) return;

    try {
      await apiClient.post(url, body);
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      alert("Não foi possível enviar a sua mensagem.");
      if (type === "texto") setMessage(messageToSend);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
    e.target.value = null;
  };

  const handleSendImage = async () => {
    if (!imageFile) return;
    setIsUploading(true);

    const formData = new FormData();
    formData.append("chat-image", imageFile);

    try {
      // 1. FAZ O UPLOAD DA IMAGEM PRIMEIRO PARA OBTER A URL
      const response = await apiClient.post(
        "/groups/upload/chat-image",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      // 2. USA A URL RETORNADA PARA ENVIAR A MENSAGEM DO TIPO "IMAGEM"
      await handleSendMessage(response.data.url, "imagem");
    } catch (error) {
      alert("Falha no upload da imagem. Tente novamente.");
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const cancelImageUpload = () => {
    setImageFile(null);
    setImagePreview("");
  };

  const handleMention = () => {
    setMessage((prev) => `@EsquizoIA ${prev}`);
    inputRef.current?.focus();
  };

  return (
    <InputBarContainer>
      {imagePreview ? (
        <ImagePreviewContainer>
          <PreviewImage src={imagePreview} alt={imageFile.name} />
          <PreviewInfo>
            <span>{imageFile.name}</span>
            <PreviewActions>
              <SendButton onClick={handleSendImage} disabled={isUploading}>
                {isUploading ? "A Enviar..." : "Enviar"}
              </SendButton>
              <CancelButton onClick={cancelImageUpload} disabled={isUploading}>
                Cancelar
              </CancelButton>
            </PreviewActions>
          </PreviewInfo>
        </ImagePreviewContainer>
      ) : (
        <>
          {replyingTo && (
            <ReplyBar>
              <ReplyContent>
                Respondendo a <strong>{replyingTo.autorNome}</strong>
              </ReplyContent>
              <CancelReplyButton onClick={onCancelReply}>
                &times;
              </CancelReplyButton>
            </ReplyBar>
          )}
          <InputWrapper>
            <UploadButton
              onClick={() => fileInputRef.current.click()}
              title="Enviar Imagem"
            >
              <i className="fas fa-plus-circle"></i>
            </UploadButton>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              accept="image/*"
              onChange={handleImageSelect}
            />
            <InputField
              ref={inputRef}
              type="text"
              placeholder={chatInfo.placeholder}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage(message)}
              disabled={chatInfo.disabled}
            />
            {chatInfo?.type === "group" && (
              <MentionButton
                onClick={handleMention}
                title="Mencionar EsquizoIA"
              >
                <i className="fas fa-robot"></i>
              </MentionButton>
            )}
          </InputWrapper>
        </>
      )}
    </InputBarContainer>
  );
};

export default ChatInput;
