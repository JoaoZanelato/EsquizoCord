// src/components/VoiceChannel/styles.js
import styled, { keyframes } from "styled-components";

const speakingAnimation = keyframes`
  0%, 100% {
    box-shadow: 0 0 2px 2px ${({ theme }) => theme.greenAccent};
  }
  50% {
    box-shadow: 0 0 8px 4px ${({ theme }) => theme.greenAccent};
  }
`;

export const VoiceChannelContainer = styled.div`
  padding: 20px;
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: ${({ theme }) => theme.backgroundPrimary};
  color: ${({ theme }) => theme.textNormal};
`;

export const VoiceUserList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 20px;
  margin-top: 20px;
  overflow-y: auto;
  padding: 10px;
`;

export const VoiceUser = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 15px;
  background-color: ${({ theme }) => theme.backgroundSecondary};
  border-radius: 8px;
  text-align: center;
  transition: transform 0.2s ease-in-out;

  &:hover {
    transform: translateY(-5px);
  }

  span {
    font-weight: 500;
    font-size: 14px;
    word-break: break-word;
  }
`;

export const AvatarContainer = styled.div`
  position: relative;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  animation: ${({ $isSpeaking }) => ($isSpeaking ? speakingAnimation : "none")}
    1.5s infinite;
  transition: box-shadow 0.3s;

  img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
  }
`;

export const VoiceControls = styled.div`
  margin-top: auto;
  padding: 15px;
  background-color: ${({ theme }) => theme.backgroundTertiary};
  border-radius: 8px;
  display: flex;
  justify-content: center;
  gap: 20px;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.2);
`;

export const ControlButton = styled.button`
  background-color: ${({ theme, $active }) =>
    $active ? "transparent" : theme.redDanger};
  border: 2px solid
    ${({ theme, $active }) => ($active ? theme.greenAccent : theme.redDanger)};
  color: ${({ theme, $active }) => ($active ? theme.greenAccent : "white")};
  width: 50px;
  height: 50px;
  border-radius: 50%;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease-in-out;

  &:hover {
    opacity: 0.9;
    transform: scale(1.1);
    background-color: ${({ theme, $active }) =>
      $active ? theme.greenAccent : theme.redDangerHover};
    color: white;
  }
`;
