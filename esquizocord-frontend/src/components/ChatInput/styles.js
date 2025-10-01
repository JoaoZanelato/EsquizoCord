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
  margin-bottom: -8px;
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
  width: 100%;
  background-color: ${({ theme }) => theme.backgroundSecondary};
  border-radius: 8px;
  position: relative;
  z-index: 2;
  padding: 0 10px;
`;

export const UploadButton = styled.button`
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

// --- ESTILO QUE FALTAVA ---
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
  padding: 12px 10px;
  border-radius: 8px;
  border: none;
  background-color: transparent;
  color: ${({ theme }) => theme.textNormal};
  font-size: 1rem;

  &:focus {
    outline: none;
  }
`;

export const ImagePreviewContainer = styled.div`
  background-color: ${({ theme }) => theme.backgroundSecondary};
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 8px;
  display: flex;
  align-items: flex-start;
  gap: 16px;
`;

export const PreviewImage = styled.img`
  max-width: 100px;
  max-height: 100px;
  border-radius: 4px;
`;

export const PreviewInfo = styled.div`
  flex-grow: 1;
  display: flex;
  flex-direction: column;
`;

export const PreviewActions = styled.div`
  display: flex;
  gap: 10px;
  margin-top: auto;
`;

export const SendButton = styled.button`
  background-color: ${({ theme }) => theme.greenAccent};
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  &:disabled {
    opacity: 0.5;
  }
`;

export const CancelButton = styled.button`
  background-color: ${({ theme }) => theme.redDanger};
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
`;
