// src/components/ChatInput/styles.js
import styled from 'styled-components';

export const InputBarContainer = styled.div`
  padding: 0 16px 24px 16px;
  background-color: ${({ theme }) => theme.backgroundPrimary};
  display: flex;
  flex-direction: column;
`;

export const InputWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  background-color: ${({ theme }) => theme.backgroundSecondary};
  border-radius: 8px;
  padding: 0 10px;
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