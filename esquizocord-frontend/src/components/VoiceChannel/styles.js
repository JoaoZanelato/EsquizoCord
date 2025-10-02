// src/components/VoiceChannel/styles.js
import styled from "styled-components";

export const VoiceChannelContainer = styled.div`
  padding: 20px;
  display: flex;
  flex-direction: column;
  height: 100%;
`;

export const VoiceUserList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-top: 20px;
`;

export const VoiceUser = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 10px;
  background-color: ${({ theme }) => theme.backgroundTertiary};
  border-radius: 8px;

  img {
    width: 48px;
    height: 48px;
    border-radius: 50%;
  }

  span {
    font-weight: 500;
    font-size: 16px;
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
`;

export const ControlButton = styled.button`
  background-color: ${({ theme, $active }) =>
    $active ? theme.greenAccent : theme.redDanger};
  border: none;
  color: white;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;

  &:hover {
    opacity: 0.9;
  }
`;
