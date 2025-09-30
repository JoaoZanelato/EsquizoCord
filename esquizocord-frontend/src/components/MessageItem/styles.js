// src/components/MessageItem/styles.js
import styled from 'styled-components';

export const MessageContainer = styled.div`
  display: flex;
  gap: 16px;
  max-width: 90%;
  align-items: flex-start;

  // Alinha a mensagem à direita se for enviada pelo utilizador atual
  align-self: ${({ $issentbyme }) => ($issentbyme ? 'flex-end' : 'flex-start')};
  flex-direction: ${({ $issentbyme }) => ($issentbyme ? 'row-reverse' : 'row')};
`;

export const Avatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  flex-shrink: 0;
`;

export const MessageContent = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
  background-color: ${({ $issentbyme, theme }) => ($issentbyme ? theme.chatBubbleSent : 'transparent')};
  padding: ${({ $issentbyme }) => ($issentbyme ? '8px 12px' : '0')};
  border-radius: ${({ $issentbyme }) => ($issentbyme ? '12px 12px 0 12px' : '0')};
`;

export const AuthorName = styled.span`
  font-weight: bold;
  color: ${({ theme }) => theme.headerPrimary};
  margin-bottom: 4px;
`;

export const MessageText = styled.div`
  color: ${({ $issentbyme, theme }) => ($issentbyme ? 'white' : theme.textNormal)};
  line-height: 1.4;
  overflow-wrap: break-word;
  word-wrap: break-word;
  word-break: break-all;
`;