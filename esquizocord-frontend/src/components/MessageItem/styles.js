// src/components/MessageItem/styles.js
import styled from 'styled-components';

export const MessageContainer = styled.div`
  display: flex;
  max-width: 90%;
  align-items: flex-start;
  gap: 16px;
  padding: 4px 8px; /* Adicionado para criar espaço para o hover */
  border-radius: 4px;
  transition: background-color 0.2s;
  
  /* --- EFEITO DE HOVER ADICIONADO --- */
  &:hover {
    background-color: rgba(255, 255, 255, 0.02);
  }

  align-self: ${({ $isSentByMe }) => ($isSentByMe ? 'flex-end' : 'flex-start')};
  flex-direction: ${({ $isSentByMe }) => ($isSentByMe ? 'row-reverse' : 'row')};
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
  
  background-color: ${({ $isSentByMe, theme }) => ($isSentByMe ? theme.chatBubbleSent : 'transparent')};
  padding: ${({ $isSentByMe }) => ($isSentByMe ? '8px 12px' : '0')};
  border-radius: ${({ $isSentByMe }) => ($isSentByMe ? '12px 12px 0 12px' : '0')};
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

  /* --- EFEITO DE HOVER ADICIONADO --- */
  &:hover {
    text-decoration: underline;
  }
`;

export const Timestamp = styled.span`
  color: ${({ theme }) => theme.textMuted};
  font-size: 0.75rem;
`;

export const MessageText = styled.div`
  color: ${({ $isSentByMe, theme }) => ($isSentByMe ? '#FFFFFF' : theme.textNormal)};
  line-height: 1.375rem;
  font-size: 1rem;
  overflow-wrap: break-word;
  word-wrap: break-word;
  word-break: break-word;
`;