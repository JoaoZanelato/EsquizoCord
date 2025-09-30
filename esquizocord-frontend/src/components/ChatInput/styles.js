// src/components/ChatInput/styles.js
import styled from "styled-components";

export const InputBarContainer = styled.div`
  padding: 0 16px 24px 16px;
  background-color: ${({ theme }) => theme.backgroundPrimary};
  display: flex;
  flex-direction: column;
`;

export const ReplyBar = styled.div`
  background-color: ${({ theme }) => theme.backgroundTertiary};
  padding: 8px 12px;
  border-radius: 8px 8px 0 0;
  margin-bottom: -8px; /* Para colar na barra de input */
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: ${({ theme }) => theme.textMuted};
`;

export const ReplyContent = styled.div`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-grow: 1;
  min-width: 0;
`;

export const CancelReplyButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.textMuted};
  font-size: 20px;
  cursor: pointer;
  padding: 0 5px;
  flex-shrink: 0;
  &:hover {
    color: ${({ theme }) => theme.headerPrimary};
  }
`;

export const InputWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  background-color: ${({ theme }) => theme.backgroundSecondary};
  border-radius: 8px;
  padding: 0 10px;
  position: relative;
  z-index: 2;
`;

export const MentionButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.textMuted};
  font-size: 20px;
  cursor: pointer;
  padding: 8px;
  flex-shrink: 0;

  &:hover {
    color: ${({ theme }) => theme.headerPrimary};
  }
`;

export const InputField = styled.input`
  flex-grow: 1;
  width: 100%;
  padding: 12px 0;
  border-radius: 8px;
  border: none;
  background-color: transparent;
  color: ${({ theme }) => theme.textNormal};
  font-size: 1rem;

  &:focus {
    outline: none;
  }
`;
