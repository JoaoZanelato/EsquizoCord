// src/components/MessageItem/styles.js
import styled from "styled-components";

export const MessageActions = styled.div`
  display: none; /* Escondido por padrão */
  gap: 8px;
  align-items: center;
  position: absolute;
  top: -12px;
  right: 16px;
  background-color: ${({ theme }) => theme.backgroundTertiary};
  padding: 4px 8px;
  border-radius: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
`;

export const MessageContainer = styled.div`
  position: relative; /* Necessário para posicionar as ações */
  display: flex;
  max-width: 90%;
  align-items: flex-start;
  gap: 16px;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(255, 255, 255, 0.02);
    ${MessageActions} {
      display: flex; /* Mostra as ações no hover */
    }
  }

  align-self: ${({ $isSentByMe }) => ($isSentByMe ? "flex-end" : "flex-start")};
`;

export const ActionButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.textMuted};
  font-size: 14px;
  cursor: pointer;
  padding: 4px;

  &:hover {
    color: ${({ theme }) => theme.headerPrimary};
  }
`;

export const ReplyContext = styled.div`
  background-color: rgba(0, 0, 0, 0.1);
  border-left: 3px solid ${({ theme }) => theme.purpleAccent};
  padding: 6px 8px;
  margin-bottom: 6px;
  border-radius: 4px;
  font-size: 14px;
  max-width: 400px;
`;

export const ReplyAuthor = styled.span`
  font-weight: bold;
  color: ${({ theme }) => theme.purpleAccent};
`;

export const ReplyContent = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.textNormal};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const Avatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  flex-shrink: 0;
  cursor: pointer;
`;

export const MessageContent = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;

  background-color: ${({ $isSentByMe, theme }) =>
    $isSentByMe ? theme.chatBubbleSent : "transparent"};
  padding: ${({ $isSentByMe }) => ($isSentByMe ? "8px 12px" : "0")};
  border-radius: ${({ $isSentByMe }) =>
    $isSentByMe ? "12px 12px 0 12px" : "0"};
`;

export const MessageHeader = styled.div`
  display: flex;
  align-items: baseline;
  margin-bottom: 4px;
`;

export const AuthorName = styled.span`
  font-weight: 500;
  color: ${({ theme }) => theme.headerPrimary};
  font-size: 1rem;
  margin-right: 0.5rem;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`;

export const MessageText = styled.div`
  color: ${({ $isSentByMe, theme }) =>
    $isSentByMe ? "#FFFFFF" : theme.textNormal};
  line-height: 1.375rem;
  font-size: 1rem;
  overflow-wrap: break-word;
  word-wrap: break-word;
  word-break: break-word;

  /* Adiciona margem se a mensagem for enviada por si, para separar do timestamp */
  ${({ $isSentByMe }) => $isSentByMe && `margin-bottom: 4px;`}
`;

export const EditedIndicator = styled.span`
  color: ${({ theme }) => theme.textMuted};
  font-size: 0.7rem;
  margin-left: 8px;
`;

export const EditInputContainer = styled.div`
  width: 100%;
  margin-top: 8px;
`;

export const EditInput = styled.textarea`
  width: 100%;
  background-color: ${({ theme }) => theme.backgroundTertiary};
  color: ${({ theme }) => theme.textNormal};
  border-radius: 4px;
  padding: 8px;
  border: 1px solid ${({ theme }) => theme.backgroundPrimary};
  font-size: 1rem;
  resize: vertical;
  min-height: 50px;
`;

export const EditActions = styled.div`
  font-size: 12px;
  margin-top: 4px;
  color: ${({ theme }) => theme.textMuted};

  button {
    background: none;
    border: none;
    color: ${({ theme }) => theme.purpleAccent};
    cursor: pointer;
    padding: 0 4px;

    &:hover {
      text-decoration: underline;
    }
  }
`;
export const ChatImage = styled.img`
  max-width: 400px;
  max-height: 300px;
  border-radius: 8px;
  margin-top: 4px;
  cursor: pointer;
`;